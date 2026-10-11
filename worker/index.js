function sanitize(value) {
  return String(value || '').replace(/[<>]/g, '').trim();
}

function json(body, status = 200, headers = {}) {
  return Response.json(body, { status, headers });
}

async function handleContact(request, env) {
  if (request.method !== 'POST') {
    return json({ message: 'POSTで送信してください。' }, 405, { Allow: 'POST' });
  }

  const body = await request.json().catch(() => ({}));
  const { name, email, subject, message, website } = body || {};
  if (website) {
    return json({ ok: true });
  }

  const cleanName = sanitize(name);
  const cleanEmail = sanitize(email);
  const cleanSubject = sanitize(subject);
  const cleanMessage = sanitize(message);

  if (!cleanName || !cleanEmail || !cleanSubject || !cleanMessage) {
    return json({ message: '未入力の項目があります。' }, 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return json({ message: 'メールアドレスを確認してください。' }, 400);
  }

  if (!env.CONTACT_TO || !env.RESEND_API_KEY) {
    return json({ message: '送信設定が未完了です。管理者にお問い合わせください。' }, 503);
  }

  const mailBody = [
    'Webサイトのお問い合わせフォームから送信されました。',
    '',
    `お名前: ${cleanName}`,
    `メールアドレス: ${cleanEmail}`,
    `件名: ${cleanSubject}`,
    '',
    'お問い合わせ内容:',
    cleanMessage
  ].join('\n');

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM || 'Yoshibow Contact <onboarding@resend.dev>',
      to: env.CONTACT_TO,
      reply_to: cleanEmail,
      subject: `【お問い合わせ】${cleanSubject}`,
      text: mailBody
    })
  });

  if (!resendResponse.ok) {
    console.error('Resend error', resendResponse.status, await resendResponse.text());
    return json({ message: '送信できませんでした。時間をおいて再度お試しください。' }, 502);
  }

  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.hostname === 'www.yoshibow.org') {
      url.hostname = 'yoshibow.org';
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === '/api/contact') {
      return handleContact(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

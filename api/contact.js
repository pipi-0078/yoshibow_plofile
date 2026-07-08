function sanitize(value) {
  return String(value || '').replace(/[<>]/g, '').trim();
}

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ message: 'POSTで送信してください。' });
  }

  const { name, email, subject, message, website } = request.body || {};
  if (website) {
    return response.status(200).json({ ok: true });
  }

  const cleanName = sanitize(name);
  const cleanEmail = sanitize(email);
  const cleanSubject = sanitize(subject);
  const cleanMessage = sanitize(message);

  if (!cleanName || !cleanEmail || !cleanSubject || !cleanMessage) {
    return response.status(400).json({ message: '未入力の項目があります。' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return response.status(400).json({ message: 'メールアドレスを確認してください。' });
  }

  if (!process.env.CONTACT_TO || !process.env.RESEND_API_KEY) {
    return response.status(503).json({ message: '送信設定が未完了です。管理者にお問い合わせください。' });
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
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM || 'Yoshibow Contact <onboarding@resend.dev>',
      to: process.env.CONTACT_TO,
      reply_to: cleanEmail,
      subject: `【お問い合わせ】${cleanSubject}`,
      text: mailBody
    })
  });

  if (!resendResponse.ok) {
    return response.status(502).json({ message: '送信できませんでした。時間をおいて再度お試しください。' });
  }

  return response.status(200).json({ ok: true });
};

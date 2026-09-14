# Yoshibow profile website

仏教・AI活用・コミュニティ・配信・アプリを紹介する静的サイトです。公開先は https://yoshibow-plofile.vercel.app/ です。

## 開発

Node.js 22以上を利用します。

```sh
npm ci
npm run dev
```

http://127.0.0.1:4173 で確認できます。ビルド工程は不要です。

## 構成

- `index.html`: 紹介文と外部リンク。JavaScriptなしでも本文と全アプリを表示します。
- `style.css`: サイト共通・お問い合わせ・プライバシーポリシーのスタイル。
- `styles/home.css`: トップページのレイアウト、レスポンシブ表示、アニメーション。
- `scripts/home.js`: メニュー、アプリ切替、スクロール演出。
- `scripts/motion.js`: 動きの停止ボタンとOS設定の管理。
- `scripts/enso.js`: 画面外・非表示タブで停止するCanvas描画。
- `assets/visuals-v2/*.webp`: 配信用画像。
- `api/contact.js`: 既存のResend連携。環境変数はVercelで管理します。

## 検証

```sh
npm run format:check
npm test
```

macOSではインストール済みChromeを利用します。他の環境では `npx playwright install chromium` を実行するか、`PLAYWRIGHT_CHROMIUM_EXECUTABLE` を指定してください。

4つの画面幅、画像読み込み、方向別アニメーション、アプリ切替、キーボード操作、モバイルメニュー、動きの停止、JavaScriptなしの表示、サポートページを検証します。スクリーンショットは `test-results/` に保存します。テストは問い合わせメールを送信しません。

公開サイトの確認は `SITE_URL=https://yoshibow-plofile.vercel.app npm test` で実行できます。

## 公開

既存Vercelプロジェクト `yoshibow-plofile` にリンクして利用します。

```sh
vercel --prod
```

`.vercelignore` により開発資料、テスト、生成画像のPNG原本を配信対象から除外します。制作プロンプトは `docs/visual-prompts.json` に記録しています。App Storeの価格・対応OS等はストア側で最新情報を確認する構成です。

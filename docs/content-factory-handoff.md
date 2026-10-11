# 投稿ツールのOAuth登録情報

- アプリ名：ヨシボウ コンテンツ制作・投稿ツール
- サポートメール：chad78xx@gmail.com（2026-09-21に本人確認）
- ホームページ：https://yoshibow.org/content-factory
- プライバシーポリシー：https://yoshibow.org/content-factory/privacy
- 対象Google Cloudプロジェクト：emomind-tts

## 実装・運用の確認

`/Users/matsumotoyoshihide/Documents/contents automation/tools/youtube/` の prepare-private-upload.mjs、upload-private.mjs、verify-private.mjs、deliver-and-upload-private.mjs を確認。認証設定・トークンファイルの秘密値は読み出していない。ツール本体は変更していない。

本人によるリポジトリ外保存、固定の保存期限なし、不要時の手動削除、バックアップ・クラウド同期なし、広告・販売・AI学習へのGoogle APIデータ利用なしを確認。

## Google Cloud側で残る操作

1. Google Auth Platformのブランディングで上記の名称・サポートメール・2つのURLを登録する。サポートメールが選択肢に出るGoogleアカウントで作業する。
2. 承認済みドメインとGoogle Search Consoleの所有権を確認する。所有権は未確認。確認タグ・ファイルが必要なら、Googleが実際に発行した値を使う。
3. データアクセスで実装が要求する `https://www.googleapis.com/auth/youtube` を確認する。広い権限なので、必要最小限の権限と審査要否を別途点検する。実装のスコープは今回変更していない。
4. 対象のAudienceで公開ステータスを本番環境へ切り替える。ブランディング審査・公開やデータアクセス審査が求められた場合は画面に従う。これらは動画を一般公開する操作ではない。
5. 切替後、投稿ツール側で再認証して新しい認証情報を取得し、投稿先・認証状態を確認する。本作業では認証・動画投稿を行わない。

外部アプリのTestingでは、今回のYouTubeスコープは7日で期限切れになる更新トークンの対象。本番環境でも取り消し、長期間の未使用などによる失効はある。ページ整備で審査通過や無期限の認証は保証されない。

## 別途確認が必要なデータ保持の要件

YouTube Developer Policies III.E.4では、保存したAPIデータの種類に応じて30日以内の更新または削除、許可取り消し後の削除などを要求している。現在の手動保存・削除の運用とコードだけでは、定期的な更新・削除の実施は確認できない。公開ポリシーには確認できた実態のみ記載し、未実装の自動削除を約束していない。Google側の要件に合わせた運用・実装の点検が別途必要。

## 公式資料

- https://support.google.com/cloud/answer/15549049?hl=ja
- https://developers.google.com/identity/protocols/oauth2#expiration
- https://developers.google.com/terms/api-services-user-data-policy
- https://developers.google.com/youtube/terms/developer-policies

## 公開・検証結果（2026-09-21）

既存Vercelプロジェクトへの本番デプロイ成功。デプロイID：`dpl_FCkJpmkkGqCqqvCdgEgqJWoyt5w5`。
上記の正式URL 2件でHTTP 200、ログインなし・JavaScriptなしの本文表示、320 / 390 / 768 / 1440pxの横はみ出しなし、問い合わせメールと内部リンク、トップページからのリンクを確認した。

Prettierとgit diff --checkに合格。既存トップページの全体テストは、初回・再試行時にスクロールアニメーションの完了待ちで失敗した。変更前のテストは合格。対象要素の診断情報だけを増やした同じ検証の再実行では、変更後も4幅の表示・操作、アニメーション、JavaScriptなし表示、既存サポートページ、コンソール検証にすべて合格した。アニメーションテストにはタイミング依存の不安定さが残る。今回、既存アニメーションやテストのコードは変更していない。

`/chuin-privacy` と既存アプリの説明は変更していない。Google Cloudの登録、Search Consoleの所有権確認、OAuthの本番環境への切り替え・再認証は未実施。

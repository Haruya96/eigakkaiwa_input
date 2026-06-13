# ASN Kidney Week English Phrase Trainer

ASN Kidney Weekで使える英会話表現100文を、音声再生とチェック保存で学習する静的Webアプリです。

## 機能

- 100個の英語短文をカテゴリ別に収録
- 各英文をブラウザの音声合成で再生
- 学習済みチェックを端末内に保存
- 未チェックのみ表示、検索、シャッフル、再生速度調整
- Android Chromeのホーム画面追加に対応するPWA構成
- GitHub Pagesで公開できる静的ファイル構成

## GitHub Pagesで公開する手順

1. このフォルダの全ファイルをGitHubリポジトリに追加します。
2. GitHubの`Settings`から`Pages`を開きます。
3. `Build and deployment`で`GitHub Actions`を選びます。
4. `main`ブランチへpushすると`.github/workflows/pages.yml`がサイトを公開します。

## Androidで使う手順

1. Android ChromeでGitHub PagesのURLを開きます。
2. メニューから`ホーム画面に追加`を選びます。
3. 追加したアイコンから起動すると、チェック状態は同じ端末のブラウザに保存されます。

## ローカル確認

ブラウザ音声とPWA機能の確認には、ファイルを直接開くよりローカルサーバーでの確認が適しています。

```powershell
node local-server.cjs 4173
```

その後、`http://127.0.0.1:4173/`を開きます。

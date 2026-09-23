# ASN Kidney Week English Phrase Trainer

## 2026年ポスター専用の新アプリ

尿酸・蛋白尿・eGFRのポスターに特化した英語表現100題、英語表現→日本語→例文2回の音声再生、暗記用フラッシュカードは [`asn-poster-2026/`](asn-poster-2026/) にあります。既存の300文のアプリとは別のAndroidアプリ／PWAです。

GitHub Pages上では `https://haruya96.github.io/eigakkaiwa_input/asn-poster-2026/www/` から起動できます。AndroidのAPKは「Build ASN poster Android APK」ワークフローの成果物です。

ASN Kidney Weekで使える英会話表現300文を、音声再生とチェック保存で学習する静的Webアプリです。

## 機能

- 基本100文、腎臓内科の深掘り議論100文、選抜100文を切り替えて学習
- 連続再生では各項目を日本語訳1回、英文2回の順で再生
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

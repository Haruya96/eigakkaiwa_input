# ASN 2026 Poster Input

ASN Kidney Week 2026 の尿酸・蛋白尿・eGFR ポスター発表用の英語表現100題を練習する Android アプリです。前の `eigakkaiwa_input` を参考に、内容と学習画面を別アプリとして作成しました。

## 使い方

- **音声で覚える**：1カードごとに①英語表現1回 → ②日本語訳1回 → ③発表用の短い例文2回。表示中のカードを現在位置から順に連続再生できます。再生中は停止できます。
- **フラッシュカード**：日本語を見て英語を思い出す、または英語を見て日本語を思い出す。タップして答えと例文を表示します。
- カテゴリー、検索、シャッフル、未暗記だけの表示、読み上げ速度の調整に対応します。「覚えた」は端末に保存されます。
- Android 版は100題をAPKに同梱します。サーバーやアカウントは不要です。英語・日本語の音声は端末の Text-to-Speech エンジンを利用します。

## Android APK のビルド

Android Studio で `android/` を開き、JDK 17 と Android SDK 35 を設定して **Build > Build APK(s)** を実行してください。Debug APK は `android/app/build/outputs/apk/debug/app-debug.apk` に生成されます。Android 8.0（API 26）以上に対応します。

コマンドラインでは Gradle 8.9 を使用します。

```bash
python3 tools/generate_cards.py
cd android
gradle :app:assembleDebug
```

このリポジトリでは、ルートの `.github/workflows/asn-poster-apk.yml` が変更時にAndroid用のAPKをビルドし、Actions の `ASN2026PosterInput-debug-apk` 成果物として保存します。

## PWA での使用

`www/` は同じ100題を使うインストール可能な Web 版です。HTTPS のサイトとして設置すると Android Chrome の「ホーム画面に追加」から利用できます。初回表示後は静的ファイルを端末にキャッシュします。Web 版の音声にはブラウザの SpeechSynthesis を使います。

同梱の `ASN2026PosterInput_Offline.html` は単独で開ける確認用ファイルです。Android 端末へコピーしてブラウザで開けます。端末やブラウザによってはローカルファイルからの暗記状態保存が制限されるため、継続利用にはAPK版かHTTPS上のPWA版を使ってください。

ローカルで動作を確かめる場合は `python3 -m http.server 4173 --directory www` を実行し、`http://127.0.0.1:4173/` を開いてください（ローカル HTTP ではオフラインキャッシュは有効になりません）。

## 設問の編集

`cards.tsv` が元データです。各行は「カテゴリー／英語表現／日本語訳／例文」の4列です。変更後は `python3 tools/generate_cards.py` で `www/cards-data.js` を作り直します。数値と結論は2026年9月の論文草案と「修正13」ポスターに合わせています。

## 確認

```bash
python3 tools/generate_cards.py
node --test tests/*.cjs
```

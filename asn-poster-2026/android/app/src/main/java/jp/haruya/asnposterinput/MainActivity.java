package jp.haruya.asnposterinput;

import android.app.Activity;
import android.net.Uri;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.util.Locale;

public class MainActivity extends Activity {
    private static final String ASSET_HOST = "appassets.androidplatform.net";
    private WebView webView;
    private TextToSpeech tts;
    private boolean ttsReady;
    private boolean ttsInitialized;
    private PendingSpeech waiting;

    private static final class PendingSpeech {
        final String text, language, id;
        final float rate;
        PendingSpeech(String text, String language, float rate, String id) {
            this.text = text;
            this.language = language;
            this.rate = rate;
            this.id = id;
        }
    }

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        webView = new WebView(this);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setAllowFileAccess(false);
        webView.getSettings().setAllowContentAccess(false);
        webView.addJavascriptInterface(new SpeechBridge(), "AndroidTts");
        webView.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (ASSET_HOST.equals(uri.getHost()) && uri.getPath().startsWith("/assets/")) {
                    WebResourceResponse resource = loader.shouldInterceptRequest(uri);
                    if (resource != null) return resource;
                }
                WebResourceResponse blocked = new WebResourceResponse("text/plain", "UTF-8", new ByteArrayInputStream(new byte[0]));
                blocked.setStatusCodeAndReasonPhrase(404, "Not Found");
                return blocked;
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                return !ASSET_HOST.equals(uri.getHost()) || !uri.getPath().startsWith("/assets/");
            }
        });
        setContentView(webView);

        tts = new TextToSpeech(this, status -> runOnUiThread(() -> {
            ttsInitialized = true;
            ttsReady = status == TextToSpeech.SUCCESS;
            if (ttsReady) {
                tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                    @Override public void onStart(String id) { }
                    @Override public void onDone(String id) { reportSpeech(id, true); }
                    @Override public void onError(String id) { reportSpeech(id, false); }
                    @Override public void onError(String id, int code) { reportSpeech(id, false); }
                    @Override public void onStop(String id, boolean interrupted) { reportSpeech(id, false); }
                });
            }
            PendingSpeech pending = waiting;
            waiting = null;
            if (pending != null) {
                if (ttsReady) startSpeech(pending);
                else reportSpeech(pending.id, false);
            }
        }));

        webView.loadUrl("https://" + ASSET_HOST + "/assets/index.html");
    }

    private void reportSpeech(String id, boolean success) {
        runOnUiThread(() -> {
            if (webView != null) {
                String script = "window.onNativeSpeechDone(" + JSONObject.quote(id) + "," + success + ");";
                webView.evaluateJavascript(script, null);
            }
        });
    }

    private void startSpeech(PendingSpeech pending) {
        if (tts == null || !ttsReady) { reportSpeech(pending.id, false); return; }
        int support = tts.setLanguage(Locale.forLanguageTag(pending.language));
        if (support == TextToSpeech.LANG_MISSING_DATA || support == TextToSpeech.LANG_NOT_SUPPORTED) {
            reportSpeech(pending.id, false);
            return;
        }
        tts.setSpeechRate(pending.rate);
        if (tts.speak(pending.text, TextToSpeech.QUEUE_FLUSH, null, pending.id) == TextToSpeech.ERROR) {
            reportSpeech(pending.id, false);
        }
    }

    public final class SpeechBridge {
        @JavascriptInterface public void speak(String text, String language, double rate, String id) {
            runOnUiThread(() -> {
                PendingSpeech pending = new PendingSpeech(text, language, (float) rate, id);
                if (ttsReady) startSpeech(pending);
                else if (ttsInitialized) reportSpeech(id, false);
                else waiting = pending;
            });
        }
        @JavascriptInterface public void cancel() {
            runOnUiThread(() -> {
                waiting = null;
                if (tts != null) tts.stop();
            });
        }
        @JavascriptInterface public void keepScreenOn(boolean enabled) {
            runOnUiThread(() -> { if (webView != null) webView.setKeepScreenOn(enabled); });
        }
    }

    @Override protected void onDestroy() {
        if (tts != null) { tts.stop(); tts.shutdown(); }
        if (webView != null) { webView.destroy(); webView = null; }
        super.onDestroy();
    }
}

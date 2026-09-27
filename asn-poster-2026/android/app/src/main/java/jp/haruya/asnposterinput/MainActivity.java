package jp.haruya.asnposterinput;

import android.app.Activity;
import android.net.Uri;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.util.Locale;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class MainActivity extends Activity {
    private static final String ASSET_HOST = "appassets.androidplatform.net";
    private WebView webView;
    private TextToSpeech tts;
    private boolean ttsReady;
    private boolean ttsInitialized;
    private PendingSpeech waiting;
    private String defaultEngine;
    private final Map<String, TextToSpeech> engines = new HashMap<>();
    private final Map<String, String> engineLabels = new HashMap<>();
    private final Set<String> readyEngines = new HashSet<>();

    private static final class PendingSpeech {
        final String text, language, id, voiceId;
        final float rate;
        PendingSpeech(String text, String language, float rate, String id, String voiceId) {
            this.text = text;
            this.language = language;
            this.rate = rate;
            this.id = id;
            this.voiceId = voiceId;
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
                defaultEngine = tts.getDefaultEngine();
                if (defaultEngine == null) defaultEngine = "default";
                engines.put(defaultEngine, tts);
                readyEngines.add(defaultEngine);
                attachSpeechListener(tts);
                List<TextToSpeech.EngineInfo> installed = tts.getEngines();
                if (installed != null) for (TextToSpeech.EngineInfo info : installed) {
                    engineLabels.put(info.name, info.label);
                    if (info.name.equals(defaultEngine)) continue;
                    final String engineName = info.name;
                    TextToSpeech alternate = new TextToSpeech(this, result -> runOnUiThread(() -> {
                        TextToSpeech instance = engines.get(engineName);
                        if (instance == null) return;
                        if (result == TextToSpeech.SUCCESS) {
                            readyEngines.add(engineName);
                            attachSpeechListener(instance);
                        }
                        reportVoices();
                        if (waiting != null && waiting.voiceId.startsWith(engineName + "|")) {
                            PendingSpeech pending = waiting;
                            waiting = null;
                            if (result == TextToSpeech.SUCCESS) startSpeech(pending);
                            else reportSpeech(pending.id, false);
                        }
                    }), engineName);
                    engines.put(engineName, alternate);
                }
            }
            reportVoices();
            PendingSpeech pending = waiting;
            waiting = null;
            if (pending != null) {
                if (ttsReady) startSpeech(pending);
                else reportSpeech(pending.id, false);
            }
        }));

        webView.loadUrl("https://" + ASSET_HOST + "/assets/index.html");
    }

    private void attachSpeechListener(TextToSpeech engine) {
        engine.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override public void onStart(String id) { }
            @Override public void onDone(String id) { reportSpeech(id, true); }
            @Override public void onError(String id) { reportSpeech(id, false); }
            @Override public void onError(String id, int code) { reportSpeech(id, false); }
            @Override public void onStop(String id, boolean interrupted) { reportSpeech(id, false); }
        });
    }

    private void reportSpeech(String id, boolean success) {
        runOnUiThread(() -> {
            if (webView != null) {
                String script = "window.onNativeSpeechDone(" + JSONObject.quote(id) + "," + success + ");";
                webView.evaluateJavascript(script, null);
            }
        });
    }

    private List<Voice> englishVoices(TextToSpeech engine) {
        List<Voice> result = new ArrayList<>();
        if (engine == null) return result;
        Set<Voice> voices = engine.getVoices();
        if (voices == null) return result;
        for (Voice voice : voices) {
            if (voice.getLocale() != null && "en".equals(voice.getLocale().getLanguage())) result.add(voice);
        }
        result.sort(Comparator.comparing(Voice::isNetworkConnectionRequired).thenComparing(Voice::getName));
        return result;
    }

    private void reportVoices() {
        JSONArray names = new JSONArray();
        List<String> engineNames = new ArrayList<>(readyEngines);
        engineNames.sort(Comparator.comparing((String name) -> !name.equals(defaultEngine)).thenComparing(name -> name));
        for (String engineName : engineNames) {
            for (Voice voice : englishVoices(engines.get(engineName))) {
                JSONObject entry = new JSONObject();
                try {
                    entry.put("id", engineName + "|" + voice.getName());
                    entry.put("name", voice.getName());
                    entry.put("engine", engineLabels.getOrDefault(engineName, engineName));
                    entry.put("network", voice.isNetworkConnectionRequired());
                    entry.put("lang", voice.getLocale().toLanguageTag());
                    names.put(entry);
                } catch (org.json.JSONException ignored) { }
            }
        }
        if (webView != null) {
            String script = "window.onNativeVoices(" + JSONObject.quote(names.toString()) + ");";
            webView.evaluateJavascript(script, null);
        }
    }

    private void startSpeech(PendingSpeech pending) {
        if (tts == null || !ttsReady) { reportSpeech(pending.id, false); return; }
        TextToSpeech engine = tts;
        Voice selected = null;
        if (!pending.voiceId.isEmpty()) {
            int separator = pending.voiceId.indexOf('|');
            if (separator > 0) {
                String engineName = pending.voiceId.substring(0, separator);
                if (!readyEngines.contains(engineName)) {
                    if (engines.containsKey(engineName)) { waiting = pending; return; }
                    reportSpeech(pending.id, false);
                    return;
                }
                engine = engines.get(engineName);
                String voiceName = pending.voiceId.substring(separator + 1);
                for (Voice voice : englishVoices(engine)) {
                    if (voiceName.equals(voice.getName())) { selected = voice; break; }
                }
            }
            if (selected == null) { reportSpeech(pending.id, false); return; }
        }
        int support = engine.setLanguage(selected != null ? selected.getLocale() : Locale.forLanguageTag(pending.language));
        if (support == TextToSpeech.LANG_MISSING_DATA || support == TextToSpeech.LANG_NOT_SUPPORTED) {
            reportSpeech(pending.id, false);
            return;
        }
        if (selected != null && engine.setVoice(selected) == TextToSpeech.ERROR) {
            reportSpeech(pending.id, false);
            return;
        }
        engine.setSpeechRate(pending.rate);
        if (engine.speak(pending.text, TextToSpeech.QUEUE_FLUSH, null, pending.id) == TextToSpeech.ERROR) {
            reportSpeech(pending.id, false);
        }
    }

    public final class SpeechBridge {
        @JavascriptInterface public void speak(String text, String language, double rate, String id, String voiceId) {
            runOnUiThread(() -> {
                PendingSpeech pending = new PendingSpeech(text, language, (float) rate, id, voiceId);
                if (ttsReady) startSpeech(pending);
                else if (ttsInitialized) reportSpeech(id, false);
                else waiting = pending;
            });
        }
        @JavascriptInterface public void requestVoices() {
            runOnUiThread(() -> { if (ttsInitialized) reportVoices(); });
        }
        @JavascriptInterface public void cancel() {
            runOnUiThread(() -> {
                waiting = null;
                if (tts != null) tts.stop();
                for (TextToSpeech engine : engines.values()) if (engine != tts) engine.stop();
            });
        }
        @JavascriptInterface public void keepScreenOn(boolean enabled) {
            runOnUiThread(() -> { if (webView != null) webView.setKeepScreenOn(enabled); });
        }
    }

    @Override protected void onDestroy() {
        for (TextToSpeech engine : engines.values()) { engine.stop(); engine.shutdown(); }
        if (tts != null && !engines.containsValue(tts)) { tts.stop(); tts.shutdown(); }
        if (webView != null) { webView.destroy(); webView = null; }
        super.onDestroy();
    }
}

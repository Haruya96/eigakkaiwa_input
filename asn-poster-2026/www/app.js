"use strict";

const CARDS = window.ASN_CARDS || [];
const CORE = window.PosterStudyCore;
const MASTERED_KEY = "asn-poster-2026-mastered-v1";
const RATE_KEY = "asn-poster-2026-rate-v1";
const $ = selector => document.querySelector(selector);

function loadMastery() {
  try {
    const saved = JSON.parse(localStorage.getItem(MASTERED_KEY) || "[]");
    return new Set(Array.isArray(saved) ? saved.filter(Number.isInteger) : []);
  } catch { return new Set(); }
}

const state = {
  mastered: loadMastery(), visible: [], currentId: 1, order: [], shuffled: false,
  mode: "listen", flipped: false, playing: false, playbackToken: 0,
  pendingSpeech: null, wakeLock: null,
};

function saveMastery() {
  try { localStorage.setItem(MASTERED_KEY, JSON.stringify([...state.mastered])); }
  catch { status("このブラウザでは暗記状態を保存できません。"); }
}
function currentCard() { return CARDS.find(card => card.id === state.currentId); }
function status(message) { $("#playStatus").textContent = message; }

function filteredCards() {
  const cards = CORE.filter(CARDS, $("#category").value, $("#status").value, $("#search").value, state.mastered);
  return state.shuffled ? cards.sort((a, b) => state.order.indexOf(a.id) - state.order.indexOf(b.id)) : cards;
}

function render() {
  state.visible = filteredCards();
  if (state.visible.length && !state.visible.some(card => card.id === state.currentId)) state.currentId = state.visible[0].id;
  const index = state.visible.findIndex(card => card.id === state.currentId);
  const hasCard = index >= 0;
  $("#empty").hidden = hasCard;
  $("#listenPanel").hidden = !hasCard || state.mode !== "listen";
  $("#flashPanel").hidden = !hasCard || state.mode !== "flash";
  $("#position").textContent = hasCard ? `${index + 1} / ${state.visible.length}` : "0 / 0";
  for (const selector of ["#previous", "#next", "#playOne", "#playAll", "#flashNext", "#flashPlay"]) $(selector).disabled = !hasCard;
  const mastered = CARDS.filter(card => state.mastered.has(card.id)).length;
  $("#progressText").textContent = `${mastered} / ${CARDS.length}`;
  $("#progressFill").style.width = `${CARDS.length ? mastered / CARDS.length * 100 : 0}%`;
  if (!hasCard) return;

  const card = currentCard();
  $("#listenCategory").textContent = card.category;
  $("#listenNumber").textContent = `CARD ${String(card.id).padStart(3, "0")}`;
  $("#phrase").textContent = card.phrase;
  $("#japanese").textContent = card.japanese;
  $("#example").textContent = card.example;
  $("#flashCategory").textContent = card.category;
  $("#flashNumber").textContent = `CARD ${String(card.id).padStart(3, "0")}`;
  const japaneseFront = $("#flashDirection").value === "ja";
  $("#flashPromptLabel").textContent = japaneseFront ? "日本語から英語を思い出す" : "英語から日本語を思い出す";
  $("#flashPrompt").textContent = japaneseFront ? card.japanese : card.phrase;
  $("#flashAnswer").textContent = `${japaneseFront ? card.phrase : card.japanese}\n\n例文：${card.example}`;
  $("#flashAnswer").hidden = !state.flipped;
  $("#flashHint").textContent = state.flipped ? "タップして表面に戻る" : "タップして答えを見る ↗";
  $("#flip").setAttribute("aria-label", state.flipped ? "表面に戻る" : "答えを表示");
  for (const selector of ["#learnButton", "#flashLearn"]) {
    const button = $(selector);
    const learned = state.mastered.has(card.id);
    button.textContent = learned ? "✓ 覚えた" : "まだ不安";
    button.classList.toggle("learned", learned);
    button.setAttribute("aria-pressed", String(learned));
  }
}

function releaseWakeLock() {
  const lock = state.wakeLock;
  state.wakeLock = null;
  if (lock) void lock.release().catch(() => {});
  if (window.AndroidTts) window.AndroidTts.keepScreenOn(false);
}

async function requestWakeLock(token) {
  if (window.AndroidTts) window.AndroidTts.keepScreenOn(true);
  if (!navigator.wakeLock || document.visibilityState !== "visible") return;
  try {
    const lock = await navigator.wakeLock.request("screen");
    if (token !== state.playbackToken || !state.playing) await lock.release();
    else state.wakeLock = lock;
  } catch { /* Speech still works if the system denies the screen wake lock. */ }
}

function stopPlayback() {
  state.playbackToken++;
  state.playing = false;
  state.pendingSpeech?.(false);
  state.pendingSpeech = null;
  if (window.AndroidTts) window.AndroidTts.cancel();
  else if (window.speechSynthesis) window.speechSynthesis.cancel();
  releaseWakeLock();
  $("#stop").hidden = true;
  $("#playOne").hidden = false;
  $("#playAll").hidden = false;
  $("#flashPlay").textContent = "▶ 音声を再生";
  status("端末の英語・日本語音声を使用します。");
}

function move(delta) {
  if (!state.visible.length) return;
  stopPlayback();
  const index = state.visible.findIndex(card => card.id === state.currentId);
  state.currentId = state.visible[(index + delta + state.visible.length) % state.visible.length].id;
  state.flipped = false;
  render();
}

function toggleMastered() {
  if (!state.visible.length) return;
  const id = state.currentId;
  if (state.mastered.has(id)) state.mastered.delete(id);
  else state.mastered.add(id);
  saveMastery();
  if ($("#status").value !== "all") {
    stopPlayback();
    const index = state.visible.findIndex(card => card.id === id);
    const remaining = filteredCards();
    state.currentId = remaining[Math.min(index, remaining.length - 1)]?.id ?? id;
    state.flipped = false;
  }
  render();
}

let utteranceId = 0;
window.onNativeSpeechDone = (id, successful) => {
  if (window.nativeSpeechId === id && state.pendingSpeech) state.pendingSpeech(Boolean(successful));
};

function speak(text, language, token) {
  if (token !== state.playbackToken) return Promise.resolve(false);
  return new Promise(resolve => {
    let done = false;
    const finish = success => {
      if (done) return;
      done = true;
      state.pendingSpeech = null;
      resolve(Boolean(success) && token === state.playbackToken);
    };
    state.pendingSpeech = finish;
    const rate = Number($("#rate").value);
    if (window.AndroidTts) {
      const id = String(++utteranceId);
      window.nativeSpeechId = id;
      try { window.AndroidTts.speak(text, language, rate, id); }
      catch { finish(false); }
    } else if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = rate;
      utterance.onend = () => finish(true);
      utterance.onerror = () => finish(false);
      window.speechSynthesis.speak(utterance);
    } else finish(false);
  });
}

async function playCards(queue) {
  if (!queue.length) return;
  stopPlayback();
  if (!window.AndroidTts && (!window.speechSynthesis || !window.SpeechSynthesisUtterance)) {
    status("この端末では音声合成を利用できません。");
    return;
  }
  state.playing = true;
  const token = state.playbackToken;
  $("#stop").hidden = false;
  $("#playOne").hidden = true;
  $("#playAll").hidden = true;
  $("#flashPlay").textContent = "■ 停止";
  void requestWakeLock(token);
  for (const [index, card] of queue.entries()) {
    if (token !== state.playbackToken) return;
    state.currentId = card.id;
    state.flipped = false;
    render();
    for (const segment of CORE.segments(card)) {
      if (token !== state.playbackToken) return;
      status(`${index + 1}/${queue.length}　${segment.label}を再生中`);
      const success = await speak(segment.text, segment.lang, token);
      if (!success) {
        if (token === state.playbackToken) {
          stopPlayback();
          status("音声を再生できませんでした。端末の音声設定を確認してください。");
        }
        return;
      }
    }
  }
  stopPlayback();
  status("再生が完了しました。");
}

function setMode(mode) {
  stopPlayback();
  state.mode = mode;
  state.flipped = false;
  for (const [name, selector] of [["listen", "#listenTab"], ["flash", "#flashTab"]]) {
    $(selector).classList.toggle("active", name === mode);
    $(selector).setAttribute("aria-selected", String(name === mode));
  }
  render();
}

function init() {
  if (CARDS.length !== 100 || !CORE) {
    $("#empty").textContent = "カードデータの読み込みに失敗しました。";
    $("#empty").hidden = false;
    $("#listenPanel").hidden = true;
    return;
  }
  for (const category of new Set(CARDS.map(card => card.category))) $("#category").append(new Option(category, category));
  state.order = CARDS.map(card => card.id);
  let rate = NaN;
  try { rate = Number(localStorage.getItem(RATE_KEY)); } catch { /* Private storage can be disabled. */ }
  if (rate >= .65 && rate <= 1.15) $("#rate").value = rate.toFixed(2);
  $("#rateLabel").textContent = `${Number($("#rate").value).toFixed(2)}×`;

  for (const selector of ["#category", "#status", "#search"]) {
    $(selector).addEventListener(selector === "#search" ? "input" : "change", () => { stopPlayback(); state.flipped = false; render(); });
  }
  $("#rate").addEventListener("input", () => {
    $("#rateLabel").textContent = `${Number($("#rate").value).toFixed(2)}×`;
    try { localStorage.setItem(RATE_KEY, $("#rate").value); } catch { /* Playback still works. */ }
  });
  $("#previous").addEventListener("click", () => move(-1));
  $("#next").addEventListener("click", () => move(1));
  $("#flashNext").addEventListener("click", () => move(1));
  $("#listenTab").addEventListener("click", () => setMode("listen"));
  $("#flashTab").addEventListener("click", () => setMode("flash"));
  $("#flashDirection").addEventListener("change", () => { state.flipped = false; render(); });
  $("#flip").addEventListener("click", () => { state.flipped = !state.flipped; render(); });
  for (const selector of ["#learnButton", "#flashLearn"]) $(selector).addEventListener("click", toggleMastered);
  $("#playOne").addEventListener("click", () => void playCards([currentCard()]));
  $("#flashPlay").addEventListener("click", () => { if (state.playing) stopPlayback(); else void playCards([currentCard()]); });
  $("#playAll").addEventListener("click", () => {
    const index = state.visible.findIndex(card => card.id === state.currentId);
    void playCards([...state.visible.slice(index), ...state.visible.slice(0, index)]);
  });
  $("#stop").addEventListener("click", stopPlayback);
  $("#shuffle").addEventListener("click", () => {
    stopPlayback();
    state.shuffled = !state.shuffled;
    for (let i = state.order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [state.order[i], state.order[j]] = [state.order[j], state.order[i]];
    }
    $("#shuffle").textContent = state.shuffled ? "順番に戻す" : "シャッフル";
    $("#shuffle").setAttribute("aria-pressed", String(state.shuffled));
    render();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && state.playing) void requestWakeLock(state.playbackToken);
    else if (document.visibilityState !== "visible") releaseWakeLock();
  });
  document.addEventListener("keydown", event => {
    if (["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
    if (event.key === "ArrowRight") move(1);
    else if (event.key === "ArrowLeft") move(-1);
    else if (event.code === "Space" && state.mode === "flash") { event.preventDefault(); state.flipped = !state.flipped; render(); }
  });
  render();
  if (!window.AndroidTts && "serviceWorker" in navigator && location.protocol === "https:") {
    void navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }
}

init();

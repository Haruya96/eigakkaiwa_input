const STORAGE_KEY = "asn-kidney-week-english-mastered-v1";

const state = {
  phrases: [],
  mastered: new Set(),
  set: "core",
  category: "all",
  query: "",
  reviewOnly: false,
  shuffled: false,
  visiblePhrases: [],
  voices: [],
  currentUtterance: null,
  playbackToken: 0,
  playingVisible: false,
};

const elements = {
  phraseList: document.querySelector("#phraseList"),
  template: document.querySelector("#phraseTemplate"),
  searchInput: document.querySelector("#searchInput"),
  setSelect: document.querySelector("#setSelect"),
  categorySelect: document.querySelector("#categorySelect"),
  voiceSelect: document.querySelector("#voiceSelect"),
  rateInput: document.querySelector("#rateInput"),
  playVisibleButton: document.querySelector("#playVisibleButton"),
  reviewButton: document.querySelector("#reviewButton"),
  shuffleButton: document.querySelector("#shuffleButton"),
  resetButton: document.querySelector("#resetButton"),
  progressCount: document.querySelector("#progressCount"),
  visibleCount: document.querySelector("#visibleCount"),
  uncheckedCount: document.querySelector("#uncheckedCount"),
  categoryCount: document.querySelector("#categoryCount"),
};

function loadMastered() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    state.mastered = new Set(saved);
  } catch {
    state.mastered = new Set();
  }
}

function saveMastered() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.mastered]));
}

function getActivePhrases() {
  return state.phrases.filter((phrase) => phrase.set === state.set);
}

function getSetLabels() {
  const labels = new Map();
  for (const phrase of state.phrases) {
    labels.set(phrase.set, phrase.setLabel);
  }
  return labels;
}

function getCategories() {
  return [...new Set(getActivePhrases().map((phrase) => phrase.category))];
}

function buildSets() {
  elements.setSelect.replaceChildren();
  for (const [value, label] of getSetLabels()) {
    elements.setSelect.append(new Option(label, value));
  }
  elements.setSelect.value = state.set;
}

function buildCategories() {
  elements.categorySelect.replaceChildren(new Option("All categories", "all"));
  const categories = getCategories();
  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    elements.categorySelect.append(option);
  }
  elements.categoryCount.textContent = String(categories.length);
}

function normalizeText(value) {
  return value.trim().toLowerCase();
}

function filterPhrases() {
  const query = normalizeText(state.query);
  let phrases = getActivePhrases().filter((phrase) => {
    const matchesCategory = state.category === "all" || phrase.category === state.category;
    const haystack = `${phrase.english} ${phrase.japanese} ${phrase.category} ${phrase.setLabel} ${phrase.note}`.toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    const matchesReview = !state.reviewOnly || !state.mastered.has(phrase.id);
    return matchesCategory && matchesQuery && matchesReview;
  });

  if (state.shuffled) {
    phrases = [...phrases].sort((a, b) => a.shuffleKey.localeCompare(b.shuffleKey));
  }

  state.visiblePhrases = phrases;
}

function render() {
  filterPhrases();
  elements.phraseList.replaceChildren();

  if (state.visiblePhrases.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "表示できる表現がありません。検索条件を変えてください。";
    elements.phraseList.append(empty);
  }

  const fragment = document.createDocumentFragment();
  for (const phrase of state.visiblePhrases) {
    const node = elements.template.content.firstElementChild.cloneNode(true);
    const mastered = state.mastered.has(phrase.id);
    node.classList.toggle("is-mastered", mastered);
    node.querySelector(".phrase-number").textContent = String(phrase.localId).padStart(2, "0");
    node.querySelector(".phrase-category").textContent = phrase.category;
    node.querySelector(".phrase-english").textContent = phrase.english;
    node.querySelector(".phrase-japanese").textContent = phrase.japanese;
    node.querySelector(".phrase-note").textContent = phrase.note;
    node.querySelector(".play-button").addEventListener("click", () => playPhraseSequence(phrase));

    const checkbox = node.querySelector(".mastered-checkbox");
    checkbox.checked = mastered;
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        state.mastered.add(phrase.id);
      } else {
        state.mastered.delete(phrase.id);
      }
      saveMastered();
      updateStats();
      node.classList.toggle("is-mastered", checkbox.checked);
      if (state.reviewOnly) {
        render();
      }
    });

    fragment.append(node);
  }

  elements.phraseList.append(fragment);
  updateStats();
}

function updateStats() {
  const activePhrases = getActivePhrases();
  const masteredInSet = activePhrases.filter((phrase) => state.mastered.has(phrase.id)).length;
  elements.progressCount.textContent = `${masteredInSet} / ${activePhrases.length}`;
  elements.visibleCount.textContent = String(state.visiblePhrases.length);
  elements.uncheckedCount.textContent = String(activePhrases.length - masteredInSet);
}

function pickVoiceFor(lang) {
  const selected = elements.voiceSelect.value;
  if (/^en/i.test(lang) && selected) {
    return state.voices.find((voice) => voice.name === selected) || null;
  }
  const langPrefix = lang.slice(0, 2);
  return (
    state.voices.find((voice) => new RegExp(`^${langPrefix}[-_]`, "i").test(voice.lang) && /US|United States|Japan/i.test(voice.name)) ||
    state.voices.find((voice) => new RegExp(`^${langPrefix}[-_]`, "i").test(voice.lang)) ||
    null
  );
}

function stopPlayback() {
  state.playbackToken += 1;
  state.playingVisible = false;
  elements.playVisibleButton.textContent = "Play sequence";
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function speakSegment(segment, token, onEnd) {
  if (!("speechSynthesis" in window)) {
    alert("このブラウザでは音声合成を利用できません。");
    return;
  }

  const utterance = new SpeechSynthesisUtterance(segment.text);
  const voice = pickVoiceFor(segment.lang);
  if (voice) {
    utterance.voice = voice;
  }
  utterance.lang = voice?.lang || segment.lang;
  utterance.rate = Number(elements.rateInput.value);
  utterance.pitch = 1;
  utterance.onend = () => {
    state.currentUtterance = null;
    if (token === state.playbackToken && onEnd) {
      onEnd();
    }
  };
  utterance.onerror = utterance.onend;
  state.currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

function getPhraseSequence(phrase) {
  return [
    { text: phrase.japanese, lang: "ja-JP" },
    { text: phrase.english, lang: "en-US" },
    { text: phrase.english, lang: "en-US" },
  ];
}

function playSegments(segments, index, token, onDone) {
  if (token !== state.playbackToken) {
    return;
  }
  if (index >= segments.length) {
    if (onDone) {
      onDone();
    }
    return;
  }
  speakSegment(segments[index], token, () => playSegments(segments, index + 1, token, onDone));
}

function playPhraseSequence(phrase) {
  stopPlayback();
  const token = state.playbackToken;
  playSegments(getPhraseSequence(phrase), 0, token);
}

function playVisibleFrom(index = 0, token = state.playbackToken) {
  if (token !== state.playbackToken) {
    return;
  }
  if (index >= state.visiblePhrases.length) {
    state.playingVisible = false;
    elements.playVisibleButton.textContent = "Play sequence";
    return;
  }
  elements.playVisibleButton.textContent = `Playing ${index + 1}/${state.visiblePhrases.length}`;
  playSegments(getPhraseSequence(state.visiblePhrases[index]), 0, token, () => playVisibleFrom(index + 1, token));
}

function loadVoices() {
  if (!("speechSynthesis" in window)) {
    return;
  }
  state.voices = window.speechSynthesis.getVoices();
  const englishVoices = state.voices.filter((voice) => /^en[-_]/i.test(voice.lang));
  elements.voiceSelect.replaceChildren(new Option("System default", ""));
  for (const voice of englishVoices) {
    elements.voiceSelect.append(new Option(`${voice.name} (${voice.lang})`, voice.name));
  }
}

function wireControls() {
  elements.searchInput.addEventListener("input", (event) => {
    stopPlayback();
    state.query = event.target.value;
    render();
  });

  elements.setSelect.addEventListener("change", (event) => {
    stopPlayback();
    state.set = event.target.value;
    state.category = "all";
    buildCategories();
    render();
  });

  elements.categorySelect.addEventListener("change", (event) => {
    stopPlayback();
    state.category = event.target.value;
    render();
  });

  elements.reviewButton.addEventListener("click", () => {
    stopPlayback();
    state.reviewOnly = !state.reviewOnly;
    elements.reviewButton.setAttribute("aria-pressed", String(state.reviewOnly));
    render();
  });

  elements.shuffleButton.addEventListener("click", () => {
    stopPlayback();
    state.shuffled = !state.shuffled;
    elements.shuffleButton.setAttribute("aria-pressed", String(state.shuffled));
    render();
  });

  elements.resetButton.addEventListener("click", () => {
    const activeIds = new Set(getActivePhrases().map((phrase) => phrase.id));
    const hasActiveChecks = [...activeIds].some((id) => state.mastered.has(id));
    if (!hasActiveChecks) {
      return;
    }
    const ok = confirm("現在のセットのチェックをすべて外しますか。");
    if (!ok) {
      return;
    }
    for (const id of activeIds) {
      state.mastered.delete(id);
    }
    saveMastered();
    render();
  });

  elements.playVisibleButton.addEventListener("click", () => {
    if (!state.visiblePhrases.length) {
      return;
    }
    if (state.playingVisible || window.speechSynthesis.speaking) {
      stopPlayback();
      return;
    }
    state.playingVisible = true;
    state.playbackToken += 1;
    playVisibleFrom(0, state.playbackToken);
  });
}

async function loadPhrases() {
  const [coreResponse, advancedResponse] = await Promise.all([fetch("phrases.json"), fetch("advanced-phrases.json")]);
  if (!coreResponse.ok || !advancedResponse.ok) {
    throw new Error("phrase data could not be loaded");
  }
  const corePhrases = await coreResponse.json();
  const advancedPhrases = await advancedResponse.json();
  state.phrases = [
    ...corePhrases.map((phrase, index) => ({
      ...phrase,
      set: "core",
      setLabel: "Core 100",
      localId: index + 1,
      shuffleKey: `${Math.random().toString(36).slice(2)}-${phrase.id}`,
    })),
    ...advancedPhrases.map((phrase, index) => ({
      ...phrase,
      set: "advanced",
      setLabel: "Advanced 100",
      localId: index + 1,
      shuffleKey: `${Math.random().toString(36).slice(2)}-${phrase.id}`,
    })),
  ];
}

async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("service-worker.js");
    } catch {
      // The app still works online when service worker registration is unavailable.
    }
  }
}

async function init() {
  loadMastered();
  wireControls();
  await loadPhrases();
  buildSets();
  buildCategories();
  render();
  loadVoices();
  if ("speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
  registerServiceWorker();
}

init().catch((error) => {
  elements.phraseList.innerHTML = `<p class="empty-state">${error.message}</p>`;
});

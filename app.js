const STORAGE_KEY = "asn-kidney-week-english-mastered-v1";

const state = {
  phrases: [],
  mastered: new Set(),
  category: "all",
  query: "",
  reviewOnly: false,
  shuffled: false,
  visiblePhrases: [],
  voices: [],
  currentUtterance: null,
};

const elements = {
  phraseList: document.querySelector("#phraseList"),
  template: document.querySelector("#phraseTemplate"),
  searchInput: document.querySelector("#searchInput"),
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

function getCategories() {
  return [...new Set(state.phrases.map((phrase) => phrase.category))];
}

function buildCategories() {
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
  let phrases = state.phrases.filter((phrase) => {
    const matchesCategory = state.category === "all" || phrase.category === state.category;
    const haystack = `${phrase.english} ${phrase.japanese} ${phrase.category} ${phrase.note}`.toLowerCase();
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
    node.querySelector(".phrase-number").textContent = String(phrase.id).padStart(2, "0");
    node.querySelector(".phrase-category").textContent = phrase.category;
    node.querySelector(".phrase-english").textContent = phrase.english;
    node.querySelector(".phrase-japanese").textContent = phrase.japanese;
    node.querySelector(".phrase-note").textContent = phrase.note;
    node.querySelector(".play-button").addEventListener("click", () => speak(phrase.english));

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
  elements.progressCount.textContent = `${state.mastered.size} / ${state.phrases.length}`;
  elements.visibleCount.textContent = String(state.visiblePhrases.length);
  elements.uncheckedCount.textContent = String(state.phrases.length - state.mastered.size);
}

function pickVoice() {
  const selected = elements.voiceSelect.value;
  if (selected) {
    return state.voices.find((voice) => voice.name === selected) || null;
  }
  return (
    state.voices.find((voice) => /^en[-_]/i.test(voice.lang) && /US|United States/i.test(voice.name)) ||
    state.voices.find((voice) => /^en[-_]/i.test(voice.lang)) ||
    null
  );
}

function speak(text, onEnd) {
  if (!("speechSynthesis" in window)) {
    alert("このブラウザでは音声合成を利用できません。");
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if (voice) {
    utterance.voice = voice;
  }
  utterance.lang = voice?.lang || "en-US";
  utterance.rate = Number(elements.rateInput.value);
  utterance.pitch = 1;
  utterance.onend = () => {
    state.currentUtterance = null;
    if (onEnd) {
      onEnd();
    }
  };
  state.currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

function playVisibleFrom(index = 0) {
  if (index >= state.visiblePhrases.length) {
    elements.playVisibleButton.textContent = "Play visible";
    return;
  }
  elements.playVisibleButton.textContent = `Playing ${index + 1}/${state.visiblePhrases.length}`;
  speak(state.visiblePhrases[index].english, () => playVisibleFrom(index + 1));
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
    state.query = event.target.value;
    render();
  });

  elements.categorySelect.addEventListener("change", (event) => {
    state.category = event.target.value;
    render();
  });

  elements.reviewButton.addEventListener("click", () => {
    state.reviewOnly = !state.reviewOnly;
    elements.reviewButton.setAttribute("aria-pressed", String(state.reviewOnly));
    render();
  });

  elements.shuffleButton.addEventListener("click", () => {
    state.shuffled = !state.shuffled;
    elements.shuffleButton.setAttribute("aria-pressed", String(state.shuffled));
    render();
  });

  elements.resetButton.addEventListener("click", () => {
    if (!state.mastered.size) {
      return;
    }
    const ok = confirm("すべてのチェックを外しますか。");
    if (!ok) {
      return;
    }
    state.mastered.clear();
    saveMastered();
    render();
  });

  elements.playVisibleButton.addEventListener("click", () => {
    if (!state.visiblePhrases.length) {
      return;
    }
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      elements.playVisibleButton.textContent = "Play visible";
      return;
    }
    playVisibleFrom(0);
  });
}

async function loadPhrases() {
  const response = await fetch("phrases.json");
  if (!response.ok) {
    throw new Error("phrases.json could not be loaded");
  }
  const phrases = await response.json();
  state.phrases = phrases.map((phrase) => ({
    ...phrase,
    shuffleKey: `${Math.random().toString(36).slice(2)}-${phrase.id}`,
  }));
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

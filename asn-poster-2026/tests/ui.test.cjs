const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'www/index.html'), 'utf8');

function makeApp(initialStorage = []) {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  class Element {
    constructor(id) {
      this.id = id;
      this.hidden = false;
      this.value = {category: 'all', status: 'all', flashDirection: 'ja', rate: '0.90'}[id] ?? '';
      this.textContent = '';
      this.handlers = {};
      this.attributes = {};
      this.style = {};
      this.classList = {toggle: () => {}};
    }
    addEventListener(type, handler) { this.handlers[type] = handler; }
    append() {}
    setAttribute(key, value) { this.attributes[key] = value; }
    click() { this.handlers.click?.({}); }
    change() { this.handlers.change?.({target: this}); }
  }
  const elements = Object.fromEntries(ids.map(id => [id, new Element(id)]));
  const storage = new Map(initialStorage);
  const spoken = [];
  const document = {
    querySelector: selector => elements[selector.slice(1)],
    addEventListener: () => {},
    visibilityState: 'visible',
    activeElement: {tagName: 'BODY'},
  };
  const window = {
    speechSynthesis: {
      speak(utterance) { spoken.push({text: utterance.text, lang: utterance.lang}); queueMicrotask(() => utterance.onend()); },
      cancel() {},
    },
  };
  class SpeechSynthesisUtterance { constructor(text) { this.text = text; } }
  window.SpeechSynthesisUtterance = SpeechSynthesisUtterance;
  const context = vm.createContext({window, document, navigator: {}, location: {protocol: 'http:'}, localStorage: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  }, Option: class Option {}, SpeechSynthesisUtterance, queueMicrotask, console});
  for (const file of ['cards-data.js', 'qa-data.js', 'study-core.js', 'app.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'www', file), 'utf8'), context, {filename: file});
  }
  return {elements, spoken, storage};
}

test('audio control speaks exactly four ordered segments and stops', async () => {
  const {elements, spoken} = makeApp();
  assert.equal(elements.phrase.textContent, 'Thank you for stopping by.');
  elements.playOne.click();
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.deepEqual(spoken.map(item => item.text), [
    'Thank you for stopping by.', 'お立ち寄りありがとうございます。',
    'Thank you for stopping by our poster.', 'Thank you for stopping by our poster.',
  ]);
  assert.deepEqual(spoken.map(item => item.lang), ['en-US', 'ja-JP', 'en-US', 'en-US']);
  assert.equal(elements.stop.hidden, true);
});

test('flashcard flips, reverses direction, remembers mastery and filters it', () => {
  const {elements, storage} = makeApp();
  elements.flashTab.click();
  assert.equal(elements.flashPrompt.textContent, 'お立ち寄りありがとうございます。');
  elements.flip.click();
  assert.equal(elements.flashAnswer.hidden, false);
  assert.ok(elements.flashAnswer.textContent.includes('Thank you for stopping by.'));
  elements.flashDirection.value = 'en';
  elements.flashDirection.change();
  assert.equal(elements.flashPrompt.textContent, 'Thank you for stopping by.');
  assert.equal(elements.flashAnswer.hidden, true);
  elements.flashLearn.click();
  assert.deepEqual(JSON.parse(storage.get('asn-poster-2026-mastered-v1')), [1]);
  elements.status.value = 'unlearned';
  elements.status.change();
  assert.equal(elements.flashNumber.textContent, 'CARD 002');
  assert.equal(elements.position.textContent, '1 / 99');
});

test('continuous playback advances through every visible card in order', async () => {
  const {elements, spoken} = makeApp();
  elements.category.value = 'Sensitivity';
  elements.category.change();
  assert.equal(elements.position.textContent, '1 / 5');
  elements.playAll.click();
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(spoken.length, 20);
  assert.equal(spoken[0].text, 'a stricter proteinuria threshold');
  assert.equal(spoken[19].text, 'We restricted this sensitivity analysis to the overall cohort because few participants were positive.');
  assert.equal(elements.stop.hidden, true);
});

test('Q&A switches to English-only audio, question-front flashcards, and independent mastery', async () => {
  const {elements, spoken, storage} = makeApp();
  elements.qaDeck.click();
  assert.equal(elements.progressText.textContent, '0 / 50');
  assert.equal(elements.japaneseItem.hidden, true);
  assert.equal(elements.flashDirectionWrap.hidden, true);
  assert.equal(elements.phrase.textContent, 'What should a visitor take away from your poster?');
  elements.flashTab.click();
  assert.equal(elements.flashPrompt.textContent, 'What should a visitor take away from your poster?');
  elements.flip.click();
  assert.ok(elements.flashAnswer.textContent.includes('people with proteinuria'));
  assert.equal(elements.flashAnswer.hidden, false);
  elements.flashLearn.click();
  assert.deepEqual(JSON.parse(storage.get('asn-poster-2026-qa-mastered-v2')), [1]);
  assert.equal(storage.get('asn-poster-2026-mastered-v1'), undefined);
  elements.flashPlay.click();
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.deepEqual(spoken.map(item => item.text), [
    'What should a visitor take away from your poster?',
    "Higher uric acid was linked to faster eGFR decline, mostly among people with proteinuria. Because this is observational, we can't say uric acid caused the decline.",
    "Higher uric acid was linked to faster eGFR decline, mostly among people with proteinuria. Because this is observational, we can't say uric acid caused the decline.",
  ]);
  assert.ok(spoken.every(item => item.lang === 'en-US'));
  elements.phrasesDeck.click();
  assert.equal(elements.progressText.textContent, '0 / 100');
  assert.equal(elements.japaneseItem.hidden, false);
  assert.equal(elements.flashDirectionWrap.hidden, false);
});

test('Q&A flashcards reveal multiple-blank full-answer hint without revealing the answer', () => {
  const {elements} = makeApp();
  elements.flashTab.click();
  assert.equal(elements.showHint.hidden, true, 'phrase cards have no hint control');
  elements.qaDeck.click();
  assert.equal(elements.showHint.hidden, false);
  assert.equal(elements.clozeHint.hidden, true);
  assert.equal(elements.flashAnswer.hidden, true);
  elements.showHint.click();
  assert.equal(elements.clozeHint.hidden, false);
  assert.equal(elements.flashAnswer.hidden, true);
  assert.equal(elements.showHint.attributes['aria-expanded'], 'true');
  assert.equal(elements.clozeHint.textContent, "Higher uric acid ________ faster eGFR decline, ________ people with proteinuria. Because this is observational, we ________.");
  elements.flip.click();
  assert.equal(elements.clozeHint.hidden, true);
  assert.equal(elements.showHint.hidden, true);
  assert.equal(elements.flashAnswer.hidden, false);
  elements.flip.click();
  assert.equal(elements.clozeHint.hidden, true, 'returning to the question resets the hint');
  elements.showHint.click();
  elements.flashNext.click();
  assert.equal(elements.clozeHint.hidden, true, 'next Q&A begins without a hint');
  assert.equal(elements.showHint.textContent, 'ヒントを表示');
  elements.phrasesDeck.click();
  assert.equal(elements.showHint.hidden, true);
});

test('rewritten Q&A starts fresh, retains phrase progress, and plays only the 35 discussion cards', async () => {
  const {elements, spoken, storage} = makeApp([
    ['asn-poster-2026-qa-mastered-v1', '[1,2]'],
    ['asn-poster-2026-mastered-v1', '[1]'],
  ]);
  assert.equal(elements.progressText.textContent, '1 / 100');
  elements.qaDeck.click();
  assert.equal(elements.progressText.textContent, '0 / 50');
  elements.category.value = 'discussion';
  elements.category.change();
  assert.equal(elements.position.textContent, '1 / 35');
  assert.equal(elements.listenNumber.textContent, 'Q 016');
  elements.playAll.click();
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(spoken.length, 105);
  assert.ok(spoken.every(part => part.lang === 'en-US'));
  assert.equal(elements.listenNumber.textContent, 'Q 050');
  assert.equal(elements.stop.hidden, true);
  assert.equal(storage.get('asn-poster-2026-qa-mastered-v1'), '[1,2]');
  elements.phrasesDeck.click();
  assert.equal(elements.progressText.textContent, '1 / 100');
});

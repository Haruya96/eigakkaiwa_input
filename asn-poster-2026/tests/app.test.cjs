const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const dataSource = fs.readFileSync(path.join(root, 'www/cards-data.js'), 'utf8');
const qaSource = fs.readFileSync(path.join(root, 'www/qa-data.js'), 'utf8');
const core = require('../www/study-core.js');

test('questions and answers are 50 distinct English-only study cards', () => {
  const context = {window: {}};
  vm.runInNewContext(qaSource, context);
  const qa = context.window.ASN_QA;
  assert.equal(qa.length, 50);
  assert.equal(new Set(qa.map(card => card.question)).size, 50);
  qa.forEach((card, index) => {
    assert.equal(card.id, index + 1);
    assert.ok(card.question.endsWith('?'));
    assert.ok(card.answer);
    assert.match(card.question + card.answer, /^[\x00-\x7F]+$/);
    assert.equal(card.japanese, undefined);
    assert.equal((card.hint.match(/________/g) || []).length >= 2, true, `Q${card.id}: multiple blanks`);
    assert.ok(card.hint.length > 50, `Q${card.id}: hint retains the full answer context`);
    const numbers = text => text.match(/\d+(?:[.,]\d+)*\+?/g) || [];
    assert.deepEqual(numbers(card.hint), numbers(card.answer), `Q${card.id}: study numbers stay visible`);
  });
  assert.equal(qa[0].hint, "Higher uric acid ________ faster eGFR decline, ________ people with proteinuria. Because this is observational, we ________.");
  assert.equal(qa[4].hint, "With proteinuria, ________ 1.3 a year ________ 5.0, ________ 2.0 at 7.8. That's in milliliters per minute per 1.73 square meters per year.");
  assert.ok(qa.some(card => card.answer.includes('8,266')));
  assert.ok(qa.some(card => card.answer.includes('Bonferroni')));
  assert.match(qa[4].answer, /milliliters per minute per 1\.73 square meters per year/);
  assert.match(qa[26].answer, /uric acid and other causes of kidney decline both affect proteinuria/);
  assert.match(qa[30].answer, /populations studied/);
});

test('question is spoken once and answer twice, all in English', () => {
  const card = {question: 'What did you observe?', answer: 'The groups differed.'};
  const parts = core.segments(card, 'qa');
  assert.deepEqual(parts.map(part => part.text), [card.question, card.answer, card.answer]);
  assert.deepEqual(parts.map(part => part.lang), ['en-US', 'en-US', 'en-US']);
});

test('Q&A search covers both questions and answers', () => {
  const cards = [{id: 1, category: 'Results', question: 'Which subgroup?', answer: 'Baseline estimated GFR.'}];
  assert.deepEqual(core.filter(cards, 'all', 'unlearned', 'GFR', new Set()).map(card => card.id), [1]);
  assert.deepEqual(core.filter(cards, 'all', 'learned', '', new Set()).map(card => card.id), []);
});

test('approved data has 100 unique, complete cards with stable IDs', () => {
  const context = {window: {}};
  vm.runInNewContext(dataSource, context);
  const cards = context.window.ASN_CARDS;
  assert.equal(cards.length, 100);
  assert.equal(new Set(cards.map(card => card.phrase)).size, 100);
  assert.equal(new Set(cards.map(card => card.example)).size, 100);
  cards.forEach((card, index) => {
    assert.equal(card.id, index + 1);
    for (const key of ['category', 'phrase', 'japanese', 'example']) assert.ok(card[key]);
    assert.equal(card.hint, undefined);
  });
  assert.ok(cards.some(card => card.example.includes('8,266')));
  assert.ok(cards.some(card => card.example.includes('371')));
});

test('spoken card has phrase, Japanese translation, and the example twice', () => {
  const card = {phrase: 'The key message is that ...', japanese: '重要な結論は…ということです。', example: 'Proteinuria modified the association.'};
  const parts = core.segments(card);
  assert.deepEqual(parts.map(part => part.text), [card.phrase, card.japanese, card.example, card.example]);
  assert.deepEqual(parts.map(part => part.lang), ['en-US', 'ja-JP', 'en-US', 'en-US']);
});

test('unlearned filter excludes mastered cards and searches example text', () => {
  const cards = [
    {id: 1, category: 'Findings', phrase: 'first', japanese: '一番', example: 'proteinuria'},
    {id: 2, category: 'Findings', phrase: 'second', japanese: '二番', example: 'eGFR'},
  ];
  assert.deepEqual(core.filter(cards, 'Findings', 'unlearned', 'egfr', new Set([1])).map(card => card.id), [2]);
  assert.deepEqual(core.filter(cards, 'Findings', 'learned', '', new Set([1])).map(card => card.id), [1]);
});

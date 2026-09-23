const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const dataSource = fs.readFileSync(path.join(root, 'www/cards-data.js'), 'utf8');
const core = require('../www/study-core.js');

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

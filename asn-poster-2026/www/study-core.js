"use strict";
(function (root) {
  function segments(card, deck = 'phrases') {
    if (deck === 'qa') return [
      {text: card.question, lang: 'en-US', label: 'Question'},
      {text: card.answer, lang: 'en-US', label: 'Answer 1'},
      {text: card.answer, lang: 'en-US', label: 'Answer 2'},
    ];
    return [
      {text: card.phrase, lang: 'en-US', label: '英語表現'},
      {text: card.japanese, lang: 'ja-JP', label: '日本語'},
      {text: card.example, lang: 'en-US', label: '例文 1回目'},
      {text: card.example, lang: 'en-US', label: '例文 2回目'},
    ];
  }
  function filter(cards, category, status, query, mastered) {
    const search = query.trim().toLocaleLowerCase();
    return cards.filter(card =>
      (category === 'all' || card.category === category || (category === 'discussion' && card.category.startsWith('Discussion:'))) &&
      (status === 'all' || (status === 'learned') === mastered.has(card.id)) &&
      (!search || [card.phrase, card.japanese, card.example, card.question, card.answer, card.category]
        .filter(Boolean).some(value => value.toLocaleLowerCase().includes(search)))
    );
  }
  const api = {segments, filter};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PosterStudyCore = api;
})(typeof window !== 'undefined' ? window : globalThis);

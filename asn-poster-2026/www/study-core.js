"use strict";
(function (root) {
  function segments(card, deck = 'phrases') {
    if (deck === 'qa') return [
      {text: card.question, lang: 'en-US', label: 'Question', role: 'question'},
      {text: card.answer, lang: 'en-US', label: 'Answer 1', role: 'answer'},
      {text: card.answer, lang: 'en-US', label: 'Answer 2', role: 'answer'},
    ];
    return [
      {text: card.phrase, lang: 'en-US', label: '英語表現'},
      {text: card.japanese, lang: 'ja-JP', label: '日本語'},
      {text: card.example, lang: 'en-US', label: '例文 1回目'},
      {text: card.example, lang: 'en-US', label: '例文 2回目'},
    ];
  }
  function voiceGender(name) {
    // TTS engines expose names, not a portable gender property.
    if (/(?:^|[^a-z])female(?:[^a-z]|$)|(?:^|[^a-z])woman(?:[^a-z]|$)/i.test(name)) return 'female';
    if (/(?:^|[^a-z])male(?:[^a-z]|$)|(?:^|[^a-z])man(?:[^a-z]|$)/i.test(name)) return 'male';
    return null;
  }
  function preferredVoice(voices, role) {
    const gender = role === 'question' ? 'female' : 'male';
    return voices.find(voice => /^en[-_]us$/i.test(voice.lang) && voiceGender(voice.name) === gender)
      || voices.find(voice => /^en(?:[-_]|$)/i.test(voice.lang) && voiceGender(voice.name) === gender)
      || null;
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
  const api = {segments, filter, voiceGender, preferredVoice};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PosterStudyCore = api;
})(typeof window !== 'undefined' ? window : globalThis);

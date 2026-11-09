'use strict';
const english = require('./messages.en.json');

function translator(language) {
 return (message, values) => {
  const translated = language === 'en' && Object.hasOwn(english, message) ? english[message] : message;
  return values ? translated.replace(/\{(\w+)\}/g, (_, key) => values[key]) : translated;
 };
}

const panelMessages = {
 eyebrow: "STAP VOOR STAP",
 tagline: "Jij zoekt. Wij wijzen de weg.",
 pause: "Hints pauzeren",
 resume: "Hints hervatten",
 navigation: "Ondersteuning",
 spelling: "Dyslexie · codehulp",
 principles: "Programmeerprincipes",
 footer: "Mogelijke aandachtspunten, geen beoordeling. Geen hint betekent niet dat alle code correct is.",
 settings: "Instellingen",
 guideTitle: "Welke patronen helpt CodeKompas nalopen?",
 guideIntro: "Dit zijn patronen in code, geen test op dyslexie.",
 issueCount: "{count} mogelijke aandachtspunten. Kies er één.",
 noIssues: "Geen aandachtspunten gevonden binnen de ondersteunde controles.",
 somePrinciples: "Onderzoek deze ideeën. Het zijn geen fouten.",
 noPrinciples: "Hier zijn nu geen principesuggesties. Je kunt dit luik in de instellingen aanzetten.",
 line: "REGEL {line}",
 location: "REGEL {line}, KOLOM {column}",
 example: "Voorbeeld met andere code",
 steps: "Zelf nalopen",
 moreExplanation: "Meer uitleg",
 locate: "Bekijk in mijn code",
 ignore: "Deze naam is bewust zo geschreven",
 more: "Toon meer ({visible} van {total} zichtbaar)",
};

function panelLabels(translate) {
 return Object.fromEntries(Object.entries(panelMessages).map(([key, message]) => [key, translate(message)]));
}

module.exports = {translator, panelLabels};

// Deze oefencode bevat bewust fouten. De tool schrijft geen oplossingen.
var aantalBoeken = 3;
const boeken = ['Boek één', 'Boek twee', 'Boek drie'];
const knop = document.querySelector('#toevoegen');
console.log(aantalBoekne);
knop.addEventListner('click', () => {
  console.log(boeken);
});
knop.style.backgroundColor = '#245878';

function beschrijfBoek(titel) {
  if (titel) {
    return { titel: titel, gelezen: false };
  }
}
for (const boek of boeken) {
  console.log(beschrijfBoek(boek));
}

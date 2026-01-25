import { phoneticNormalize } from './cardMatcher';

export const TAROT_DECK_DATA = {
  majorArcana: [
    { id: 'major-00', names: ['The Fool', 'Fool', 'Zero'], arcana: 'major', number: 0 },
    { id: 'major-01', names: ['The Magician', 'Magician', 'The Magus', 'Magus', 'The Cobbler'], arcana: 'major', number: 1 },
    { id: 'major-02', names: ['The High Priestess', 'High Priestess', 'Priestess', 'The Papess', 'La Papesse'], arcana: 'major', number: 2 },
    { id: 'major-03', names: ['The Empress', 'Empress', 'The Mother'], arcana: 'major', number: 3 },
    { id: 'major-04', names: ['The Emperor', 'Emperor', 'The Father'], arcana: 'major', number: 4 },
    { id: 'major-05', names: ['The Hierophant', 'Hierophant', 'The Pope', 'High Priest'], arcana: 'major', number: 5 },
    { id: 'major-06', names: ['The Lovers', 'Lovers', 'The Love'], arcana: 'major', number: 6 },
    { id: 'major-07', names: ['The Chariot', 'Chariot'], arcana: 'major', number: 7 },
    { id: 'major-08', names: ['Strength', 'Fortitude', 'Lust'], arcana: 'major', number: 8 },
    { id: 'major-09', names: ['The Hermit', 'Hermit'], arcana: 'major', number: 9 },
    { id: 'major-10', names: ['Wheel of Fortune', 'Wheel', 'The Wheel', 'Fortune'], arcana: 'major', number: 10 },
    { id: 'major-11', names: ['Justice', 'Adjustment'], arcana: 'major', number: 11 },
    { id: 'major-12', names: ['The Hanged Man', 'Hanged Man', 'The Hanged One', 'Hanged'], arcana: 'major', number: 12 },
    { id: 'major-13', names: ['Death', 'Transformation'], arcana: 'major', number: 13 },
    { id: 'major-14', names: ['Temperance', 'Art'], arcana: 'major', number: 14 },
    { id: 'major-15', names: ['The Devil', 'Devil'], arcana: 'major', number: 15 },
    { id: 'major-16', names: ['The Tower', 'Tower', 'La Maison Dieu'], arcana: 'major', number: 16 },
    { id: 'major-17', names: ['The Star', 'Star'], arcana: 'major', number: 17 },
    { id: 'major-18', names: ['The Moon', 'Moon'], arcana: 'major', number: 18 },
    { id: 'major-19', names: ['The Sun', 'Sun'], arcana: 'major', number: 19 },
    { id: 'major-20', names: ['Judgement', 'Judgment', 'The Aeon', 'The Angel'], arcana: 'major', number: 20 },
    { id: 'major-21', names: ['The World', 'World', 'The Universe'], arcana: 'major', number: 21 },
  ],
  minorArcana: {
    wands: ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King'].map((n, i) => ({
      id: `wands-${i+1}`, names: [`${n} of Wands`, `${n} Wands`, `${n} of Rods`, `${n} Rods`, `${n} of Staves`, `${n} Staves`], suit: 'wands', number: i+1
    })),
    cups: ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King'].map((n, i) => ({
      id: `cups-${i+1}`, names: [`${n} of Cups`, `${n} Cups`, `${n} of Chalices`, `${n} Chalices`], suit: 'cups', number: i+1
    })),
    swords: ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King'].map((n, i) => ({
      id: `swords-${i+1}`, names: [`${n} of Swords`, `${n} Swords`, `${n} of Blades`, `${n} Blades`], suit: 'swords', number: i+1
    })),
    pentacles: ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King'].map((n, i) => ({
      id: `pentacles-${i+1}`, names: [`${n} of Pentacles`, `${n} Pentacles`, `${n} of Coins`, `${n} Coins`, `${n} of Disks`, `${n} Disks`, `${n} of Stones`, `${n} Stones`], suit: 'pentacles', number: i+1
    })),
  }
};

export const flattenCardDatabase = () => {
  const flattened: any[] = [];
  TAROT_DECK_DATA.majorArcana.forEach(c => flattened.push({
    ...c,
    normalizedNames: c.names.map(n => n.toLowerCase().trim()),
    phoneticNames: c.names.map(n => phoneticNormalize(n))
  }));
  Object.values(TAROT_DECK_DATA.minorArcana).forEach(suit => {
    suit.forEach(c => flattened.push({
      ...c,
      normalizedNames: c.names.map(n => n.toLowerCase().trim()),
      phoneticNames: c.names.map(n => phoneticNormalize(n))
    }));
  });
  return flattened;
};

// Generated canonical list of card names for random pulls and validation
export const CANONICAL_TAROT_LIST = flattenCardDatabase().map(c => c.names[0]);

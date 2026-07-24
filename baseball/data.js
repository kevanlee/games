// Central rules. Change these values to tune the prototype.
const GAME_CONFIG = {
  innings: 3,
  seasonLength: 6,
  startingCurrency: 20,
  rewards: {
    winnerCurrency: 10,
    stealCurrency: 5,
  },
  abilityLimits: {
    perGame: 1,
    powerupPerGame: 1,
  },
  cardValues: {
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    J: 11,
    Q: 12,
    K: 13,
    A: 14,
    Joker: 15,
  },
  hitMarginOutcomes: [
    { min: 7, result: "home run" },
    { min: 5, result: "triple" },
    { min: 3, result: "double" },
    { min: 1, result: "single" },
    { min: -Infinity, result: "out" },
  ],
};

const ABILITIES = {
  powerHitting: {
    name: "Power Hitting",
    description: "Once per game, add 2 to a winning blackjack margin.",
  },
  strongBullpen: {
    name: "Strong Bullpen",
    description: "Once per game, add 2 to your pitching hand without busting.",
  },
  contactTeam: {
    name: "Contact Team",
    description: "Passive: the hitting hand stands on 16 or higher.",
    passive: true,
  },
};

const POWERUPS = {
  redraw: {
    name: "Redraw",
    description: "Once per game, discard your hitting hand and deal a new one.",
  },
  scout: {
    name: "Scout",
    description: "Once per game, reveal the full opposing pitching hand.",
  },
  rally: {
    name: "Rally",
    description: "Add 1 to winning margins for the current half-inning.",
  },
};

const TEAM_DEFINITIONS = [
  {
    id: "player",
    name: "Home Nine",
    abbreviation: "HOM",
    ability: "powerHitting",
    powerup: "redraw",
  },
  {
    id: "comets",
    name: "Gray Comets",
    abbreviation: "COM",
    ability: "contactTeam",
    powerup: "scout",
  },
  {
    id: "foundry",
    name: "Iron Foundry",
    abbreviation: "IRN",
    ability: "strongBullpen",
    powerup: "rally",
  },
  {
    id: "crows",
    name: "Black Crows",
    abbreviation: "CRW",
    ability: "powerHitting",
    powerup: "redraw",
  },
];

function createStandardDeckDefinition() {
  const ranks = Object.keys(GAME_CONFIG.cardValues).filter(
    (rank) => rank !== "Joker",
  );
  const suits = ["Spades", "Hearts", "Diamonds", "Clubs"];
  const cards = [];

  ranks.forEach((rank) => {
    suits.forEach((suit) => {
      cards.push({ rank, suit, value: GAME_CONFIG.cardValues[rank] });
    });
  });

  cards.push(
    { rank: "Joker", suit: "Black", value: 15 },
    { rank: "Joker", suit: "Gray", value: 15 },
  );

  return cards;
}

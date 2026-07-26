const suits = [
  { name: "hearts", start: 1 },
  { name: "spades", start: 15 },
  { name: "diamonds", start: 29 },
  { name: "clubs", start: 43 },
];

const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const boardElement = document.querySelector("#board");
const rowHandsElement = document.querySelector("#row-hands");
const columnHandsElement = document.querySelector("#column-hands");
const swapsElement = document.querySelector("#swaps-left");
const statusElement = document.querySelector("#status");
const newRoundButton = document.querySelector("#new-round");

let grid = [];
let selectedIndex = null;
let swapsLeft = 3;

function pad(number) {
  return String(number).padStart(2, "0");
}

function createDeck() {
  return suits.flatMap((suit) =>
    ranks.map((rank, rankIndex) => ({
      rank,
      rankValue: rankIndex + 1,
      suit: suit.name,
      image: `img/card assets/${pad(suit.start + rankIndex)}_kerenel_Cards.png`,
    })),
  );
}

function shuffled(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function evaluateHand(cards) {
  const rankCounts = new Map();
  cards.forEach((card) => rankCounts.set(card.rankValue, (rankCounts.get(card.rankValue) || 0) + 1));
  const counts = [...rankCounts.values()].sort((a, b) => b - a);
  const values = [...rankCounts.keys()].sort((a, b) => a - b);
  const isFlush = cards.every((card) => card.suit === cards[0].suit);
  const isWheel = values.join(",") === "1,2,3,4,5";
  const isBroadway = values.join(",") === "1,10,11,12,13";
  const isSequential = values.length === 5 && values[4] - values[0] === 4;
  const isStraight = isWheel || isBroadway || isSequential;

  let name = "High Card";
  if (isBroadway && isFlush) name = "Royal Flush";
  else if (isStraight && isFlush) name = "Straight Flush";
  else if (counts[0] === 4) name = "Four of a Kind";
  else if (counts[0] === 3 && counts[1] === 2) name = "Full House";
  else if (isFlush) name = "Flush";
  else if (isStraight) name = "Straight";
  else if (counts[0] === 3) name = "Three of a Kind";
  else if (counts[0] === 2 && counts[1] === 2) name = "Two Pair";
  else if (counts[0] === 2) name = "One Pair";

  return { name };
}

function getHands() {
  const rows = Array.from({ length: 5 }, (_, row) => evaluateHand(grid.slice(row * 5, row * 5 + 5)));
  const columns = Array.from({ length: 5 }, (_, column) =>
    evaluateHand(Array.from({ length: 5 }, (_, row) => grid[row * 5 + column])),
  );
  return { rows, columns };
}

function handResultMarkup(hand, label) {
  const name = hand.name === "High Card" ? "" : hand.name;
  const ariaLabel = name ? `${label}: ${name}` : `${label}: no poker hand`;
  return `<div class="hand-result" aria-label="${ariaLabel}"><span>${name}</span></div>`;
}

function render() {
  boardElement.innerHTML = grid
    .map((card, index) => {
      const selected = index === selectedIndex;
      return `<button class="card${selected ? " selected" : ""}" type="button" role="gridcell"
        data-index="${index}" aria-pressed="${selected}" aria-label="${card.rank} of ${card.suit}${selected ? ", selected" : ""}">
        <img src="${card.image}" alt="" draggable="false">
      </button>`;
    })
    .join("");

  const { rows, columns } = getHands();
  rowHandsElement.innerHTML = rows.map((hand, index) => handResultMarkup(hand, `Row ${index + 1}`)).join("");
  columnHandsElement.innerHTML = columns
    .map((hand, index) => handResultMarkup(hand, `Column ${index + 1}`))
    .join("");

  swapsElement.textContent = swapsLeft;
}

function animateSwap(firstIndex, secondIndex, firstRect, secondRect) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const firstButton = boardElement.querySelector(`[data-index="${firstIndex}"]`);
  const secondButton = boardElement.querySelector(`[data-index="${secondIndex}"]`);
  if (!firstButton || !secondButton || typeof firstButton.animate !== "function") return;

  boardElement.classList.add("is-swapping");

  const duration = 420;
  const options = {
    duration,
    easing: "cubic-bezier(.22,.8,.25,1)",
  };

  const firstAnimation = firstButton.animate(
    [
      {
        transform: `translate(${secondRect.left - firstRect.left}px, ${secondRect.top - firstRect.top}px)`,
        zIndex: 2,
      },
      { transform: "translate(0, 0)", zIndex: 2 },
    ],
    options,
  );

  secondButton.animate(
    [
      {
        transform: `translate(${firstRect.left - secondRect.left}px, ${firstRect.top - secondRect.top}px)`,
        zIndex: 1,
      },
      { transform: "translate(0, 0)", zIndex: 1 },
    ],
    options,
  );

  firstAnimation.finished.finally(() => boardElement.classList.remove("is-swapping"));
}

function chooseCard(index) {
  if (swapsLeft === 0) {
    statusElement.textContent = "No swaps left. Start a new round to play again.";
    return;
  }

  if (selectedIndex === null) {
    selectedIndex = index;
    statusElement.textContent = `${grid[index].rank} of ${grid[index].suit} selected. Choose its replacement.`;
  } else if (selectedIndex === index) {
    selectedIndex = null;
    statusElement.textContent = "Selection cleared. Choose a card to start a swap.";
  } else {
    const firstIndex = selectedIndex;
    const firstButton = boardElement.querySelector(`[data-index="${firstIndex}"]`);
    const secondButton = boardElement.querySelector(`[data-index="${index}"]`);
    const firstRect = firstButton.getBoundingClientRect();
    const secondRect = secondButton.getBoundingClientRect();
    const firstCard = grid[selectedIndex];
    const secondCard = grid[index];
    [grid[selectedIndex], grid[index]] = [grid[index], grid[selectedIndex]];
    swapsLeft -= 1;
    selectedIndex = null;
    statusElement.textContent =
      swapsLeft > 0
        ? `Swapped the ${firstCard.rank} of ${firstCard.suit} and ${secondCard.rank} of ${secondCard.suit}.`
        : "Final swap made. Your grid is complete.";
    render();
    animateSwap(firstIndex, index, firstRect, secondRect);
    return;
  }
  render();
}

function newRound() {
  grid = shuffled(createDeck()).slice(0, 25);
  selectedIndex = null;
  swapsLeft = 3;
  statusElement.textContent = "Choose a card to start a swap.";
  render();
}

boardElement.addEventListener("click", (event) => {
  const cardButton = event.target.closest(".card");
  if (cardButton) chooseCard(Number(cardButton.dataset.index));
});

newRoundButton.addEventListener("click", newRound);
newRound();

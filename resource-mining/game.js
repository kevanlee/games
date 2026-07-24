const resources = [
  { id: "stone", name: "Basalt", count: 96 },
  { id: "coal", name: "Anthracite", count: 80 },
  { id: "copper", name: "Native copper", count: 64 },
  { id: "iron", name: "Hematite", count: 56 },
  { id: "amber", name: "Amber", count: 40 },
  { id: "quartz", name: "Quartz", count: 36 },
  { id: "jade", name: "Jade", count: 32 },
  { id: "ruby", name: "Ruby", count: 24 },
  { id: "sapphire", name: "Sapphire", count: 20 },
  { id: "gold", name: "Native gold", count: 16 },
  { id: "amethyst", name: "Amethyst", count: 8 },
  { id: "diamond", name: "Diamond", count: 8 },
];

const columns = 24;
const board = document.querySelector("#board");
const turnsEl = document.querySelector("#turns");
const excavatedEl = document.querySelector("#excavated");
const totalPairsEl = document.querySelector("#total-pairs");
const surveyedEl = document.querySelector("#surveyed");
const statusEl = document.querySelector("#status");
const completeDialog = document.querySelector("#complete-dialog");
const finalTurns = document.querySelector("#final-turns");
const controlPanel = document.querySelector("#control-panel");
const panelToggle = document.querySelector("#panel-toggle");

const colors = [
  ["#e74938", "#ff9a78", "#f5d4c9"],
  ["#e99b21", "#ffd36a", "#f5dfae"],
  ["#d6bf22", "#fff078", "#f0e8ad"],
  ["#65a849", "#9bd879", "#d2e8c7"],
  ["#2d9a7c", "#76d1ae", "#c9e9dc"],
  ["#278ca5", "#7ccbd7", "#c9e6e9"],
  ["#3f68d4", "#8bafff", "#cdd9ef"],
  ["#7652c7", "#ba91f0", "#ddd0ee"],
  ["#bd45a8", "#ef91dd", "#edd0e7"],
  ["#dc416f", "#ff8faf", "#f1ccd6"],
  ["#6c5548", "#ad8c76", "#dfd1c8"],
  ["#394148", "#8b969d", "#d8dcdd"],
];

const shapes = [
  "polygon(15% 14%, 43% 0, 68% 10%, 100% 40%, 83% 82%, 53% 100%, 16% 88%, 0 52%)",
  "polygon(50% 0, 88% 15%, 100% 58%, 70% 100%, 27% 91%, 0 61%, 12% 20%)",
  "polygon(18% 0, 70% 5%, 100% 33%, 86% 79%, 48% 100%, 0 77%, 7% 29%)",
  "polygon(7% 20%, 48% 0, 91% 16%, 100% 63%, 64% 100%, 21% 91%, 0 54%)",
  "polygon(27% 0, 77% 12%, 100% 49%, 77% 94%, 31% 100%, 0 69%, 8% 25%)",
  "polygon(50% 0, 100% 28%, 90% 75%, 53% 100%, 13% 84%, 0 37%)",
  "polygon(11% 7%, 68% 0, 100% 44%, 78% 88%, 38% 100%, 0 70%)",
  "polygon(36% 0, 82% 6%, 100% 50%, 79% 100%, 20% 89%, 0 42%)",
  "polygon(0 24%, 34% 0, 83% 15%, 100% 59%, 67% 100%, 17% 85%)",
  "polygon(19% 4%, 72% 0, 100% 38%, 91% 86%, 45% 100%, 0 66%, 4% 27%)",
  "polygon(49% 0, 91% 23%, 100% 69%, 61% 100%, 13% 84%, 0 39%)",
  "polygon(8% 16%, 55% 0, 94% 29%, 100% 76%, 52% 100%, 0 73%)",
];

let deck = [];
let firstCard = null;
let secondCard = null;
let locked = false;
let turns = 0;
let excavated = 0;
let surveyedCards = new Set();
let mismatchTimer = null;

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function buildDeck() {
  const shuffledColors = shuffle([...colors]);
  const shuffledShapes = shuffle([...shapes]);
  const styledResources = resources.map((resource, index) => ({
    ...resource,
    mineral: shuffledColors[index][0],
    facet: shuffledColors[index][1],
    paper: shuffledColors[index][2],
    shape: shuffledShapes[index],
  }));

  return shuffle(styledResources.flatMap((resource) =>
    Array.from({ length: resource.count }, (_, copy) => ({
      ...resource,
      uid: `${resource.id}-${copy}`,
    }))
  ));
}

function specimenMarkup() {
  return '<span class="specimen" aria-hidden="true"><span class="mineral"></span><span class="spark"></span></span>';
}

function startGame() {
  if (mismatchTimer) window.clearTimeout(mismatchTimer);
  deck = buildDeck();
  firstCard = null;
  secondCard = null;
  locked = false;
  turns = 0;
  excavated = 0;
  surveyedCards = new Set();
  turnsEl.textContent = "0";
  excavatedEl.textContent = "0";
  totalPairsEl.textContent = String(deck.length / 2);
  surveyedEl.textContent = "0%";
  statusEl.textContent = "Choose your first sample.";
  completeDialog.hidden = true;
  board.innerHTML = "";

  deck.forEach((resource, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "card";
    card.dataset.index = String(index);
    card.setAttribute("role", "gridcell");
    card.setAttribute("aria-label", `Hidden sample, row ${Math.floor(index / columns) + 1}, column ${(index % columns) + 1}`);
    card.style.setProperty("--mineral", resource.mineral);
    card.style.setProperty("--facet", resource.facet);
    card.style.setProperty("--paper", resource.paper);
    card.style.setProperty("--shape", resource.shape);
    card.innerHTML = specimenMarkup();
    card.addEventListener("click", () => revealCard(card, index));
    board.appendChild(card);
  });
}

function revealCard(card, index) {
  if (locked || card.classList.contains("revealed") || card.classList.contains("matched")) return;

  card.classList.add("revealed");
  card.setAttribute("aria-label", deck[index].name);
  surveyedCards.add(index);
  surveyedEl.textContent = `${Math.round((surveyedCards.size / deck.length) * 100)}%`;

  if (!firstCard) {
    firstCard = { card, index };
    statusEl.textContent = `${deck[index].name} found. Locate another sample.`;
    return;
  }

  secondCard = { card, index };
  turns += 1;
  turnsEl.textContent = String(turns);
  locked = true;

  const firstResource = deck[firstCard.index];
  const secondResource = deck[secondCard.index];

  if (firstResource.id === secondResource.id) {
    statusEl.textContent = `Match: ${firstResource.name} excavated.`;
    mismatchTimer = window.setTimeout(() => {
      firstCard.card.classList.add("matched");
      secondCard.card.classList.add("matched");
      firstCard.card.classList.remove("revealed");
      secondCard.card.classList.remove("revealed");
      firstCard.card.disabled = true;
      secondCard.card.disabled = true;
      firstCard.card.setAttribute("aria-label", `Excavated ${firstResource.name}`);
      secondCard.card.setAttribute("aria-label", `Excavated ${firstResource.name}`);
      excavated += 1;
      excavatedEl.textContent = String(excavated);
      resetSelection();

      if (excavated === deck.length / 2) {
        finalTurns.textContent = `${turns} ${turns === 1 ? "turn" : "turns"}`;
        completeDialog.hidden = false;
        document.querySelector("#play-again").focus();
      }
    }, 430);
  } else {
    statusEl.textContent = `${firstResource.name} and ${secondResource.name} do not match.`;
    mismatchTimer = window.setTimeout(() => {
      firstCard.card.classList.remove("revealed");
      secondCard.card.classList.remove("revealed");
      firstCard.card.setAttribute("aria-label", "Hidden sample");
      secondCard.card.setAttribute("aria-label", "Hidden sample");
      resetSelection();
      statusEl.textContent = "Samples returned. Try another pair.";
    }, 850);
  }
}

function resetSelection() {
  firstCard = null;
  secondCard = null;
  locked = false;
  mismatchTimer = null;
}

document.querySelector("#new-field").addEventListener("click", startGame);
document.querySelector("#play-again").addEventListener("click", startGame);
panelToggle.addEventListener("click", () => {
  const minimized = controlPanel.classList.toggle("minimized");
  panelToggle.setAttribute("aria-expanded", String(!minimized));
  panelToggle.setAttribute("aria-label", minimized ? "Expand controls" : "Minimize controls");
  panelToggle.textContent = minimized ? "+" : "_";
});

startGame();

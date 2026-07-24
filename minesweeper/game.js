const COLS = 30;
const ROWS = 20;
const MINES = 130;
const SAVE_KEY = "stillfield-save-v1";

const boardElement = document.querySelector("#board");
const clearedElement = document.querySelector("#cleared-count");
const markerElement = document.querySelector("#marker-count");
const timerElement = document.querySelector("#timer");
const pauseButton = document.querySelector("#pause-button");
const pauseScreen = document.querySelector("#pause-screen");
const resumeButton = document.querySelector("#resume-button");
const soundButton = document.querySelector("#sound-button");
const newGameButton = document.querySelector("#new-game-button");
const newGameDialog = document.querySelector("#new-game-dialog");
const confirmNewGame = document.querySelector("#confirm-new-game");

let state;
let timerId;
let audioContext;
let pressTimer;
let longPressTriggered = false;

function blankBoard() {
  return Array.from({ length: ROWS * COLS }, (_, index) => ({
    index,
    mine: false,
    adjacent: 0,
    revealed: false,
    flagged: false,
  }));
}

function freshState() {
  return {
    cells: blankBoard(),
    seeded: false,
    status: "ready",
    seconds: 0,
    sound: true,
    lastTick: Date.now(),
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (
      saved &&
      Array.isArray(saved.cells) &&
      saved.cells.length === ROWS * COLS &&
      ["ready", "playing", "won", "lost"].includes(saved.status)
    ) {
      return { ...freshState(), ...saved, lastTick: Date.now() };
    }
  } catch {
    localStorage.removeItem(SAVE_KEY);
  }
  return freshState();
}

function saveState() {
  const saved = { ...state, lastTick: Date.now() };
  localStorage.setItem(SAVE_KEY, JSON.stringify(saved));
}

function neighbors(index) {
  const row = Math.floor(index / COLS);
  const col = index % COLS;
  const result = [];

  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
      if (rowOffset === 0 && colOffset === 0) continue;
      const nextRow = row + rowOffset;
      const nextCol = col + colOffset;
      if (nextRow >= 0 && nextRow < ROWS && nextCol >= 0 && nextCol < COLS) {
        result.push(nextRow * COLS + nextCol);
      }
    }
  }
  return result;
}

function seedBoard(safeIndex) {
  const safeCells = new Set([safeIndex, ...neighbors(safeIndex)]);
  const candidates = state.cells
    .map((cell) => cell.index)
    .filter((index) => !safeCells.has(index));

  for (let i = candidates.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  candidates.slice(0, MINES).forEach((index) => {
    state.cells[index].mine = true;
  });

  state.cells.forEach((cell) => {
    if (!cell.mine) {
      cell.adjacent = neighbors(cell.index).filter((index) => state.cells[index].mine).length;
    }
  });

  state.seeded = true;
  state.status = "playing";
  state.lastTick = Date.now();
}

function reveal(index) {
  if (state.status === "won" || state.status === "lost") return;
  const firstCell = state.cells[index];
  if (firstCell.flagged || firstCell.revealed) return;

  if (!state.seeded) seedBoard(index);

  if (firstCell.mine) {
    firstCell.revealed = true;
    state.status = "lost";
    state.cells.forEach((cell) => {
      if (cell.mine) cell.revealed = true;
    });
    tone(120, 0.18);
    finishTurn();
    return;
  }

  const queue = [index];
  const visited = new Set();
  while (queue.length) {
    const nextIndex = queue.shift();
    if (visited.has(nextIndex)) continue;
    visited.add(nextIndex);
    const cell = state.cells[nextIndex];
    if (cell.flagged || cell.mine) continue;
    cell.revealed = true;
    if (cell.adjacent === 0) {
      neighbors(nextIndex).forEach((neighborIndex) => {
        if (!visited.has(neighborIndex)) queue.push(neighborIndex);
      });
    }
  }

  tone(firstCell.adjacent ? 340 + firstCell.adjacent * 28 : 290, 0.035);
  checkWin();
  finishTurn();
}

function toggleFlag(index) {
  if (state.status === "won" || state.status === "lost") return;
  const cell = state.cells[index];
  if (cell.revealed) {
    chord(index);
    return;
  }
  cell.flagged = !cell.flagged;
  tone(cell.flagged ? 510 : 390, 0.025);
  finishTurn();
}

function chord(index) {
  const cell = state.cells[index];
  if (!cell.revealed || cell.adjacent === 0) return;
  const nearby = neighbors(index);
  const flagCount = nearby.filter((neighborIndex) => state.cells[neighborIndex].flagged).length;
  if (flagCount !== cell.adjacent) return;
  nearby.forEach((neighborIndex) => {
    if (!state.cells[neighborIndex].revealed && !state.cells[neighborIndex].flagged) {
      reveal(neighborIndex);
    }
  });
}

function checkWin() {
  const safeCells = ROWS * COLS - MINES;
  const cleared = state.cells.filter((cell) => cell.revealed && !cell.mine).length;
  if (cleared === safeCells) {
    state.status = "won";
    state.cells.forEach((cell) => {
      if (cell.mine) cell.flagged = true;
    });
    tone(620, 0.08);
    window.setTimeout(() => tone(780, 0.12), 110);
  }
}

function finishTurn() {
  saveState();
  render();
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  if (hours) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function tileLabel(cell) {
  const row = Math.floor(cell.index / COLS) + 1;
  const col = (cell.index % COLS) + 1;
  if (cell.flagged && !cell.revealed) return `Row ${row}, column ${col}, marked`;
  if (!cell.revealed) return `Row ${row}, column ${col}, covered`;
  if (cell.mine) return `Row ${row}, column ${col}, mine`;
  return `Row ${row}, column ${col}, ${cell.adjacent || "no"} nearby mines`;
}

function render() {
  state.cells.forEach((cell) => {
    const tile = boardElement.children[cell.index];
    tile.className = "tile";
    tile.textContent = "";
    tile.setAttribute("aria-label", tileLabel(cell));

    if (cell.flagged && !cell.revealed) tile.classList.add("flagged");
    if (cell.revealed) {
      tile.classList.add("revealed");
      if (cell.mine) {
        tile.classList.add("mine");
      } else if (cell.adjacent) {
        tile.classList.add("number", `n${cell.adjacent}`);
        tile.textContent = cell.adjacent;
      }
    }
    if (state.status === "lost" && cell.flagged && !cell.mine) tile.classList.add("wrong");
  });

  const cleared = state.cells.filter((cell) => cell.revealed && !cell.mine).length;
  const flags = state.cells.filter((cell) => cell.flagged).length;
  clearedElement.textContent = `${cleared} / ${ROWS * COLS - MINES}`;
  markerElement.textContent = Math.max(0, MINES - flags);
  timerElement.textContent = formatTime(state.seconds);
  soundButton.textContent = state.sound ? "Sound on" : "Sound off";
  soundButton.setAttribute("aria-pressed", String(state.sound));

}

function buildBoard() {
  const fragment = document.createDocumentFragment();
  state.cells.forEach((cell) => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "tile";
    tile.dataset.index = cell.index;
    tile.setAttribute("role", "gridcell");
    fragment.appendChild(tile);
  });
  boardElement.replaceChildren(fragment);
  render();
}

function tone(frequency, duration) {
  if (!state.sound) return;
  try {
    audioContext ||= new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.frequency.value = frequency;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.035, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch {
    // The game remains fully playable when browser audio is unavailable.
  }
}

boardElement.addEventListener("click", (event) => {
  const tile = event.target.closest(".tile");
  if (!tile || !boardElement.contains(tile)) return;
  const index = Number(tile.dataset.index);
  if (state.cells[index].revealed) chord(index);
  else reveal(index);
});

boardElement.addEventListener("contextmenu", (event) => {
  const tile = event.target.closest(".tile");
  if (!tile || !boardElement.contains(tile)) return;
  event.preventDefault();
  toggleFlag(Number(tile.dataset.index));
});

boardElement.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse") return;
  const tile = event.target.closest(".tile");
  if (!tile) return;
  longPressTriggered = false;
  pressTimer = window.setTimeout(() => {
    longPressTriggered = true;
    toggleFlag(Number(tile.dataset.index));
    navigator.vibrate?.(20);
  }, 480);
});

boardElement.addEventListener("pointerup", () => window.clearTimeout(pressTimer));
boardElement.addEventListener("pointercancel", () => window.clearTimeout(pressTimer));
boardElement.addEventListener("pointermove", () => window.clearTimeout(pressTimer));

boardElement.addEventListener("click", (event) => {
  if (!longPressTriggered) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  longPressTriggered = false;
}, true);

boardElement.addEventListener("keydown", (event) => {
  const tile = event.target.closest(".tile");
  if (!tile || !["f", "F"].includes(event.key)) return;
  event.preventDefault();
  toggleFlag(Number(tile.dataset.index));
});

pauseButton.addEventListener("click", () => {
  pauseScreen.hidden = false;
  pauseButton.textContent = "Paused";
  resumeButton.focus();
});

resumeButton.addEventListener("click", () => {
  pauseScreen.hidden = true;
  pauseButton.textContent = "Pause";
  pauseButton.focus();
});

soundButton.addEventListener("click", () => {
  state.sound = !state.sound;
  saveState();
  render();
  if (state.sound) tone(440, 0.04);
});

newGameButton.addEventListener("click", () => newGameDialog.showModal());

confirmNewGame.addEventListener("click", () => {
  state = freshState();
  buildBoard();
  saveState();
});

document.addEventListener("visibilitychange", () => {
  state.lastTick = Date.now();
  if (document.hidden) saveState();
});

window.addEventListener("beforeunload", saveState);

timerId = window.setInterval(() => {
  if (state.status !== "playing" || document.hidden || !pauseScreen.hidden) return;
  state.seconds += 1;
  timerElement.textContent = formatTime(state.seconds);
  if (state.seconds % 10 === 0) saveState();
}, 1000);

state = loadState();
buildBoard();

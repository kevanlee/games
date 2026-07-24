const STORAGE_KEY = "baseball-deck-manager-v1";

let state = loadState() || createNewSeasonState();

// ---------- Deck creation, shuffling, and drawing ----------

function cloneCards(cards) {
  return cards.map((card) => ({ ...card }));
}

function shuffle(cards) {
  const result = [...cards];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

function createLiveDeck(definition) {
  return { draw: shuffle(cloneCards(definition)), discard: [] };
}

function drawCard(deck) {
  if (!deck.draw.length && deck.discard.length) {
    deck.draw = shuffle(deck.discard);
    deck.discard = [];
  }
  return deck.draw.pop() || null;
}

function discardCard(deck, card) {
  if (card) deck.discard.push(card);
}

function cardsRemaining(deck) {
  return deck.draw.length + deck.discard.length;
}

// ---------- Season scheduling and state ----------

function createTeam(definition) {
  return {
    ...definition,
    wins: 0,
    losses: 0,
    currency: GAME_CONFIG.startingCurrency,
    hittingDeck: createStandardDeckDefinition(),
    pitchingDeck: createStandardDeckDefinition(),
  };
}

function createSchedule() {
  const opponents = TEAM_DEFINITIONS.slice(1);
  return opponents.flatMap((opponent, index) => [
    {
      id: `game-${index * 2 + 1}`,
      opponentId: opponent.id,
      playerHome: index % 2 === 0,
      status: "upcoming",
      playerScore: null,
      opponentScore: null,
    },
    {
      id: `game-${index * 2 + 2}`,
      opponentId: opponent.id,
      playerHome: index % 2 !== 0,
      status: "upcoming",
      playerScore: null,
      opponentScore: null,
    },
  ]);
}

function createNewSeasonState() {
  return {
    version: 1,
    view: "season",
    teams: TEAM_DEFINITIONS.map(createTeam),
    schedule: createSchedule(),
    currentGame: null,
    postgame: null,
    notice: "A new six-game season is ready.",
  };
}

function getPlayer() {
  return state.teams.find((team) => team.id === "player");
}

function getTeam(id) {
  return state.teams.find((team) => team.id === id);
}

function getNextGame() {
  return state.schedule.find((game) => game.status === "upcoming");
}

function getStandings() {
  return [...state.teams].sort(
    (a, b) => b.wins - a.wins || a.losses - b.losses,
  );
}

// The two idle computer teams play each other once per player game.
function simulateOtherGames(activeOpponentId) {
  const idleTeams = state.teams.filter(
    (team) => team.id !== "player" && team.id !== activeOpponentId,
  );
  if (idleTeams.length !== 2) return;

  const winnerIndex = Math.random() > 0.5 ? 0 : 1;
  idleTeams[winnerIndex].wins += 1;
  idleTeams[1 - winnerIndex].losses += 1;
}

// ---------- Game creation and at-bat resolution ----------

function startNextGame() {
  const scheduledGame = getNextGame();
  if (!scheduledGame) return;

  const player = getPlayer();
  const opponent = getTeam(scheduledGame.opponentId);
  state.currentGame = {
    scheduleId: scheduledGame.id,
    playerId: player.id,
    opponentId: opponent.id,
    playerHome: scheduledGame.playerHome,
    inning: 1,
    half: "top",
    outs: 0,
    bases: [false, false, false],
    score: { player: 0, opponent: 0 },
    hits: { player: 0, opponent: 0 },
    lineScore: { player: [], opponent: [] },
    decks: {
      playerHitting: createLiveDeck(player.hittingDeck),
      playerPitching: createLiveDeck(player.pitchingDeck),
      opponentHitting: createLiveDeck(opponent.hittingDeck),
      opponentPitching: createLiveDeck(opponent.pitchingDeck),
    },
    phase: "break",
    currentCard: null,
    halfHistory: [],
    message: "Ready for the first at-bat.",
    halfSummary: null,
    halfStartScore: { player: 0, opponent: 0 },
    halfStartHits: { player: 0, opponent: 0 },
    log: ["Play ball."],
    abilityUsed: false,
    powerupUsed: false,
    powerHittingArmed: false,
    strongBullpenArmed: false,
    rallyHalf: null,
    gameOver: false,
  };

  state.view = "game";
  state.notice = "";
  saveAndRender();
}

function isPlayerBatting(game = state.currentGame) {
  return game.playerHome ? game.half === "bottom" : game.half === "top";
}

function outcomeForCard(card) {
  if (card.rank === "Joker") return "walk";
  if (card.rank === "A") return "home run";
  if (card.rank === "K") return "double";
  if (["J", "Q"].includes(card.rank)) return "single";
  return "out";
}

function basesForResult(result) {
  return { single: 1, double: 2, triple: 3, "home run": 4 }[result] || 0;
}

// Advance every runner the number of bases in the result.
function advanceRunners(result) {
  const game = state.currentGame;
  const basesAdvanced = basesForResult(result);
  if (!basesAdvanced) return 0;

  let runs = basesAdvanced === 4 ? 1 : 0;
  const nextBases = [false, false, false];

  game.bases.forEach((occupied, index) => {
    if (!occupied) return;
    const destination = index + basesAdvanced;
    if (destination >= 3) runs += 1;
    else nextBases[destination] = true;
  });

  if (basesAdvanced < 4) nextBases[basesAdvanced - 1] = true;
  game.bases = nextBases;
  return runs;
}

function advanceWalk() {
  const game = state.currentGame;
  const [first, second, third] = game.bases;
  let runs = 0;
  if (first && second && third) runs = 1;
  game.bases = [
    true,
    first || second,
    (first && second) || third,
  ];
  return runs;
}

function recordAtBat(result, offense, card) {
  const game = state.currentGame;
  game.hits ||= { player: 0, opponent: 0 };
  game.lineScore ||= { player: [], opponent: [] };

  if (result === "out") {
    game.outs += 1;
  } else {
    const runs = result === "walk" ? advanceWalk() : advanceRunners(result);
    if (result !== "walk") game.hits[offense] += 1;
    game.score[offense] += runs;
    game.lineScore[offense][game.inning - 1] =
      (game.lineScore[offense][game.inning - 1] || 0) + runs;
  }

  game.log.unshift(
    `${offense === "player" ? "You" : getTeam(game.opponentId).abbreviation}: ` +
      `${cardLabel(card)} — ${result}.`,
  );
}

function startHalfInning() {
  const game = state.currentGame;
  if (!game || game.gameOver || game.phase !== "break") return;
  game.halfHistory = [];
  game.halfSummary = null;
  game.halfStartScore = { ...game.score };
  game.halfStartHits = { ...game.hits };
  game.phase = "ready";
  game.message = isPlayerBatting()
    ? "Click the hitting deck to reveal the next at-bat."
    : "Click the pitching deck to face the next hitter.";
  saveAndRender();
}

function flipAtBatCard() {
  const game = state.currentGame;
  if (!game || game.gameOver || game.phase !== "ready") return;
  const batting = isPlayerBatting();
  const deck = batting ? game.decks.playerHitting : game.decks.playerPitching;
  const card = drawCard(deck);
  if (!card) return;

  game.currentCard = card;
  game.phase = "revealing";
  game.message = `${card.rank} reveals ${outcomeForCard(card).toUpperCase()}`;
  saveAndRender();
  window.setTimeout(finishCardAtBat, 1400);
}

function finishCardAtBat() {
  const game = state.currentGame;
  if (!game || game.phase !== "revealing" || !game.currentCard) return;
  const card = game.currentCard;
  const result = outcomeForCard(card);
  const offense = isPlayerBatting() ? "player" : "opponent";
  const deck = isPlayerBatting()
    ? game.decks.playerHitting
    : game.decks.playerPitching;

  recordAtBat(result, offense, card);
  discardCard(deck, card);
  game.halfHistory.push({ card, result });
  game.currentCard = null;

  if (game.outs >= 3) {
    endHalfInning();
  } else {
    game.phase = "ready";
    game.message = "Click the deck for the next at-bat.";
  }
  saveAndRender();
}

// ---------- Inning and game management ----------

function endHalfInning() {
  const game = state.currentGame;
  const completedInning = game.inning;
  const completedHalf = game.half;
  const offense = isPlayerBatting(game) ? "player" : "opponent";
  const offenseTeam =
    offense === "player" ? getPlayer() : getTeam(game.opponentId);
  const runs =
    game.score[offense] - (game.halfStartScore?.[offense] || 0);
  const hits =
    game.hits[offense] - (game.halfStartHits?.[offense] || 0);

  game.halfSummary = {
    inning: completedInning,
    half: completedHalf,
    teamName: offenseTeam.name,
    runs,
    hits,
    atBats: game.halfHistory.length,
  };
  game.outs = 0;
  game.bases = [false, false, false];
  game.currentCard = null;

  if (game.half === "top") {
    game.half = "bottom";
  } else {
    const tied = game.score.player === game.score.opponent;
    if (game.inning >= GAME_CONFIG.innings && !tied) {
      finishGame();
      return;
    }
    game.inning += 1;
    game.half = "top";
  }

  game.log.unshift(`Start of the ${game.half} of inning ${game.inning}.`);
  game.phase = "break";
  game.message = `Get ready for the ${game.half} of inning ${game.inning}.`;
}

function finishGame() {
  const game = state.currentGame;
  game.gameOver = true;
  const playerWon = game.score.player > game.score.opponent;
  const player = getPlayer();
  const opponent = getTeam(game.opponentId);
  const scheduledGame = state.schedule.find(
    (item) => item.id === game.scheduleId,
  );

  scheduledGame.status = "complete";
  scheduledGame.playerScore = game.score.player;
  scheduledGame.opponentScore = game.score.opponent;

  if (playerWon) {
    player.wins += 1;
    opponent.losses += 1;
    player.currency += GAME_CONFIG.rewards.winnerCurrency;
  } else {
    player.losses += 1;
    opponent.wins += 1;
    opponent.currency += GAME_CONFIG.rewards.winnerCurrency;
  }

  state.postgame = {
    playerWon,
    opponentId: opponent.id,
    playerScore: game.score.player,
    opponentScore: game.score.opponent,
    rewardResolved: false,
    rewardMessage: "",
    cardOffers: playerWon ? createCardOffers(opponent) : [],
  };

  if (!playerWon) resolveOpponentReward();
  simulateOtherGames(opponent.id);
  state.view = "postgame";
}

function resetCurrentGame() {
  if (!state.currentGame) return;
  const scheduleId = state.currentGame.scheduleId;
  state.currentGame = null;
  state.postgame = null;
  state.schedule.find((game) => game.id === scheduleId).status = "upcoming";
  state.view = "season";
  state.notice = "The unfinished game was reset.";
  saveAndRender();
}

// ---------- Postgame rewards ----------

function createCardOffers(team) {
  const pool = [
    ...team.hittingDeck.map((card) => ({ ...card, deckType: "hittingDeck" })),
    ...team.pitchingDeck.map((card) => ({
      ...card,
      deckType: "pitchingDeck",
    })),
  ];
  return shuffle(pool).slice(0, 3);
}

function takeCurrencyReward() {
  const postgame = state.postgame;
  if (!postgame || postgame.rewardResolved) return;
  const player = getPlayer();
  const opponent = getTeam(postgame.opponentId);
  const amount = Math.min(
    opponent.currency,
    GAME_CONFIG.rewards.stealCurrency,
  );
  opponent.currency -= amount;
  player.currency += amount;
  postgame.rewardResolved = true;
  postgame.rewardMessage = `You took ${amount} currency from ${opponent.name}.`;
  saveAndRender();
}

function takeCardReward(offerIndex) {
  const postgame = state.postgame;
  if (!postgame || postgame.rewardResolved) return;
  const card = postgame.cardOffers[offerIndex];
  const player = getPlayer();
  const opponent = getTeam(postgame.opponentId);
  const sourceDeck = opponent[card.deckType];
  const matchIndex = sourceDeck.findIndex(
    (item) => item.rank === card.rank && item.suit === card.suit,
  );
  if (matchIndex < 0) return;

  const [transferredCard] = sourceDeck.splice(matchIndex, 1);
  player[card.deckType].push(transferredCard);
  postgame.rewardResolved = true;
  postgame.rewardMessage =
    `${cardLabel(card)} moved to your ${deckName(card.deckType)}.`;
  saveAndRender();
}

function resolveOpponentReward() {
  const postgame = state.postgame;
  const player = getPlayer();
  const opponent = getTeam(postgame.opponentId);

  if (Math.random() > 0.5 && player.currency > 0) {
    const amount = Math.min(
      player.currency,
      GAME_CONFIG.rewards.stealCurrency,
    );
    player.currency -= amount;
    opponent.currency += amount;
    postgame.rewardMessage = `${opponent.name} took ${amount} currency from you.`;
  } else {
    const deckType = Math.random() > 0.5 ? "hittingDeck" : "pitchingDeck";
    const index = Math.floor(Math.random() * player[deckType].length);
    const [card] = player[deckType].splice(index, 1);
    opponent[deckType].push(card);
    postgame.rewardMessage =
      `${opponent.name} took ${cardLabel(card)} from your ${deckName(deckType)}.`;
  }
  postgame.rewardResolved = true;
}

function returnToSeason() {
  if (!state.postgame?.rewardResolved) return;
  state.currentGame = null;
  state.postgame = null;
  state.view = "season";
  state.notice = getNextGame()
    ? "The standings and schedule have been updated."
    : "The regular season is complete.";
  saveAndRender();
}

// ---------- Saving and loading ----------

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Could not save game state.", error);
  }
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error("Could not load saved game state.", error);
    return null;
  }
}

function saveAndRender() {
  saveState();
  render();
}

// ---------- Rendering ----------

function cardLabel(card) {
  return card ? `${card.rank} ${card.suit}` : "No card";
}

function cardMarkup(card) {
  const content = `
    <span class="card-rank">${card.rank}</span>
    <span class="card-suit">${card.suit}</span>
  `;
  return `<div class="card">${content}</div>`;
}

function deckName(deckType) {
  return deckType === "hittingDeck" ? "hitting deck" : "pitching deck";
}

function renderSeason() {
  const player = getPlayer();
  const nextGame = getNextGame();
  const seasonComplete = !nextGame;
  return `
    <section>
      <h2>${seasonComplete ? "Final standings" : "Season dashboard"}</h2>
      ${state.notice ? `<p class="status-line">${state.notice}</p>` : ""}
      <div class="grid">
        <article class="panel">
          <h3>Your team</h3>
          <p class="stat">${player.name} (${player.abbreviation})</p>
          <p>${player.wins}–${player.losses} · ${player.currency} currency</p>
          ${
            nextGame
              ? `<p>Next: ${nextGame.playerHome ? "vs." : "at"} ${getTeam(nextGame.opponentId).name}</p>
                 <button data-start-game type="button">Play next game</button>`
              : "<p>The six-game season is complete. Start a new season to play again.</p>"
          }
        </article>
        <article class="panel">
          <h3>Standings</h3>
          ${standingsTable()}
        </article>
        <article class="panel wide">
          <h3>Schedule</h3>
          <ol class="schedule-list">
            ${state.schedule.map(scheduleRow).join("")}
          </ol>
        </article>
      </div>
    </section>
    ${renderTeam()}
  `;
}

function standingsTable() {
  return `
    <table>
      <thead><tr><th>Team</th><th>W</th><th>L</th></tr></thead>
      <tbody>
        ${getStandings()
          .map(
            (team) =>
              `<tr><td>${team.name}</td><td>${team.wins}</td><td>${team.losses}</td></tr>`,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function scheduleRow(game, index) {
  const opponent = getTeam(game.opponentId);
  const result =
    game.status === "complete"
      ? `${game.playerScore}–${game.opponentScore}`
      : "Upcoming";
  return `<li>Game ${index + 1}: ${game.playerHome ? "vs." : "at"} ${opponent.name} <strong>${result}</strong></li>`;
}

function rankCounts(cards) {
  return Object.keys(GAME_CONFIG.cardValues)
    .map((rank) => {
      const count = cards.filter((card) => card.rank === rank).length;
      return `<span class="deck-chip">${rank}: ${count}</span>`;
    })
    .join("");
}

function renderTeam() {
  const player = getPlayer();
  return `
    <section class="team-dashboard">
      <h2>Team management</h2>
      <div class="grid">
        <article class="panel">
          <h3>Loadout</h3>
          <div class="slot">
            <label for="ability-select">Ability</label>
            <select id="ability-select">
              ${Object.entries(ABILITIES)
                .map(
                  ([id, item]) =>
                    `<option value="${id}" ${player.ability === id ? "selected" : ""}>${item.name} — ${item.description}</option>`,
                )
                .join("")}
            </select>
          </div>
          <div class="slot">
            <label for="powerup-select">Powerup</label>
            <select id="powerup-select">
              ${Object.entries(POWERUPS)
                .map(
                  ([id, item]) =>
                    `<option value="${id}" ${player.powerup === id ? "selected" : ""}>${item.name} — ${item.description}</option>`,
                )
                .join("")}
            </select>
          </div>
          <p class="muted">Selections apply to your next game.</p>
        </article>
        ${deckPanel("Hitting deck", player.hittingDeck)}
        ${deckPanel("Pitching deck", player.pitchingDeck)}
      </div>
    </section>
  `;
}

function deckPanel(title, cards) {
  return `
    <article class="panel">
      <h3>${title} (${cards.length})</h3>
      <div class="deck-list">${rankCounts(cards)}</div>
      <details>
        <summary>View every card</summary>
        <p class="muted">${cards.map(cardLabel).join(", ")}</p>
      </details>
    </article>
  `;
}

function renderGame() {
  const game = state.currentGame;
  if (!game) return renderSeason();
  game.hits ||= { player: 0, opponent: 0 };
  game.lineScore ||= { player: [], opponent: [] };
  game.phase ||= "break";
  game.halfHistory ||= [];
  game.currentCard ||= null;
  game.message ||= "Ready for the next at-bat.";
  game.halfSummary ||= null;
  game.halfStartScore ||= { ...game.score };
  game.halfStartHits ||= { ...game.hits };
  const player = getPlayer();
  const opponent = getTeam(game.opponentId);
  const batting = isPlayerBatting();

  return `
    <section>
      ${matchupMarkup(player, opponent)}
      <div class="inning-status">
        <span>${game.half === "top" ? "Top" : "Bottom"}</span>
        <strong>Inning ${game.inning}</strong>
        <span>${game.outs} out${game.outs === 1 ? "" : "s"}</span>
      </div>
      <div class="grid game-layout">
        <article class="panel wide scoreboard-panel">
          <h3>Scoreboard</h3>
          ${scoreboardMarkup(game, player, opponent)}
        </article>
        <article class="panel wide compact-field">
          <h3>Field</h3>
          <div class="field-strip">
            <div class="diamond" aria-label="${game.bases.filter(Boolean).length} bases occupied">
              <span class="base second ${game.bases[1] ? "occupied" : ""}" title="Second base"></span>
              <span class="base third ${game.bases[2] ? "occupied" : ""}" title="Third base"></span>
              <span class="base first ${game.bases[0] ? "occupied" : ""}" title="First base"></span>
              <span class="home-plate" title="Home plate"></span>
            </div>
            <div class="outs" aria-label="${game.outs} outs">
              <strong>Outs</strong>
              ${[0, 1, 2].map((out) => `<span class="out-light ${game.outs > out ? "recorded" : ""}"></span>`).join("")}
            </div>
          </div>
        </article>
        <article class="panel wide play-panel">
          <h3>${batting ? "Your team is hitting" : `${opponent.name} is hitting`}</h3>
          ${cardFlipMarkup(game, batting)}
        </article>
        <article class="panel wide">
          <h3>Recent plays</h3>
          <ol class="log">${game.log.map((item) => `<li>${item}</li>`).join("")}</ol>
        </article>
      </div>
      ${game.halfSummary ? halfSummaryMarkup(game) : ""}
    </section>
  `;
}

function matchupMarkup(player, opponent) {
  return `
    <div class="matchup" aria-label="${player.name} versus ${opponent.name}">
      <div class="matchup-team player-team">
        <span class="team-mark">${player.abbreviation.slice(0, 1)}</span>
        <span><small>You</small><strong>${player.name}</strong></span>
      </div>
      <span class="versus">VS</span>
      <div class="matchup-team opponent-team">
        <span><small>Opponent</small><strong>${opponent.name}</strong></span>
        <span class="team-mark">${opponent.abbreviation.slice(0, 1)}</span>
      </div>
    </div>
  `;
}

function halfSummaryMarkup(game) {
  const summary = game.halfSummary;
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="half-modal" role="dialog" aria-modal="true" aria-labelledby="half-summary-title">
        <p class="label">${summary.half === "top" ? "Top" : "Bottom"} ${summary.inning} complete</p>
        <h2 id="half-summary-title">${summary.teamName}: ${summary.runs} run${summary.runs === 1 ? "" : "s"}</h2>
        <p>${summary.hits} hit${summary.hits === 1 ? "" : "s"} across ${summary.atBats} at-bat${summary.atBats === 1 ? "" : "s"}.</p>
        <button data-start-half type="button">Go to next half-inning</button>
      </section>
    </div>
  `;
}

function cardFlipMarkup(game, batting) {
  const deckLabel = batting ? "Hitting deck" : "Pitching deck";
  const activeDeck = batting
    ? game.decks.playerHitting
    : game.decks.playerPitching;
  return `
    <div class="flip-stage">
      <p class="at-bat-message" aria-live="polite">${game.message}</p>
      <div class="flip-area">
        <div class="flip-column">
          <h4>Deck</h4>
          <button
            class="deck-stack"
            data-flip-card
            type="button"
            ${game.phase === "ready" ? "" : "disabled"}
            aria-label="Reveal the top card of the ${deckLabel}"
          >
            <span>${deckLabel}</span>
            <small>${cardsRemaining(activeDeck)} cards</small>
          </button>
        </div>
        <div class="flip-column">
          <h4>Next card</h4>
          <div class="revealed-card">
            ${game.currentCard ? largeCardMarkup(game.currentCard, outcomeForCard(game.currentCard)) : '<div class="card-placeholder">Next card</div>'}
          </div>
        </div>
        <div class="flip-column previous-column">
          <h4>Previous cards</h4>
          <div class="history-cards">
            ${
              game.halfHistory.length
                ? game.halfHistory
                    .map(
                      ({ card, result }) =>
                        `<div class="history-card">${cardMarkup(card)}<small>${result}</small></div>`,
                    )
                    .join("")
                : '<p class="muted">None yet.</p>'
            }
          </div>
        </div>
      </div>
      ${
        game.phase === "break" && !game.halfSummary
          ? '<button data-start-half type="button">Start next at-bat</button>'
          : ""
      }
    </div>
  `;
}

function largeCardMarkup(card, result) {
  return `
    <div class="card large-card">
      <span class="card-rank">${card.rank}</span>
      <strong>${result}</strong>
      <span class="card-suit">${card.suit}</span>
    </div>
  `;
}

function scoreboardMarkup(game, player, opponent) {
  const inningNumbers = Array.from({ length: 9 }, (_, index) => index + 1);

  function teamRow(team, side) {
    const scores = game.lineScore[side] || [];
    const isBatting = isPlayerBatting(game)
      ? side === "player"
      : side === "opponent";
    return `
      <tr class="${isBatting ? "at-bat-row" : ""}">
        <th scope="row">${team.abbreviation}</th>
        ${inningNumbers
          .map((inning) => {
            const inningPlayed =
              inning < game.inning ||
              (inning === game.inning &&
                ((side === "opponent" && game.playerHome && game.half === "bottom") ||
                  (side === "player" && !game.playerHome && game.half === "bottom"))) ||
              scores[inning - 1] !== undefined;
            return `<td class="${inning === game.inning ? "current-inning" : ""}">${inningPlayed ? scores[inning - 1] || 0 : "–"}</td>`;
          })
          .join("")}
        <td class="total">${game.score[side]}</td>
        <td class="total">${game.hits[side]}</td>
        <td class="total">0</td>
      </tr>
    `;
  }

  return `
    <div class="scoreboard-wrap">
      <table class="baseball-scoreboard">
        <thead>
          <tr>
            <th scope="col">Team</th>
            ${inningNumbers.map((inning) => `<th class="${inning === game.inning ? "current-inning" : ""}" scope="col">${inning}</th>`).join("")}
            <th scope="col" title="Runs">R</th>
            <th scope="col" title="Hits">H</th>
            <th scope="col" title="Errors">E</th>
          </tr>
        </thead>
        <tbody>
          ${teamRow(player, "player")}
          ${teamRow(opponent, "opponent")}
        </tbody>
      </table>
    </div>
  `;
}

function renderPostgame() {
  const postgame = state.postgame;
  const opponent = getTeam(postgame.opponentId);
  return `
    <section>
      <h2>Final: ${getPlayer().abbreviation} ${postgame.playerScore}, ${opponent.abbreviation} ${postgame.opponentScore}</h2>
      <div class="panel">
        <p class="stat">${postgame.playerWon ? "You won." : "You lost."}</p>
        <p>${postgame.playerWon ? `You earned ${GAME_CONFIG.rewards.winnerCurrency} currency.` : `${opponent.name} earned ${GAME_CONFIG.rewards.winnerCurrency} currency.`}</p>
        ${
          postgame.playerWon && !postgame.rewardResolved
            ? rewardChoices(postgame)
            : `<p class="status-line">${postgame.rewardMessage}</p>
               <button data-return-season type="button">Return to season</button>`
        }
      </div>
    </section>
  `;
}

function rewardChoices(postgame) {
  return `
    <h3>Choose a reward</h3>
    <div class="reward-choice">
      <button data-take-currency type="button">Take up to ${GAME_CONFIG.rewards.stealCurrency} currency</button>
    </div>
    <p>Or take one offered card:</p>
    <div class="cards">
      ${postgame.cardOffers
        .map(
          (card, index) =>
            `<button class="card" data-take-card="${index}" type="button">
              <span class="card-rank">${card.rank}</span>
              <span class="card-suit">${card.suit} · ${deckName(card.deckType)}</span>
            </button>`,
        )
        .join("")}
    </div>
  `;
}

function render() {
  const app = document.querySelector("#app");
  if (state.view === "game") app.innerHTML = renderGame();
  else if (state.view === "postgame") app.innerHTML = renderPostgame();
  else app.innerHTML = renderSeason();

  document.querySelector("#reset-game").disabled = !state.currentGame;
}

// ---------- Event handling ----------

document.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;

  if (target.matches("[data-start-game]")) startNextGame();
  else if (target.matches("[data-start-half]")) startHalfInning();
  else if (target.matches("[data-flip-card]")) flipAtBatCard();
  else if (target.matches("[data-take-currency]")) takeCurrencyReward();
  else if (target.dataset.takeCard !== undefined)
    takeCardReward(Number(target.dataset.takeCard));
  else if (target.matches("[data-return-season]")) returnToSeason();
});

document.addEventListener("change", (event) => {
  if (event.target.id === "ability-select") {
    getPlayer().ability = event.target.value;
    saveAndRender();
  } else if (event.target.id === "powerup-select") {
    getPlayer().powerup = event.target.value;
    saveAndRender();
  }
});

document.querySelector("#reset-game").addEventListener("click", () => {
  if (window.confirm("Reset the current game without recording a result?")) {
    resetCurrentGame();
  }
});

document.querySelector("#new-season").addEventListener("click", () => {
  if (window.confirm("Erase the saved season and start over?")) {
    state = createNewSeasonState();
    saveAndRender();
  }
});

render();

(function () {
  var ATTRIBUTE_KEYS = ["team", "product", "growth", "market", "burn", "hype", "moat", "timing"];
  var ATTRIBUTE_LABELS = {
    team: "Team",
    product: "Product",
    growth: "Growth",
    market: "Market",
    burn: "Burn",
    hype: "Hype",
    moat: "Moat",
    timing: "Timing"
  };
  var ATTRIBUTE_MARKERS = {
    team: "TM",
    product: "PR",
    growth: "GR",
    market: "MK",
    burn: "BU",
    hype: "HY",
    moat: "MO",
    timing: "TI"
  };
  var VALUE_SCORES = { Strong: 2, Medium: 1, Weak: -1 };
  var DECISION_REPLIES = {
    invested: {
      title: "Thanks for investing in us!",
      text: "We'll make sure this round was worth your conviction."
    },
    stay: {
      title: "Guess we'll stay in touch.",
      text: "We'll keep you posted when the story gets harder to ignore."
    },
    passed: {
      title: "You're missing out!",
      text: "Or maybe you just saved the fund. Time will tell."
    }
  };

  var STARTUP_LIBRARY = [
    makeStartup({
      id: "cinder",
      name: "Cinder Health",
      sector: "Digital Health",
      stage: "Seed",
      founder: "Academic",
      tagline: "Clinical workflow software for overloaded care teams.",
      perception: "Skepticism: serious science, awkward pitch.",
      hidden: { team: "Strong", product: "Medium", growth: "Medium", market: "Strong", burn: "Weak", hype: "Weak", moat: "Strong", timing: "Medium" },
      revenue: 1.2,
      multiple: 5.2
    }),
    makeStartup({
      id: "sunline",
      name: "Sunline Commerce",
      sector: "Creator Tools",
      stage: "Pre-seed",
      founder: "Storyteller",
      tagline: "One storefront layer for every short-form creator channel.",
      perception: "High buzz: founder went viral after demo day.",
      hidden: { team: "Medium", product: "Strong", growth: "Strong", market: "Medium", burn: "Weak", hype: "Strong", moat: "Weak", timing: "Strong" },
      revenue: 0.8,
      multiple: 7.3
    }),
    makeStartup({
      id: "harbor",
      name: "Harbor Grid",
      sector: "Climate Infra",
      stage: "Seed",
      founder: "Operator",
      tagline: "Software to coordinate distributed power storage for city blocks.",
      perception: "Hot sector: everyone wants climate exposure.",
      hidden: { team: "Strong", product: "Strong", growth: "Medium", market: "Strong", burn: "Medium", hype: "Medium", moat: "Medium", timing: "Strong" },
      revenue: 1.6,
      multiple: 6.1
    }),
    makeStartup({
      id: "moss",
      name: "Moss Ledger",
      sector: "Fintech",
      stage: "Series A",
      founder: "Insider",
      tagline: "Treasury software built for mid-market finance teams.",
      perception: "Polished but crowded: feels premium, not inevitable.",
      hidden: { team: "Strong", product: "Medium", growth: "Medium", market: "Medium", burn: "Weak", hype: "Medium", moat: "Medium", timing: "Weak" },
      revenue: 4.4,
      multiple: 4.8
    }),
    makeStartup({
      id: "quarry",
      name: "Quarry Robotics",
      sector: "Industrial AI",
      stage: "Seed",
      founder: "Outsider",
      tagline: "Autonomous quality control for small factory floors.",
      perception: "Skepticism: ambitious product, rough edges everywhere.",
      hidden: { team: "Medium", product: "Strong", growth: "Medium", market: "Strong", burn: "Weak", hype: "Weak", moat: "Strong", timing: "Medium" },
      revenue: 1.1,
      multiple: 5.7
    }),
    makeStartup({
      id: "petal",
      name: "Petal Loop",
      sector: "Consumer Social",
      stage: "Pre-seed",
      founder: "Repeat founder",
      tagline: "A private social layer for micro-communities and fandoms.",
      perception: "High buzz: everyone has an opinion already.",
      hidden: { team: "Medium", product: "Medium", growth: "Strong", market: "Weak", burn: "Medium", hype: "Strong", moat: "Weak", timing: "Strong" },
      revenue: 0.5,
      multiple: 8.4
    }),
    makeStartup({
      id: "anchor",
      name: "Anchor Desk",
      sector: "Future of Work",
      stage: "Seed",
      founder: "Operator",
      tagline: "Workflow software for hybrid office managers.",
      perception: "Muted reaction: useful, unsexy, easy to overlook.",
      hidden: { team: "Strong", product: "Strong", growth: "Medium", market: "Medium", burn: "Strong", hype: "Weak", moat: "Medium", timing: "Medium" },
      revenue: 2.1,
      multiple: 4.1
    })
  ];

  var state = {};
  var ui = {};
  var windowState = { topZ: 30, drag: null, portfolioTab: "invested" };
  var BOOT_DELAY_MS = 280;

  function makeStartup(config) {
    return {
      id: config.id,
      name: config.name,
      sector: config.sector,
      stage: config.stage,
      founder: config.founder,
      tagline: config.tagline,
      perception: config.perception,
      hidden: config.hidden,
      revenue: config.revenue,
      multiple: config.multiple
    };
  }

  function cacheDom() {
    ui.bootScreen = document.getElementById("bootScreen");
    ui.desktopShell = document.getElementById("desktopShell");
    ui.powerButton = document.getElementById("powerButton");
    ui.closeWelcomeBtn = document.getElementById("closeWelcomeBtn");
    ui.closeDecisionModalBtn = document.getElementById("closeDecisionModalBtn");
    ui.welcomeModal = document.getElementById("welcomeModal");
    ui.decisionModal = document.getElementById("decisionModal");
    ui.decisionModalTitle = document.getElementById("decisionModalTitle");
    ui.decisionModalText = document.getElementById("decisionModalText");
    ui.cashStat = document.getElementById("cashStat");
    ui.reputationStat = document.getElementById("reputationStat");
    ui.portfolioStat = document.getElementById("portfolioStat");
    ui.roundStat = document.getElementById("roundStat");
    ui.messagesList = document.getElementById("messagesList");
    ui.startupName = document.getElementById("startupName");
    ui.sectorChip = document.getElementById("sectorChip");
    ui.stageChip = document.getElementById("stageChip");
    ui.founderChip = document.getElementById("founderChip");
    ui.taglineText = document.getElementById("taglineText");
    ui.perceptionText = document.getElementById("perceptionText");
    ui.revealedAttributes = document.getElementById("revealedAttributes");
    ui.roundSummaryPanel = document.getElementById("roundSummaryPanel");
    ui.convictionValue = document.getElementById("convictionValue");
    ui.outlookValue = document.getElementById("outlookValue");
    ui.movesRemainingLabel = document.getElementById("movesRemainingLabel");
    ui.boardCover = document.getElementById("boardCover");
    ui.boardCoverBeginBtn = document.getElementById("boardCoverBeginBtn");
    ui.boardContainer = document.getElementById("boardContainer");
    ui.beginResearchBtn = document.getElementById("beginResearchBtn");
    ui.decisionButtons = document.getElementById("decisionButtons");
    ui.investBtn = document.getElementById("investBtn");
    ui.stayBtn = document.getElementById("stayBtn");
    ui.passBtn = document.getElementById("passBtn");
    ui.portfolioList = document.getElementById("portfolioList");
    ui.portfolioTabs = Array.prototype.slice.call(document.querySelectorAll("[data-portfolio-tab]"));
    ui.windows = Array.prototype.slice.call(document.querySelectorAll("[data-window]"));
    ui.windowButtons = Array.prototype.slice.call(document.querySelectorAll("[data-window-target]"));
    ui.closeWindowButtons = Array.prototype.slice.call(document.querySelectorAll("[data-close-window]"));
    ui.dragHandles = Array.prototype.slice.call(document.querySelectorAll("[data-drag-handle]"));
    ui.desktopCanvas = document.getElementById("desktopCanvas");
    ui.menuDate = document.getElementById("menuDate");
    ui.menuTime = document.getElementById("menuTime");
    ui.endScreen = document.getElementById("endScreen");
    ui.endHeadline = document.getElementById("endHeadline");
    ui.endSummary = document.getElementById("endSummary");
    ui.endCash = document.getElementById("endCash");
    ui.endPortfolio = document.getElementById("endPortfolio");
    ui.endReputation = document.getElementById("endReputation");
    ui.restartBtn = document.getElementById("restartBtn");
  }

  function initState() {
    var inbox = shuffle(STARTUP_LIBRARY.map(cloneStartup)).slice(0, 5);
    state = {
      booted: false,
      feedDismissed: false,
      cash: 600,
      reputation: 50,
      dealList: inbox.map(cloneStartup),
      inbox: inbox,
      completedDeals: [],
      analyzedCount: 0,
      current: null,
      portfolioCompanies: [],
      decisions: {
        invested: [],
        stay: [],
        passed: []
      }
    };
    windowState.portfolioTab = "invested";
  }

  function cloneStartup(startup) {
    return JSON.parse(JSON.stringify(startup));
  }

  function shuffle(items) {
    for (var i = items.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = items[i];
      items[i] = items[j];
      items[j] = temp;
    }
    return items;
  }

  function bootGame() {
    initState();
    ui.bootScreen.classList.add("hidden");
    ui.desktopShell.classList.remove("hidden");
    ui.welcomeModal.classList.remove("hidden");
    updateMenuClock();
    openWindow("messagesWindow");
    hideWindow("boardMemoWindow");
    hideWindow("portfolioWindow");
    hideWindow("endScreen");
    updateStats();
    renderMessages();
    renderPortfolio();
  }

  function initDesktopWindows() {
    ui.windows.forEach(function (win, index) {
      win.style.zIndex = String(windowState.topZ + index);
      win.addEventListener("pointerdown", function () {
        focusWindow(win.id);
      });
    });

    ui.windowButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        openWindow(button.getAttribute("data-window-target"));
      });
    });

    ui.closeWindowButtons.forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.stopPropagation();
        hideWindow(button.getAttribute("data-close-window"));
      });
    });

    ui.dragHandles.forEach(function (handle) {
      handle.addEventListener("pointerdown", onWindowDragStart);
    });

    document.addEventListener("pointermove", onWindowDragMove);
    document.addEventListener("pointerup", onWindowDragEnd);
  }

  function openWindow(id) {
    var win = document.getElementById(id);
    if (!win) {
      return;
    }
    win.classList.remove("hidden");
    focusWindow(id);
  }

  function hideWindow(id) {
    var win = document.getElementById(id);
    if (!win) {
      return;
    }
    win.classList.add("hidden");
  }

  function focusWindow(id) {
    var win = document.getElementById(id);
    if (!win) {
      return;
    }
    windowState.topZ += 1;
    win.style.zIndex = String(windowState.topZ);
    ui.windows.forEach(function (item) {
      item.classList.toggle("is-active", item.id === id);
    });
  }

  function onWindowDragStart(event) {
    if (window.innerWidth <= 1180 || event.target.closest("[data-close-window]")) {
      return;
    }
    var targetWindow = event.currentTarget.parentElement;
    var rect = targetWindow.getBoundingClientRect();
    focusWindow(targetWindow.id);
    targetWindow.setPointerCapture(event.pointerId);
    windowState.drag = {
      pointerId: event.pointerId,
      windowId: targetWindow.id,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    };
  }

  function onWindowDragMove(event) {
    if (!windowState.drag || window.innerWidth <= 1180) {
      return;
    }
    var win = document.getElementById(windowState.drag.windowId);
    var canvasRect = ui.desktopCanvas.getBoundingClientRect();
    var nextLeft = event.clientX - canvasRect.left - windowState.drag.offsetX;
    var nextTop = event.clientY - canvasRect.top - windowState.drag.offsetY;
    var maxLeft = Math.max(0, canvasRect.width - win.offsetWidth);
    var maxTop = Math.max(0, canvasRect.height - win.offsetHeight);
    win.style.left = Math.max(0, Math.min(maxLeft, nextLeft)) + "px";
    win.style.top = Math.max(0, Math.min(maxTop, nextTop)) + "px";
    win.style.transform = "none";
  }

  function onWindowDragEnd(event) {
    if (!windowState.drag) {
      return;
    }
    var win = document.getElementById(windowState.drag.windowId);
    if (win && typeof win.releasePointerCapture === "function") {
      try {
        win.releasePointerCapture(event.pointerId);
      } catch (error) {
      }
    }
    windowState.drag = null;
  }

  function startAnalysis(startupId) {
    var startup = state.inbox.find(function (item) {
      return item.id === startupId;
    });

    if (!startup) {
      return;
    }

    state.current = {
      startup: startup,
      flipLimit: 24,
      flipsUsed: 0,
      researchStarted: false,
      resolved: false,
      decisionMade: false,
      activeCards: [],
      previewing: false,
      justRevealedKey: "",
      revealedAttributes: {},
      board: buildBoard(startup)
    };

    renderBoardMemo();
    openWindow("boardMemoWindow");
  }

  function buildBoard(startup) {
    var cards = [];
    ATTRIBUTE_KEYS.forEach(function (key) {
      cards.push(makeCard(key, startup.hidden[key], "attribute"));
      cards.push(makeCard(key, startup.hidden[key], "attribute"));
    });
    shuffle(cards);
    return cards.map(function (card, index) {
      card.id = "card-" + index;
      return card;
    });
  }

  function makeCard(key, value, kind) {
    return {
      id: "",
      key: key,
      value: value,
      kind: kind,
      flipped: false,
      matched: false,
      finalRevealed: false
    };
  }

  function renderMessages() {
    var completedMap = {};
    state.completedDeals.forEach(function (id) {
      completedMap[id] = true;
    });

    var activeItems = state.dealList.filter(function (startup) {
      return !completedMap[startup.id];
    });
    var completedItems = state.dealList.filter(function (startup) {
      return completedMap[startup.id];
    });
    var orderedItems = activeItems.concat(completedItems);

    if (!orderedItems.length) {
      ui.messagesList.innerHTML = '<div class="portfolio-empty">No deal tasks are queued right now.</div>';
      return;
    }

    var rows = orderedItems.map(function (startup) {
      var isComplete = !!completedMap[startup.id];
      return [
        "<tr" + (isComplete ? " class='is-complete'" : "") + ">",
        "<td>",
        isComplete ?
          "<div class='todo-row is-complete'><span class='todo-checkbox' aria-hidden='true'></span><div class='todo-copy'><div class='message-subject'>" + startup.name + " needs analyzing</div><div class='message-actions'><span class='todo-complete-label'>Completed</span></div></div><span class='todo-arrow' aria-hidden='true'>Go</span></div>" :
          "<button class='todo-row analyze-row-btn' type='button' data-startup-id='" + startup.id + "'><span class='todo-checkbox' aria-hidden='true'></span><div class='todo-copy'><div class='message-subject'>" + startup.name + " needs analyzing</div></div><span class='todo-arrow' aria-hidden='true'>Go</span></button>",
        "</td>",
        "</tr>"
      ].join("");
    }).join("");

    ui.messagesList.innerHTML = [
      "<table class='message-table'>",
      "<thead><tr><th>To-Do</th></tr></thead>",
      "<tbody>" + rows + "</tbody>",
      "</table>"
    ].join("");

    Array.prototype.forEach.call(ui.messagesList.querySelectorAll(".analyze-row-btn"), function (button) {
      button.addEventListener("click", function () {
        startAnalysis(button.getAttribute("data-startup-id"));
      });
    });
  }

  function renderBoardMemo() {
    var startup = state.current.startup;
    ui.startupName.textContent = startup.name;
    ui.sectorChip.textContent = startup.sector;
    ui.stageChip.textContent = startup.stage;
    ui.founderChip.textContent = startup.founder;
    ui.taglineText.textContent = startup.tagline;
    ui.perceptionText.textContent = startup.perception;
    if (ui.beginResearchBtn) {
      ui.beginResearchBtn.classList.toggle("hidden", state.current.researchStarted || state.current.resolved);
      ui.beginResearchBtn.disabled = state.current.researchStarted;
    }
    if (ui.boardCover) {
      ui.boardCover.classList.toggle("hidden", state.current.researchStarted || state.current.resolved);
    }
    if (ui.boardContainer) {
      ui.boardContainer.classList.toggle("hidden", !state.current.researchStarted && !state.current.resolved);
    }
    if (ui.roundSummaryPanel) {
      ui.roundSummaryPanel.classList.toggle("hidden", !state.current.resolved);
    }
    if (ui.decisionButtons) {
      ui.decisionButtons.classList.toggle("hidden", !state.current.resolved);
    }
    setDecisionButtonsEnabled(state.current.resolved);
    renderAttributes();
    updateSummary();
    renderBoard();
  }

  function renderAttributes() {
    ui.revealedAttributes.innerHTML = ATTRIBUTE_KEYS.map(function (key) {
      var value = state.current.revealedAttributes[key];
      var classes = ["attribute-row", value ? "revealed" : "unknown", value ? value.toLowerCase() : "unknown"];
      if (state.current.justRevealedKey === key) {
        classes.push("just-revealed");
      }
      return [
        '<div class="' + classes.join(" ") + '">',
        '<span class="attribute-label"><i class="trait-marker trait-' + key + '" aria-hidden="true">' + ATTRIBUTE_MARKERS[key] + "</i><span>" + ATTRIBUTE_LABELS[key] + "</span></span>",
        '<strong class="value-pill">' + (value || "Unknown") + "</strong>",
        "</div>"
      ].join("");
    }).join("");
  }

  function renderBoard() {
    ui.boardContainer.style.setProperty("--cols", "4");
    ui.boardContainer.classList.toggle("is-inactive", !state.current.researchStarted || state.current.resolved);

    ui.boardContainer.innerHTML = state.current.board.map(function (card, index) {
      var flipped = card.flipped || card.matched || card.finalRevealed;
      var classes = ["memory-card"];
      if (card.flipped) {
        classes.push("is-flipped");
      }
      if (card.matched) {
        classes.push("is-matched");
      }
      if (card.finalRevealed) {
        classes.push("is-final-reveal");
      }
      return [
        '<button class="' + classes.join(" ") + ' trait-' + card.key + '" type="button" data-index="' + index + '"' + (canFlipCard(card) ? "" : " disabled") + ">",
        '<span class="memory-card-inner">',
        '<span class="memory-card-face memory-card-front"><strong>?</strong></span>',
        '<span class="memory-card-face memory-card-back"><span class="card-marker" aria-hidden="true">' + ATTRIBUTE_MARKERS[card.key] + '</span><strong class="sr-only">' + ATTRIBUTE_LABELS[card.key] + "</strong></span>",
        "</span>",
        "</button>"
      ].join("");
    }).join("");

    ui.movesRemainingLabel.textContent = remainingFlips() + " flips left";

    Array.prototype.forEach.call(ui.boardContainer.querySelectorAll(".memory-card"), function (button) {
      button.addEventListener("click", onCardClick);
    });
  }

  function canFlipCard(card) {
    return state.current &&
      state.current.researchStarted &&
      !state.current.resolved &&
      !card.matched &&
      !card.flipped &&
      remainingFlips() > 0 &&
      state.current.activeCards.length < 2;
  }

  function onCardClick(event) {
    var index = Number(event.currentTarget.getAttribute("data-index"));
    var card = state.current.board[index];
    if (!canFlipCard(card)) {
      return;
    }
    card.flipped = true;
    state.current.activeCards.push(index);
    state.current.flipsUsed += 1;
    renderBoard();
    if (state.current.activeCards.length === 2) {
      resolveTurn();
    }
  }

  function resolveTurn() {
    var first = state.current.board[state.current.activeCards[0]];
    var second = state.current.board[state.current.activeCards[1]];

    if (first.key === second.key) {
      window.setTimeout(function () {
        first.matched = true;
        second.matched = true;
        first.flipped = false;
        second.flipped = false;
        state.current.revealedAttributes[first.key] = first.value;
        state.current.justRevealedKey = first.key;
        state.current.activeCards = [];
        renderBoardMemo();
        window.setTimeout(function () {
          if (state.current && state.current.justRevealedKey === first.key) {
            state.current.justRevealedKey = "";
            renderAttributes();
          }
        }, 700);
        maybeEndResearch();
      }, 300);
      return;
    }

    window.setTimeout(function () {
      first.flipped = false;
      second.flipped = false;
      state.current.activeCards = [];
      renderBoardMemo();
      maybeEndResearch();
    }, 700);
  }

  function maybeEndResearch() {
    if (state.current.resolved) {
      return;
    }
    if (remainingFlips() > 0 || state.current.activeCards.length) {
      return;
    }
    finalizeResearch();
  }

  function finalizeResearch() {
    state.current.resolved = true;
    state.current.researchStarted = false;
    state.current.board.forEach(function (card) {
      if (!card.matched) {
        card.finalRevealed = true;
      }
    });
    renderBoardMemo();
  }

  function remainingFlips() {
    return Math.max(0, state.current.flipLimit - state.current.flipsUsed);
  }

  function updateSummary() {
    var revealedKeys = Object.keys(state.current.revealedAttributes);
    var score = revealedKeys.reduce(function (total, key) {
      return total + VALUE_SCORES[state.current.revealedAttributes[key]];
    }, 0);
    var outlook = revealedKeys.length === 0 ? "Unknown" : (score >= 8 ? "High" : (score >= 3 ? "Medium" : "Low"));
    ui.convictionValue.textContent = Math.round((revealedKeys.length / ATTRIBUTE_KEYS.length) * 100) + "%";
    ui.outlookValue.textContent = outlook;
    ui.outlookValue.className = "";
    if (outlook !== "Unknown") {
      ui.outlookValue.classList.add(outlook.toLowerCase());
    }
  }

  function setDecisionButtonsEnabled(enabled) {
    if (ui.investBtn) {
      ui.investBtn.disabled = !enabled;
    }
    if (ui.stayBtn) {
      ui.stayBtn.disabled = !enabled;
    }
    if (ui.passBtn) {
      ui.passBtn.disabled = !enabled;
    }
  }

  function handleDecision(type) {
    if (!state.current || !state.current.resolved || state.current.decisionMade) {
      return;
    }

    var startup = state.current.startup;
    state.current.decisionMade = true;
    recordDecision(type, startup);
    simulatePortfolio();
    updateStats();
    renderPortfolio();

    state.inbox = state.inbox.filter(function (item) {
      return item.id !== startup.id;
    });
    if (state.completedDeals.indexOf(startup.id) === -1) {
      state.completedDeals.push(startup.id);
    }
    state.analyzedCount += 1;

    var reply = DECISION_REPLIES[type];
    ui.decisionModalTitle.textContent = reply.title;
    ui.decisionModalText.textContent = reply.text;
    ui.decisionModal.classList.remove("hidden");
  }

  function recordDecision(type, startup) {
    var key = type;
    var record = {
      name: startup.name,
      sector: startup.sector,
      founder: startup.founder,
      tagline: startup.tagline,
      action: type
    };

    if (key === "invested") {
      var company = {
        name: startup.name,
        sector: startup.sector,
        founder: startup.founder,
        revenue: startup.revenue,
        multiple: startup.multiple,
        valuation: roundToOneDecimal(startup.revenue * startup.multiple),
        status: "growing",
        hidden: startup.hidden
      };
      state.portfolioCompanies.push(company);
      record.meta = "Active position";
      state.cash = Math.max(0, roundToOneDecimal(state.cash - 120));
    } else if (key === "stay") {
      record.meta = "Relationship maintained";
    } else {
      record.meta = "No allocation";
    }

    state.decisions[key].unshift(record);
  }

  function simulatePortfolio() {
    state.portfolioCompanies.forEach(function (company) {
      var score = ATTRIBUTE_KEYS.reduce(function (total, key) {
        return total + VALUE_SCORES[company.hidden[key]];
      }, 0);
      var growthRate = (Math.random() * 0.28) - 0.06 + (score * 0.02);
      company.revenue = Math.max(0.2, roundToOneDecimal(company.revenue * (1 + growthRate)));
      company.multiple = Math.max(1.8, roundToOneDecimal(company.multiple * (1 + (growthRate / 2))));
      company.valuation = roundToOneDecimal(company.revenue * company.multiple);
      company.status = growthRate > 0.06 ? "growing" : (growthRate > -0.03 ? "flat" : "failing");
      state.reputation = Math.max(0, Math.min(100, Math.round(state.reputation + (growthRate > 0.06 ? 2 : (growthRate < -0.03 ? -2 : 0)))));
    });
  }

  function renderPortfolio() {
    var items = state.decisions[windowState.portfolioTab];
    ui.portfolioTabs.forEach(function (tab) {
      tab.classList.toggle("is-active", tab.getAttribute("data-portfolio-tab") === windowState.portfolioTab);
    });

    if (!items.length) {
      ui.portfolioList.innerHTML = '<div class="portfolio-empty">Nothing logged in this category yet.</div>';
      return;
    }

    ui.portfolioList.innerHTML = items.map(function (item) {
      var company = state.portfolioCompanies.find(function (entry) {
        return entry.name === item.name;
      });
      return [
        '<article class="portfolio-item">',
        '<div class="portfolio-headline"><h4>' + item.name + '</h4><strong>' + item.meta + '</strong></div>',
        '<div class="portfolio-meta">' + item.sector + " • " + item.founder + "</div>",
        company ? '<div class="portfolio-meta">Value ' + formatMoney(company.valuation) + " • " + company.status + "</div>" : '<div class="portfolio-meta">' + item.tagline + "</div>",
        "</article>"
      ].join("");
    }).join("");
  }

  function updateStats() {
    ui.cashStat.textContent = formatMoney(state.cash);
    ui.reputationStat.textContent = String(state.reputation);
    ui.portfolioStat.textContent = formatMoney(getPortfolioValue());
    ui.roundStat.textContent = state.analyzedCount + " / 5";
  }

  function getPortfolioValue() {
    return roundToOneDecimal(state.portfolioCompanies.reduce(function (total, company) {
      return total + company.valuation;
    }, 0));
  }

  function finishSprint() {
    openWindow("endScreen");
    ui.endHeadline.textContent = getPortfolioValue() + state.cash >= 900 ?
      "You closed the sprint with real signal." :
      "You made it through the sprint.";
    ui.endSummary.textContent = "Five companies came through the inbox. Some earned conviction, some only earned curiosity, and your portfolio shows the consequences.";
    ui.endCash.textContent = formatMoney(state.cash);
    ui.endPortfolio.textContent = formatMoney(getPortfolioValue());
    ui.endReputation.textContent = String(state.reputation);
    announce("Sprint complete. Review the results.");
  }

  function afterDecisionModalClose() {
    ui.decisionModal.classList.add("hidden");
    hideWindow("boardMemoWindow");
    state.current = null;
    renderMessages();
    if (state.analyzedCount >= 5 || !state.inbox.length) {
      finishSprint();
      return;
    }
    openWindow("messagesWindow");
  }

  function formatMoney(value) {
    return "$" + Number(value).toFixed(1).replace(".0", "") + "M";
  }

  function updateMenuClock() {
    var now = new Date();
    ui.menuDate.textContent = now.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
    ui.menuTime.textContent = now.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function roundToOneDecimal(value) {
    return Math.round(value * 10) / 10;
  }

  function bindEvents() {
    function beginResearch() {
      if (!state.current || state.current.researchStarted || state.current.resolved) {
        return;
      }
      state.current.researchStarted = true;
      renderBoardMemo();
    }

    ui.powerButton.addEventListener("click", function () {
      ui.powerButton.disabled = true;
      window.setTimeout(function () {
        bootGame();
        ui.powerButton.disabled = false;
      }, BOOT_DELAY_MS);
    });
    if (ui.closeWelcomeBtn) {
      ui.closeWelcomeBtn.addEventListener("click", function () {
        ui.welcomeModal.classList.add("hidden");
      });
    }
    if (ui.closeDecisionModalBtn) {
      ui.closeDecisionModalBtn.addEventListener("click", afterDecisionModalClose);
    }
    if (ui.beginResearchBtn) {
      ui.beginResearchBtn.addEventListener("click", beginResearch);
    }
    if (ui.boardCoverBeginBtn) {
      ui.boardCoverBeginBtn.addEventListener("click", beginResearch);
    }
    if (ui.investBtn) {
      ui.investBtn.addEventListener("click", function () {
        handleDecision("invested");
      });
    }
    if (ui.stayBtn) {
      ui.stayBtn.addEventListener("click", function () {
        handleDecision("stay");
      });
    }
    if (ui.passBtn) {
      ui.passBtn.addEventListener("click", function () {
        handleDecision("passed");
      });
    }
    ui.portfolioTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        windowState.portfolioTab = tab.getAttribute("data-portfolio-tab");
        renderPortfolio();
      });
    });
    if (ui.restartBtn) {
      ui.restartBtn.addEventListener("click", function () {
        hideWindow("endScreen");
        bootGame();
      });
    }
  }

  cacheDom();
  initDesktopWindows();
  bindEvents();
  updateMenuClock();
  window.setInterval(updateMenuClock, 30000);
}());

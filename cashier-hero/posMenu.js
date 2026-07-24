var POS_STATE = {
  activeCategoryId: null,
  activeItemId: null,
  builderSelections: {},
  builderQuantity: 1,
  selectedPaymentMethod: null,
  paymentSession: null,
  cardDrag: {
    active: false,
    startX: 0,
    startPosition: 0
  },
  cardSwipeTimer: null,
  cardSignatureTimer: null,
  npcSpeechTimer: null,
  heartbeatTimer: null,
  clock: {
    startedAtRealMs: 0,
    pausedAtRealMs: 0,
    pausedDurationMs: 0,
    frozenGameMs: 0,
    modeFrozenAtRealMs: 0,
    modeFrozenDurationMs: 0,
    modeFrozenGameMs: 0
  },
  game: {
    paused: false,
    currentDay: 1,
    totalDays: 7,
    ordersPerDay: 5,
    ordersCompletedToday: 0,
    carsSpawnedToday: 0,
    totalScore: 0,
    totalTipsCents: 0,
    totalOrdersCompleted: 0,
    perfectOrders: 0,
    uiMode: "between_orders",
    queue: [],
    activeCar: null,
    nextCarId: 1,
    nextArrivalAtMs: 0,
    recap: null,
    dayStats: null,
    dayHistory: []
  },
  npcChat: {
    messages: [],
    isCustomerSpeaking: false,
    flowStage: "confirm_all"
  },
  orderNameModal: {
    open: false,
    value: ""
  }
};

var POS_DOM = {};
var CHANGE_DENOMINATIONS = [2000, 1000, 500, 100, 25, 10, 5, 1];
var CUSTOMER_NAMES = ["Taylor", "Jordan", "Sam", "Avery", "Riley", "Morgan", "Casey"];
var PICKUP_NAMES = ["Alex", "Jamie", "Jess", "Chris", "Mia", "Noah", "Luna", "Eli", "Sage", "Zoe", "Max", "Nina"];
var CUSTOMER_ARCHETYPES = [
  {
    id: "regular",
    label: "Regular",
    intros: ["Hey, can I get ", "Hi there, can I do "],
    joiners: {
      two: [" and "],
      middle: [", and "],
      last: [", and "]
    },
    outros: ["?", " please?", " thanks!"]
  },
  {
    id: "rushed",
    label: "Rushed",
    intros: ["Can I get ", "Yeah, can I do "],
    joiners: {
      two: [" and ", " plus "],
      middle: [", "],
      last: [", and "]
    },
    outros: ["?", "."]
  },
  {
    id: "indecisive",
    label: "Indecisive",
    intros: ["Um, could I get ", "Hi, let me do "],
    joiners: {
      two: ["... and also ", ", and maybe "],
      middle: [", ", "... and "],
      last: [", and maybe ", ", and also "]
    },
    outros: ["?", " please?"]
  },
  {
    id: "grumpy",
    label: "Grumpy",
    intros: ["I need ", "Give me "],
    joiners: {
      two: [" and "],
      middle: [", "],
      last: [", and "]
    },
    outros: [".", "."]
  },
  {
    id: "chatty",
    label: "Chatty",
    intros: ["Hi! Could I please get ", "Hey there, can I get "],
    joiners: {
      two: [", and could I also get ", ", and then add "],
      middle: [", then "],
      last: [", and could I also get "]
    },
    outros: ["? Thanks!", "? Thank you!"]
  }
];

function initPOS() {
  POS_DOM.app = document.getElementById("app");
  POS_DOM.headerStatus = document.getElementById("headerStatus");
  POS_DOM.categoryChips = document.getElementById("categoryChips");
  POS_DOM.menuHint = document.getElementById("menuHint");
  POS_DOM.itemsPanel = document.getElementById("itemsPanel");
  POS_DOM.builderPanel = document.getElementById("builderPanel");
  POS_DOM.cartPanel = document.getElementById("cartPanel");
  POS_DOM.npcPanel = document.getElementById("npcPanel");
  POS_DOM.paymentModal = document.getElementById("paymentModal");
  POS_DOM.gameOverlay = document.getElementById("gameOverlay");

  POS_DOM.headerStatus.addEventListener("click", onHeaderClick);
  POS_DOM.categoryChips.addEventListener("click", onCategoryClick);
  POS_DOM.itemsPanel.addEventListener("click", onItemClick);
  POS_DOM.builderPanel.addEventListener("click", onBuilderClick);
  POS_DOM.builderPanel.addEventListener("change", onBuilderChange);
  POS_DOM.cartPanel.addEventListener("click", onCartClick);
  POS_DOM.npcPanel.addEventListener("click", onNpcPanelClick);
  POS_DOM.paymentModal.addEventListener("click", onPaymentModalClick);
  POS_DOM.paymentModal.addEventListener("input", onPaymentModalInput);
  POS_DOM.paymentModal.addEventListener("mousedown", onPaymentModalMouseDown);
  POS_DOM.gameOverlay.addEventListener("click", onGameOverlayClick);
  POS_DOM.gameOverlay.addEventListener("input", onGameOverlayInput);
  document.addEventListener("mousemove", onGlobalMouseMove);
  document.addEventListener("mouseup", onGlobalMouseUp);

  initClock();
  startNewWeek();
  startHeartbeat();
}

function initClock() {
  POS_STATE.clock.startedAtRealMs = Date.now();
  POS_STATE.clock.pausedAtRealMs = 0;
  POS_STATE.clock.pausedDurationMs = 0;
  POS_STATE.clock.frozenGameMs = 0;
  POS_STATE.clock.modeFrozenAtRealMs = 0;
  POS_STATE.clock.modeFrozenDurationMs = 0;
  POS_STATE.clock.modeFrozenGameMs = 0;
}

function getGameNowMs() {
  if (POS_STATE.game.paused) {
    return POS_STATE.clock.frozenGameMs;
  }

  if (isUiModeTimeFrozen()) {
    return POS_STATE.clock.modeFrozenGameMs;
  }

  return Date.now() - POS_STATE.clock.startedAtRealMs - POS_STATE.clock.pausedDurationMs - POS_STATE.clock.modeFrozenDurationMs;
}

function isUiModeTimeFrozen() {
  return POS_STATE.game.uiMode === "order_recap" ||
    POS_STATE.game.uiMode === "day_summary" ||
    POS_STATE.game.uiMode === "week_summary";
}

function setUiMode(nextMode) {
  var wasFrozen = isUiModeTimeFrozen();

  if (POS_STATE.game.uiMode === nextMode) {
    return;
  }

  if (wasFrozen) {
    releaseUiModeTimeFreeze();
  }

  POS_STATE.game.uiMode = nextMode;

  if (isUiModeTimeFrozen()) {
    beginUiModeTimeFreeze();
  }
}

function beginUiModeTimeFreeze() {
  if (POS_STATE.clock.modeFrozenAtRealMs) {
    return;
  }

  POS_STATE.clock.modeFrozenGameMs = Date.now() - POS_STATE.clock.startedAtRealMs - POS_STATE.clock.pausedDurationMs - POS_STATE.clock.modeFrozenDurationMs;
  POS_STATE.clock.modeFrozenAtRealMs = Date.now();
}

function releaseUiModeTimeFreeze() {
  if (!POS_STATE.clock.modeFrozenAtRealMs) {
    return;
  }

  POS_STATE.clock.modeFrozenDurationMs += Date.now() - POS_STATE.clock.modeFrozenAtRealMs;
  POS_STATE.clock.modeFrozenAtRealMs = 0;
}

function startHeartbeat() {
  stopHeartbeat();
  POS_STATE.heartbeatTimer = setInterval(onGameTick, 250);
}

function stopHeartbeat() {
  if (!POS_STATE.heartbeatTimer) {
    return;
  }

  clearInterval(POS_STATE.heartbeatTimer);
  POS_STATE.heartbeatTimer = null;
}

function onGameTick() {
  if (POS_STATE.game.paused) {
    return;
  }

  if (POS_STATE.game.uiMode === "intro") {
    renderHeader();
    renderNPC();
    return;
  }

  processCarArrivals();
  renderHeader();
  renderNPC();
  updateLiveOverlayValues();
}

function startNewWeek() {
  POS_STATE.game.currentDay = 1;
  POS_STATE.game.totalScore = 0;
  POS_STATE.game.totalTipsCents = 0;
  POS_STATE.game.totalOrdersCompleted = 0;
  POS_STATE.game.perfectOrders = 0;
  POS_STATE.game.dayHistory = [];
  POS_STATE.game.nextCarId = 1;
  POS_STATE.game.ordersCompletedToday = 0;
  POS_STATE.game.carsSpawnedToday = 0;
  POS_STATE.game.queue = [];
  POS_STATE.game.activeCar = null;
  POS_STATE.game.recap = null;
  POS_STATE.game.dayStats = null;
  POS_STATE.game.nextArrivalAtMs = 0;
  clearOrder();
  clearNpcSpeechTimer();
  closePaymentModal();
  resetMenuSelection();
  POS_STATE.selectedPaymentMethod = null;
  POS_STATE.npcChat.messages = [];
  POS_STATE.npcChat.isCustomerSpeaking = false;
  POS_STATE.npcChat.flowStage = "confirm_all";
  POS_STATE.orderNameModal.open = false;
  POS_STATE.orderNameModal.value = "";
  setUiMode("intro");
  renderPOS();
}

function startDay(dayNumber) {
  POS_STATE.game.currentDay = dayNumber;
  POS_STATE.game.ordersCompletedToday = 0;
  POS_STATE.game.carsSpawnedToday = 0;
  POS_STATE.game.queue = [];
  POS_STATE.game.activeCar = null;
  POS_STATE.game.recap = null;
  POS_STATE.game.nextArrivalAtMs = 0;
  POS_STATE.game.dayStats = {
    dayNumber: dayNumber,
    score: 0,
    tipsCents: 0,
    totalAccuracy: 0,
    totalWaitMs: 0,
    perfectOrders: 0,
    completedOrders: 0
  };

  clearOrder();
  clearNpcSpeechTimer();
  closePaymentModal();
  POS_STATE.orderNameModal.open = false;
  POS_STATE.orderNameModal.value = "";
  resetMenuSelection();
  POS_STATE.selectedPaymentMethod = null;
  setUiMode("between_orders");

  seedDriveThruQueue();
  moveNextCarToSpeaker();
  renderPOS();
}

function processCarArrivals() {
  var now = getGameNowMs();
  var maxQueue = getMaxQueueDepthForDay(POS_STATE.game.currentDay);
  var totalInSystem = getCarsInSystemCount();

  if (POS_STATE.game.carsSpawnedToday >= POS_STATE.game.ordersPerDay) {
    return;
  }

  if (POS_STATE.game.nextArrivalAtMs === 0) {
    POS_STATE.game.nextArrivalAtMs = now + getNextArrivalDelayMs();
  }

  while (POS_STATE.game.carsSpawnedToday < POS_STATE.game.ordersPerDay &&
    totalInSystem < maxQueue &&
    now >= POS_STATE.game.nextArrivalAtMs) {
    enqueueNewCar(now);
    totalInSystem = getCarsInSystemCount();
    POS_STATE.game.nextArrivalAtMs = now + getNextArrivalDelayMs();
  }
}

function seedDriveThruQueue() {
  var now = getGameNowMs();
  var desired = Math.min(2, POS_STATE.game.ordersPerDay);

  while (getCarsInSystemCount() < desired && POS_STATE.game.carsSpawnedToday < POS_STATE.game.ordersPerDay) {
    enqueueNewCar(now - Math.max(0, (desired - getCarsInSystemCount()) * 3000));
  }

  POS_STATE.game.nextArrivalAtMs = now + getNextArrivalDelayMs();
}

function enqueueNewCar(arrivedAtMs) {
  var carId = POS_STATE.game.nextCarId;
  var sequenceNumber = POS_STATE.game.carsSpawnedToday + 1;
  var customerProfile = pickCustomerArchetype();

  POS_STATE.game.queue.push({
    id: carId,
    label: "Person " + padNumber(carId),
    customerName: CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)],
    customerProfile: customerProfile,
    arrivedAtMs: arrivedAtMs,
    orderStartedAtMs: 0,
    speakerReadyAtMs: 0,
    completedAtMs: 0,
    order: generateCustomerOrder(POS_STATE.game.currentDay, sequenceNumber, customerProfile)
  });

  POS_STATE.game.nextCarId += 1;
  POS_STATE.game.carsSpawnedToday += 1;
}

function moveNextCarToSpeaker() {
  var now = getGameNowMs();

  if (POS_STATE.game.activeCar || POS_STATE.game.queue.length === 0) {
    return;
  }

  POS_STATE.game.activeCar = POS_STATE.game.queue.shift();
  POS_STATE.game.activeCar.speakerReadyAtMs = now;
  setUiMode("between_orders");
  clearOrder();
  POS_STATE.orderNameModal.open = false;
  POS_STATE.orderNameModal.value = "";
  POS_STATE.selectedPaymentMethod = null;
  resetMenuSelection();
  initNpcChatForCar(POS_STATE.game.activeCar);
}

function initNpcChatForCar(car) {
  clearNpcSpeechTimer();
  POS_STATE.npcChat.messages = [
    {
      speaker: "system",
      text: car.label + " stepped up to the register."
    }
  ];
  POS_STATE.npcChat.isCustomerSpeaking = false;
  POS_STATE.npcChat.flowStage = "confirm_all";
}

function beginOrderForActiveCar() {
  var activeCar = POS_STATE.game.activeCar;

  if (!activeCar || POS_STATE.game.paused || !isSpeakerReady(activeCar)) {
    return;
  }

  setUiMode("taking_order");
  activeCar.orderStartedAtMs = getGameNowMs();
  POS_STATE.npcChat.flowStage = "confirm_all";
  queueCustomerSpeech(activeCar.order.spokenText, 0);
  renderPOS();
}

function renderPOS() {
  renderShellState();
  renderHeader();
  renderNPC();
  renderCategories();
  renderItems();
  renderBuilder();
  renderCart();
  renderGameOverlay();
  renderPaymentModal();
}

function renderShellState() {
  var classes = [];

  if (shouldDimPos()) {
    classes.push("is-pos-dimmed");
  }

  if (POS_STATE.game.paused) {
    classes.push("is-game-paused");
  }

  POS_DOM.app.className = classes.join(" ");
}

function renderHeader() {
  var dayStats = POS_STATE.game.dayStats;
  var averageWaitMs = dayStats && dayStats.completedOrders > 0
    ? dayStats.totalWaitMs / dayStats.completedOrders
    : 0;
  var queueCount = getCarsInSystemCount();
  var isPaused = POS_STATE.game.paused;
  var html = "";

  html += "<div class='status-bar'>";
  html += "<div class='status-pill'><span>Day</span><strong>" + POS_STATE.game.currentDay + " / " + POS_STATE.game.totalDays + "</strong></div>";
  html += "<div class='status-pill'><span>Orders</span><strong>" + POS_STATE.game.ordersCompletedToday + " / " + POS_STATE.game.ordersPerDay + "</strong></div>";
  html += "<div class='status-pill'><span>Line</span><strong>" + queueCount + " person" + (queueCount === 1 ? "" : "s") + "</strong></div>";
  html += "<div class='status-pill'><span>Score</span><strong>" + POS_STATE.game.totalScore + "</strong></div>";
  html += "<div class='status-pill'><span>Tips</span><strong>" + moneyFromCents(POS_STATE.game.totalTipsCents) + "</strong></div>";
  html += "<div class='status-pill'><span>Avg Wait</span><strong>" + formatDuration(averageWaitMs) + "</strong></div>";
  html += "<button class='header-btn' data-action='toggle-pause'>" + (isPaused ? "Resume" : "Pause") + "</button>";
  html += "</div>";

  POS_DOM.headerStatus.innerHTML = html;
}

function renderNPC() {
  var html = "";
  var activeCar = POS_STATE.game.activeCar;
  var queue = POS_STATE.game.queue;
  var options = buildNpcOptions();
  var showOptions = options.length > 0 && POS_STATE.game.uiMode === "taking_order";
  var i = 0;
  var message = null;
  var option = null;

  html += "<div class='drive-thru-line-shell'>";
  html += "<div class='drive-thru-line-label'>Customer Line</div>";
  html += "<div class='queue-strip outside-headset vertical-line'>";
  for (i = queue.length - 1; i >= 0; i -= 1) {
    html += buildQueueCarChip(queue[i], "");
  }
  if (activeCar) {
    html += buildQueueCarChip(activeCar, "at-speaker");
  }
  html += "</div>";
  html += "</div>";

  html += "<div class='drive-thru-shell'>";
  html += "<div class='drive-thru-banner'>";
  html += "<div>";
  html += "<div class='drive-thru-eyebrow'>Front Counter</div>";
  if (activeCar) {
    html += "<div class='drive-thru-title'>" + esc(activeCar.label) + " at register</div>";
  } else {
    html += "<div class='drive-thru-title'>Waiting for next customer</div>";
  }
  html += "</div>";
  html += "<div class='drive-thru-queue-count'>" + (queue.length + (activeCar ? 1 : 0)) + " in line</div>";
  html += "</div>";

  html += "<div class='npc-chat-shell drive-thru-chat'>";
  html += "<div class='npc-chat-window'>";
  html += "<div class='npc-chat-list'>";
  for (i = 0; i < POS_STATE.npcChat.messages.length; i += 1) {
    message = POS_STATE.npcChat.messages[i];
    html += "<div class='npc-message-row " + getMessageSpeakerClass(message.speaker) + "'>";
    html += "<div class='npc-bubble'>" + esc(message.text) + "</div>";
    html += "</div>";
  }
  html += "</div></div>";

  html += "<div class='npc-chat-footer'>";
  html += "<div class='npc-mic " + (POS_STATE.npcChat.isCustomerSpeaking ? "is-speaking" : "") + "' aria-hidden='true'>";
  html += "<span class='npc-mic-head'></span>";
  html += "<span class='npc-mic-stem'></span>";
  html += "<span class='npc-mic-base'></span>";
  html += "</div>";

  if (showOptions) {
    html += "<div class='npc-options'>";
    for (i = 0; i < options.length; i += 1) {
      option = options[i];
      html += "<button class='btn npc-option-btn " + (POS_STATE.npcChat.isCustomerSpeaking ? "is-disabled" : "") + "' data-action='npc-ask' data-option-id='" + esc(option.id) + "' " + (POS_STATE.npcChat.isCustomerSpeaking ? "disabled" : "") + ">";
      html += esc(option.text);
      html += "</button>";
    }
    html += "</div>";
  } else if (activeCar) {
    html += "<p class='muted npc-listening'>" + getNpcStatusCopy(activeCar) + "</p>";
  } else {
    html += "<p class='muted npc-listening'>No customer at the register.</p>";
  }

  html += "</div></div>";
  html += "</div>";

  POS_DOM.npcPanel.innerHTML = html;
  scrollNpcChatToBottom();
}

function getNpcStatusCopy(activeCar) {
  if (POS_STATE.game.uiMode === "between_orders") {
    return "Press Start Order when you're ready to take the order.";
  }

  if (POS_STATE.npcChat.isCustomerSpeaking) {
    return "Listening...";
  }

  return "Customer is waiting for you to finish the ticket.";
}

function buildNpcOptions() {
  var options = [];
  var totalText = "";

  if (POS_STATE.game.uiMode !== "taking_order" || !hasCustomerOrderMessage()) {
    return options;
  }

  if (POS_STATE.npcChat.flowStage === "confirm_all") {
    options.push({
      id: "npc-opt-all",
      text: "Will that be all today?"
    });
    return options;
  }

  if (POS_STATE.npcChat.flowStage === "ask_name" && ORDER_STATE.lines.length > 0) {
    options.push({
      id: "npc-opt-name",
      text: "Can I get a name for the order?"
    });
    return options;
  }

  if (POS_STATE.npcChat.flowStage === "quote_total" && ORDER_STATE.lines.length > 0) {
    totalText = money(getOrderTotal());
    options.push({
      id: "npc-opt-total",
      text: "OK, that will be " + totalText
    });
    return options;
  }

  if (POS_STATE.npcChat.flowStage === "ask_payment") {
    options.push({
      id: "npc-opt-payment",
      text: "Are you paying with cash or card?"
    });
  }

  return options;
}

function buildQueueCarChip(car, extraClass) {
  var waitSeconds = Math.floor((getGameNowMs() - car.arrivedAtMs) / 1000);

  return "<div class='queue-car " + extraClass + "'><span>" + esc(car.label) + "</span><strong>" + waitSeconds + "s</strong></div>";
}

function getMessageSpeakerClass(speaker) {
  if (speaker === "player") {
    return "player";
  }

  if (speaker === "system") {
    return "system";
  }

  return "customer";
}

function onNpcPanelClick(event) {
  var actionTarget = event.target.closest("[data-action]");
  var action = actionTarget ? actionTarget.getAttribute("data-action") : "";
  var optionId = actionTarget ? actionTarget.getAttribute("data-option-id") : "";
  var reply = "";

  if (action !== "npc-ask" || !optionId || POS_STATE.game.paused || POS_STATE.game.uiMode !== "taking_order") {
    return;
  }

  if (POS_STATE.npcChat.isCustomerSpeaking) {
    return;
  }

  if (!POS_STATE.game.activeCar) {
    return;
  }

  POS_STATE.npcChat.messages.push({
    speaker: "player",
    text: getNpcOptionLabel(optionId)
  });

  if (optionId === "npc-opt-all") {
    reply = "Yep, that's everything.";
    POS_STATE.npcChat.flowStage = "ask_name";
  } else if (optionId === "npc-opt-name") {
    POS_STATE.game.activeCar.order.pickupNameKnown = true;
    POS_STATE.orderNameModal.open = true;
    POS_STATE.orderNameModal.value = POS_STATE.game.activeCar.order.enteredPickupName || "";
    reply = buildOrderNameReply(POS_STATE.game.activeCar.order.pickupName);
    POS_STATE.npcChat.flowStage = "quote_total";
  } else if (optionId === "npc-opt-total") {
    POS_STATE.npcChat.flowStage = "ask_payment";
  } else if (optionId === "npc-opt-payment") {
    reply = "I'll be paying with " + getPaymentMethodLabel(POS_STATE.game.activeCar.order.paymentMethod).toLowerCase() + ".";
    POS_STATE.npcChat.flowStage = "done";
  }

  if (reply) {
    pushCustomerReply(reply);
    return;
  }

  renderNPC();
}

function pushCustomerReply(text) {
  clearNpcSpeechTimer();
  POS_STATE.npcChat.isCustomerSpeaking = false;
  POS_STATE.npcChat.messages.push({
    speaker: "customer",
    text: text
  });
  renderNPC();
  renderCart();
}

function getNpcOptionLabel(optionId) {
  if (optionId === "npc-opt-all") {
    return "Will that be all today?";
  }
  if (optionId === "npc-opt-name") {
    return "Can I get a name for the order?";
  }
  if (optionId === "npc-opt-total") {
    return "OK, that will be " + money(getOrderTotal());
  }
  if (optionId === "npc-opt-payment") {
    return "Are you paying with cash or card?";
  }
  return "";
}

function buildOrderNameReply(name) {
  if (Math.random() < 0.5) {
    return "It's " + name + ".";
  }

  return name + ".";
}

function queueCustomerSpeech(text, delayMs) {
  clearNpcSpeechTimer();
  POS_STATE.npcChat.isCustomerSpeaking = true;
  renderNPC();

  if (!delayMs || delayMs <= 0) {
    POS_STATE.npcChat.messages.push({
      speaker: "customer",
      text: text
    });
    POS_STATE.npcChat.isCustomerSpeaking = false;
    renderNPC();
    return;
  }

  POS_STATE.npcSpeechTimer = setTimeout(function () {
    POS_STATE.npcSpeechTimer = null;
    POS_STATE.npcChat.messages.push({
      speaker: "customer",
      text: text
    });
    POS_STATE.npcChat.isCustomerSpeaking = false;
    renderNPC();
  }, delayMs);
}

function clearNpcSpeechTimer() {
  if (!POS_STATE.npcSpeechTimer) {
    return;
  }

  clearTimeout(POS_STATE.npcSpeechTimer);
  POS_STATE.npcSpeechTimer = null;
}

function hasCustomerOrderMessage() {
  var i = 0;

  for (i = 0; i < POS_STATE.npcChat.messages.length; i += 1) {
    if (POS_STATE.npcChat.messages[i].speaker === "customer") {
      return true;
    }
  }

  return false;
}

function scrollNpcChatToBottom() {
  var windowEl = POS_DOM.npcPanel.querySelector(".npc-chat-window");

  if (!windowEl) {
    return;
  }

  windowEl.scrollTop = windowEl.scrollHeight;
}

function renderCategories() {
  var html = "";
  var i = 0;
  var category = null;
  var isActive = false;
  var imageHtml = "";

  for (i = 0; i < MENU.categories.length; i += 1) {
    category = MENU.categories[i];
    isActive = POS_STATE.activeCategoryId === category.id;
    imageHtml = "";
    if (category.image) {
      imageHtml = "<img class='chip-image' src='" + esc(category.image) + "' alt='' aria-hidden='true'>";
    }
    html += "<div class='chip " + (isActive ? "active" : "") + "' data-category-id='" + esc(category.id) + "'>" + imageHtml + "<span class='chip-label'>" + esc(category.label) + "</span></div>";
  }

  POS_DOM.categoryChips.innerHTML = html;

  if (POS_STATE.game.uiMode === "between_orders") {
    POS_DOM.menuHint.textContent = "Wait for the next customer, then click Start Order to open the register.";
    return;
  }

  if (POS_STATE.game.uiMode === "order_recap") {
    POS_DOM.menuHint.textContent = "Order complete. Review the recap before taking the next customer.";
    return;
  }

  if (POS_STATE.game.paused) {
    POS_DOM.menuHint.textContent = "Shift paused. Timers and arrivals are frozen.";
    return;
  }

  POS_DOM.menuHint.textContent = "Select a category, then an item.";
}

function renderItems() {
  var category = getActiveCategory();
  var html = "";
  var i = 0;
  var isActive = false;

  if (!category) {
    POS_DOM.itemsPanel.innerHTML = "<p class='muted'>No category selected.</p>";
    return;
  }

  html += "<div class='item-masonry'>";
  for (i = 0; i < category.items.length; i += 1) {
    isActive = POS_STATE.activeItemId === category.items[i].id;
    html += "<button class='btn item-chip " + (isActive ? "active" : "") + "' data-action='select-item' data-item-id='" + esc(category.items[i].id) + "'>";
    html += esc(category.items[i].label) + " <span class='muted'>" + money(category.items[i].basePrice) + "</span>";
    html += "</button>";
  }
  html += "</div>";

  POS_DOM.itemsPanel.innerHTML = html;
}

function renderBuilder() {
  var item = getActiveItem();
  var html = "";
  var g = 0;

  if (!item) {
    POS_DOM.builderPanel.innerHTML = "<p class='muted'>Pick an item to customize.</p>";
    return;
  }

  if (!item.modifiers || item.modifiers.length === 0) {
    html += "<div class='builder'>";
    html += "<p class='muted'>No modifiers for this item.</p>";
    html += renderBuilderQuantityControls();
    html += "<div class='builder-footer'>";
    html += "<button class='btn' data-action='add-to-ticket'>Add " + POS_STATE.builderQuantity + " to ticket</button>";
    html += "</div>";
    html += "</div>";
    POS_DOM.builderPanel.innerHTML = html;
    return;
  }

  html += "<div class='builder'>";
  html += "<div class='modifier-grid'>";

  for (g = 0; g < item.modifiers.length; g += 1) {
    html += renderModifierGroup(item.modifiers[g]);
  }

  html += "</div>";
  html += renderBuilderQuantityControls();
  html += "<div class='builder-footer'>";
  html += "<button class='btn add-to-order' data-action='add-to-ticket'>Add " + POS_STATE.builderQuantity + " to Order</button>";
  html += "</div>";
  html += "</div>";

  POS_DOM.builderPanel.innerHTML = html;
}

function renderBuilderQuantityControls() {
  var html = "";

  html += "<div class='builder-quantity-row'>";
  html += "<span class='muted'>Quantity</span>";
  html += "<div class='qty-controls'>";
  html += "<button type='button' class='qty-btn' data-action='item-qty-minus'>-</button>";
  html += "<span class='qty-value'>" + POS_STATE.builderQuantity + "</span>";
  html += "<button type='button' class='qty-btn' data-action='item-qty-plus'>+</button>";
  html += "</div>";
  html += "</div>";

  return html;
}

function renderModifierGroup(group) {
  var html = "";
  var i = 0;
  var option = null;
  var selected = POS_STATE.builderSelections[group.id];
  var checked = false;
  var qty = 0;

  html += "<div class='group'>";
  html += "<h4>" + esc(group.label) + "</h4>";

  for (i = 0; i < group.options.length; i += 1) {
    option = group.options[i];

    if (option.inputType === "plus/minus") {
      qty = getQuantityValue(selected, option.id);
      html += "<div class='qty-row'>";
      html += "<span>" + esc(option.label) + priceDeltaLabel(option.priceDelta) + "</span>";
      html += "<div class='qty-controls'>";
      html += "<button type='button' class='qty-btn' data-action='qty-minus' data-group-id='" + esc(group.id) + "' data-option-id='" + esc(option.id) + "'>-</button>";
      html += "<span class='qty-value'>" + qty + "</span>";
      html += "<button type='button' class='qty-btn' data-action='qty-plus' data-group-id='" + esc(group.id) + "' data-option-id='" + esc(option.id) + "'>+</button>";
      html += "</div></div>";
      continue;
    }

    if (group.selection === "single") {
      checked = selected === option.id;
      html += "<label><input type='radio' name='" + esc(group.id) + "' value='" + esc(option.id) + "' data-group-id='" + esc(group.id) + "' data-action='single-select' " + (checked ? "checked" : "") + "> " + esc(option.label) + priceDeltaLabel(option.priceDelta) + "</label>";
      continue;
    }

    checked = isMultiOptionSelected(selected, option.id);
    html += "<label><input type='checkbox' data-action='multi-select' data-group-id='" + esc(group.id) + "' data-option-id='" + esc(option.id) + "' " + (checked ? "checked" : "") + "> " + esc(option.label) + priceDeltaLabel(option.priceDelta) + "</label>";
  }

  html += "</div>";
  return html;
}

function renderCart() {
  var html = "";
  var i = 0;
  var subtotal = getOrderSubtotal();
  var tax = getOrderTax();
  var total = getOrderTotal();
  var activeCar = POS_STATE.game.activeCar;
  var disabled = isCheckoutDisabled();

  html += "<div class='cart-content'>";
  if (activeCar && activeCar.order && activeCar.order.pickupNameKnown) {
    html += "<div class='order-name-card'>";
    html += "<div class='order-name-label'>Order Name</div>";
    if (activeCar.order.enteredPickupName) {
      html += "<div class='order-name-target'>Saved on ticket: <strong>" + esc(activeCar.order.enteredPickupName) + "</strong></div>";
    } else {
      html += "<div class='order-name-target'>Not entered yet.</div>";
    }
    html += "<button class='btn small' data-action='open-order-name-modal'>Enter Order Name</button>";
    html += "</div>";
  }
  html += "<div class='cart-items'>";

  if (ORDER_STATE.lines.length === 0) {
    if (POS_STATE.game.activeCar && POS_STATE.game.uiMode === "taking_order") {
      html += "<p class='muted'>Ticket is empty. Enter the customer's order here.</p>";
    } else {
      html += "<p class='muted'>No active ticket right now.</p>";
    }
  } else {
    for (i = 0; i < ORDER_STATE.lines.length; i += 1) {
      html += "<div class='cart-line'>";
      html += "<div class='cart-line-main'>";
      html += "<div class='cart-line-title'>" + esc(ORDER_STATE.lines[i].name || ORDER_STATE.lines[i].label) + (ORDER_STATE.lines[i].size ? " <span class='cart-line-size'>" + esc(ORDER_STATE.lines[i].size) + "</span>" : "") + "</div>";
      if (ORDER_STATE.lines[i].details) {
        html += "<div class='cart-line-details'>" + esc(ORDER_STATE.lines[i].details) + "</div>";
      }
      html += "</div>";
      html += "<div class='cart-line-side'>";
      html += "<span class='cart-price'>" + money(ORDER_STATE.lines[i].total) + "</span>";
      html += "<button class='line-remove' data-action='remove-line' data-index='" + i + "'>x</button>";
      html += "</div>";
      html += "</div>";
    }
  }

  html += "</div>";
  html += "<div class='cart-footer'>";
  html += "<div class='row'><div>Subtotal</div><div>" + money(subtotal) + "</div></div>";
  html += "<div class='row'><div>Sales tax (5%)</div><div>" + money(tax) + "</div></div>";
  html += "<div class='row'><div class='total'>Total</div><div class='total'>" + money(total) + "</div></div>";
  html += "<div class='payment-row'>";
  html += "<button class='btn payment-btn " + (POS_STATE.selectedPaymentMethod === "cash" ? "active" : "") + "' data-action='set-payment' data-payment-method='cash'>Cash</button>";
  html += "<button class='btn payment-btn " + (POS_STATE.selectedPaymentMethod === "card" ? "active" : "") + "' data-action='set-payment' data-payment-method='card'>Card</button>";
  html += "</div>";
  html += "<button class='btn checkout-btn " + (disabled ? "is-disabled" : "") + "' data-action='checkout' " + (disabled ? "disabled" : "") + ">Check out</button>";
  html += "</div></div>";

  POS_DOM.cartPanel.innerHTML = html;
}

function onHeaderClick(event) {
  var actionTarget = event.target.closest("[data-action]");
  var action = actionTarget ? actionTarget.getAttribute("data-action") : "";

  if (action === "toggle-pause") {
    togglePause();
  }
}

function onGameOverlayClick(event) {
  var actionTarget = event.target.closest("[data-action]");
  var action = actionTarget ? actionTarget.getAttribute("data-action") : "";

  if (!action) {
    return;
  }

  if (action === "start-order") {
    beginOrderForActiveCar();
    return;
  }

  if (action === "save-order-name") {
    saveOrderNameFromModal();
    return;
  }

  if (action === "start-week") {
    startDay(1);
    return;
  }

  if (action === "toggle-pause") {
    togglePause();
    return;
  }

  if (action === "continue-from-recap") {
    continueFromRecap();
    return;
  }

  if (action === "start-next-day") {
    startNextDay();
    return;
  }

  if (action === "restart-week") {
    startNewWeek();
  }
}

function onGameOverlayInput(event) {
  var action = event.target.getAttribute("data-action");

  if (action !== "overlay-order-name-input") {
    return;
  }

  POS_STATE.orderNameModal.value = event.target.value;
}

function togglePause() {
  if (POS_STATE.game.paused) {
    POS_STATE.clock.pausedDurationMs += Date.now() - POS_STATE.clock.pausedAtRealMs;
    POS_STATE.game.paused = false;
    renderPOS();
    return;
  }

  POS_STATE.clock.frozenGameMs = getGameNowMs();
  POS_STATE.clock.pausedAtRealMs = Date.now();
  POS_STATE.game.paused = true;
  renderPOS();
}

function renderGameOverlay() {
  var html = "";
  var activeCar = POS_STATE.game.activeCar;
  var recap = POS_STATE.game.recap;
  var dayStats = POS_STATE.game.dayStats;

  if (POS_STATE.game.paused) {
    html += "<div class='game-overlay is-visible'><div class='game-overlay-card'>";
    html += "<div class='overlay-eyebrow'>Shift Paused</div>";
    html += "<h3>Everything is on hold</h3>";
    html += "<p>Queue timing and arrivals are frozen until you resume.</p>";
    html += "<button class='btn overlay-primary' data-action='toggle-pause'>Resume Shift</button>";
    html += "</div></div>";
    POS_DOM.gameOverlay.className = "game-overlay-root active";
    POS_DOM.gameOverlay.innerHTML = html;
    return;
  }

  if (POS_STATE.game.uiMode === "intro") {
    html += "<div class='game-overlay is-visible'><div class='game-overlay-card intro-card'>";
    html += "<div class='overlay-eyebrow'>Welcome to Java the Hut</div>";
    html += "<h2>You're hired, new cashier!</h2>";
    html += "<p>You run the front counter at our coffee shop. Ring up each order, get the pickup name, take payment, and keep the line moving.</p>";
    html += "<div class='intro-stats'>";
    html += "<div class='intro-stat-pill'><span>Shift Length</span><strong>7 days</strong></div>";
    html += "<div class='intro-stat-pill'><span>Orders Per Day</span><strong>" + POS_STATE.game.ordersPerDay + " guests</strong></div>";
    html += "<div class='intro-stat-pill'><span>Earn Rewards</span><strong>Points + tips</strong></div>";
    html += "</div>";
    html += "<p>Ready? Let's begin!</p>";
    html += "<button class='btn overlay-primary' data-action='start-week'>Start Day 1</button>";
    html += "</div></div>";
    POS_DOM.gameOverlay.className = "game-overlay-root active";
    POS_DOM.gameOverlay.innerHTML = html;
    return;
  }

  if (POS_STATE.game.uiMode === "taking_order" && POS_STATE.orderNameModal.open) {
    html += "<div class='game-overlay is-visible'><div class='game-overlay-card compact order-name-modal-card'>";
    html += "<div class='overlay-eyebrow'>Order Name</div>";
    html += "<h3>Type the name for the ticket</h3>";
    html += "<p>Enter the name the customer just gave you.</p>";
    html += "<input id='overlayOrderNameInput' class='order-name-input modal-order-name-input' data-action='overlay-order-name-input' type='text' autocomplete='off' spellcheck='false' value='" + esc(POS_STATE.orderNameModal.value) + "' placeholder='Type order name'>";
    html += "<button class='btn overlay-primary' data-action='save-order-name'>Save Order Name</button>";
    html += "</div></div>";
    POS_DOM.gameOverlay.className = "game-overlay-root active";
    POS_DOM.gameOverlay.innerHTML = html;
    return;
  }

  if (POS_STATE.game.uiMode === "between_orders" && activeCar) {
    html += "<div class='game-overlay is-visible subtle'><div class='game-overlay-card compact'>";
    html += "<div class='overlay-eyebrow'>Next Customer</div>";
    html += "<h3>" + esc(activeCar.label) + " is at the register</h3>";
    html += "<p>Wait time already running: <strong id='betweenOrderWait'>" + formatDuration(getGameNowMs() - activeCar.arrivedAtMs) + "</strong></p>";
    html += "<button id='betweenOrderStartBtn' class='btn overlay-primary' data-action='start-order'>Start Order</button>";
    html += "</div></div>";
    POS_DOM.gameOverlay.className = "game-overlay-root active";
    POS_DOM.gameOverlay.innerHTML = html;
    return;
  }

  if (POS_STATE.game.uiMode === "order_recap" && recap) {
    html += "<div class='game-overlay is-visible'><div class='game-overlay-card'>";
    html += "<div class='overlay-eyebrow'>Order Recap</div>";
    html += "<h3>" + esc(recap.customerLabel) + " complete</h3>";
    html += "<div class='recap-hero-grid'>";
    html += "<div class='recap-points-card'><span>Points</span><strong>" + recap.points + "</strong></div>";
    html += "<div class='recap-grid recap-grid-secondary'>";
    html += "<div class='recap-stat'><span>Accuracy</span><strong>" + recap.accuracyPct + "%</strong></div>";
    html += "<div class='recap-stat'><span>Wait</span><strong>" + formatDuration(recap.totalWaitMs) + "</strong></div>";
    html += "<div class='recap-stat'><span>Register Time</span><strong>" + formatDuration(recap.speakerToChargeMs) + "</strong></div>";
    html += "<div class='recap-stat'><span>Order Name</span><strong>" + esc(recap.pickupName || "-") + "</strong></div>";
    html += "<div class='recap-stat'><span>Tip</span><strong>" + moneyFromCents(recap.tipCents || 0) + "</strong></div>";
    html += "</div>";
    html += "</div>";
    html += "<p>" + esc(recap.summaryText) + "</p>";
    html += "<div class='recap-order-compare'>";
    html += "<div class='score-breakdown-title'>Order Check</div>";
    html += buildRecapComparisonHtml(recap.comparisonLines);
    html += "</div>";
    html += "<div class='score-breakdown'>";
    html += "<div class='score-breakdown-title'>Points Calculation</div>";
    html += buildScoreBreakdownHtml(recap.scoreBreakdown);
    html += "</div>";
    html += "<button class='btn overlay-primary' data-action='continue-from-recap'>Continue</button>";
    html += "</div></div>";
    POS_DOM.gameOverlay.className = "game-overlay-root active";
    POS_DOM.gameOverlay.innerHTML = html;
    return;
  }

  if (POS_STATE.game.uiMode === "day_summary" && dayStats) {
    html += "<div class='game-overlay is-visible'><div class='game-overlay-card day-summary-card'>";
    html += "<div class='overlay-eyebrow'>End of Day</div>";
    html += "<h3>Congrats! You made it through the day.</h3>";
    html += "<div class='day-summary-hero'>";
    html += "<div class='day-summary-score'><span>Day Score</span><strong>" + dayStats.score + "</strong></div>";
    html += "<p>Day " + dayStats.dayNumber + " summary. You cleared all " + POS_STATE.game.ordersPerDay + " counter orders for the day. Tomorrow can get busier and more complex.</p>";
    html += "</div>";
    html += "<div class='day-summary-grid'>";
    html += "<div class='day-summary-stat'><span>Orders</span><strong>" + dayStats.completedOrders + "</strong></div>";
    html += "<div class='day-summary-stat'><span>Avg Accuracy</span><strong>" + getAverageAccuracy(dayStats) + "%</strong></div>";
    html += "<div class='day-summary-stat'><span>Avg Wait</span><strong>" + getAverageWait(dayStats) + "</strong></div>";
    html += "<div class='day-summary-stat'><span>Perfect Orders</span><strong>" + dayStats.perfectOrders + "</strong></div>";
    html += "<div class='day-summary-stat'><span>Tips</span><strong>" + moneyFromCents(dayStats.tipsCents || 0) + "</strong></div>";
    html += "</div>";
    html += "<button class='btn overlay-primary' data-action='start-next-day'>" + (POS_STATE.game.currentDay >= POS_STATE.game.totalDays ? "See Week Summary" : "Start Day " + (POS_STATE.game.currentDay + 1)) + "</button>";
    html += "</div></div>";
    POS_DOM.gameOverlay.className = "game-overlay-root active";
    POS_DOM.gameOverlay.innerHTML = html;
    return;
  }

  if (POS_STATE.game.uiMode === "week_summary") {
    html += "<div class='game-overlay is-visible'><div class='game-overlay-card'>";
    html += "<div class='overlay-eyebrow'>Seven-Day Wrap</div>";
    html += "<h3>Shift week complete</h3>";
    html += "<div class='recap-grid'>";
    html += "<div class='recap-stat'><span>Total Score</span><strong>" + POS_STATE.game.totalScore + "</strong></div>";
    html += "<div class='recap-stat'><span>Total Tips</span><strong>" + moneyFromCents(POS_STATE.game.totalTipsCents) + "</strong></div>";
    html += "<div class='recap-stat'><span>Orders Completed</span><strong>" + POS_STATE.game.totalOrdersCompleted + "</strong></div>";
    html += "<div class='recap-stat'><span>Perfect Orders</span><strong>" + POS_STATE.game.perfectOrders + "</strong></div>";
    html += "<div class='recap-stat'><span>Days Cleared</span><strong>" + POS_STATE.game.totalDays + "</strong></div>";
    html += "</div>";
    html += "<p>This is a strong foundation for layering in reputation, promotions, and story beats next.</p>";
    html += "<button class='btn overlay-primary' data-action='restart-week'>Play Another Week</button>";
    html += "</div></div>";
    POS_DOM.gameOverlay.className = "game-overlay-root active";
    POS_DOM.gameOverlay.innerHTML = html;
    return;
  }

  POS_DOM.gameOverlay.className = "game-overlay-root";
  POS_DOM.gameOverlay.innerHTML = "";
}

function updateLiveOverlayValues() {
  var activeCar = POS_STATE.game.activeCar;
  var waitEl = null;
  var startBtn = null;

  if (POS_STATE.game.uiMode !== "between_orders" || !activeCar) {
    return;
  }

  waitEl = POS_DOM.gameOverlay.querySelector("#betweenOrderWait");
  if (waitEl) {
    waitEl.textContent = formatDuration(getGameNowMs() - activeCar.arrivedAtMs);
  }

  startBtn = POS_DOM.gameOverlay.querySelector("#betweenOrderStartBtn");
  if (startBtn) {
    startBtn.disabled = false;
    startBtn.textContent = "Start Order";
  }
}

function continueFromRecap() {
  POS_STATE.game.recap = null;

  if (POS_STATE.game.ordersCompletedToday >= POS_STATE.game.ordersPerDay) {
    playEndOfDayTransition();
    return;
  }

  if (POS_STATE.game.queue.length === 0 && POS_STATE.game.carsSpawnedToday < POS_STATE.game.ordersPerDay) {
    enqueueNewCar(getGameNowMs());
  }

  moveNextCarToSpeaker();
  renderPOS();
}

function playEndOfDayTransition() {
  POS_DOM.gameOverlay.className = "game-overlay-root active closing";

  setTimeout(function () {
    setUiMode("day_summary");
    renderPOS();
  }, 180);
}

function saveOrderNameFromModal() {
  var activeCar = POS_STATE.game.activeCar;
  var enteredName = "";

  if (!activeCar || !activeCar.order) {
    return;
  }

  enteredName = String(POS_STATE.orderNameModal.value || "").trim();
  if (!enteredName) {
    return;
  }

  activeCar.order.enteredPickupName = enteredName;
  POS_STATE.orderNameModal.open = false;
  POS_STATE.orderNameModal.value = enteredName;
  renderCart();
  renderGameOverlay();
}

function startNextDay() {
  if (POS_STATE.game.currentDay >= POS_STATE.game.totalDays) {
    setUiMode("week_summary");
    renderPOS();
    return;
  }

  startDay(POS_STATE.game.currentDay + 1);
}

function onCategoryClick(event) {
  var target = event.target;
  var categoryId = "";

  if (!canUsePos()) {
    return;
  }

  while (target && target !== POS_DOM.categoryChips) {
    if (target.getAttribute) {
      categoryId = target.getAttribute("data-category-id");
      if (categoryId) {
        break;
      }
    }
    target = target.parentElement;
  }

  if (!categoryId) {
    return;
  }

  if (POS_STATE.activeCategoryId === categoryId) {
    POS_STATE.activeCategoryId = null;
  } else {
    POS_STATE.activeCategoryId = categoryId;
  }

  POS_STATE.activeItemId = null;
  POS_STATE.builderSelections = {};
  renderCategories();
  renderItems();
  renderBuilder();
}

function onItemClick(event) {
  var action = event.target.getAttribute("data-action");
  var itemId = event.target.getAttribute("data-item-id");
  var item = null;

  if (!canUsePos()) {
    return;
  }

  if (!action && event.target.parentElement) {
    action = event.target.parentElement.getAttribute("data-action");
    itemId = event.target.parentElement.getAttribute("data-item-id");
  }

  if (action !== "select-item" || !itemId) {
    return;
  }

  POS_STATE.activeItemId = itemId;
  item = getActiveItem();
  POS_STATE.builderSelections = buildDefaultSelections(item);
  POS_STATE.builderQuantity = 1;

  renderItems();
  renderBuilder();
}

function onBuilderClick(event) {
  var action = event.target.getAttribute("data-action");
  var groupId = event.target.getAttribute("data-group-id");
  var optionId = event.target.getAttribute("data-option-id");

  if (!canUsePos() || !action) {
    return;
  }

  if (action === "add-to-ticket") {
    addActiveItemToTicket();
    return;
  }

  if (action === "item-qty-plus") {
    updateBuilderQuantity(1);
    renderBuilder();
    return;
  }

  if (action === "item-qty-minus") {
    updateBuilderQuantity(-1);
    renderBuilder();
    return;
  }

  if (action === "qty-plus") {
    updatePlusMinusSelection(groupId, optionId, 1);
    renderBuilder();
    return;
  }

  if (action === "qty-minus") {
    updatePlusMinusSelection(groupId, optionId, -1);
    renderBuilder();
  }
}

function onBuilderChange(event) {
  var action = event.target.getAttribute("data-action");
  var groupId = event.target.getAttribute("data-group-id");
  var optionId = event.target.getAttribute("data-option-id");

  if (!canUsePos()) {
    return;
  }

  if (action === "single-select") {
    POS_STATE.builderSelections[groupId] = event.target.value;
    return;
  }

  if (action === "multi-select") {
    if (!POS_STATE.builderSelections[groupId] || typeof POS_STATE.builderSelections[groupId] !== "object") {
      POS_STATE.builderSelections[groupId] = {};
    }
    POS_STATE.builderSelections[groupId][optionId] = event.target.checked;
  }
}

function onCartClick(event) {
  var action = event.target.getAttribute("data-action");
  var index = -1;
  var paymentMethod = "";

  if (POS_STATE.game.paused) {
    return;
  }

  if (action === "remove-line") {
    if (!canUsePos()) {
      return;
    }
    index = Number(event.target.getAttribute("data-index"));
    removeOrderLine(index);
    if (ORDER_STATE.lines.length === 0) {
      POS_STATE.selectedPaymentMethod = null;
    }
    renderCart();
    return;
  }

  if (action === "open-order-name-modal") {
    if (!canUsePos() || !POS_STATE.game.activeCar || !POS_STATE.game.activeCar.order || !POS_STATE.game.activeCar.order.pickupNameKnown) {
      return;
    }
    POS_STATE.orderNameModal.open = true;
    POS_STATE.orderNameModal.value = POS_STATE.game.activeCar.order.enteredPickupName || "";
    renderGameOverlay();
    return;
  }

  if (action === "set-payment") {
    if (!canUsePos()) {
      return;
    }
    paymentMethod = event.target.getAttribute("data-payment-method");
    if (!paymentMethod || ORDER_STATE.lines.length === 0) {
      return;
    }
    POS_STATE.selectedPaymentMethod = paymentMethod;
    renderCart();
    return;
  }

  if (action === "checkout") {
    if (!canUsePos() || ORDER_STATE.lines.length === 0 || !POS_STATE.selectedPaymentMethod) {
      return;
    }
    openPaymentModal(POS_STATE.selectedPaymentMethod, getOrderTotal());
  }
}

function isCheckoutDisabled() {
  var activeCar = POS_STATE.game.activeCar;
  var requiresOrderName = activeCar && activeCar.order && activeCar.order.pickupNameKnown;
  var enteredName = requiresOrderName ? normalizeOrderName(activeCar.order.enteredPickupName || "") : "";

  return ORDER_STATE.lines.length === 0 ||
    !POS_STATE.selectedPaymentMethod ||
    !canUsePos() ||
    (requiresOrderName && !enteredName);
}

function normalizeOrderName(value) {
  return String(value || "").trim().toLowerCase();
}

function canUsePos() {
  return !POS_STATE.game.paused &&
    POS_STATE.game.uiMode === "taking_order" &&
    POS_STATE.paymentSession === null &&
    POS_STATE.game.activeCar !== null;
}

function shouldDimPos() {
  return POS_STATE.game.uiMode !== "taking_order" || POS_STATE.game.paused;
}

function openPaymentModal(method, orderTotal) {
  var totalCents = centsFromDollars(orderTotal);
  var activeCar = POS_STATE.game.activeCar;

  clearCardSwipeTimer();
  clearCardSignatureTimer();
  POS_STATE.paymentSession = {
    method: method,
    totalCents: totalCents,
    orderName: activeCar && activeCar.order && activeCar.order.pickupNameKnown ? activeCar.order.pickupName : "",
    complete: false,
    confirmationText: "",
    cash: {
      givenCents: 0,
      changeDueCents: 0,
      givenChange: initChangeMap()
    },
    card: {
      swiped: false,
      swipePending: false,
      swipePosition: 0,
      signature: "",
      signed: false
    },
    coupon: {
      code: generateCouponCode(),
      scanned: false,
      applied: false,
      status: "idle"
    }
  };

  renderPaymentModal();
}

function closePaymentModal() {
  clearCardSwipeTimer();
  clearCardSignatureTimer();
  POS_STATE.paymentSession = null;
  POS_STATE.cardDrag.active = false;
  renderPaymentModal();
}

function onPaymentModalClick(event) {
  var action = event.target.getAttribute("data-action");
  var denomination = Number(event.target.getAttribute("data-denomination") || 0);
  var session = POS_STATE.paymentSession;

  if (!session || !action || POS_STATE.game.paused) {
    return;
  }

  if (action === "close-payment-modal") {
    closePaymentModal();
    return;
  }

  if (action === "cash-offer") {
    session.cash.givenCents = pickCustomerCashAmount(session.totalCents);
    session.cash.changeDueCents = Math.max(0, session.cash.givenCents - session.totalCents);
    session.cash.givenChange = initChangeMap();
    renderPaymentModal();
    return;
  }

  if (action === "cash-change-plus") {
    session.cash.givenChange[String(denomination)] += 1;
    renderPaymentModal();
    return;
  }

  if (action === "cash-change-minus") {
    session.cash.givenChange[String(denomination)] = Math.max(0, session.cash.givenChange[String(denomination)] - 1);
    renderPaymentModal();
    return;
  }

  if (action === "cash-complete") {
    finishPayment("Cash payment complete.");
    return;
  }

  if (action === "card-sign") {
    startCardSignatureAnimation();
    return;
  }

  if (action === "card-complete") {
    if (!session.card.swiped || !session.card.signed) {
      return;
    }
    finishPayment("Card payment approved.");
    return;
  }

  if (action === "coupon-scan") {
    scanCoupon();
    return;
  }

  if (action === "coupon-apply") {
    applyCoupon();
    return;
  }

  if (action === "coupon-complete") {
    if (!session.coupon.applied) {
      return;
    }
    finishPayment("Coupon accepted.");
  }
}

function onPaymentModalInput(event) {
  var action = event.target.getAttribute("data-action");
  var session = POS_STATE.paymentSession;

  if (!session || !action || session.method !== "coupon" || POS_STATE.game.paused) {
    return;
  }
}

function onPaymentModalMouseDown(event) {
  var action = event.target.getAttribute("data-action");
  var session = POS_STATE.paymentSession;

  if (!session || session.method !== "card" || session.card.swiped || session.card.swipePending || POS_STATE.game.paused) {
    return;
  }

  if (action !== "swipe-start") {
    return;
  }

  POS_STATE.cardDrag.active = true;
  POS_STATE.cardDrag.startX = event.clientX;
  POS_STATE.cardDrag.startPosition = session.card.swipePosition;
}

function onGlobalMouseMove(event) {
  var session = POS_STATE.paymentSession;
  var swipeMax = 0;
  var next = 0;

  if (!POS_STATE.cardDrag.active || !session || session.method !== "card" || session.card.swiped || POS_STATE.game.paused) {
    return;
  }

  swipeMax = getCardSwipeMaxTravel();
  next = POS_STATE.cardDrag.startPosition + (event.clientX - POS_STATE.cardDrag.startX);
  if (next < 0) {
    next = 0;
  }
  if (next > swipeMax) {
    next = swipeMax;
  }

  session.card.swipePosition = next;

  if (swipeMax > 0 && session.card.swipePosition >= swipeMax) {
    session.card.swipePosition = swipeMax;
    session.card.swipePending = true;
    POS_STATE.cardDrag.active = false;
    clearCardSwipeTimer();
    POS_STATE.cardSwipeTimer = setTimeout(function () {
      if (!POS_STATE.paymentSession || POS_STATE.paymentSession.method !== "card") {
        return;
      }
      POS_STATE.paymentSession.card.swiped = true;
      POS_STATE.paymentSession.card.swipePending = false;
      renderPaymentModal();
    }, 500);
  }

  renderPaymentModal();
}

function onGlobalMouseUp() {
  POS_STATE.cardDrag.active = false;
}

function clearCardSwipeTimer() {
  if (!POS_STATE.cardSwipeTimer) {
    return;
  }
  clearTimeout(POS_STATE.cardSwipeTimer);
  POS_STATE.cardSwipeTimer = null;
}

function getCardSwipeMaxTravel() {
  var lane = POS_DOM.paymentModal.querySelector(".swipe-lane");
  var card = POS_DOM.paymentModal.querySelector(".swipe-card");
  var laneWidth = 0;
  var cardWidth = 0;
  var maxTravel = 0;

  if (!lane || !card) {
    return 0;
  }

  laneWidth = lane.clientWidth;
  cardWidth = card.offsetWidth;
  maxTravel = laneWidth - cardWidth - 16;

  if (maxTravel < 0) {
    return 0;
  }

  return maxTravel;
}

function renderPaymentModal() {
  var session = POS_STATE.paymentSession;

  if (!session) {
    POS_DOM.paymentModal.className = "payment-modal-root";
    POS_DOM.paymentModal.innerHTML = "";
    return;
  }

  POS_DOM.paymentModal.className = "payment-modal-root active";
  POS_DOM.paymentModal.innerHTML = buildPaymentModalHtml(session);
}

function buildPaymentModalHtml(session) {
  var methodLabel = session.method === "cash" ? "Cash" : (session.method === "card" ? "Credit Card" : "Coupon");
  var html = "";

  html += "<div class='payment-overlay'>";
  html += "<div class='payment-modal'>";
  html += "<div class='payment-modal-header'>";
  html += "<h3>Register Checkout - " + methodLabel + "</h3>";
  html += "<button class='close-payment-btn' data-action='close-payment-modal'>x</button>";
  html += "</div>";
  if (session.orderName) {
    html += "<p class='payment-kv'><span>Order Name</span><strong>" + esc(session.orderName) + "</strong></p>";
  }
  html += "<p class='payment-total-line'>Total Due: <strong>" + moneyFromCents(session.totalCents) + "</strong></p>";

  if (session.method === "cash") {
    html += buildCashPaymentHtml(session);
  }

  if (session.method === "card") {
    html += buildCardPaymentHtml(session);
  }

  if (session.method === "coupon") {
    html += buildCouponPaymentHtml(session);
  }

  html += "</div></div>";
  return html;
}

function buildCashPaymentHtml(session) {
  var html = "";
  var i = 0;
  var denom = 0;
  var remaining = getCashRemainingCents(session);
  var givenBack = getCashGivenBackCents(session);
  var bills = [];
  var coins = [];

  html += "<div class='payment-section'>";
  html += "<div class='cash-layout'>";
  html += "<div class='cash-topbar'>";
  html += "<div class='cash-intro'><strong>Cash Drawer</strong><span>Count back the customer's change using the drawer buttons.</span></div>";
  html += "<button class='btn cash-offer-btn' data-action='cash-offer' " + (session.cash.givenCents > 0 ? "disabled" : "") + ">" + (session.cash.givenCents > 0 ? "Cash Received" : "Customer Hands Cash") + "</button>";
  html += "</div>";

  if (session.cash.givenCents === 0) {
    html += "<div class='cash-empty-state'><p class='muted'>Tap the button to receive the customer's cash and open the drawer.</p></div>";
    html += "</div></div>";
    return html;
  }

  html += "<div class='cash-summary-grid'>";
  html += "<div class='cash-summary-card'><span>Tendered</span><strong>" + moneyFromCents(session.cash.givenCents) + "</strong></div>";
  html += "<div class='cash-summary-card'><span>Change Due</span><strong>" + moneyFromCents(session.cash.changeDueCents) + "</strong></div>";
  html += "<div class='cash-summary-card'><span>Given Back</span><strong>" + moneyFromCents(givenBack) + "</strong></div>";
  html += "<div class='cash-summary-card'><span>Difference</span><strong class='" + getCashDifferenceClass(remaining) + "'>" + formatCashDifference(remaining) + "</strong></div>";
  html += "</div>";

  for (i = 0; i < CHANGE_DENOMINATIONS.length; i += 1) {
    denom = CHANGE_DENOMINATIONS[i];
    if (denom >= 100) {
      bills.push(denom);
    } else {
      coins.push(denom);
    }
  }

  html += "<div class='cash-drawer-columns'>";
  html += "<div class='cash-drawer-column'>";
  html += "<div class='cash-column-title'>Cash</div>";
  html += "<div class='cash-drawer-grid'>";
  for (i = 0; i < bills.length; i += 1) {
    denom = bills[i];
    html += buildCashDrawerRow(session, denom);
  }
  html += "</div>";
  html += "</div>";

  html += "<div class='cash-drawer-column'>";
  html += "<div class='cash-column-title'>Coins</div>";
  html += "<div class='cash-drawer-grid'>";
  for (i = 0; i < coins.length; i += 1) {
    denom = coins[i];
    html += buildCashDrawerRow(session, denom);
  }
  for (i = 0; i < CHANGE_DENOMINATIONS.length; i += 1) {
    if (i > -1) {
      break;
    }
  }
  html += "</div>";
  html += "</div>";
  html += "</div>";

  html += "<div class='change-visual'>" + buildChangeVisual(session) + "</div>";
  html += "<div class='cash-complete-wrap'>";
  html += "<p class='muted'>You can submit at any time. Incorrect change lowers the score.</p>";
  html += "<button class='btn payment-finish-btn cash-complete-btn' data-action='cash-complete'>Complete Cash Payment</button>";
  html += "</div>";
  html += "</div></div>";

  return html;
}

function buildCashDrawerRow(session, denom) {
  var html = "";

  html += "<div class='cash-drawer-row'>";
  html += "<div class='cash-denom-block'><span class='change-label'>" + formatDenomination(denom) + "</span><span class='cash-denom-help'>Add or remove</span></div>";
  html += "<div class='change-controls cash-drawer-controls'>";
  html += "<button class='qty-btn' data-action='cash-change-minus' data-denomination='" + denom + "'>-</button>";
  html += "<span class='change-count'>" + session.cash.givenChange[String(denom)] + "</span>";
  html += "<button class='qty-btn' data-action='cash-change-plus' data-denomination='" + denom + "'>+</button>";
  html += "</div></div>";

  return html;
}

function buildCardPaymentHtml(session) {
  var html = "";

  html += "<div class='payment-section'>";
  html += "<p class='muted'>Click and drag the card all the way right to swipe.</p>";
  html += "<div class='swipe-lane " + (session.card.swipePending ? "reading" : "") + "'>";
  html += "<div class='swipe-track'></div>";
  html += "<div class='swipe-reader'></div>";
  html += "<div class='swipe-card " + (session.card.swiped ? "done" : "") + "' data-action='swipe-start' style='transform: translateX(" + session.card.swipePosition + "px)'>CARD</div>";
  html += "</div>";
  if (session.card.swipePending) {
    html += "<p class='muted'>Reading card...</p>";
  }

  if (session.card.swiped) {
    html += "<p class='good'>Card read successful.</p>";
    html += "<div class='signature-box'>" + (session.card.signature ? esc(session.card.signature) : "") + "</div>";
    html += "<button class='btn' data-action='card-sign' " + (session.card.signed ? "disabled" : "") + ">" + (session.card.signed ? "Signature Captured" : "Capture Signature") + "</button>";
  }

  html += "<button class='btn payment-finish-btn " + (session.card.swiped && session.card.signed ? "" : "is-disabled") + "' data-action='card-complete' " + (session.card.swiped && session.card.signed ? "" : "disabled") + ">Complete Card Payment</button>";
  html += "</div>";

  return html;
}

function buildCouponPaymentHtml(session) {
  var html = "";

  html += "<div class='payment-section'>";
  html += "<p class='payment-kv'><span>Coupon Code</span><strong>" + esc(session.coupon.code) + "</strong></p>";
  html += "<p class='muted'>Scan the coupon, then apply it to this ticket.</p>";
  html += "<button class='btn' data-action='coupon-scan' " + (session.coupon.scanned ? "disabled" : "") + ">" + (session.coupon.status === "scanning" ? "Scanning..." : (session.coupon.scanned ? "Coupon Scanned" : "Scan Coupon")) + "</button>";

  if (session.coupon.scanned) {
    html += "<p class='good'>Coupon verified for " + moneyFromCents(session.totalCents) + ".</p>";
    html += "<button class='btn' data-action='coupon-apply' " + (session.coupon.applied ? "disabled" : "") + ">" + (session.coupon.applied ? "Coupon Applied" : "Apply Coupon") + "</button>";
  }

  if (session.coupon.applied) {
    html += "<div class='qr-box complete'><div class='qr-complete'>APPLIED</div><p class='good'>Discount applied and tender accepted.</p></div>";
  }

  html += "<button class='btn payment-finish-btn " + (session.coupon.applied ? "" : "is-disabled") + "' data-action='coupon-complete' " + (session.coupon.applied ? "" : "disabled") + ">Complete Coupon Payment</button>";
  html += "</div>";

  return html;
}

function startCardSignatureAnimation() {
  var session = POS_STATE.paymentSession;
  var signatures = ["A. Martinez", "Jordan K.", "M. Sinclair"];
  var target = "";
  var index = 0;

  if (!session || session.method !== "card" || !session.card.swiped || session.card.signed) {
    return;
  }

  target = signatures[Math.floor(Math.random() * signatures.length)];
  session.card.signature = "";

  clearCardSignatureTimer();
  POS_STATE.cardSignatureTimer = setInterval(function () {
    session.card.signature += target.charAt(index);
    index += 1;
    renderPaymentModal();

    if (index >= target.length) {
      clearCardSignatureTimer();
      session.card.signed = true;
      renderPaymentModal();
    }
  }, 85);
}

function clearCardSignatureTimer() {
  if (!POS_STATE.cardSignatureTimer) {
    return;
  }
  clearInterval(POS_STATE.cardSignatureTimer);
  POS_STATE.cardSignatureTimer = null;
}

function scanCoupon() {
  var session = POS_STATE.paymentSession;

  if (!session || session.method !== "coupon" || session.coupon.scanned) {
    return;
  }

  session.coupon.status = "scanning";
  renderPaymentModal();

  setTimeout(function () {
    if (!POS_STATE.paymentSession || POS_STATE.paymentSession.method !== "coupon") {
      return;
    }
    POS_STATE.paymentSession.coupon.scanned = true;
    POS_STATE.paymentSession.coupon.status = "scanned";
    renderPaymentModal();
  }, 700);
}

function applyCoupon() {
  var session = POS_STATE.paymentSession;

  if (!session || session.method !== "coupon" || !session.coupon.scanned) {
    return;
  }

  session.coupon.applied = true;
  session.coupon.status = "applied";
  renderPaymentModal();
}

function finishPayment(message) {
  var session = POS_STATE.paymentSession;
  var activeCar = POS_STATE.game.activeCar;
  var validation = null;
  var paymentMatched = false;
  var cashDeltaCents = 0;
  var totalWaitMs = 0;
  var speakerToChargeMs = 0;
  var points = 0;
  var tipCents = 0;
  var accuracyPct = 0;
  var summaryText = "";
  var scoreBreakdown = null;
  var comparisonLines = null;
  var pickupNameMatched = true;

  if (!session || !activeCar) {
    return;
  }

  activeCar.completedAtMs = getGameNowMs();
  validation = validateOrderAgainstRequest(activeCar.order, ORDER_STATE.lines);
  comparisonLines = buildRecapComparisonLines(validation, activeCar.order.lines, ORDER_STATE.lines);
  paymentMatched = session.method === activeCar.order.paymentMethod;
  cashDeltaCents = session.method === "cash" ? Math.abs(getCashRemainingCents(session)) : 0;
  totalWaitMs = activeCar.completedAtMs - activeCar.arrivedAtMs;
  speakerToChargeMs = activeCar.orderStartedAtMs > 0 ? activeCar.completedAtMs - activeCar.orderStartedAtMs : totalWaitMs;
  accuracyPct = validation.accuracyPct;
  pickupNameMatched = normalizeOrderName(activeCar.order.enteredPickupName) === normalizeOrderName(activeCar.order.pickupName);
  scoreBreakdown = calculatePoints(validation, totalWaitMs, speakerToChargeMs, paymentMatched, cashDeltaCents);
  points = scoreBreakdown.total;
  tipCents = calculateTipCents(validation, totalWaitMs, speakerToChargeMs, paymentMatched, cashDeltaCents, session.method, pickupNameMatched);
  summaryText = buildValidationSummaryText(validation, message, activeCar.order.paymentMethod, session.method, paymentMatched, cashDeltaCents, tipCents, pickupNameMatched, activeCar.order.pickupName, activeCar.order.enteredPickupName);

  POS_STATE.game.totalScore += points;
  POS_STATE.game.totalTipsCents += tipCents;
  POS_STATE.game.totalOrdersCompleted += 1;
  POS_STATE.game.ordersCompletedToday += 1;
  POS_STATE.game.dayStats.score += points;
  POS_STATE.game.dayStats.tipsCents += tipCents;
  POS_STATE.game.dayStats.totalAccuracy += accuracyPct;
  POS_STATE.game.dayStats.totalWaitMs += totalWaitMs;
  POS_STATE.game.dayStats.completedOrders += 1;

  if (validation.isPerfect) {
    POS_STATE.game.perfectOrders += 1;
    POS_STATE.game.dayStats.perfectOrders += 1;
  }

  POS_STATE.game.recap = {
    customerLabel: activeCar.label,
    pickupName: activeCar.order.pickupNameKnown ? activeCar.order.pickupName : "",
    pickupNameMatched: pickupNameMatched,
    points: points,
    tipCents: tipCents,
    accuracyPct: accuracyPct,
    totalWaitMs: totalWaitMs,
    speakerToChargeMs: speakerToChargeMs,
    expectedText: activeCar.order.spokenText,
    actualText: buildActualTicketText(ORDER_STATE.lines),
    summaryText: summaryText,
    scoreBreakdown: scoreBreakdown.lines,
    comparisonLines: comparisonLines
  };

  closePaymentModal();
  clearOrder();
  POS_STATE.selectedPaymentMethod = null;
  POS_STATE.game.activeCar = null;
  setUiMode("order_recap");
  resetMenuSelection();
  initNpcChatIdleAfterCompletion(activeCar, points, accuracyPct, tipCents);
  renderPOS();
}

function initNpcChatIdleAfterCompletion(car, points, accuracyPct, tipCents) {
  POS_STATE.npcChat.messages = [
    {
      speaker: "system",
      text: car.label + " finished checkout. +" + points + " points earned."
    },
    {
      speaker: "system",
      text: "Accuracy: " + accuracyPct + "%."
    },
    {
      speaker: "system",
      text: "Tips earned: " + moneyFromCents(tipCents || 0) + "."
    }
  ];
  POS_STATE.npcChat.isCustomerSpeaking = false;
  POS_STATE.npcChat.flowStage = "confirm_all";
}

function validateOrderAgainstRequest(orderRequest, actualLines) {
  var unmatchedActual = [];
  var expectedLines = orderRequest.lines;
  var matchedActualIndex = -1;
  var bestMatch = null;
  var i = 0;
  var j = 0;
  var lineResult = null;
  var totals = {
    correctChecks: 0,
    totalChecks: 0,
    missingItems: 0,
    extraItems: 0,
    exactLines: 0,
    mismatchChecks: 0,
    matchedPairs: []
  };

  for (i = 0; i < actualLines.length; i += 1) {
    unmatchedActual.push(i);
  }

  for (i = 0; i < expectedLines.length; i += 1) {
    bestMatch = null;
    matchedActualIndex = -1;

    for (j = 0; j < unmatchedActual.length; j += 1) {
      lineResult = scoreLineMatch(expectedLines[i], actualLines[unmatchedActual[j]]);
      if (!bestMatch || lineResult.correctChecks > bestMatch.correctChecks) {
        bestMatch = lineResult;
        matchedActualIndex = j;
      }
    }

    if (!bestMatch || bestMatch.itemMatched === false) {
      totals.missingItems += 1;
      totals.totalChecks += getExpectedCheckCount(expectedLines[i]);
      continue;
    }

    totals.correctChecks += bestMatch.correctChecks;
    totals.totalChecks += bestMatch.totalChecks;
    totals.mismatchChecks += bestMatch.totalChecks - bestMatch.correctChecks;
    if (bestMatch.isExact) {
      totals.exactLines += 1;
    }
    totals.matchedPairs.push({
      expectedIndex: i,
      actualIndex: unmatchedActual[matchedActualIndex],
      isExact: bestMatch.isExact,
      itemMatched: bestMatch.itemMatched
    });
    unmatchedActual.splice(matchedActualIndex, 1);
  }

  totals.extraItems = unmatchedActual.length;

  return {
    accuracyPct: totals.totalChecks > 0 ? Math.round((totals.correctChecks / totals.totalChecks) * 100) : 0,
    missingItems: totals.missingItems,
    extraItems: totals.extraItems,
    exactLines: totals.exactLines,
    mismatchChecks: totals.mismatchChecks,
    expectedCount: expectedLines.length,
    actualCount: actualLines.length,
    matchedPairs: totals.matchedPairs,
    unmatchedActualIndexes: unmatchedActual,
    isPerfect: totals.missingItems === 0 &&
      totals.extraItems === 0 &&
      totals.totalChecks > 0 &&
      totals.correctChecks === totals.totalChecks
  };
}

function scoreLineMatch(expectedLine, actualLine) {
  var item = findItemById(expectedLine.itemId);
  var defaults = buildDefaultSelections(item);
  var result = {
    itemMatched: false,
    correctChecks: 0,
    totalChecks: 1,
    isExact: false
  };
  var expectedSelections = mergeExpectedSelections(defaults, expectedLine.selections);
  var group = null;
  var actualValue = null;
  var expectedValue = null;
  var option = null;
  var g = 0;
  var o = 0;

  if (!actualLine || actualLine.itemId !== expectedLine.itemId || !item) {
    return result;
  }

  result.itemMatched = true;
  result.correctChecks = 1;

  for (g = 0; g < item.modifiers.length; g += 1) {
    group = item.modifiers[g];
    actualValue = getSelectionValueForGroup(actualLine.selections, group.id);
    expectedValue = expectedSelections[group.id];

    if (group.selection === "single") {
      result.totalChecks += 1;
      if (actualValue === expectedValue) {
        result.correctChecks += 1;
      }
      continue;
    }

    for (o = 0; o < group.options.length; o += 1) {
      option = group.options[o];
      result.totalChecks += 1;

      if (option.inputType === "plus/minus") {
        if (getQuantityValue(actualValue, option.id) === getQuantityValue(expectedValue, option.id)) {
          result.correctChecks += 1;
        }
      } else if (isMultiOptionSelected(actualValue, option.id) === isMultiOptionSelected(expectedValue, option.id)) {
        result.correctChecks += 1;
      }
    }
  }

  result.isExact = result.correctChecks === result.totalChecks;
  return result;
}

function calculatePoints(validation, totalWaitMs, speakerToChargeMs, paymentMatched, cashDeltaCents) {
  var basePoints = 40;
  var accuracyPoints = Math.round(validation.accuracyPct);
  var waitPenalty = Math.max(0, Math.floor((Math.round(totalWaitMs / 1000) - 120) / 15));
  var serviceBonus = Math.max(0, 30 - Math.floor(Math.round(speakerToChargeMs / 1000) / 15) * 5);
  var itemPenalty = validation.missingItems * 30 + validation.extraItems * 18;
  var modifierPenalty = validation.mismatchChecks > 0 ? Math.max(6, validation.mismatchChecks * 3) : 0;
  var perfectBonus = validation.isPerfect ? 30 : 0;
  var paymentPenalty = paymentMatched ? 0 : 20;
  var cashPenalty = cashDeltaCents > 0 ? Math.max(2, Math.round(cashDeltaCents / 25)) : 0;
  var total = basePoints + accuracyPoints + serviceBonus + perfectBonus - waitPenalty - itemPenalty - modifierPenalty - paymentPenalty - cashPenalty;

  return {
    total: total,
    lines: [
      { label: "Base shift points", value: basePoints },
      { label: "Accuracy", value: accuracyPoints },
      { label: "Service speed bonus", value: serviceBonus },
      { label: "Perfect ticket bonus", value: perfectBonus },
      { label: "Queue wait penalty", value: -waitPenalty },
      { label: "Wrong item penalty", value: -itemPenalty },
      { label: "Modifier mismatch penalty", value: -modifierPenalty },
      { label: "Payment mismatch penalty", value: -paymentPenalty },
      { label: "Cash difference penalty", value: -cashPenalty }
    ]
  };
}

function calculateTipCents(validation, totalWaitMs, speakerToChargeMs, paymentMatched, cashDeltaCents, method, pickupNameMatched) {
  var tipScore = validation.accuracyPct;
  var methodType = method || "card";
  var cashTips = [0, 0, 100, 100, 200, 300, 500];
  var cardTips = [0, 100, 200, 300, 400, 500, 600];

  if (validation.isPerfect) {
    tipScore += 20;
  }

  if (speakerToChargeMs <= 45000) {
    tipScore += 15;
  } else if (speakerToChargeMs <= 75000) {
    tipScore += 8;
  } else if (speakerToChargeMs <= 105000) {
    tipScore += 3;
  }

  if (totalWaitMs > 150000) {
    tipScore -= 10;
  }

  if (!paymentMatched) {
    tipScore -= 30;
  }

  if (cashDeltaCents > 0) {
    tipScore -= 20;
  }

  if (validation.missingItems > 0 || validation.extraItems > 0) {
    tipScore -= 15;
  }

  if (!pickupNameMatched) {
    tipScore -= 10;
  }

  if (tipScore < 70) {
    return 0;
  }

  if (tipScore < 85) {
    return methodType === "cash" ? cashTips[2 + Math.floor(Math.random() * 2)] : cardTips[1 + Math.floor(Math.random() * 2)];
  }

  if (tipScore < 100) {
    return methodType === "cash" ? cashTips[4 + Math.floor(Math.random() * 2)] : cardTips[3 + Math.floor(Math.random() * 2)];
  }

  return methodType === "cash" ? cashTips[6] : cardTips[6];
}

function buildValidationSummaryText(validation, paymentMessage, expectedPaymentMethod, actualPaymentMethod, paymentMatched, cashDeltaCents, tipCents, pickupNameMatched, expectedPickupName, enteredPickupName) {
  var pieces = [paymentMessage];

  if (validation.isPerfect) {
    pieces.push("Perfect ticket.");
  } else {
    if (validation.missingItems > 0) {
      pieces.push(validation.missingItems + " missing item" + (validation.missingItems === 1 ? "" : "s") + ".");
    }
    if (validation.extraItems > 0) {
      pieces.push(validation.extraItems + " extra item" + (validation.extraItems === 1 ? "" : "s") + ".");
    }
    if (validation.missingItems === 0 && validation.extraItems === 0) {
      pieces.push("Some modifiers did not match the requested order.");
    }
  }

  if (!paymentMatched) {
    pieces.push("Customer expected " + getPaymentMethodLabel(expectedPaymentMethod).toLowerCase() + ", but the ticket was charged as " + getPaymentMethodLabel(actualPaymentMethod).toLowerCase() + ".");
  }

  if (cashDeltaCents > 0) {
    pieces.push("Cash back was off by " + moneyFromCents(cashDeltaCents) + ".");
  }

  if (!pickupNameMatched) {
    pieces.push("Order name entered as " + (enteredPickupName ? "\"" + enteredPickupName + "\"" : "\"\"") + " instead of \"" + expectedPickupName + "\".");
  }

  if (tipCents > 0) {
    pieces.push("They left a " + getPaymentMethodLabel(actualPaymentMethod).toLowerCase() + " tip of " + moneyFromCents(tipCents) + ".");
  } else {
    pieces.push("No tip on this order.");
  }

  return pieces.join(" ");
}

function getExpectedCheckCount(expectedLine) {
  var item = findItemById(expectedLine.itemId);
  var total = 1;
  var group = null;
  var g = 0;
  var o = 0;

  if (!item) {
    return 1;
  }

  for (g = 0; g < item.modifiers.length; g += 1) {
    group = item.modifiers[g];
    if (group.selection === "single") {
      total += 1;
      continue;
    }

    for (o = 0; o < group.options.length; o += 1) {
      total += 1;
    }
  }

  return total;
}

function mergeExpectedSelections(defaults, overrides) {
  var merged = JSON.parse(JSON.stringify(defaults || {}));
  var key = "";

  for (key in overrides) {
    if (!Object.prototype.hasOwnProperty.call(overrides, key)) {
      continue;
    }
    merged[key] = JSON.parse(JSON.stringify(overrides[key]));
  }

  return merged;
}

function getSelectionValueForGroup(selections, groupId) {
  if (!selections || !Object.prototype.hasOwnProperty.call(selections, groupId)) {
    return null;
  }

  return selections[groupId];
}

function buildActualTicketText(lines) {
  var labels = [];
  var i = 0;

  if (!lines || lines.length === 0) {
    return "No items entered.";
  }

  for (i = 0; i < lines.length; i += 1) {
    labels.push(lines[i].label);
  }

  return labels.join("; ");
}

function buildScoreBreakdownHtml(lines) {
  var html = "";
  var i = 0;
  var value = 0;
  var className = "";

  if (!lines || lines.length === 0) {
    return "<p class='muted'>No score details available.</p>";
  }

  html += "<div class='score-breakdown-list'>";
  for (i = 0; i < lines.length; i += 1) {
    value = Number(lines[i].value || 0);
    if (value === 0) {
      continue;
    }
    className = value > 0 ? "good" : (value < 0 ? "warn" : "");
    html += "<div class='score-breakdown-row'><span>" + esc(lines[i].label) + "</span><strong class='" + className + "'>" + formatPointValue(value) + "</strong></div>";
  }
  html += "</div>";

  return html;
}

function buildRecapComparisonLines(validation, expectedLines, actualLines) {
  var comparison = [];
  var usedActualIndexes = {};
  var pair = null;
  var expectedLine = null;
  var actualLine = null;
  var diffText = "";
  var i = 0;

  for (i = 0; i < validation.matchedPairs.length; i += 1) {
    pair = validation.matchedPairs[i];
    expectedLine = expectedLines[pair.expectedIndex];
    actualLine = actualLines[pair.actualIndex];
    usedActualIndexes[pair.actualIndex] = true;
    diffText = pair.isExact ? "" : buildMismatchDetailText(expectedLine, actualLine);
    comparison.push({
      expectedLabel: buildRequestedLineLabel(expectedLine),
      actualLabel: actualLine ? actualLine.label : "Missing item",
      details: diffText,
      status: pair.isExact ? "correct" : "incorrect"
    });
  }

  for (i = 0; i < expectedLines.length; i += 1) {
    if (!hasMatchedExpectedIndex(validation.matchedPairs, i)) {
      comparison.push({
        expectedLabel: buildRequestedLineLabel(expectedLines[i]),
        actualLabel: "Missing from ticket",
        details: "",
        status: "missing"
      });
    }
  }

  for (i = 0; i < actualLines.length; i += 1) {
    if (!usedActualIndexes[i]) {
      comparison.push({
        expectedLabel: "Wrong item",
        actualLabel: actualLines[i].label,
        details: "",
        status: "extra"
      });
    }
  }

  return comparison;
}

function hasMatchedExpectedIndex(pairs, expectedIndex) {
  var i = 0;

  for (i = 0; i < pairs.length; i += 1) {
    if (pairs[i].expectedIndex === expectedIndex) {
      return true;
    }
  }

  return false;
}

function buildRequestedLineLabel(expectedLine) {
  var item = findItemById(expectedLine.itemId);
  var priced = null;

  if (!item) {
    return expectedLine.label || "Unknown item";
  }

  priced = priceItemWithSelections(item, expectedLine.selections || {});
  return priced.label;
}

function buildMismatchDetailText(expectedLine, actualLine) {
  var item = findItemById(expectedLine.itemId);
  var expectedSelections = null;
  var actualSelections = actualLine ? actualLine.selections : null;
  var mismatchParts = [];
  var defaults = null;
  var group = null;
  var expectedValue = null;
  var actualValue = null;
  var expectedLabels = [];
  var actualLabels = [];
  var qtyExpected = 0;
  var qtyActual = 0;
  var g = 0;
  var o = 0;
  var option = null;

  if (!item || !actualLine) {
    return "";
  }

  defaults = buildDefaultSelections(item);
  expectedSelections = mergeExpectedSelections(defaults, expectedLine.selections || {});

  for (g = 0; g < item.modifiers.length; g += 1) {
    group = item.modifiers[g];
    expectedValue = getSelectionValueForGroup(expectedSelections, group.id);
    actualValue = getSelectionValueForGroup(actualSelections, group.id);

    if (group.selection === "single") {
      if (expectedValue !== actualValue) {
        mismatchParts.push(group.label + ": expected " + getOptionLabel(item, group.id, expectedValue) + ", got " + getOptionLabel(item, group.id, actualValue));
      }
      continue;
    }

    expectedLabels = [];
    actualLabels = [];

    for (o = 0; o < group.options.length; o += 1) {
      option = group.options[o];
      if (option.inputType === "plus/minus") {
        qtyExpected = getQuantityValue(expectedValue, option.id);
        qtyActual = getQuantityValue(actualValue, option.id);
        if (qtyExpected !== qtyActual) {
          mismatchParts.push(option.label + ": expected " + qtyExpected + ", got " + qtyActual);
        }
        continue;
      }

      if (isMultiOptionSelected(expectedValue, option.id)) {
        expectedLabels.push(option.label);
      }
      if (isMultiOptionSelected(actualValue, option.id)) {
        actualLabels.push(option.label);
      }
    }

    if (expectedLabels.join(",") !== actualLabels.join(",")) {
      mismatchParts.push(group.label + ": expected " + formatListOrNone(expectedLabels) + ", got " + formatListOrNone(actualLabels));
    }
  }

  return mismatchParts.join(" | ");
}

function formatListOrNone(labels) {
  if (!labels || labels.length === 0) {
    return "none";
  }

  return labels.join(", ");
}

function buildRecapComparisonHtml(lines) {
  var html = "";
  var i = 0;
  var line = null;

  if (!lines || lines.length === 0) {
    return "<p class='muted'>No order comparison available.</p>";
  }

  html += "<div class='recap-ticket-list'>";
  for (i = 0; i < lines.length; i += 1) {
    line = lines[i];
    html += "<div class='cart-line recap-ticket-line " + line.status + "'>";
    html += "<div class='recap-ticket-status'>" + getRecapStatusIcon(line.status) + "</div>";
    html += "<div class='cart-line-main'>";
    html += "<div class='cart-line-title'>" + esc(line.expectedLabel) + "</div>";
    html += "<div class='cart-line-details'>Ticketed: " + esc(line.actualLabel) + (line.details ? " | " + esc(line.details) : "") + "</div>";
    html += "</div>";
    html += "</div>";
  }
  html += "</div>";

  return html;
}

function getRecapStatusIcon(status) {
  if (status === "correct") {
    return "✓";
  }

  return "X";
}

function formatPointValue(value) {
  if (value > 0) {
    return "+" + value;
  }
  return String(value);
}

function buildQrVisual(status) {
  var i = 0;
  var pattern = [
    1, 1, 1, 0, 0, 1, 1, 1,
    1, 0, 1, 1, 0, 1, 0, 1,
    1, 1, 1, 0, 1, 1, 1, 0,
    0, 0, 1, 1, 0, 0, 1, 1,
    1, 0, 1, 0, 1, 0, 1, 0,
    1, 1, 1, 1, 0, 1, 0, 1,
    1, 0, 0, 1, 1, 0, 1, 1,
    1, 1, 1, 0, 1, 1, 0, 1
  ];
  var html = "";

  if (status === "complete") {
    return "<div class='qr-complete'>COMPLETE</div>";
  }

  html += "<div class='qr-grid'>";
  for (i = 0; i < pattern.length; i += 1) {
    html += "<span class='" + (pattern[i] ? "on" : "off") + "'></span>";
  }
  html += "</div>";
  return html;
}

function formatRate(value) {
  return Number(value || 0).toFixed(2);
}

function pickCustomerCashAmount(totalCents) {
  var denominations = [1, 5, 10, 20, 50, 100];
  var weights = [];
  var totalWeight = 0;
  var i = 0;
  var bill = 0;
  var minBill = Math.floor(totalCents / 100) + 1;
  var candidate = 0;
  var diff = 0;
  var base = 1;
  var roll = 0;

  for (i = 0; i < denominations.length; i += 1) {
    candidate = denominations[i];
    if (candidate < minBill) {
      continue;
    }

    diff = candidate * 100 - totalCents;
    base = getCashBaseWeight(candidate);
    weights.push({
      bill: candidate,
      weight: base / (1 + diff / 300)
    });
  }

  if (weights.length === 0) {
    return 10000;
  }

  for (i = 0; i < weights.length; i += 1) {
    totalWeight += weights[i].weight;
  }

  roll = Math.random() * totalWeight;
  for (i = 0; i < weights.length; i += 1) {
    roll -= weights[i].weight;
    if (roll <= 0) {
      bill = weights[i].bill;
      return bill * 100;
    }
  }

  return weights[weights.length - 1].bill * 100;
}

function getCashBaseWeight(denomination) {
  if (denomination === 1) {
    return 6;
  }
  if (denomination === 5) {
    return 7;
  }
  if (denomination === 10) {
    return 6;
  }
  if (denomination === 20) {
    return 4;
  }
  if (denomination === 50) {
    return 1.6;
  }
  return 0.7;
}

function initChangeMap() {
  var map = {};
  var i = 0;

  for (i = 0; i < CHANGE_DENOMINATIONS.length; i += 1) {
    map[String(CHANGE_DENOMINATIONS[i])] = 0;
  }

  return map;
}

function getCashGivenBackCents(session) {
  var i = 0;
  var total = 0;
  var denom = 0;

  for (i = 0; i < CHANGE_DENOMINATIONS.length; i += 1) {
    denom = CHANGE_DENOMINATIONS[i];
    total += denom * Number(session.cash.givenChange[String(denom)] || 0);
  }

  return total;
}

function getCashRemainingCents(session) {
  return session.cash.changeDueCents - getCashGivenBackCents(session);
}

function formatDenomination(cents) {
  if (cents >= 100) {
    return "$" + (cents / 100).toFixed(0);
  }
  return cents + "c";
}

function buildChangeVisual(session) {
  var html = "";
  var i = 0;
  var denom = 0;
  var count = 0;

  html += "<div class='change-pill-wrap'>";
  for (i = 0; i < CHANGE_DENOMINATIONS.length; i += 1) {
    denom = CHANGE_DENOMINATIONS[i];
    count = Number(session.cash.givenChange[String(denom)] || 0);
    if (count === 0) {
      continue;
    }
    html += "<span class='change-pill'>" + formatDenomination(denom) + " x" + count + "</span>";
  }

  if (html === "<div class='change-pill-wrap'>") {
    html += "<span class='muted'>No change counted yet.</span>";
  }

  html += "</div>";
  return html;
}

function getCashDifferenceClass(remainingCents) {
  if (remainingCents === 0) {
    return "good";
  }
  return "warn";
}

function formatCashDifference(remainingCents) {
  if (remainingCents === 0) {
    return "Exact";
  }

  if (remainingCents > 0) {
    return "Short " + moneyFromCents(remainingCents);
  }

  return "Over " + moneyFromCents(Math.abs(remainingCents));
}

function centsFromDollars(value) {
  return Math.round(Number(value) * 100);
}

function moneyFromCents(cents) {
  return "$" + (Number(cents) / 100).toFixed(2);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function addActiveItemToTicket() {
  var item = getActiveItem();
  var qty = POS_STATE.builderQuantity;
  var i = 0;

  if (!item || !canUsePos()) {
    return;
  }

  for (i = 0; i < qty; i += 1) {
    addItemToOrder(item, POS_STATE.builderSelections);
  }
  resetMenuSelection();
  renderCategories();
  renderItems();
  renderBuilder();
  renderCart();
}

function resetMenuSelection() {
  POS_STATE.activeCategoryId = null;
  POS_STATE.activeItemId = null;
  POS_STATE.builderSelections = {};
  POS_STATE.builderQuantity = 1;
}

function updateBuilderQuantity(direction) {
  POS_STATE.builderQuantity += direction;

  if (POS_STATE.builderQuantity < 1) {
    POS_STATE.builderQuantity = 1;
  }

  if (POS_STATE.builderQuantity > 9) {
    POS_STATE.builderQuantity = 9;
  }
}

function updatePlusMinusSelection(groupId, optionId, direction) {
  var item = getActiveItem();
  var group = null;
  var option = null;
  var current = 0;
  var min = 0;
  var max = 10;

  if (!item) {
    return;
  }

  group = findModifierGroup(item, groupId);
  if (!group) {
    return;
  }

  option = findOptionById(group.options, optionId);
  if (!option) {
    return;
  }

  if (!POS_STATE.builderSelections[groupId] || typeof POS_STATE.builderSelections[groupId] !== "object") {
    POS_STATE.builderSelections[groupId] = {};
  }

  current = Number(POS_STATE.builderSelections[groupId][optionId] || 0);
  min = typeof option.min === "number" ? option.min : 0;
  max = typeof option.max === "number" ? option.max : 10;

  current += direction;

  if (current < min) {
    current = min;
  }

  if (current > max) {
    current = max;
  }

  POS_STATE.builderSelections[groupId][optionId] = current;
}

function buildDefaultSelections(item) {
  var selections = {};
  var g = 0;
  var o = 0;
  var group = null;

  if (!item || !item.modifiers || item.modifiers.length === 0) {
    return selections;
  }

  for (g = 0; g < item.modifiers.length; g += 1) {
    group = item.modifiers[g];

    if (group.selection === "single" && group.options.length > 0) {
      selections[group.id] = group.options[0].id;
      continue;
    }

    selections[group.id] = {};

    for (o = 0; o < group.options.length; o += 1) {
      if (group.options[o].inputType === "plus/minus") {
        selections[group.id][group.options[o].id] = group.options[o].min || 0;
      } else {
        selections[group.id][group.options[o].id] = false;
      }
    }
  }

  return selections;
}

function findModifierGroup(item, groupId) {
  var i = 0;

  for (i = 0; i < item.modifiers.length; i += 1) {
    if (item.modifiers[i].id === groupId) {
      return item.modifiers[i];
    }
  }

  return null;
}

function getActiveCategory() {
  var i = 0;

  for (i = 0; i < MENU.categories.length; i += 1) {
    if (MENU.categories[i].id === POS_STATE.activeCategoryId) {
      return MENU.categories[i];
    }
  }

  return null;
}

function getActiveItem() {
  var category = getActiveCategory();
  var i = 0;

  if (!category) {
    return null;
  }

  for (i = 0; i < category.items.length; i += 1) {
    if (category.items[i].id === POS_STATE.activeItemId) {
      return category.items[i];
    }
  }

  return null;
}

function findItemById(itemId) {
  var c = 0;
  var i = 0;

  for (c = 0; c < MENU.categories.length; c += 1) {
    for (i = 0; i < MENU.categories[c].items.length; i += 1) {
      if (MENU.categories[c].items[i].id === itemId) {
        return MENU.categories[c].items[i];
      }
    }
  }

  return null;
}

function getCategoryById(categoryId) {
  var i = 0;

  for (i = 0; i < MENU.categories.length; i += 1) {
    if (MENU.categories[i].id === categoryId) {
      return MENU.categories[i];
    }
  }

  return null;
}

function priceDeltaLabel(delta) {
  if (!delta) {
    return "";
  }
  return " (" + money(delta) + ")";
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, replaceEscapeChar);
}

function replaceEscapeChar(char) {
  if (char === "&") {
    return "&amp;";
  }
  if (char === "<") {
    return "&lt;";
  }
  if (char === ">") {
    return "&gt;";
  }
  if (char === "\"") {
    return "&quot;";
  }
  return "&#39;";
}

function padNumber(value) {
  if (value < 10) {
    return "0" + value;
  }
  return String(value);
}

function formatDuration(ms) {
  var totalSeconds = Math.max(0, Math.round(ms / 1000));
  var minutes = Math.floor(totalSeconds / 60);
  var seconds = totalSeconds % 60;

  if (minutes === 0) {
    return seconds + "s";
  }

  return minutes + "m " + seconds + "s";
}

function isSpeakerReady(car) {
  return car && getGameNowMs() >= car.speakerReadyAtMs;
}

function getCarsInSystemCount() {
  return POS_STATE.game.queue.length + (POS_STATE.game.activeCar ? 1 : 0);
}

function getMaxQueueDepthForDay(dayNumber) {
  if (dayNumber <= 2) {
    return 3;
  }
  if (dayNumber <= 5) {
    return 4;
  }
  return 5;
}

function getNextArrivalDelayMs() {
  var day = POS_STATE.game.currentDay;
  var minDelay = Math.max(4500, 12000 - (day - 1) * 900);
  var maxDelay = Math.max(minDelay + 500, 18000 - (day - 1) * 1100);

  return Math.round(randomBetween(minDelay, maxDelay));
}

function getAverageAccuracy(dayStats) {
  if (!dayStats || dayStats.completedOrders === 0) {
    return 0;
  }

  return Math.round(dayStats.totalAccuracy / dayStats.completedOrders);
}

function getAverageWait(dayStats) {
  if (!dayStats || dayStats.completedOrders === 0) {
    return "0.0s";
  }

  return formatDuration(dayStats.totalWaitMs / dayStats.completedOrders);
}

function generateCustomerOrder(dayNumber, sequenceNumber, customerProfile) {
  var lineCount = getLineCountForDay(dayNumber);
  var lines = [];
  var speechLines = [];
  var i = 0;

  for (i = 0; i < lineCount; i += 1) {
    lines.push(generateOrderLine(dayNumber, sequenceNumber, i));
  }
  speechLines = buildGroupedSpeechLines(lines);

  return {
    lines: lines,
    spokenText: buildFullOrderSpeech(speechLines, customerProfile),
    paymentMethod: pickPaymentMethod(),
    pickupName: pickPickupName(),
    pickupNameKnown: false,
    enteredPickupName: ""
  };
}

function pickCustomerArchetype() {
  return CUSTOMER_ARCHETYPES[Math.floor(Math.random() * CUSTOMER_ARCHETYPES.length)];
}

function pickPickupName() {
  return PICKUP_NAMES[Math.floor(Math.random() * PICKUP_NAMES.length)];
}

function buildGroupedSpeechLines(lines) {
  var grouped = [];
  var used = {};
  var i = 0;
  var j = 0;
  var count = 0;
  var line = null;

  for (i = 0; i < lines.length; i += 1) {
    if (used[i]) {
      continue;
    }

    line = lines[i];
    count = 1;

    if (line.stackableSpeechKey) {
      for (j = i + 1; j < lines.length; j += 1) {
        if (used[j]) {
          continue;
        }

        if (lines[j].stackableSpeechKey === line.stackableSpeechKey) {
          count += 1;
          used[j] = true;
        }
      }
    }

    grouped.push(count > 1 ? count + " " + line.stackablePluralLabel : line.spokenText);
  }

  return grouped;
}

function getLineCountForDay(dayNumber) {
  var roll = Math.random();

  if (dayNumber <= 2) {
    return roll < 0.75 ? 1 : 2;
  }

  if (dayNumber <= 5) {
    if (roll < 0.45) {
      return 1;
    }
    if (roll < 0.9) {
      return 2;
    }
    return 3;
  }

  if (roll < 0.2) {
    return 1;
  }
  if (roll < 0.75) {
    return 2;
  }
  return 3;
}

function generateOrderLine(dayNumber, sequenceNumber, lineIndex) {
  if (Math.random() < getFoodChance(dayNumber)) {
    return buildFoodOrderLine();
  }

  return buildDrinkOrderLine(dayNumber, sequenceNumber, lineIndex);
}

function getFoodChance(dayNumber) {
  if (dayNumber <= 2) {
    return 0.18;
  }
  if (dayNumber <= 5) {
    return 0.24;
  }
  return 0.28;
}

function buildFoodOrderLine() {
  var category = getCategoryById("food");
  var item = category.items[Math.floor(Math.random() * category.items.length)];

  return {
    itemId: item.id,
    label: item.label,
    selections: {},
    spokenText: "a " + item.label.toLowerCase(),
    stackableSpeechKey: item.id,
    stackablePluralLabel: pluralizeSimpleItemLabel(item.label.toLowerCase())
  };
}

function pluralizeSimpleItemLabel(label) {
  if (label === "croissant") {
    return "croissants";
  }

  if (label === "doughnut") {
    return "doughnuts";
  }

  if (label.slice(-1) === "s") {
    return label;
  }

  return label + "s";
}

function buildDrinkOrderLine(dayNumber) {
  var category = getCategoryById("drinks");
  var item = category.items[Math.floor(Math.random() * category.items.length)];
  var selections = {};
  var baseSpeechParts = ["a"];
  var modifierPhrases = [];
  var defaults = buildDefaultSelections(item);
  var complexity = getModifierComplexity(dayNumber);
  var tempRoll = Math.random();
  var milkLabel = "";

  selections.size = pickSizeForDay(dayNumber);
  baseSpeechParts.push(getOptionLabel(item, "size", selections.size).toLowerCase());

  if (tempRoll < 0.33) {
    selections.type = "iced";
    baseSpeechParts.push("iced");
  } else if (tempRoll > 0.92 && dayNumber >= 4) {
    selections.type = "decaf";
    baseSpeechParts.push("decaf");
  }
  baseSpeechParts.push(item.label.toLowerCase());

  if (complexity >= 2 && Math.random() < 0.45) {
    selections.milk = pickMilkForDay(dayNumber);
    milkLabel = getOptionLabel(item, "milk", selections.milk).toLowerCase();
    modifierPhrases.push(milkLabel + " milk");
  }

  if (complexity >= 2 && Math.random() < 0.28) {
    selections["espresso-shot"] = { "extra-shot": 1 };
    modifierPhrases.push("an extra shot");
  }

  if (complexity >= 3 && Math.random() < 0.38) {
    selections.sweeteners = {};
    if (Math.random() < 0.6) {
      selections.sweeteners.sugar = 1 + Math.floor(Math.random() * 2);
      modifierPhrases.push(selections.sweeteners.sugar + " sugar");
    } else if (Math.random() < 0.5) {
      selections.sweeteners.splenda = 1 + Math.floor(Math.random() * 2);
      modifierPhrases.push(selections.sweeteners.splenda + " splenda");
    } else {
      selections.sweeteners.stevia = true;
      modifierPhrases.push("stevia");
    }
  }

  if (complexity >= 4 && Math.random() < 0.35) {
    selections["add-ons"] = {};
    selections["add-ons"][Math.random() < 0.5 ? "whipped-cream" : "cold-foam"] = true;
    modifierPhrases.push(getSelectedMultiLabels(findModifierGroup(item, "add-ons"), selections["add-ons"]).join(" and "));
  }

  if (complexity >= 5 && Math.random() < 0.32) {
    selections.flavors = {};
    selections.flavors[pickFlavor()] = true;
    modifierPhrases.push(getSelectedMultiLabels(findModifierGroup(item, "flavors"), selections.flavors).join(" and "));
  }

  return {
    itemId: item.id,
    label: item.label,
    selections: mergeExpectedSelections(defaults, selections),
    spokenText: buildDrinkSpokenText(baseSpeechParts, modifierPhrases)
  };
}

function buildDrinkSpokenText(baseSpeechParts, modifierPhrases) {
  var baseText = baseSpeechParts.join(" ");

  if (!modifierPhrases || modifierPhrases.length === 0) {
    return baseText;
  }

  return baseText + " with " + joinPhrasesNaturally(modifierPhrases);
}

function joinPhrasesNaturally(parts) {
  var leading = [];

  if (!parts || parts.length === 0) {
    return "";
  }

  if (parts.length === 1) {
    return parts[0];
  }

  if (parts.length === 2) {
    return parts[0] + " and " + parts[1];
  }

  leading = parts.slice(0, parts.length - 1);
  return leading.join(", ") + ", and " + parts[parts.length - 1];
}

function getModifierComplexity(dayNumber) {
  if (dayNumber <= 2) {
    return 2;
  }
  if (dayNumber <= 4) {
    return 3;
  }
  if (dayNumber <= 6) {
    return 4;
  }
  return 5;
}

function pickSizeForDay(dayNumber) {
  var options = ["small", "medium", "large"];

  if (dayNumber >= 5) {
    options.push("extra-large");
  }

  return options[Math.floor(Math.random() * options.length)];
}

function pickMilkForDay(dayNumber) {
  var milks = ["whole", "two-percent", "non-fat"];

  if (dayNumber >= 3) {
    milks = milks.concat(["oat", "almond", "soy"]);
  }

  return milks[Math.floor(Math.random() * milks.length)];
}

function pickFlavor() {
  var flavors = ["hazelnut", "lavender", "peach", "salted-caramel", "irish-creme", "chocolate"];

  return flavors[Math.floor(Math.random() * flavors.length)];
}

function getSelectedMultiLabels(group, selectedValue) {
  var labels = [];
  var i = 0;

  if (!group || !selectedValue) {
    return labels;
  }

  for (i = 0; i < group.options.length; i += 1) {
    if (selectedValue[group.options[i].id]) {
      labels.push(group.options[i].label.toLowerCase());
    }
  }

  return labels;
}

function getOptionLabel(item, groupId, optionId) {
  var group = findModifierGroup(item, groupId);
  var option = null;

  if (!group) {
    return optionId;
  }

  option = findOptionById(group.options, optionId);
  return option ? option.label : optionId;
}

function buildFullOrderSpeech(speechLines, customerProfile) {
  var profile = customerProfile || CUSTOMER_ARCHETYPES[0];
  var intro = pickOne(profile.intros);
  var outro = pickOne(profile.outros);

  if (speechLines.length === 0) {
    return "Hello?";
  }

  return intro + buildSpeechLineList(speechLines, profile.joiners) + outro;
}

function buildSpeechLineList(speechLines, joiners) {
  if (speechLines.length === 1) {
    return speechLines[0];
  }

  if (speechLines.length === 2) {
    return speechLines[0] + pickOne(joiners.two) + speechLines[1];
  }

  return speechLines[0] +
    pickOne(joiners.middle) +
    speechLines[1] +
    pickOne(joiners.last) +
    speechLines[2];
}

function pickOne(options) {
  if (!options || options.length === 0) {
    return "";
  }

  return options[Math.floor(Math.random() * options.length)];
}

function pickPaymentMethod() {
  var roll = Math.random();

  if (roll < 0.48) {
    return "cash";
  }
  return "card";
}

function getPaymentMethodLabel(method) {
  if (method === "cash") {
    return "Cash";
  }
  if (method === "card") {
    return "Card";
  }
  return "Coupon";
}

function generateCouponCode() {
  return "SAVE-" + (1000 + Math.floor(Math.random() * 9000));
}

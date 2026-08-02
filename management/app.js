const startScreen = document.querySelector("#startScreen");
const dashboard = document.querySelector("#dashboard");
const startButton = document.querySelector("#startButton");
const homeButton = document.querySelector("#homeButton");

function openDashboard() {
  if (!startScreen || !dashboard) return;
  startScreen.hidden = true;
  dashboard.hidden = false;
  window.scrollTo(0, 0);
  document.querySelector(".action-button")?.focus();
}

function openStartScreen(event) {
  event?.preventDefault();
  if (!startScreen || !dashboard) return;
  dashboard.hidden = true;
  startScreen.hidden = false;
  history.replaceState(null, "", location.pathname);
  window.scrollTo(0, 0);
  startButton?.focus();
}

startButton?.addEventListener("click", openDashboard);
homeButton?.addEventListener("click", openStartScreen);

if (location.hash === "#overview") {
  openDashboard();
}

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((link) => link.classList.remove("active"));
    item.classList.add("active");
  });
});

function ensureDialog(id, content) {
  let dialog = document.querySelector("#" + id);
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = id;
    dialog.className = "prototype-modal";
    dialog.innerHTML = content;
    document.body.append(dialog);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.querySelectorAll("[data-close-modal]").forEach((button) => {
      button.addEventListener("click", () => dialog.close());
    });
  }
  return dialog;
}

const advanceMarkup = `
  <div class="modal-header">
    <div><p class="section-kicker">Day advanced · August 4, 2026</p><h3>Day 05 briefing</h3></div>
    <button class="modal-close" data-close-modal aria-label="Close">×</button>
  </div>
  <div class="modal-body">
    <p><strong>Three events require your attention.</strong></p>
    <div class="advance-event"><span>01</span><div><b>Cal Foster response window</b><small>His agent wants an indication before Day 10. No formal offer has been submitted.</small></div></div>
    <div class="advance-event"><span>02</span><div><b>Noah Warren cleared</b><small>Warren has returned to full practice and should be available against Phoenix.</small></div></div>
    <div class="advance-event"><span>03</span><div><b>Phoenix signs Damon Mercer</b><small>Your next opponent filled its final roster spot. The scouting report needs revision.</small></div></div>
  </div>
  <div class="modal-actions"><a class="action-button button-link" href="inbox.html">Open inbox</a><button class="utility-button" data-close-modal>Continue</button></div>`;

document.querySelectorAll('a[href="advance-day.html"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    ensureDialog("advanceDayModal", advanceMarkup).showModal();
  });
});

const players = {
  "Marcus Hill": ["07","PG","28","82","$8.4M","3 years","Captain · Floor general"],
  "Andre Webb": ["22","PF","25","79","$6.1M","2 years","Starter · Two-way forward"],
  "Leo Santos": ["14","SF","23","76","$3.8M","4 years","Starter · Emerging scorer"],
  "Cal Foster": ["31","C","31","74","$5.7M","1 year","Starter · Contract expiring"],
  "Eli Brooks": ["03","SG","20","68","$1.2M","3 years","Prospect · High upside"],
  "Jordan Kim": ["09","SG","27","75","$4.9M","1 year","Sixth man · Extension requested"],
  "Miles Price": ["18","C","26","73","$3.6M","2 years","Rotation · Interior defender"],
  "Noah Warren": ["04","PG","24","72","$2.8M","2 years","Rotation · Recently cleared"],
  "Darius Cole": ["12","SF","29","71","$3.1M","1 year","Rotation · Veteran wing"],
  "Sam Okafor": ["25","PF","22","69","$1.7M","3 years","Development · Rebounder"],
  "Trey Vaughn": ["06","SG","30","70","$2.4M","1 year","Veteran · Bench shooter"],
  "Benji Shaw": ["44","C","21","66","$1.1M","2 years","Development · G League"],
  "Owen Park": ["01","PG","23","65","$1.0M","1 year","Reserve · Depth guard"],
  "Micah Ford": ["27","SF","20","64","$0.6M","1 year","Two-way · Development"],
  "Nico Bell": ["33","PF","24","67","$0.6M","1 year","Two-way · Energy big"]
};

function openPlayer(name) {
  const p = players[name] || ["—","—","—","—","—","—","Roster player"];
  const markup = `
    <div class="modal-header">
      <div><p class="section-kicker">Player profile</p><h3>${name}</h3></div>
      <button class="modal-close" data-close-modal aria-label="Close">×</button>
    </div>
    <div class="modal-body">
      <div class="player-modal-summary">
        <div class="player-modal-number">${p[0]}</div>
        <div class="player-modal-meta"><h4>${name}</h4><p>${p[6]}</p>
          <div class="player-detail-grid">
            <div><span>Position</span><b>${p[1]}</b></div>
            <div><span>Age</span><b>${p[2]}</b></div>
            <div><span>Overall</span><b>${p[3]}</b></div>
          </div>
        </div>
      </div>
      <div class="player-detail-grid">
        <div><span>Salary</span><b>${p[4]}</b></div>
        <div><span>Contract</span><b>${p[5]}</b></div>
        <div><span>Status</span><b>Available</b></div>
      </div>
    </div>
    <div class="modal-actions"><button class="action-button" data-close-modal>Done</button><button class="utility-button">Full profile</button></div>`;
  const old = document.querySelector("#playerDetailModal");
  old?.remove();
  ensureDialog("playerDetailModal", markup).showModal();
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-player]");
  if (!target) return;
  event.preventDefault();
  openPlayer(target.dataset.player);
});

document.addEventListener("keydown", (event) => {
  if ((event.key === "Enter" || event.key === " ") && event.target.matches(".player-card[data-player]")) {
    event.preventDefault();
    openPlayer(event.target.dataset.player);
  }
});

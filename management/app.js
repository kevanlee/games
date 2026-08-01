const startScreen = document.querySelector("#startScreen");
const dashboard = document.querySelector("#dashboard");
const startButton = document.querySelector("#startButton");
const homeButton = document.querySelector("#homeButton");

function openDashboard() {
  startScreen.hidden = true;
  dashboard.hidden = false;
  window.scrollTo(0, 0);
  document.querySelector(".action-button").focus();
}

function openStartScreen(event) {
  event.preventDefault();
  dashboard.hidden = true;
  startScreen.hidden = false;
  window.scrollTo(0, 0);
  startButton.focus();
}

startButton.addEventListener("click", openDashboard);
homeButton.addEventListener("click", openStartScreen);

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((link) => link.classList.remove("active"));
    item.classList.add("active");
  });
});

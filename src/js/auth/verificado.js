document.addEventListener("DOMContentLoaded", () => {
  const REDIRECT_URL = "/iniciarsesion";
  let seconds = 5;

  const mainCountdownEl = document.getElementById("countdown-main");
  const secondsBoxEl = document.getElementById("countdown-seconds");
  const redirectLink = document.getElementById("redirect-link");

  const updateUI = () => {
    if (mainCountdownEl) {
      mainCountdownEl.textContent = seconds;
    }
    if (secondsBoxEl) {
      secondsBoxEl.textContent = String(seconds).padStart(2, "0");
    }
  };

  updateUI();

  const interval = setInterval(() => {
    seconds--;
    updateUI();

    if (seconds <= 0) {
      clearInterval(interval);
      window.location.href = REDIRECT_URL;
    }
  }, 1000);

  if (redirectLink) {
    redirectLink.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = REDIRECT_URL;
    });
  }
});

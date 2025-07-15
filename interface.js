import { toggleSound } from "./som.js";

export function initInterface({ scoreRef, resetGame, togglePause, getPaused }) {
  const pauseBtn = document.getElementById("pauseBtn");
  const toggleSoundBtn = document.getElementById("toggle-sound");

  document.getElementById("startBtn").addEventListener("click", resetGame);
  document.getElementById("resetBtn").addEventListener("click", resetGame);

  pauseBtn.addEventListener("click", () => {
    togglePause();
    pauseBtn.textContent = getPaused() ? "▶ Retomar" : "⏸ Pausar";
  });

  toggleSoundBtn.addEventListener("click", () => toggleSound(toggleSoundBtn));

  document.getElementById("save-score-btn").addEventListener("click", () => {
    const name = document.getElementById("player-name").value.trim();
    if (name) {
      const scores = JSON.parse(localStorage.getItem("scores")) || [];
      scores.push({ name, score: scoreRef() });
      scores.sort((a, b) => b.score - a.score);
      scores.splice(10);
      localStorage.setItem("scores", JSON.stringify(scores));
      location.reload();
    } else {
      alert("Por favor, insere o teu nome.");
    }
  });

  const scores = JSON.parse(localStorage.getItem("scores")) || [];
  const medals = ["🥇", "🥈", "🥉"];
  const rankingList = document.getElementById("ranking-list");
  rankingList.innerHTML = scores
    .map((entry, i) => `<li>${medals[i] || (i + 1)}. ${entry.name} - ${entry.score}</li>`)
    .join("");
}

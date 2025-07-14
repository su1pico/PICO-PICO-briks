const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const nextCanvas = document.getElementById("next");
const nextCtx = nextCanvas.getContext("2d");

const levelEl = document.getElementById("level");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const startBtn = document.getElementById("startBtn");
const toggleMusicBtn = document.getElementById("toggle-music");

const bgMusic = document.getElementById("bg-music");
const gameOverSound = document.getElementById("gameover-sound");
const winSound = document.getElementById("win-sound");

const modal = document.getElementById("modal");
const finalScore = document.getElementById("final-score");
const starsContainer = document.getElementById("stars-container");
const playerNameInput = document.getElementById("player-name");
const saveScoreBtn = document.getElementById("save-score-btn");
const shareScoreBtn = document.getElementById("share-score-btn");

let isMusicPlaying = false;

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 32;

canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;
nextCanvas.width = 4 * BLOCK_SIZE;
nextCanvas.height = 4 * BLOCK_SIZE;

const COLORS = [null, "#FF5733", "#33FF57", "#3357FF", "#FF33A8", "#33FFF5", "#F5FF33", "#FF8F33"];
const SHAPES = [ [], [[1,1,1,1]], [[2,2],[2,2]], [[0,3,0],[3,3,3]], [[4,4,0],[0,4,4]], [[0,5,5],[5,5,0]], [[6,0,0],[6,6,6]], [[0,0,7],[7,7,7]] ];

let board, currentPiece, nextPiece, pos, score, level, linesCleared, dropInterval, dropCounter, lastTime, gameOver, startTime;

function createMatrix(w, h) {
  return Array.from({ length: h }, () => Array(w).fill(0));
}

function drawMatrix(matrix, offset, context = ctx) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        const color = COLORS[value];
        const gx = x + offset.x;
        const gy = y + offset.y;
        const gradient = context.createLinearGradient(gx * BLOCK_SIZE, gy * BLOCK_SIZE, (gx + 1) * BLOCK_SIZE, (gy + 1) * BLOCK_SIZE);
        gradient.addColorStop(0, "#ffffff");
        gradient.addColorStop(1, color);
        context.fillStyle = gradient;
        context.strokeStyle = "#222";
        context.lineWidth = 2;
        context.shadowColor = "rgba(0, 0, 0, 0.4)";
        context.shadowBlur = 6;
        context.fillRect(gx * BLOCK_SIZE, gy * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        context.strokeRect(gx * BLOCK_SIZE, gy * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        context.shadowColor = "transparent";
        context.shadowBlur = 0;
      }
    });
  });
}

function collide(board, piece, pos) {
  return piece.some((row, y) => row.some((val, x) => val !== 0 && (board[y + pos.y] && board[y + pos.y][x + pos.x]) !== 0));
}

function merge(board, piece, pos) {
  piece.forEach((row, y) => row.forEach((value, x) => {
    if (value !== 0) board[y + pos.y][x + pos.x] = value;
  }));
}

function rotate(matrix, dir) {
  const res = matrix[0].map((_, i) => matrix.map(row => row[i]));
  matrix.length = 0;
  res.forEach(row => matrix.push(dir > 0 ? row.reverse() : row));
}

function resetPiece() {
  currentPiece = nextPiece;
  nextPiece = randomPiece();
  pos = { x: Math.floor(COLS/2) - Math.floor(currentPiece[0].length/2), y: 0 };
  if (collide(board, currentPiece, pos)) {
    gameOver = true;
    showGameOverModal();
    gameOverSound.play();
  }
}

function randomPiece() {
  const index = Math.floor(Math.random() * (SHAPES.length - 1)) + 1;
  return SHAPES[index].map(row => row.slice());
}

function clearLines() {
  let lines = 0;
  outer: for (let y = board.length - 1; y >= 0; y--) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x] === 0) continue outer;
    }
    const row = board.splice(y, 1)[0].fill(0);
    board.unshift(row);
    lines++;
    y++;
  }
  if (lines > 0) {
    linesCleared += lines;
    score += lines * 100 * level;
    if (linesCleared >= level * 10) {
      level++;
      dropInterval *= 0.9;
    }
  }
  updateScore();
}

function updateScore() {
  scoreEl.textContent = score;
  levelEl.textContent = level;
}

function draw() {
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawMatrix(board, { x: 0, y: 0 }, ctx);
  drawMatrix(currentPiece, pos, ctx);
  nextCtx.fillStyle = "#222";
  nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
  drawMatrix(nextPiece, { x: 1, y: 1 }, nextCtx);
}

function update(time = 0) {
  if (gameOver) return;
  if (!lastTime) lastTime = time;
  const deltaTime = time - lastTime;
  dropCounter += deltaTime;

  if (dropCounter > dropInterval) {
    pos.y++;
    if (collide(board, currentPiece, pos)) {
      pos.y--;
      merge(board, currentPiece, pos);
      clearLines();
      resetPiece();
    }
    dropCounter = 0;
  }

  draw();
  updateTimer();
  lastTime = time;
  requestAnimationFrame(update);
}

function updateTimer() {
  const elapsed = Date.now() - startTime;
  const h = Math.floor(elapsed / 3600000);
  const m = Math.floor((elapsed % 3600000) / 60000);
  const s = Math.floor((elapsed % 60000) / 1000);
  timeEl.textContent = `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
}

function showGameOverModal() {
  finalScore.textContent = `Pontuação: ${score}`;
  showStars(score);
  if (score > 3000) winSound.play();
  modal.classList.add("show");
}

function showStars(score) {
  starsContainer.innerHTML = "";
  let starCount = score > 8000 ? 3 : score > 4000 ? 2 : score > 1000 ? 1 : 0;
  for (let i = 0; i < 3; i++) {
    const star = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    star.setAttribute("class", "star");
    star.setAttribute("viewBox", "0 0 24 24");
    star.innerHTML = `<path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.758 1.496 8.281L12 18.897l-7.432 4.448 1.496-8.281-6.064-5.758 8.332-1.151z" fill="${i < starCount ? '#fa8231' : '#ddd'}"/>`;
    starsContainer.appendChild(star);
  }
}

function saveScore() {
  const name = playerNameInput.value.trim();
  if (name.length < 3) {
    alert("Por favor, escreve um nome com pelo menos 3 letras.");
    return;
  }
  const storedScores = JSON.parse(localStorage.getItem("picoPicoScores") || "[]");
  storedScores.push({ name, score });
  storedScores.sort((a, b) => b.score - a.score);
  localStorage.setItem("picoPicoScores", JSON.stringify(storedScores.slice(0, 10)));
  alert("Pontuação guardada!");
}

function shareScore() {
  const name = playerNameInput.value.trim() || "Anónimo";
  const shareText = `No jogo Desafio Pico-Pico, ${name} fez ${score} pontos! Consegues superar? #DesafioPicoPico`;
  if (navigator.share) {
    navigator.share({ title: "Desafio Pico-Pico", text: shareText, url: window.location.href }).catch(console.error);
  } else {
    navigator.clipboard.writeText(shareText).then(() => alert("Texto copiado para o clipboard!"));
  }
}

function startGame() {
  board = createMatrix(COLS, ROWS);
  score = 0;
  level = 1;
  linesCleared = 0;
  dropInterval = 1000;
  dropCounter = 0;
  lastTime = 0;
  gameOver = false;
  startTime = Date.now();
  currentPiece = randomPiece();
  nextPiece = randomPiece();
  pos = { x: Math.floor(COLS/2) - Math.floor(currentPiece[0].length/2), y: 0 };
  modal.classList.remove("show");
  updateScore();
  update();
  if (!isMusicPlaying) {
    bgMusic.volume = 0.4;
    bgMusic.play();
    isMusicPlaying = true;
    toggleMusicBtn.textContent = "🔊";
  }
}

document.addEventListener("keydown", event => {
  if (gameOver) return;
  if (event.key === "ArrowLeft") { pos.x--; if (collide(board, currentPiece, pos)) pos.x++; }
  else if (event.key === "ArrowRight") { pos.x++; if (collide(board, currentPiece, pos)) pos.x--; }
  else if (event.key === "ArrowDown") {
    pos.y++;
    if (collide(board, currentPiece, pos)) {
      pos.y--;
      merge(board, currentPiece, pos);
      clearLines();
      resetPiece();
    }
    dropCounter = 0;
  } else if (event.key === "ArrowUp") {
    rotate(currentPiece, 1);
    if (collide(board, currentPiece, pos)) rotate(currentPiece, -1);
  }
});

startBtn.addEventListener("click", startGame);
saveScoreBtn.addEventListener("click", saveScore);
shareScoreBtn.addEventListener("click", shareScore);
toggleMusicBtn.addEventListener("click", () => {
  if (bgMusic.paused) {
    bgMusic.play();
    toggleMusicBtn.textContent = "🔊";
  } else {
    bgMusic.pause();
    toggleMusicBtn.textContent = "🔇";
  }
});

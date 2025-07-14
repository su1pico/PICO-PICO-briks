const nextCanvas = document.getElementById("next");
const nextCtx = nextCanvas.getContext("2d");
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

const levelEl = document.getElementById("level");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const startBtn = document.getElementById("startBtn");
const toggleSoundBtn = document.getElementById("toggle-sound");

const musicaFundo = document.getElementById("musica-fundo");
const somRodar = document.getElementById("som-rodar");
const somColidir = document.getElementById("som-colidir");
const somPontos = document.getElementById("som-pontos");
const somPerdeu = document.getElementById("som-perdeu");

let somAtivo = true;
let paused = false;

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 32;

canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;
nextCanvas.width = 4 * BLOCK_SIZE;
nextCanvas.height = 4 * BLOCK_SIZE;

const COLORS = [
  null,
  "#FF5733", "#33FF57", "#3357FF", "#FF33A8",
  "#33FFF5", "#F5FF33", "#FF8F33"
];

const SHAPES = [
  [],
  [[1,1,1,1]],
  [[2,2],[2,2]],
  [[0,3,0],[3,3,3]],
  [[4,4,0],[0,4,4]],
  [[0,5,5],[5,5,0]],
  [[6,0,0],[6,6,6]],
  [[0,0,7],[7,7,7]],
];

let board, currentPiece, nextPiece, pos, score, level, linesCleared;
let dropInterval, dropCounter, lastTime, gameOver, startTime;
let animationId = null;

function playSound(audio) {
  if (somAtivo) {
    audio.currentTime = 0;
    audio.play();
  }
}

function createMatrix(w, h) {
  return Array.from({ length: h }, () => Array(w).fill(0));
}

function drawMatrix(matrix, offset, context = ctx) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        const color = COLORS[value];
        const gx = (x + offset.x);
        const gy = (y + offset.y);
        const gradient = context.createLinearGradient(
          gx * BLOCK_SIZE, gy * BLOCK_SIZE,
          gx * BLOCK_SIZE, gy * BLOCK_SIZE + BLOCK_SIZE
        );
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, "#000000");
        context.fillStyle = gradient;
        context.strokeStyle = "rgba(0,0,0,0.6)";
        context.lineWidth = 2;
        context.fillRect(gx * BLOCK_SIZE, gy * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        context.strokeRect(gx * BLOCK_SIZE, gy * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
    });
  });
}

function collide(board, piece, pos) {
  for (let y = 0; y < piece.length; y++) {
    for (let x = 0; x < piece[y].length; x++) {
      if (piece[y][x] !== 0 &&
         (board[y + pos.y] && board[y + pos.y][x + pos.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function merge(board, piece, pos) {
  piece.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        board[y + pos.y][x + pos.x] = value;
      }
    });
  });
  playSound(somColidir);
}

function rotate(matrix, dir) {
  // Transpose
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < y; x++) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if (dir > 0) {
    matrix.forEach(row => row.reverse());
  } else {
    matrix.reverse();
  }
  return matrix;
}

function resetPiece() {
  currentPiece = nextPiece;
  nextPiece = randomPiece();
  pos = {
    x: Math.floor(COLS / 2) - Math.floor(currentPiece[0].length / 2),
    y: 0
  };
  if (collide(board, currentPiece, pos)) {
    gameOver = true;
    playSound(somPerdeu);
    showGameOverModal();
  }
}

function randomPiece() {
  const index = Math.floor(Math.random() * (SHAPES.length - 1)) + 1;
  return SHAPES[index].map(row => row.slice());
}

function clearLines() {
  let lines = 0;
  outer: for (let y = board.length -1; y >= 0; y--) {
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
    score += lines * lines * 100;
    level = Math.min(10, Math.floor(linesCleared / 10) + 1);
    playSound(somPontos);
    updateInfo();
    dropInterval = 1000 - (level - 1) * 80;
  }
}

function updateInfo() {
  levelEl.textContent = level;
  scoreEl.textContent = score;
}

function updateTime() {
  const elapsed = Date.now() - startTime;
  const min = Math.floor(elapsed / 60000);
  const sec = Math.floor((elapsed % 60000) / 1000);
  timeEl.textContent = `${min.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
}

function draw() {
  ctx.fillStyle = "rgba(50, 50, 100, 0.3)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawMatrix(board, { x: 0, y: 0 });
  drawMatrix(currentPiece, pos);

  drawNext();
}

function drawNext() {
  nextCtx.fillStyle = "rgba(20, 20, 40, 0.6)";
  nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
  const offsetX = Math.floor((4 - nextPiece[0].length) / 2);
  const offsetY = Math.floor((4 - nextPiece.length) / 2);
  drawMatrix(nextPiece, { x: offsetX, y: offsetY }, nextCtx);
}

function drop() {
  if (paused || gameOver) return;
  pos.y++;
  if (collide(board, currentPiece, pos)) {
    pos.y--;
    merge(board, currentPiece, pos);
    resetPiece();
    clearLines();
  }
  dropCounter = 0;
}

function move(dir) {
  if (paused || gameOver) return;
  pos.x += dir;
  if (collide(board, currentPiece, pos)) {
    pos.x -= dir;
  }
}

function hardDrop() {
  if (paused || gameOver) return;
  while (!collide(board, currentPiece, { x: pos.x, y: pos.y + 1 })) {
    pos.y++;
  }
  merge(board, currentPiece, pos);
  resetPiece();
  clearLines();
  dropCounter = 0;
}

function rotatePiece(dir) {
  if (paused || gameOver) return;
  const rotated = rotate(currentPiece.map(row => row.slice()), dir);
  const oldX = pos.x;
  let offset = 0;
  while (collide(board, rotated, { x: pos.x, y: pos.y })) {
    pos.x += (offset = -(offset > 0 ? offset : -offset + 1));
    if (offset > rotated[0].length) {
      pos.x = oldX;
      return;
    }
  }
  currentPiece = rotated;
  playSound(somRodar);
}

function update(time = 0) {
  if (gameOver) {
    cancelAnimationFrame(animationId);
    return;
  }
  const deltaTime = time - lastTime;
  lastTime = time;
  if (!paused) {
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
      drop();
    }
    updateTime();
  }
  draw();
  animationId = requestAnimationFrame(update);
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
  paused = false;
  startTime = Date.now();
  nextPiece = randomPiece();
  resetPiece();
  updateInfo();
  updateTime();
  musicaFundo.play();
  animationId = requestAnimationFrame(update);
}

function pauseGame() {
  paused = !paused;
  if (paused) {
    musicaFundo.pause();
    pauseBtn.textContent = "▶️ Continuar";
  } else {
    musicaFundo.play();
    pauseBtn.textContent = "⏸ Pausar";
    lastTime = performance.now();
    animationId = requestAnimationFrame(update);
  }
}

function resetGame() {
  musicaFundo.pause();
  musicaFundo.currentTime = 0;
  cancelAnimationFrame(animationId);
  gameOver = true;
  paused = false;
  draw();
  updateInfo();
  updateTime();
  clearModal();
}

const modal = document.getElementById("modal");
const finalScore = document.getElementById("final-score");
const playerNameInput = document.getElementById("player-name");
const saveScoreBtn = document.getElementById("save-score-btn");
const rankingList = document.getElementById("ranking-list");

function showGameOverModal() {
  finalScore.textContent = `Pontuação: ${score}`;
  modal.classList.add("show");
  playerNameInput.value = "";
  playerNameInput.focus();
  musicaFundo.pause();
}

function clearModal() {
  modal.classList.remove("show");
}

function saveScore() {
  const name = playerNameInput.value.trim();
  if (!name) {
    alert("Por favor, insere um nome válido.");
    playerNameInput.focus();
    return;
  }
  let ranking = JSON.parse(localStorage.getItem("picoPicoRanking") || "[]");
  ranking.push({ name, score });
  ranking.sort((a,b) => b.score - a.score);
  ranking = ranking.slice(0, 10);
  localStorage.setItem("picoPicoRanking", JSON.stringify(ranking));
  updateRankingDisplay();
  clearModal();
}

function updateRankingDisplay() {
  let ranking = JSON.parse(localStorage.getItem("picoPicoRanking") || "[]");
  rankingList.innerHTML = ranking
    .map((item, i) => `<li>${i+1}. ${item.name} - ${item.score} pts</li>`)
    .join("");
}

startBtn.addEventListener("click", () => {
  startGame();
});

document.getElementById("resetBtn").addEventListener("click", () => {
  resetGame();
});

document.getElementById("toggle-sound").addEventListener("click", () => {
  somAtivo = !somAtivo;
  toggleSoundBtn.textContent = somAtivo ? "🔊 Som" : "🔇 Mudo";
  if (somAtivo && !paused && !gameOver) musicaFundo.play();
  else musicaFundo.pause();
});

const pauseBtn = document.getElementById("pauseBtn");
pauseBtn.addEventListener("click", () => {
  if (!gameOver) pauseGame();
});

saveScoreBtn.addEventListener("click", saveScore);

playerNameInput.addEventListener("keydown", e => {
  if (e.key === "Enter") saveScore();
});

window.addEventListener("keydown", e => {
  if (gameOver || paused) return;

  switch (e.key) {
    case "ArrowLeft":
      move(-1);
      break;
    case "ArrowRight":
      move(1);
      break;
    case "ArrowDown":
      drop();
      break;
    case "ArrowUp":
      rotatePiece(1);
      break;
    case " ":
      e.preventDefault();
      hardDrop();
      break;
    case "p":
    case "P":
      pauseGame();
      break;
  }
});

document.getElementById("leftBtn").addEventListener("click", () => move(-1));
document.getElementById("rightBtn").addEventListener("click", () => move(1));
document.getElementById("downBtn").addEventListener("click", () => drop());
document.getElementById("rotateBtn").addEventListener("click", () => rotatePiece(1));

updateRankingDisplay();

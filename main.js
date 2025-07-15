import { playSound, sons } from "./som.js";
import { initInterface } from "./interface.js";

const nextCanvas = document.getElementById("next");
const nextCtx = nextCanvas.getContext("2d");
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

const levelEl = document.getElementById("level");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");

const COLS = 10;
const ROWS = 20;
let BLOCK_SIZE = 28;

let board, currentPiece, nextPiece, pos, score, level, linesCleared;
let dropInterval, dropCounter, lastTime, gameOver, startTime;
let animationId = null;
let paused = false;

function ajustarBlockSize() {
  const largura = canvas.parentElement.clientWidth;
  BLOCK_SIZE = Math.min(Math.floor(largura / COLS), 28);
  canvas.width = COLS * BLOCK_SIZE;
  canvas.height = ROWS * BLOCK_SIZE;
  nextCanvas.width = 4 * BLOCK_SIZE;
  nextCanvas.height = 4 * BLOCK_SIZE;
}

window.addEventListener("resize", () => {
  ajustarBlockSize();
  draw();
  drawNext();
});
window.addEventListener("load", () => {
  ajustarBlockSize();
  draw();
  drawNext();
  initInterface({
    scoreRef: () => score,
    resetGame,
    togglePause,
    getPaused: () => paused
  });
});

const COLORS = [
  null,
  "#FF3CAC",
  "#784BA0",
  "#29FFC6",
  "#F8FF00",
  "#00F0FF",
  "#FFB65C",
  "#FF4E50"
];

const SHAPES = [
  [],
  [[1,1,1,1]],
  [[2,2],[2,2]],
  [[0,3,0],[3,3,3]],
  [[4,4,0],[0,4,4]],
  [[0,5,5],[5,5,0]],
  [[6,0,0],[6,6,6]],
  [[0,0,7],[7,7,7]]
];

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
          (gx + 1) * BLOCK_SIZE, (gy + 1) * BLOCK_SIZE
        );
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
  for (let y = 0; y < piece.length; y++) {
    for (let x = 0; x < piece[y].length; x++) {
      if (piece[y][x] !== 0 && (board[y + pos.y] && board[y + pos.y][x + pos.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function merge(board, piece, pos) {
  piece.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) board[y + pos.y][x + pos.x] = value;
    });
  });
  playSound(sons.somColidir);
}

function rotate(matrix, dir) {
  const res = matrix[0].map((_, i) => matrix.map(row => row[i]));
  return dir > 0 ? res.reverse() : res.map(row => row.reverse());
}

function resetPiece() {
  currentPiece = nextPiece;
  nextPiece = randomPiece();
  pos = { x: Math.floor(COLS / 2) - Math.floor(currentPiece[0].length / 2), y: 0 };
  if (collide(board, currentPiece, pos)) {
    gameOver = true;
    playSound(sons.somPerdeu);
    showGameOverModal();
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
      dropInterval *= 0.8;
    }
    playSound(sons.somPontos);
  }
  updateScore();
}

function updateScore() {
  scoreEl.textContent = score;
  levelEl.textContent = level;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(253, 246, 227, 0.25)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawMatrix(board, { x: 0, y: 0 });
  if (currentPiece) drawMatrix(currentPiece, pos);
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, COLS * BLOCK_SIZE, ROWS * BLOCK_SIZE);
}

function drawNext() {
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const offsetX = Math.floor((4 - nextPiece[0].length) / 2);
  const offsetY = Math.floor((4 - nextPiece.length) / 2);
  drawMatrix(nextPiece, { x: offsetX, y: offsetY }, nextCtx);
}

function drop() {
  pos.y++;
  if (collide(board, currentPiece, pos)) {
    pos.y--;
    merge(board, currentPiece, pos);
    clearLines();
    resetPiece();
  }
  dropCounter = 0;
}

function move(dir) {
  pos.x += dir;
  if (collide(board, currentPiece, pos)) pos.x -= dir;
}

function rotatePiece(dir) {
  currentPiece = rotate(currentPiece, dir);
  if (collide(board, currentPiece, pos)) {
    currentPiece = rotate(currentPiece, -dir);
  } else {
    playSound(sons.somRodar);
  }
}

function update(time = 0) {
  if (gameOver || paused) return;

  if (!startTime) startTime = time;
  const deltaTime = time - lastTime;
  dropCounter += deltaTime;
  lastTime = time;

  if (dropCounter > dropInterval) drop();

  const elapsed = Math.floor((time - startTime) / 1000);
  const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const seconds = String(elapsed % 60).padStart(2, "0");
  timeEl.textContent = \`\${minutes}:\${seconds}\`;

  draw();
  drawNext();
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
  startTime = null;
  paused = false;

  nextPiece = randomPiece();
  resetPiece();
  updateScore();
  if (sons.musicaFundo) sons.musicaFundo.play();
  animationId = requestAnimationFrame(update);
}

function resetGame() {
  cancelAnimationFrame(animationId);
  sons.musicaFundo.currentTime = 0;
  startGame();
}

function togglePause() {
  paused = !paused;
  if (paused) {
    cancelAnimationFrame(animationId);
    sons.musicaFundo.pause();
  } else {
    lastTime = performance.now();
    if (sons.musicaFundo) sons.musicaFundo.play();
    animationId = requestAnimationFrame(update);
  }
}

function showGameOverModal() {
  const modal = document.getElementById("modal");
  const finalScore = document.getElementById("final-score");
  finalScore.textContent = \`Pontuação: \${score}\`;
  modal.classList.add("show");
}

window.addEventListener("keydown", (e) => {
  if (gameOver) return;
  if (e.key === "p" || e.key === "P") {
    togglePause();
    return;
  }
  switch (e.key) {
    case "ArrowLeft": move(-1); break;
    case "ArrowRight": move(1); break;
    case "ArrowDown": drop(); break;
    case "ArrowUp": rotatePiece(1); break;
  }
});

document.getElementById("leftBtn").addEventListener("click", () => move(-1));
document.getElementById("rightBtn").addEventListener("click", () => move(1));
document.getElementById("downBtn").addEventListener("click", drop);
document.getElementById("rotateBtn").addEventListener("click", () => rotatePiece(1));

// ======================
// 🎨 1. Inicialização de Canvas e Elementos DOM
// ======================
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

// ======================
// 🔢 2. Configuração do Tabuleiro
// ======================
const COLS = 10;
const ROWS = 20;
let BLOCK_SIZE = 32;

function ajustarBlockSize() {
  const largura = canvas.parentElement.clientWidth;
  const maxBlockSize = 28;
  BLOCK_SIZE = Math.min(Math.floor(largura / COLS), maxBlockSize);
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
});

// ======================
// 🧩 3. Definição de Cores e Formatos das Peças
// ======================
const COLORS = [
  null,
  "#FF3CAC", "#784BA0", "#29FFC6",
  "#F8FF00", "#00F0FF", "#FFB65C", "#FF4E50"
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

// ======================
// 🧠 4. Estado do Jogo
// ======================
let board, currentPiece, nextPiece, pos, score, level, linesCleared;
let dropInterval, dropCounter, lastTime, gameOver, startTime;
let animationId = null;

// ======================
// 🔊 5. Função de Áudio
// ======================
function playSound(audio) {
  if (somAtivo) {
    audio.currentTime = 0;
    audio.play();
  }
}

// ======================
// 🔧 6. Lógica de Peças e Colisões
// ======================
function createMatrix(w, h) {
  return Array.from({ length: h }, () => Array(w).fill(0));
}

function drawMatrix(matrix, offset, context = ctx) {
  if (!matrix) return; // ← PREVINE ERRO

  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        ctx.fillStyle = colors[value];
        ctx.fillRect(
          x + offset.x,
          y + offset.y,
          1, 1
        );
      }
    });
  });
}
        const color = COLORS[value];
        const gx = x + offset.x;
        const gy = y + offset.y;
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
  playSound(somColidir);
}

// ======================
// 🔄 7. Rotação e Reset de Peça
// ======================
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
    playSound(somPerdeu);
    showGameOverModal();
  }
}

function randomPiece() {
  const index = Math.floor(Math.random() * (SHAPES.length - 1)) + 1;
  return SHAPES[index].map(row => row.slice());
}

// ======================
// ✅ 8. Pontuação, Linhas e Níveis
// ======================
function clearLines() {
  let lines = 0;
  outer: for (let y = board.length - 1; y >= 0; y--) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x] === 0) continue outer;
    }
    board.splice(y, 1);
    board.unshift(new Array(COLS).fill(0));
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
    playSound(somPontos);
  }
  updateScore();
}

function updateScore() {
  scoreEl.textContent = score;
  levelEl.textContent = level;
}

// ======================
// 🖼️ 9. Renderização (Desenhar Jogo)
// ======================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Previne erro se player.matrix ainda não estiver carregado
  if (player.matrix) {
    drawMatrix(player.matrix, player.pos);
  }
  // Se tiveres um canvas para próxima peça:
  if (nextPiece && nextPiece.matrix) {
    drawNext(nextPiece.matrix); // ← ou função equivalente
  }
}
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

// ======================
// ⏬ 10. Movimento, Queda e Rotação
// ======================
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
    playSound(somRodar);
  }
}

// ======================
// ⏱️ 11. Lógica de Atualização (animação e tempo)
// ======================
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
  timeEl.textContent = `${minutes}:${seconds}`;

  draw();
  drawNext();
  animationId = requestAnimationFrame(update);
}

// ======================
// ▶️ 12. Início e Reinício
// ======================
function startGame() {
  player.matrix = createPiece(randomType());
  player.pos = { x: 3, y: 0 };
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
  if (somAtivo) musicaFundo.play();
  animationId = requestAnimationFrame(update);
}

function resetGame() {
  cancelAnimationFrame(animationId);
  musicaFundo.currentTime = 0;
  startGame();
}

// ======================
// ⏸️ 13. Pausa e Retomar
// ======================
function togglePause() {
  paused = !paused;
  if (paused) {
    cancelAnimationFrame(animationId);
    musicaFundo.pause();
  } else {
    lastTime = performance.now();
    if (somAtivo) musicaFundo.play();
    animationId = requestAnimationFrame(update);
  }
}

// ======================
// 🕹️ 14. Controles (Teclado e Botões)
// ======================
startBtn.addEventListener("click", startGame);
document.getElementById("resetBtn").addEventListener("click", resetGame);

toggleSoundBtn.addEventListener("click", () => {
  somAtivo = !somAtivo;
  toggleSoundBtn.textContent = somAtivo ? "🔊 Som" : "🔇 Silenciar";
  if (somAtivo) musicaFundo.play();
  else musicaFundo.pause();
});

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

// ======================
// 🏆 15. Ranking Local (Top 10)
// ======================
document.getElementById("save-score-btn").addEventListener("click", () => {
  const name = document.getElementById("player-name").value.trim();
  if (name) {
    const scores = JSON.parse(localStorage.getItem("scores")) || [];
    scores.push({ name, score });
    scores.sort((a, b) => b.score - a.score);
    scores.splice(10);
    localStorage.setItem("scores", JSON.stringify(scores));
    location.reload();
  } else {
    alert("Por favor, insere o teu nome.");
  }
});

function showGameOverModal() {
  const modal = document.getElementById("modal");
  const finalScore = document.getElementById("final-score");
  finalScore.textContent = `Pontuação: ${score}`;
  modal.classList.add("show");
}

function loadRanking() {
  const rankingList = document.getElementById("ranking-list");
  if (!rankingList) return;
  const scores = JSON.parse(localStorage.getItem("scores")) || [];
  const medals = ["🥇", "🥈", "🥉"];
  rankingList.innerHTML = scores
    .map((entry, i) => `<li>${medals[i] || (i + 1)}. ${entry.name} - ${entry.score}</li>`)
    .join("");
}
loadRanking();

// ======================
// 👆 16. Botões Touch / Mobile
// ======================
document.getElementById("pauseBtn").addEventListener("click", () => {
  togglePause();
  const btn = document.getElementById("pauseBtn");
  btn.textContent = paused ? "▶ Retomar" : "⏸ Pausar";
});

document.getElementById("leftBtn").addEventListener("click", () => move(-1));
document.getElementById("rightBtn").addEventListener("click", () => move(1));
document.getElementById("downBtn").addEventListener("click", drop);
document.getElementById("rotateBtn").addEventListener("click", () => rotatePiece(1));

// ======================
// 📱 17. Gestos de Toque
// ======================
let startX = 0;
let startY = 0;

canvas.addEventListener("touchstart", function (e) {
  const touch = e.touches[0];
  startX = touch.clientX;
  startY = touch.clientY;
});

canvas.addEventListener("touchend", function (e) {
  const touch = e.changedTouches[0];
  const deltaX = touch.clientX - startX;
  const deltaY = touch.clientY - startY;

  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  if (Math.max(absX, absY) < 20) {
    rotatePiece(1);
    return;
  }

  if (absX > absY) {
    deltaX > 0 ? move(1) : move(-1);
  } else if (deltaY > 0) {
    drop();
  }
});

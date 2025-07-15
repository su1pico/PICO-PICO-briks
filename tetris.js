// 🎨 Inicialização dos canvases de jogo e peça seguinte
const nextCanvas = document.getElementById("next");
const nextCtx = nextCanvas.getContext("2d");
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

// 🧾 Elementos da interface (nível, pontuação, tempo, botões)
const levelEl = document.getElementById("level");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const startBtn = document.getElementById("startBtn");
const toggleSoundBtn = document.getElementById("toggle-sound");

// 🔊 Elementos de áudio
const musicaFundo = document.getElementById("musica-fundo");
const somRodar = document.getElementById("som-rodar");
const somColidir = document.getElementById("som-colidir");
const somPontos = document.getElementById("som-pontos");
const somPerdeu = document.getElementById("som-perdeu");

// 🔧 Estado de som e pausa
let somAtivo = true;
let paused = false;

// 📐 Tamanho do tabuleiro
const COLS = 10;
const ROWS = 20;
let BLOCK_SIZE = 32;

// 📏 Ajustar tamanho dos blocos dinamicamente
function ajustarBlockSize() {
  const largura = canvas.parentElement.clientWidth;
  const maxBlockSize = 28;
  BLOCK_SIZE = Math.min(Math.floor(largura / COLS), maxBlockSize);
  canvas.width = COLS * BLOCK_SIZE;
  canvas.height = ROWS * BLOCK_SIZE;
  nextCanvas.width = 4 * BLOCK_SIZE;
  nextCanvas.height = 4 * BLOCK_SIZE;
}

// 📲 Ajuste automático ao redimensionar ou carregar página
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

// 🎨 Paleta de cores e formas das peças
const COLORS = [
  null,
  "#FF3CAC", "#784BA0", "#29FFC6",
  "#F8FF00", "#00F0FF", "#FFB65C", "#FF4E50"
];

const SHAPES = [
  [],
  [[1,1,1,1]],         // I
  [[2,2],[2,2]],       // O
  [[0,3,0],[3,3,3]],   // T
  [[4,4,0],[0,4,4]],   // S
  [[0,5,5],[5,5,0]],   // Z
  [[6,0,0],[6,6,6]],   // J
  [[0,0,7],[7,7,7]]    // L
];

// 🎮 Variáveis do jogo
let board, currentPiece, nextPiece, pos, score, level, linesCleared;
let dropInterval, dropCounter, lastTime, gameOver, startTime;
let animationId = null;

// 🔈 Função para tocar sons
function playSound(audio) {
  if (somAtivo) {
    audio.currentTime = 0;
    audio.play();
  }
}

// 📦 Criação da matriz (tabuleiro)
function createMatrix(w, h) {
  return Array.from({ length: h }, () => Array(w).fill(0));
}

// 🧱 Desenhar uma matriz (peça ou tabuleiro)
function drawMatrix(matrix, offset, context = ctx) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
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

// 💥 Verificar colisão entre peça e tabuleiro
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

// 🔗 Fundir peça ao tabuleiro
function merge(board, piece, pos) {
  piece.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) board[y + pos.y][x + pos.x] = value;
    });
  });
  playSound(somColidir);
}

// 🔄 Rodar uma matriz (peça)
function rotate(matrix, dir) {
  const res = matrix[0].map((_, i) => matrix.map(row => row[i]));
  return dir > 0 ? res.reverse() : res.map(row => row.reverse());
}

// ♻️ Resetar peça atual e gerar próxima
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

// 🎲 Gerar peça aleatória
function randomPiece() {
  const index = Math.floor(Math.random() * (SHAPES.length - 1)) + 1;
  return SHAPES[index].map(row => row.slice());
}

// ✂️ Verificar e limpar linhas completas
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
    playSound(somPontos);
  }
  updateScore();
}

// 📊 Atualizar pontuação e nível
function updateScore() {
  scoreEl.textContent = score;
  levelEl.textContent = level;
}

// 🖼️ Desenhar o tabuleiro e peça atual
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

// 🖼️ Desenhar peça seguinte
function drawNext() {
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const offsetX = Math.floor((4 - nextPiece[0].length) / 2);
  const offsetY = Math.floor((4 - nextPiece.length) / 2);
  drawMatrix(nextPiece, { x: offsetX, y: offsetY }, nextCtx);
}

// ⬇️ Cair peça
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

// ⬅️➡️ Mover peça
function move(dir) {
  pos.x += dir;
  if (collide(board, currentPiece, pos)) pos.x -= dir;
}

// 🔁 Rodar peça
function rotatePiece(dir) {
  currentPiece = rotate(currentPiece, dir);
  if (collide(board, currentPiece, pos)) {
    currentPiece = rotate(currentPiece, -dir);
  } else {
    playSound(somRodar);
  }
}

// 🔄 Atualizar jogo a cada frame
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

// ▶️ Iniciar jogo
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
  if (somAtivo) musicaFundo.play();
  animationId = requestAnimationFrame(update);
}

// 🔁 Reiniciar jogo
function resetGame() {
  cancelAnimationFrame(animationId);
  musicaFundo.currentTime = 0;
  startGame();
}

// ⏸ Pausar ou retomar jogo
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

// 🎮 Eventos de controlo
startBtn.addEventListener("click", startGame);
document.getElementById("resetBtn").addEventListener("click", resetGame);

// 🔊 Alternar som
toggleSoundBtn.addEventListener("click", () => {
  somAtivo = !somAtivo;
  toggleSoundBtn.textContent = somAtivo ? "🔊 Som" : "🔇 Silenciar";
  if (somAtivo) musicaFundo.play();
  else musicaFundo.pause();
});

// 🎹 Controlos por teclado
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

// 💾 Guardar pontuação
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

// 🪦 Modal de fim de jogo
function showGameOverModal() {
  const modal = document.getElementById("modal");
  const finalScore = document.getElementById("final-score");
  finalScore.textContent = `Pontuação: ${score}`;
  modal.classList.add("show");
}

// 🏆 Carregar ranking
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

// ⏸ Botão visual de pausa
document.getElementById("pauseBtn").addEventListener("click", () => {
  togglePause();
  const btn = document.getElementById("pauseBtn");
  btn.textContent = paused ? "▶ Retomar" : "⏸ Pausar";
});

// ☝️ Botões de controlo táteis
document.getElementById("leftBtn").addEventListener("click", () => move(-1));
document.getElementById("rightBtn").addEventListener("click", () => move(1));
document.getElementById("downBtn").addEventListener("click", drop);
document.getElementById("rotateBtn").addEventListener("click", () => rotatePiece(1));

// 📱 Ajuste de tamanho para ecrãs mobile
function resizeCanvas() {
  const containerWidth = canvas.parentElement.clientWidth;
  const idealWidth = containerWidth;
  const idealHeight = idealWidth * (ROWS / COLS);
  canvas.width = idealWidth;
  canvas.height = idealHeight;
  nextCanvas.width = 100;
  nextCanvas.height = 100;
}
window.addEventListener("resize", resizeCanvas);
window.addEventListener("load", resizeCanvas);

// 🤏 Gestos de toque (início de swipe)
let startX = 0;
let startY = 0;
let endX = 0;
let endY = 0;

canvas.addEventListener("touchstart", function (e) {
  if (e.touches.length === 1) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }
}, false);

canvas.addEventListener("touchend", function (e) {
  endX = e.changedTouches[0].clientX;
  endY = e.changedTouches[0].clientY;

  const deltaX = endX - startX;
  const deltaY = endY - startY;

  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  // Swipe horizontal
  if (absX > absY && absX > 20) {
    if (deltaX > 0) {
      move(1); // Swipe para a direita
    } else {
      move(-1); // Swipe para a esquerda
    }
  }

  // Swipe vertical
  else if (absY > absX && absY > 20) {
    if (deltaY > 0) {
      drop(); // Swipe para baixo
    }
  }

  // Toque leve (sem arrastar)
  else if (absX < 10 && absY < 10) {
    rotatePiece(1); // Toque simples: rodar peça
  }
}, false);

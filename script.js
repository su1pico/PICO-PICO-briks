const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const nextCanvas = document.getElementById("next");
const nextCtx = nextCanvas.getContext("2d");

const levelDisplay = document.getElementById("level");
const scoreDisplay = document.getElementById("score");
const startBtn = document.getElementById("start-btn");
const muteBtn = document.getElementById("mute-btn");

const modal = document.getElementById("modal");
const finalScoreEl = document.getElementById("final-score");
const finalStarsEl = document.getElementById("final-stars");
const playerNameInput = document.getElementById("player-name");
const saveScoreBtn = document.getElementById("save-score-btn");

const bgMusic = document.getElementById("bg-music");
const soundMove = document.getElementById("sound-move");
const soundRotate = document.getElementById("sound-rotate");
const soundClear = document.getElementById("sound-clear");
const soundGameOver = document.getElementById("sound-gameover");

// Configuração do jogo
const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 32;
canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

nextCanvas.width = 4 * BLOCK_SIZE;
nextCanvas.height = 4 * BLOCK_SIZE;

const COLORS = [
  null,
  "#FF5733",
  "#33FF57",
  "#3357FF",
  "#FF33A8",
  "#33FFF5",
  "#F5FF33",
  "#FF8F33",
];

const SHAPES = [
  [],
  [[1,1,1,1]],                  // I
  [[2,2],[2,2]],                // O
  [[0,3,0],[3,3,3]],            // T
  [[4,4,0],[0,4,4]],            // S
  [[0,5,5],[5,5,0]],            // Z
  [[6,0,0],[6,6,6]],            // J
  [[0,0,7],[7,7,7]],            // L
];

// Variáveis do jogo
let board = createMatrix(COLS, ROWS);
let currentPiece = null;
let nextPiece = null;
let pos = {x: 0, y: 0};
let score = 0;
let level = 1;
let linesCleared = 0;
let dropInterval = 1000;
let dropCounter = 0;
let lastTime = 0;
let gameOver = false;
let isMuted = false;
let rankings = loadRankings();

// Funções auxiliares
function createMatrix(w, h) {
  const matrix = [];
  for(let y=0; y<h; y++) {
    matrix[y] = new Array(w).fill(0);
  }
  return matrix;
}

function drawBlock(x, y, color) {
  ctx.fillStyle = color;
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 2;
  ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if(value !== 0) {
        drawBlock(x + offset.x, y + offset.y, COLORS[value]);
      }
    });
  });
}

function collide(board, piece, pos) {
  for(let y=0; y<piece.length; y++) {
    for(let x=0; x<piece[y].length; x++) {
      if(piece[y][x] !== 0 &&
         (board[y + pos.y] &&
          board[y + pos.y][x + pos.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function merge(board, piece, pos) {
  piece.forEach((row, y) => {
    row.forEach((value, x) => {
      if(value !== 0) {
        board[y + pos.y][x + pos.x] = value;
      }
    });
  });
}

function rotate(matrix, dir) {
  for(let y=0; y<matrix.length; y++) {
    for(let x=0; x<y; x++) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if(dir > 0) {
    matrix.forEach(row => row.reverse());
  } else {
    matrix.reverse();
  }
}

function resetPiece() {
  currentPiece = nextPiece || randomPiece();
  nextPiece = randomPiece();
  pos.x = Math.floor(COLS / 2) - Math.floor(currentPiece[0].length / 2);
  pos.y = 0;
  if(collide(board, currentPiece, pos)) {
    gameOver = true;
    showGameOver();
  }
}

function randomPiece() {
  const index = Math.floor(Math.random() * (SHAPES.length -1)) +1;
  return SHAPES[index].map(row => row.slice());
}

function clearLines() {
  let lines = 0;
  outer: for(let y=board.length -1; y>=0; y--) {
    for(let x=0; x<COLS; x++) {
      if(board[y][x] === 0) {
        continue outer;
      }
    }
    const row = board.splice(y, 1)[0].fill(0);
    board.unshift(row);
    lines++;
    y++;
  }
  if(lines > 0) {
    linesCleared += lines;
    score += lines * 100 * level;
    if(linesCleared >= level * 10) {
      level++;
      dropInterval *= 0.85;
      showLevelComplete();
    }
    soundClear.play();
  }
}

function showLevelComplete() {
  // Mostrar modal com pontuação e estrelas
  const stars = calculateStars();
  finalScoreEl.textContent = score;
  finalStarsEl.textContent = "⭐".repeat(stars);
  modal.classList.add("show");
  bgMusic.pause();
}

function calculateStars() {
  if(score > level * 1000) return 3;
  if(score > level * 500) return 2;
  if(score > level * 100) return 1;
  return 0;
}

function showGameOver() {
  finalScoreEl.textContent = score;
  finalStarsEl.textContent = "💀";
  modal.classList.add("show");
  bgMusic.pause();
  soundGameOver.play();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawMatrix(board, {x:0, y:0});
  if(currentPiece) {
    drawMatrix(currentPiece, pos);
  }
}

function update(time=0) {
  const deltaTime = time - lastTime;
  lastTime = time;

  dropCounter += deltaTime;
  if(dropCounter > dropInterval) {
    drop();
  }

  draw();
  requestAnimationFrame(update);
}

function drop() {
  pos.y++;
  if(collide(board, currentPiece, pos)) {
    pos.y--;
    merge(board, currentPiece, pos);
    clearLines();
    resetPiece();
  }
  dropCounter = 0;
}

function move(dir) {
  pos.x += dir;
  if(collide(board, currentPiece, pos)) {
    pos.x -= dir;
  } else {
    soundMove.play();
  }
}

function rotatePiece(dir) {
  const cloned = currentPiece.map(row => row.slice());
  rotate(cloned, dir);
  if(!collide(board, cloned, pos)) {
    currentPiece = cloned;
    soundRotate.play();
  }
}

function loadRankings() {
  const saved = localStorage.getItem("tetrisRankings");
  return saved ? JSON.parse(saved) : [];
}

function saveRanking(name, score) {
  rankings.push({name, score});
  rankings.sort((a,b) => b.score - a.score);
  if(rankings.length > 10) rankings.pop();
  localStorage.setItem("tetrisRankings", JSON.stringify(rankings));
}

function startGame() {
  board = createMatrix(COLS, ROWS);
  score = 0;
  level = 1;
  linesCleared = 0;
  dropInterval = 1000;
  gameOver = false;
  currentPiece = null;
  nextPiece = null;
  resetPiece();
  playerNameInput.value = "";
  modal.classList.remove("show");
  bgMusic.play();
  update();
}

startBtn.addEventListener("click", () => {
  startGame();
});

muteBtn.addEventListener("click", () => {
  isMuted = !isMuted;
  if(isMuted) {
    bgMusic.pause();
    muteBtn.textContent = "🔇 Música Desligada";
  } else {
    bgMusic.play();
    muteBtn.textContent = "🔊 Música Ligada";
  }
});

window.addEventListener("keydown", (e) => {
  if(gameOver) return;

  switch(e.key) {
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
      while(!collide(board, currentPiece, {x: pos.x, y: pos.y + 1})) {
        pos.y++;
      }
      drop();
      break;
  }
});

saveScoreBtn.addEventListener("click", () => {
  const name = playerNameInput.value.trim() || "Anónimo";
  saveRanking(name, score);
  modal.classList.remove("show");
  alert("Pontuação guardada! Obrigado por jogar.");
});

draw();

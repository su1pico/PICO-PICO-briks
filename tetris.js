const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

const nextCanvas = document.getElementById("next");
const nextCtx = nextCanvas.getContext("2d");

const levelEl = document.getElementById("level");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const startBtn = document.getElementById("startBtn");

const COLS = 10;
const ROWS = 20;
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
  [[1,1,1,1]],                 // I
  [[2,2],[2,2]],               // O
  [[0,3,0],[3,3,3]],           // T
  [[4,4,0],[0,4,4]],           // S
  [[0,5,5],[5,5,0]],           // Z
  [[6,0,0],[6,6,6]],           // J
  [[0,0,7],[7,7,7]],           // L
];

let board;
let currentPiece;
let nextPiece;
let pos;
let score;
let level;
let linesCleared;
let dropInterval;
let dropCounter;
let lastTime;
let gameOver;
let startTime;

const modal = document.getElementById("modal");
const finalScore = document.getElementById("final-score");
const starsContainer = document.getElementById("stars-container");
const playerNameInput = document.getElementById("player-name");
const saveScoreBtn = document.getElementById("save-score-btn");
const shareScoreBtn = document.getElementById("share-score-btn");

const gameOverSound = new Audio("gameover.mp3");
const winSound = new Audio("win.mp3");

function createMatrix(w, h) {
  const matrix = [];
  for(let y=0; y<h; y++) {
    matrix.push(new Array(w).fill(0));
  }
  return matrix;
}

function drawMatrix(matrix, offset, context = ctx) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        const color = COLORS[value];
        const drawCtx = context;
        const gx = (x + offset.x);
        const gy = (y + offset.y);

        const gradient = drawCtx.createLinearGradient(
          gx * BLOCK_SIZE, gy * BLOCK_SIZE,
          (gx + 1) * BLOCK_SIZE, (gy + 1) * BLOCK_SIZE
        );
        gradient.addColorStop(0, "#ffffff");
        gradient.addColorStop(1, color);

        drawCtx.fillStyle = gradient;
        drawCtx.strokeStyle = "#222";
        drawCtx.lineWidth = 2;

        drawCtx.shadowColor = "rgba(0, 0, 0, 0.4)";
        drawCtx.shadowBlur = 6;

        drawCtx.fillRect(gx * BLOCK_SIZE, gy * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        drawCtx.strokeRect(gx * BLOCK_SIZE, gy * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

        drawCtx.shadowColor = "transparent";
        drawCtx.shadowBlur = 0;
      }
    });
  });
}

function collide(board, piece, pos) {
  for(let y=0; y<piece.length; y++) {
    for(let x=0; x<piece[y].length; x++) {
      if(piece[y][x] !== 0 && (board[y + pos.y] && board[y + pos.y][x + pos.x]) !== 0) {
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
  const rows = matrix.length;
  const cols = matrix[0].length;
  const res = Array.from({ length: cols }, () => Array(rows).fill(0));

  for (let y = 0; y < rows; ++y) {
    for (let x = 0; x < cols; ++x) {
      if (dir > 0) {
        res[x][rows - 1 - y] = matrix[y][x]; // rotação horária
      } else {
        res[cols - 1 - x][y] = matrix[y][x]; // rotação anti-horária
      }
    }
  }

  // Atualiza a matriz original com o resultado
  matrix.length = 0;
  for (let row of res) {
    matrix.push(row);
  }
}

function resetPiece() {
  currentPiece = nextPiece;
  nextPiece = randomPiece();
  pos = {x: Math.floor(COLS/2) - Math.floor(currentPiece[0].length/2), y:0};
  if(collide(board, currentPiece, pos)) {
    gameOver = true;
    showGameOverModal();
    gameOverSound.play();
  }
}

function randomPiece() {
  const index = Math.floor(Math.random() * (SHAPES.length -1)) +1;
  return SHAPES[index].map(row => row.slice());
}

function clearLines() {
  let lines = 0;
  outer: for(let y = board.length -1; y >= 0; y--) {
    for(let x = 0; x < COLS; x++) {
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
      dropInterval *= 0.8;
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

  drawMatrix(board, {x:0, y:0}, ctx);
  drawMatrix(currentPiece, pos, ctx);

  nextCtx.fillStyle = "#222";
  nextCtx.fillRect(0,0, nextCanvas.width, nextCanvas.height);
  drawMatrix(nextPiece, {x:1, y:1}, nextCtx);
}

function update(time = 0) {
  if (gameOver) return;

  if(!lastTime) lastTime = time;
  const deltaTime = time - lastTime;
  dropCounter += deltaTime;

  if(dropCounter > dropInterval) {
    pos.y++;
    if(collide(board, currentPiece, pos)) {
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
  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  timeEl.textContent = `${minutes.toString().padStart(2,"0")}:${seconds.toString().padStart(2,"0")}`;
}

function showGameOverModal() {
  finalScore.textContent = `Pontuação: ${score}`;
  showStars(score);
  modal.classList.add("show");
}

function showStars(score) {
  starsContainer.innerHTML = "";
  let starCount = 0;
  if(score > 8000) starCount = 3;
  else if(score > 4000) starCount = 2;
  else if(score > 1000) starCount = 1;

  for(let i = 0; i < 3; i++) {
    const star = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    star.setAttribute("class", "star");
    star.setAttribute("viewBox", "0 0 24 24");
    star.innerHTML = `<path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.758 1.496 8.281L12 18.897l-7.432 4.448 1.496-8.281-6.064-5.758 8.332-1.151z" fill="${i < starCount ? '#fa8231' : '#ddd'}"/>`;
    starsContainer.appendChild(star);
  }
}

function saveScore() {
  const name = playerNameInput.value.trim();
  if(!name) {
    alert("Por favor, escreve o teu nome antes de guardar a pontuação.");
    return;
  }
  const storedScores = JSON.parse(localStorage.getItem("picoPicoScores") || "[]");
  storedScores.push({name: name, score: score});
  storedScores.sort((a,b) => b.score - a.score);
  localStorage.setItem("picoPicoScores", JSON.stringify(storedScores.slice(0,10)));
  alert("Pontuação guardada!");
}

function shareScore() {
  const name = playerNameInput.value.trim() || "Anónimo";
  const shareText = `No jogo Desafio Pico-Pico, ${name} fez ${score} pontos! Consegues superar? #DesafioPicoPico`;
  if(navigator.share) {
    navigator.share({
      title: "Desafio Pico-Pico",
      text: shareText,
      url: window.location.href,
    }).catch(console.error);
  } else {
    // fallback: copia para clipboard
    navigator.clipboard.writeText(shareText).then(() => {
      alert("Texto de partilha copiado para o clipboard!");
    });
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
  pos = {x: Math.floor(COLS/2) - Math.floor(currentPiece[0].length/2), y:0};

  modal.classList.remove("show");
  updateScore();
  update();
}

// Controlo do jogo
document.addEventListener("keydown", event => {
  if(gameOver) return;
  if(event.key === "ArrowLeft") {
    pos.x--;
    if(collide(board, currentPiece, pos)) pos.x++;
  } else if(event.key === "ArrowRight") {
    pos.x++;
    if(collide(board, currentPiece, pos)) pos.x--;
  } else if(event.key === "ArrowDown") {
    pos.y++;
    if(collide(board, currentPiece, pos)) {
      pos.y--;
      merge(board, currentPiece, pos);
      clearLines();
      resetPiece();
    }
    dropCounter = 0;
  } else if(event.key === "ArrowUp") {
    rotate(currentPiece, 1);
    if(collide(board, currentPiece, pos)) {
      rotate(currentPiece, -1);
    }
  }
});

startBtn.addEventListener("click", () => {
  startGame();
});

saveScoreBtn.addEventListener("click", saveScore);
shareScoreBtn.addEventListener("click", shareScore);

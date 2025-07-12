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

// Estado do jogo
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

function createMatrix(w, h) {
  const matrix = [];
  for(let y=0; y<h; y++) {
    matrix.push(new Array(w).fill(0));
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

function drawMatrix(matrix, offset, context=ctx) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if(value !== 0) {
        context.fillStyle = COLORS[value];
        context.strokeStyle = "#222";
        context.lineWidth = 2;
        context.fillRect((x + offset.x) * BLOCK_SIZE, (y + offset.y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        context.strokeRect((x + offset.x) * BLOCK_SIZE, (y + offset.y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
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
  pos = {x: Math.floor(COLS/2) - Math.floor(currentPiece[0].length/2), y:0};
  if(collide(board, currentPiece, pos)) {
    gameOver = true;
    alert("Fim de jogo! Pontuação: " + score);
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
    updateScore();
  }
}

function updateScore() {
  scoreEl.textContent = score;
  levelEl.textContent = level;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawMatrix(board, {x:0, y:0});
  if(currentPiece) {
    drawMatrix(currentPiece, pos);
  }
}

function drawNext() {
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  drawMatrix(nextPiece, {x:0, y:0}, nextCtx);
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
  }
}

function rotatePiece(dir) {
  const cloned = currentPiece.map(row => row.slice());
  rotate(cloned, dir);
  if(!collide(board, cloned, pos)) {
    currentPiece = cloned;
  }
}

function update(time = 0) {
  if(gameOver) return;
  if(!startTime) startTime = time;
  const deltaTime = time - lastTime;
  dropCounter += deltaTime;
  lastTime = time;

  if(dropCounter > dropInterval) {
    drop();
  }

  // Atualiza tempo decorrido
  const elapsed = Math.floor((time - startTime) / 1000);
  const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const seconds = String(elapsed % 60).padStart(2, "0");
  timeEl.textContent = `${minutes}:${seconds}`;

  draw();
  drawNext();
  requestAnimationFrame(update);
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
  resetPiece();
  updateScore();
  update();
}

startBtn.addEventListener("click", () => {
  startGame();
});

window.addEventListener("keydown", (e) => {
  if(gameOver) return;
  switch(e.key) {
    case "ArrowLeft": move(-1); break;
    case "ArrowRight": move(1); break;
    case "ArrowDown": drop(); break;
    case "ArrowUp": rotatePiece(1); break;
    case " ": // Drop rápido
      while(!collide(board, currentPiece, {x: pos.x, y: pos.y + 1})) {
        pos.y++;
      }
      drop();
      break;
  }
});

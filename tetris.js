// === CONSTANTES E CONFIG ===
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const nextCanvas = document.getElementById("next");
const nextCtx = nextCanvas.getContext("2d");
const blockSize = 32;
const colunas = 10;
const linhas = 20;
let tabuleiro = Array.from({ length: linhas }, () => Array(colunas).fill(0));

// === PEÇAS ===
const pecas = [
  { forma: [[1, 1, 1, 1]], cor: "cyan" }, // I
  { forma: [[1, 1, 0], [0, 1, 1]], cor: "orange" }, // Z
  { forma: [[0, 1, 1], [1, 1, 0]], cor: "red" }, // S
  { forma: [[1, 0, 0], [1, 1, 1]], cor: "blue" }, // J
  { forma: [[0, 0, 1], [1, 1, 1]], cor: "green" }, // L
  { forma: [[1, 1], [1, 1]], cor: "yellow" }, // O
  { forma: [[0, 1, 0], [1, 1, 1]], cor: "purple" }, // T
];

// === ESTADO ===
let pecaAtual, proximaPeca, posX, posY;
let nivel = 1, score = 0, linhasLimpa = 0;
let intervaloQueda = 1000, tempoAnterior = 0;
let jogoRodando = false, pausado = false;
let tempoInicial, tempoAtual;
let somLigado = true;

// === ELEMENTOS DOM ===
const scoreSpan = document.getElementById("score");
const levelSpan = document.getElementById("level");
const timeSpan = document.getElementById("time");
const modal = document.getElementById("modal");
const finalScore = document.getElementById("final-score");
const playerNameInput = document.getElementById("player-name");
const rankingList = document.getElementById("ranking-list");

// === SONS ===
const somRodar = document.getElementById("som-rodar");
const somColidir = document.getElementById("som-colidir");
const somPontos = document.getElementById("som-pontos");
const somPerdeu = document.getElementById("som-perdeu");
const musicaFundo = document.getElementById("musica-fundo");

// === FUNÇÕES ===
function iniciarJogo() {
  tabuleiro = Array.from({ length: linhas }, () => Array(colunas).fill(0));
  score = 0; nivel = 1; linhasLimpa = 0;
  intervaloQueda = 1000;
  tempoInicial = Date.now();
  proximaPeca = gerarPeca();
  novaPeca();
  jogoRodando = true;
  pausado = false;
  musicaFundo.play();
  requestAnimationFrame(loop);
}

function novaPeca() {
  pecaAtual = proximaPeca;
  proximaPeca = gerarPeca();
  posX = 3; posY = 0;
  if (colide(0, 0, pecaAtual.forma)) {
    fimDeJogo();
  }
}

function gerarPeca() {
  const aleatoria = pecas[Math.floor(Math.random() * pecas.length)];
  return { ...aleatoria, forma: aleatoria.forma.map(l => [...l]) };
}

function colide(offsetX, offsetY, forma) {
  for (let y = 0; y < forma.length; y++) {
    for (let x = 0; x < forma[y].length; x++) {
      if (
        forma[y][x] &&
        (tabuleiro[y + posY + offsetY]?.[x + posX + offsetX] !== 0 ||
          y + posY + offsetY >= linhas ||
          x + posX + offsetX < 0 ||
          x + posX + offsetX >= colunas)
      ) {
        return true;
      }
    }
  }
  return false;
}

function fixar() {
  pecaAtual.forma.forEach((linha, y) => {
    linha.forEach((valor, x) => {
      if (valor) tabuleiro[y + posY][x + posX] = pecaAtual.cor;
    });
  });
  somColidir.play();
  limparLinhas();
  novaPeca();
}

function limparLinhas() {
  let linhasParaLimpar = 0;
  tabuleiro = tabuleiro.filter(linha => {
    if (linha.every(c => c !== 0)) {
      linhasParaLimpar++;
      return false;
    }
    return true;
  });
  while (tabuleiro.length < linhas) tabuleiro.unshift(Array(colunas).fill(0));

  if (linhasParaLimpar > 0) {
    score += linhasParaLimpar * 100;
    linhasLimpa += linhasParaLimpar;
    somPontos.play();
    if (linhasLimpa >= nivel * 5) {
      nivel++;
      intervaloQueda *= 0.9;
    }
  }
}

function mover(dx) {
  if (!colide(dx, 0, pecaAtual.forma)) posX += dx;
}

function descer() {
  if (!colide(0, 1, pecaAtual.forma)) {
    posY++;
  } else {
    fixar();
  }
}

function rodar() {
  const novaForma = pecaAtual.forma[0].map((_, i) =>
    pecaAtual.forma.map(l => l[i]).reverse()
  );
  if (!colide(0, 0, novaForma)) {
    pecaAtual.forma = novaForma;
    somRodar.play();
  }
}

function desenharTabuleiro() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < linhas; y++) {
    for (let x = 0; x < colunas; x++) {
      if (tabuleiro[y][x]) {
        ctx.fillStyle = tabuleiro[y][x];
        ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
      }
    }
  }
}

function desenharPeca() {
  pecaAtual.forma.forEach((linha, y) => {
    linha.forEach((valor, x) => {
      if (valor) {
        ctx.fillStyle = pecaAtual.cor;
        ctx.fillRect((x + posX) * blockSize, (y + posY) * blockSize, blockSize, blockSize);
      }
    });
  });
}

function desenharProximaPeca() {
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  proximaPeca.forma.forEach((linha, y) => {
    linha.forEach((valor, x) => {
      if (valor) {
        nextCtx.fillStyle = proximaPeca.cor;
        nextCtx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
      }
    });
  });
}

function atualizarInfo() {
  scoreSpan.textContent = score;
  levelSpan.textContent = nivel;
  const tempo = Math.floor((Date.now() - tempoInicial) / 1000);
  const min = String(Math.floor(tempo / 60)).padStart(2, "0");
  const seg = String(tempo % 60).padStart(2, "0");
  timeSpan.textContent = `${min}:${seg}`;
}

function loop(tempoAtualLoop) {
  if (!jogoRodando || pausado) return;
  const delta = tempoAtualLoop - tempoAnterior;
  if (delta > intervaloQueda) {
    descer();
    tempoAnterior = tempoAtualLoop;
  }
  desenharTabuleiro();
  desenharPeca();
  desenharProximaPeca();
  atualizarInfo();
  requestAnimationFrame(loop);
}

function fimDeJogo() {
  jogoRodando = false;
  musicaFundo.pause();
  somPerdeu.play();
  finalScore.textContent = `Pontuação: ${score}`;
  modal.classList.add("show");
}

function salvarPontuacao() {
  const nome = playerNameInput.value.trim();
  if (!nome) return;
  const ranking = JSON.parse(localStorage.getItem("ranking")) || [];
  ranking.push({ nome, score });
  ranking.sort((a, b) => b.score - a.score);
  localStorage.setItem("ranking", JSON.stringify(ranking.slice(0, 10)));
  modal.classList.remove("show");
  mostrarRanking();
}

function mostrarRanking() {
  const ranking = JSON.parse(localStorage.getItem("ranking")) || [];
  rankingList.innerHTML = ranking.map(j => `<li>${j.nome}: ${j.score}</li>`).join("");
}

function toggleSom() {
  somLigado = !somLigado;
  const audios = [musicaFundo, somRodar, somColidir, somPontos, somPerdeu];
  audios.forEach(a => (a.muted = !somLigado));
}

// === EVENTOS ===
document.getElementById("startBtn").onclick = iniciarJogo;
document.getElementById("resetBtn").onclick = iniciarJogo;
document.getElementById("save-score-btn").onclick = salvarPontuacao;
document.getElementById("toggle-sound").onclick = toggleSom;
document.getElementById("pauseBtn").onclick = () => (pausado = !pausado);

// Controles
window.addEventListener("keydown", e => {
  if (!jogoRodando || pausado) return;
  if (e.key === "ArrowLeft") mover(-1);
  if (e.key === "ArrowRight") mover(1);
  if (e.key === "ArrowDown") descer();
  if (e.key === "ArrowUp") rodar();
});

document.getElementById("leftBtn").onclick = () => mover(-1);
document.getElementById("rightBtn").onclick = () => mover(1);
document.getElementById("downBtn").onclick = () => descer();
document.getElementById("rotateBtn").onclick = () => rodar();

// === INICIAR ===
mostrarRanking();

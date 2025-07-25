import { COLUNAS, LINHAS, CORES } from "./motor.js";
import { nivel } from "./pontuacao.js";

/**
 * Inicializa os canvas principais com dimensões escaláveis e estilo pixelizado
 */
export function configurarCanvas() {
  const board = document.getElementById("board");
  const next  = document.getElementById("next");
  if (!board || !next) return null;

  const alturaMax = Math.min(window.innerHeight * 0.55, 720);
  const larguraMax = Math.min(window.innerWidth * 0.95, 640);
  const bloco = Math.floor(Math.min(larguraMax / COLUNAS, alturaMax / LINHAS));

  board.width  = COLUNAS * bloco;
  board.height = LINHAS * bloco;
  next.width   = bloco * 4;
  next.height  = bloco * 4;

  const ctxBoard = board.getContext("2d");
  const ctxNext  = next.getContext("2d");

  [ctxBoard, ctxNext].forEach(ctx => {
    ctx.imageSmoothingEnabled = false;
  });

  return { ctxBoard, ctxNext, board, next };
}

/**
 * Retorna estilo visual do bloco consoante o nível do jogador
 */
function obterEstiloBloco(nivel, valor) {
  const baseCor = obterCor(valor);
  let brilho = "#ffffff";
  let sombra = "#222222";

  if (nivel >= 10 && nivel < 20) {
    brilho = "#aaffff";   // Azul claro para peças avançadas
    sombra = "#1a1a1a";
  } else if (nivel >= 20) {
    brilho = "#ff99ff";   // Holográfico para peças lendárias
    sombra = "#330033";
  }

  return { baseCor, brilho, sombra };
}

/**
 * Desenha o estado actual do tabuleiro, incluindo blocos fixos e peça activa
 */
export function desenharJogo(ctx, largura, altura, tabuleiro, peca, posicao) {
  ctx.clearRect(0, 0, largura, altura);
  const larguraBloco = largura / COLUNAS;
  const alturaBloco  = altura / LINHAS;

  // Desenhar blocos fixos
  for (let y = 0; y < LINHAS; y++) {
    for (let x = 0; x < COLUNAS; x++) {
      const valor = tabuleiro[y][x];
      if (valor) {
        desenharBloco(ctx, x * larguraBloco, y * alturaBloco, larguraBloco, alturaBloco, valor, nivel);
      }
    }
  }

  // Desenhar peça activa
  for (let y = 0; y < peca.length; y++) {
    for (let x = 0; x < peca[y].length; x++) {
      const valor = peca[y][x];
      if (valor) {
        const px = posicao.x + x;
        const py = posicao.y + y;
        if (py >= 0 && py < LINHAS) {
          desenharBloco(ctx, px * larguraBloco, py * alturaBloco, larguraBloco, alturaBloco, valor, nivel);
        }
      }
    }
  }
}

/**
 * Desenha a próxima peça no canvas lateral com alinhamento central e efeito visual
 */
export function desenharProxima(ctx, peca) {
  const largura = ctx.canvas.width;
  const altura  = ctx.canvas.height;
  ctx.clearRect(0, 0, largura, altura);

  const larguraBloco = largura / 4;
  const alturaBloco  = altura / 4;
  const offsetX = (largura - peca[0].length * larguraBloco) / 2;
  const offsetY = (altura  - peca.length  * alturaBloco) / 2;

  for (let y = 0; y < peca.length; y++) {
    for (let x = 0; x < peca[y].length; x++) {
      const valor = peca[y][x];
      if (valor) {
        const posX = offsetX + x * larguraBloco;
        const posY = offsetY + y * alturaBloco;
        desenharBloco(ctx, posX, posY, larguraBloco, alturaBloco, valor, nivel);
      }
    }
  }
}

/**
 * Desenha um bloco com efeito 3D por nível do jogador
 */
function desenharBloco(ctx, x, y, largura, altura, valor, nivel) {
  const { baseCor, brilho, sombra } = obterEstiloBloco(nivel, valor);

  const gradiente = ctx.createLinearGradient(x, y, x + largura, y + altura);
  gradiente.addColorStop(0.0, brilho);
  gradiente.addColorStop(0.5, baseCor);
  gradiente.addColorStop(1.0, sombra);

  ctx.shadowColor   = "rgba(0,0,0,0.4)";
  ctx.shadowBlur    = 5;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = gradiente;
  ctx.fillRect(x, y, largura, altura);

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, largura, altura);
}

/**
 * Obtém a cor base associada ao valor da peça
 */
function obterCor(valor) {
  return CORES[valor] || "#aaaaaa";
}

/**
 * Actualiza visualmente a pontuação e o nível
 */
export function atualizarPontuacao(pontos, nivel) {
  const pontosEl = document.getElementById("score");
  const nivelEl  = document.getElementById("level");
  if (pontosEl) pontosEl.textContent = pontos;
  if (nivelEl)  nivelEl.textContent  = nivel;
}

/**
 * Actualiza o tempo decorrido em formato MM:SS
 */
export function atualizarTempo(segundos) {
  const el = document.getElementById("time");
  const mm = String(Math.floor(segundos / 60)).padStart(2, "0");
  const ss = String(segundos % 60).padStart(2, "0");
  if (el) el.textContent = `${mm}:${ss}`;
}

/**
 * Exibe o modal de fim de jogo com a pontuação final
 */
export function mostrarModalFim(pontuacao) {
  const pontuacaoEl = document.getElementById("final-score");
  if (pontuacaoEl) pontuacaoEl.textContent = `Pontuação: ${pontuacao}`;
  document.getElementById("modal")?.classList.add("show");
}

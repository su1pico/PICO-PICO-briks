// Detecção da resolução atual do dispositivo
const larguraEcrã = window.innerWidth;
const alturaEcrã  = window.innerHeight;

/**
 * Número de colunas e linhas do tabuleiro
 * Adaptado automaticamente à resolução
 */
export const COLUNAS = larguraEcrã <= 480 ? 8 : 10;
export const LINHAS  = alturaEcrã  <= 700 ? 18 : 20;

/**
 * Paleta de cores neon associada a cada tipo de peça
 */
export const CORES = {
  1:  "#00ffff", // I — Azul claro
  2:  "#ff00ff", // T — Rosa neon
  3:  "#ffff00", // O — Amarelo
  4:  "#00ff00", // S — Verde
  5:  "#ff0000", // Z — Vermelho
  6:  "#0000ff", // J — Azul escuro
  7:  "#ffa500", // L — Laranja
  8:  "#ff66cc", // U — Rosa claro
  9:  "#00ff99", // Plus — Verde água
  10: "#ff4444", // X — Vermelho ardente

  // 💎 Blocos lendários (nível 20+)
  11: "#99ffff", // Cruz simétrica
  12: "#cc66ff", // Torre com base
  13: "#ffcc00", // Espiral brilhante
  14: "#66ffcc"  // Retângulo com braço
};

/**
 * Peças clássicas (nível 1–9)
 */
const PECAS_CLASSICAS = [
  [[1, 1, 1, 1]],                    // I
  [[0, 2, 0], [2, 2, 2]],            // T
  [[3, 3], [3, 3]],                  // O
  [[0, 4, 4], [4, 4, 0]],            // S
  [[5, 5, 0], [0, 5, 5]],            // Z
  [[6, 0, 0], [6, 6, 6]],            // J
  [[0, 0, 7], [7, 7, 7]]             // L
];

/**
 * Peças avançadas (nível 10–19)
 */
const PECAS_AVANCADAS = [
  [[8, 0, 8], [8, 8, 8]],            // U
  [[0, 9], [9, 9], [0, 9]],          // Plus com canto
  [[9, 9, 0], [0, 9, 9]],            // Z invertido alargado
  [[0, 0, 10], [10, 10, 10], [0, 10, 0]] // X com prolongamento
];

/**
 * Peças lendárias (nível 20+), com valores exclusivos
 */
const PECAS_LEGENDARIAS = [
  [[11, 0, 11], [0, 11, 0], [11, 0, 11]],           // Cruz simétrica
  [[12, 12, 12], [0, 12, 0], [0, 12, 0]],           // Torre com base
  [[13, 13, 0], [0, 13, 0], [0, 13, 13]],           // Espiral brilhante
  [[14, 14], [0, 14], [0, 14], [14, 14]]            // Retângulo com braço
];

/**
 * Cria uma matriz vazia com dimensões fornecidas ou padrão
 */
export function criarMatriz(largura = COLUNAS, altura = LINHAS) {
  return Array.from({ length: altura }, () => Array(largura).fill(0));
}

/**
 * Cria uma nova peça aleatória com base no nível atual
 */
export function gerarPeca(nivel = 1) {
  let conjunto = PECAS_CLASSICAS;
  if (nivel >= 20) {
    conjunto = [...PECAS_CLASSICAS, ...PECAS_AVANCADAS, ...PECAS_LEGENDARIAS];
  } else if (nivel >= 10) {
    conjunto = [...PECAS_CLASSICAS, ...PECAS_AVANCADAS];
  }

  const indice = Math.floor(Math.random() * conjunto.length);
  return conjunto[indice].map(linha => [...linha]);
}

/**
 * Verifica se há colisão com limites ou peças fixas
 */
export function verificarColisao(tabuleiro, peca, posicao) {
  for (let y = 0; y < peca.length; y++) {
    for (let x = 0; x < peca[y].length; x++) {
      const valor = peca[y][x];
      if (!valor) continue;

      const tx = posicao.x + x;
      const ty = posicao.y + y;

      const foraLimite = tx < 0 || tx >= COLUNAS || ty >= LINHAS;
      const colideComFixo = ty >= 0 && tabuleiro[ty]?.[tx] !== 0;

      if (foraLimite || colideComFixo) return true;
    }
  }
  return false;
}

/**
 * Roda uma peça 90 graus (direção +1: direita, -1: esquerda)
 */
export function rodar(peca, direcao) {
  const transposta = peca[0].map((_, i) => peca.map(r => r[i]));
  return direcao > 0
    ? transposta.map(linha => linha.reverse())
    : transposta.reverse();
}

/**
 * Fixa a peça na matriz do tabuleiro na posição atual
 */
export function fundirPeca(tabuleiro, peca, posicao) {
  for (let y = 0; y < peca.length; y++) {
    for (let x = 0; x < peca[y].length; x++) {
      const valor = peca[y][x];
      if (valor) {
        const tx = posicao.x + x;
        const ty = posicao.y + y;
        if (tx >= 0 && tx < COLUNAS && ty >= 0 && ty < LINHAS) {
          tabuleiro[ty][tx] = valor;
        }
      }
    }
  }
}

/**
 * Remove todas as linhas completas e atualiza o tabuleiro
 */
export function limparLinhas(tabuleiro) {
  let removidas = 0;

  for (let y = tabuleiro.length - 1; y >= 0; y--) {
    const linhaCompleta = tabuleiro[y].every(celula => celula !== 0);
    if (linhaCompleta) {
      tabuleiro.splice(y, 1);
      tabuleiro.unshift(new Array(COLUNAS).fill(0));
      removidas++;
      y++; // Reavaliar a linha reposicionada
    }
  }

  return removidas;
}

import { obterRankingOrdenado } from "./pontuacao.js";

/**
 * Injecta os estilos CSS específicos do cartão directamente no documento
 */
function injectarEstilosCartao() {
  if (document.getElementById("estilos-cartao")) return;

  const estilos = document.createElement("style");
  estilos.id = "estilos-cartao";
  estilos.textContent = `
    .cartao-pixelado {
      border-radius: 12px;
      padding: 1em;
      font-family: 'Press Start 2P', monospace;
      color: #00ffcc;
      text-align: center;
      width: 90%;
      max-width: 340px;
      min-height: 360px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      margin: 0 auto;
      box-shadow: 0 0 16px rgba(0,255,204,0.5);
      border: 2px solid #3d3d7f;
      background: linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)),
                  url("cartaojogador.png") no-repeat center center;
      background-size: cover;
      font-size: clamp(10px, 2.5vw, 14px);
    }

    .cartao-holografico {
      background: linear-gradient(135deg, #00ffff 0%, #ff00ff 100%);
      background-size: 200% 200%;
      animation: brilho-holografico 3s ease infinite;
      box-shadow: 0 0 24px rgba(255,255,255,0.4);
    }

    @keyframes brilho-holografico {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    .forca-estilo-holografico {
      animation: none !important;
      background-position: 75% 50% !important;
    }

    .cartao-topo {
      font-size: 0.8em;
      margin-bottom: 0.6em;
      text-shadow: 1px 1px #000;
      color: #ffff66;
    }

    .cartao-nome {
      font-weight: bold;
      margin-bottom: 0.5em;
      line-height: 1.2;
      word-break: break-word;
    }

    .cartao-detalhes {
      font-size: 0.65em;
      margin-bottom: 0.5em;
      display: flex;
      flex-direction: column;
      gap: 0.3em;
      background-color: rgba(0,0,0,0.5);
      padding: 0.5em;
      border-radius: 6px;
      color: #00ffee;
    }

    .cartao-titulo-fundo {
      font-size: 0.65em;
      margin-top: 1em;
      color: #00ffff;
      text-shadow: 0 0 6px rgba(0,255,255,0.7);
    }

    .cartao-neon     { box-shadow: 0 0 16px rgba(0,255,204,0.7); }
    .cartao-pixel    { border: 2px dashed #00ffff; }
    .cartao-ouro     { border: 3px solid gold; box-shadow: 0 0 24px rgba(255,215,0,0.8); }
    .cartao-novato   { border: 2px solid #555; color: #ccc; }
    .cartao-conforto { border: 2px solid #3399ff; color: #bbddff; }
    .cartao-combo    { border: 2px solid #ff66cc; box-shadow: 0 0 18px rgba(255,102,204,0.6); }

    @media (max-width: 420px) {
      .cartao-pixelado {
        width: 95%;
        font-size: 11px;
      }
      .cartao-nome { font-size: 1.3em !important; }
      .cartao-topo { font-size: 0.75em; }
      .cartao-titulo-fundo { font-size: 0.6em; }
    }
  `;
  document.head.appendChild(estilos);
}

/**
 * Gera visualmente o Cartão do Jogador com base no primeiro lugar do ranking
 */
export function gerarCartaoJogador() {
  const ranking = obterRankingOrdenado();
  const jogador = ranking[0];
  if (!jogador) {
    const cartao = document.getElementById("cartaoGerado");
    if (cartao) cartao.innerHTML = "<p>Não existe nenhum jogador registado.</p>";
    return;
  }
  gerarCartaoJogadorDados(jogador);
}

/**
 * Divide o nome longo em duas linhas se necessário
 */
function formatarNome(nome) {
  const limite = 18;
  if (nome.length <= limite) return nome;
  const partes = nome.trim().split(" ");
  if (partes.length >= 3) {
    const meio = Math.floor(partes.length / 2);
    return `${partes.slice(0, meio).join(" ")}<br>${partes.slice(meio).join(" ")}`;
  }
  return nome;
}

/**
 * Gera o cartão com base nos dados fornecidos (jogador qualquer)
 */
export function gerarCartaoJogadorDados(jogador) {
  injectarEstilosCartao();

  const cartao = document.getElementById("cartaoGerado");
  if (!cartao || !jogador) return;

  const classes = ["cartao-pixelado"];

  // Estilo visual conforme preferências
  if (document.body.classList.contains("modo-seguro")) {
    classes.push("cartao-conforto");
  }

  // Classificação visual por pontuação
  if (jogador.pontos < 500) {
    classes.push("cartao-novato");
  } else if (jogador.pontos < 1000) {
    classes.push("cartao-pixel");
  } else if (jogador.pontos < 2000) {
    classes.push("cartao-neon");
  } else {
    classes.push("cartao-ouro");
  }

  // Estilo adicional por número de combos
  if (jogador.combos >= 10) {
    classes.push("cartao-combo");
  }

  // Efeito holográfico para nível lendário
  const tituloCartao = jogador.nivel >= 20 ? "🏅 Cartão Lendário" : "Pico-Pico Bricks";
  if (jogador.nivel >= 20) {
    classes.push("cartao-holografico");
  }

  const emojiTopo = ["🕹️", "👾", "🎯", "🔥", "🚀", "⚡"][Math.floor(Math.random() * 6)];
  const nomeFormatado = formatarNome(jogador.nome);
  const tamanhoNome = "1.2em";

  cartao.innerHTML = `
    <div class="${classes.join(" ")}">
      <div class="cartao-topo">${emojiTopo} Cartão de Jogador</div>
      <div class="cartao-nome" style="font-size:${tamanhoNome};">${nomeFormatado}</div>
      <div class="cartao-detalhes">
        <div>Pontos: <strong>${jogador.pontos}</strong></div>
        <div>Nível: <strong>${jogador.nivel || "--"}</strong></div>
        <div>Combos: <strong>${jogador.combos || 0}</strong></div>
        <div>Data: <strong>${jogador.data || "--/--/----"}</strong></div>
        <div>Tempo: <strong>${jogador.tempo || "--:--"}</strong></div>
      </div>
      <div class="cartao-titulo-fundo">${tituloCartao}</div>
    </div>
  `;

  document.getElementById("cartaoModal")?.classList.add("show");

  const botaoExportar = document.getElementById("exportarCartaoBtn");
  if (botaoExportar) botaoExportar.onclick = () => exportarCartaoComoImagem(jogador.nivel);
}

/**
 * Exporta o cartão como imagem PNG com recurso à biblioteca html2canvas
 */
export function exportarCartaoComoImagem(nivelJogador) {
  const alvo = document.getElementById("cartaoGerado");
  if (!alvo) return;

  // Aplica estilo temporário para capturar efeito holográfico corretamente
  if (nivelJogador >= 20) {
    alvo.classList.add("forca-estilo-holografico");
  }

  html2canvas(alvo, {
    backgroundColor: "#111",
    scale: 2,
    useCORS: true
  }).then(canvas => {
    // Remove classe forçada após captura
    if (nivelJogador >= 20) {
      alvo.classList.remove("forca-estilo-holografico");
    }

    const imagem = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = imagem;
    link.download = "cartao-jogador.png";
    link.click();
  }).catch(() => {
    alert("Erro ao exportar cartão. Tenta novamente.");
    if (nivelJogador >= 20) {
      alvo.classList.remove("forca-estilo-holografico");
    }
  });
}

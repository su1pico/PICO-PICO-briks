// === Importação dos módulos principais ===
import {
  COLUNAS, LINHAS,
  criarMatriz, verificarColisao,
  fundirPeca, gerarPeca,
  limparLinhas
} from './motor.js';

import {
  configurarCanvas,
  desenharJogo, desenharProxima,
  atualizarTempo, mostrarModalFim
} from './canvas.js';

import {
  tocarSomColidir, tocarSomPerdeu,
  iniciarMusicaFundo, pararMusicaFundo,
  alternarMusica, alternarEfeitos
} from './audio.js';

import {
  moverPeca, rodarPeca, descerPeca,
  configurarControlos
} from './controlos.js';

import {
  processarLinhas,
  reiniciarPontuacao,
  guardarPontuacao,
  obterRankingOrdenado,
  injectarEstilosRankingPontuacao,
  nivel
} from './pontuacao.js';

import {
  partilharResultadoFinal,
  configurarPartilhasPerfil,
  configurarPartilhasPerfilFlexivel,
  configurarPartilhaClipboard,
  configurarPartilhaLinkCurto,
  configurarPartilhaEmailPerfil,
  configurarPartilhaImagemCartao
} from './partilhas.js';

import {
  gerarCartaoJogadorDados
} from './cartao.js';

// === Inicialização de estilos e partilhas ===
injectarEstilosRankingPontuacao();
configurarPartilhasPerfil();
configurarPartilhasPerfilFlexivel();
configurarPartilhaClipboard();
configurarPartilhaLinkCurto();
configurarPartilhaEmailPerfil();
configurarPartilhaImagemCartao();

// === Configuração dos canvas e estado inicial do jogo ===
const { ctxBoard, ctxNext } = configurarCanvas();
let tabuleiro   = criarMatriz(COLUNAS, LINHAS);
let pecaAtual   = gerarPeca(nivel);
let proximaPeca = gerarPeca(nivel);
let posicao     = { x: Math.floor(COLUNAS / 2) - 1, y: 0 };

let intervalo      = null;
let tempoIntervalo = null;
let segundos       = 0;

/**
 * Função principal de actualização do jogo a cada ciclo
 */
function atualizar() {
  posicao.y++;

  if (verificarColisao(tabuleiro, pecaAtual, posicao)) {
    posicao.y--;
    fundirPeca(tabuleiro, pecaAtual, posicao);
    tocarSomColidir();

    // Verifica se foi feita alguma linha e processa a pontuação
    const linhasFeitas = limparLinhas(tabuleiro);
    const { pontuacao } = processarLinhas(linhasFeitas);

    // Efeito visual de combo activado
    if (linhasFeitas > 1) {
      document.querySelector("canvas#board")?.classList.add("combo-ativo");
      setTimeout(() => {
        document.querySelector("canvas#board")?.classList.remove("combo-ativo");
      }, 600);
    }

    // Troca a peça actual pela próxima e gera uma nova peça
    [pecaAtual, proximaPeca] = [proximaPeca, gerarPeca(nivel)];
    posicao = { x: Math.floor(COLUNAS / 2) - 1, y: 0 };

    // 🎉 Celebração especial se for uma peça lendária
    if (nivel >= 20 && pecaAtual.flat().some(v => [11,12,13,14].includes(v))) {
      mostrarCelebracao("💎 Peça lendária recebida!");
    }

    // Verifica se perdeu após nova geração
    if (verificarColisao(tabuleiro, pecaAtual, posicao)) {
      tocarSomPerdeu();
      clearInterval(intervalo);
      clearInterval(tempoIntervalo);
      mostrarModalFim(pontuacao);
      return;
    }
  }

  desenhar();
}

/**
 * Redesenha o estado do jogo no canvas
 */
function desenhar() {
  desenharJogo(ctxBoard, ctxBoard.canvas.width, ctxBoard.canvas.height, tabuleiro, pecaAtual, posicao);
  desenharProxima(ctxNext, proximaPeca);
}

/**
 * Faz a peça cair instantaneamente até travar
 */
function quedaInstantanea() {
  while (!verificarColisao(tabuleiro, pecaAtual, { x: posicao.x, y: posicao.y + 1 })) {
    posicao.y++;
  }
  atualizar();
}

/**
 * Pausa o jogo e interrompe a música
 */
function pausarJogo() {
  clearInterval(intervalo);
  clearInterval(tempoIntervalo);
  intervalo = null;
  tempoIntervalo = null;
  pararMusicaFundo();
}

/**
 * Inicia o cronómetro do jogo
 */
function iniciarTempo() {
  tempoIntervalo = setInterval(() => {
    segundos++;
    atualizarTempo(segundos);
  }, 1000);
}

/**
 * Mostra uma mensagem breve no fundo do ecrã
 */
function mostrarMensagem(texto) {
  const msg = document.getElementById("mensagemConforto");
  if (!msg) return;
  msg.textContent = texto;
  msg.style.display = "block";
  msg.style.opacity = "1";
  setTimeout(() => {
    msg.style.opacity = "0";
    setTimeout(() => msg.style.display = "none", 1000);
  }, 4000);
}

/**
 * Atualiza estatísticas no modal de jogador
 */
function atualizarEstatisticasModal() {
  const lista = document.getElementById("estatisticasList");
  if (!lista) return;

  const nome   = document.getElementById("player-name")?.value.trim() || "Jogador";
  const pontos = document.getElementById("score")?.textContent || "0";
  const nivelTxt  = document.getElementById("level")?.textContent || "1";
  const tempo  = document.getElementById("time")?.textContent || "--:--";

  const ranking = obterRankingOrdenado();
  const jogadorSalvo = ranking.find(j => j.nome === nome);
  const combos = jogadorSalvo?.combos || 0;
  const data   = jogadorSalvo?.data || new Date().toLocaleDateString("pt-PT");

  lista.innerHTML = `
    <li>👤 Nome: ${nome}</li>
    <li>💯 Pontos: ${pontos}</li>
    <li>🎮 Nível: ${nivelTxt}</li>
    <li>🔁 Combos: ${combos}</li>
    <li>⏱️ Tempo: ${tempo}</li>
    <li>📅 Data: ${data}</li>
  `;
}

/**
 * Aplica automaticamente o modo conforto com base na hora ou preferências
 */
function aplicarModoAutomatico() {
  const pref = localStorage.getItem("modoConfortoAtivado");
  const hora = new Date().getHours();
  const estaNoite = hora >= 20 || hora <= 6;
  const ativar = (estaNoite && pref !== "false") || pref === "true";

  if (ativar) {
    document.body.classList.add("modo-seguro");
    if (estaNoite) {
      mostrarMensagem("🌙 O Pico-Pico activou automaticamente o modo conforto.");
    }
  }
}

/**
 * Ajusta o layout visual conforme a resolução do dispositivo
 */
function adaptarLayoutPorResolucao() {
  const altura = window.innerHeight;
  const largura = window.innerWidth;

  const titulo = document.querySelector("h1");
  const preview = document.getElementById("preview-container");
  const canvasTabuleiro = document.querySelector("canvas#board");

  if (altura <= 550 && titulo && preview) {
    titulo.style.display = "none";
    preview.style.display = "none";
  }

  if (largura <= 480 && canvasTabuleiro) {
    canvasTabuleiro.style.maxHeight = "38vh";
  }
}

// === Configuração dos controlos principais ===
configurarControlos(
  dir => moverPeca(dir, tabuleiro, pecaAtual, posicao),
  sentido => {
    const nova = rodarPeca(sentido, pecaAtual, tabuleiro, posicao);
    if (nova !== pecaAtual) {
      pecaAtual = nova;
      desenhar();
    }
  },
  () => {
    const travou = descerPeca(tabuleiro, pecaAtual, posicao);
    travou ? atualizar() : desenhar();
  },
  quedaInstantanea,
  pausarJogo
);

// === Ligações a botões da interface ===
const btns = {
  start: document.getElementById("startBtn"),
  pause: document.getElementById("pauseBtn"),
  reset: document.getElementById("resetBtn"),
  toggleSound: document.getElementById("toggle-sound"),
  confirmSave: document.getElementById("confirmSave"),
  cancelSave: document.getElementById("cancelSave"),
  top10: document.getElementById("top10Btn"),
  fecharTop10: document.getElementById("fecharTop10"),
  estatisticas: document.getElementById("estatisticasBtn"),
    fecharEstatisticas: document.getElementById("fecharEstatisticas"),
  partilhar: document.getElementById("partilharResultado"),
  cartao: document.getElementById("gerarCartaoJogador"),
  modoSeguro: document.getElementById("modoSeguroBtn"),
  resetPrefs: document.getElementById("resetPreferenciasBtn"),
  alternarEfeitos: document.getElementById("alternarEfeitosBtn")
};

// === Configuração dos botões da interface ===

// Iniciar jogo com velocidade adaptada ao nível
if (btns.start) {
  btns.start.addEventListener("click", () => {
    if (!intervalo) {
      const velocidade = Math.max(80, 600 - (nivel * 20));
      intervalo = setInterval(atualizar, velocidade);
      iniciarTempo();
      iniciarMusicaFundo();
    }
  });
}

// Pausar o jogo
btns.pause?.addEventListener("click", pausarJogo);

// Reiniciar jogo completo
btns.reset?.addEventListener("click", () => {
  pausarJogo();
  tabuleiro = criarMatriz(COLUNAS, LINHAS);
  [pecaAtual, proximaPeca] = [gerarPeca(nivel), gerarPeca(nivel)];
  posicao = { x: Math.floor(COLUNAS / 2) - 1, y: 0 };
  segundos = 0;
  reiniciarPontuacao();
  atualizarTempo(segundos);
  desenhar();
});

// Alternar música ambiente
btns.toggleSound?.addEventListener("click", alternarMusica);

// Guardar pontuação final
btns.confirmSave?.addEventListener("click", () => {
  const pontos = parseInt(document.getElementById("score")?.textContent || "0", 10);
  guardarPontuacao(pontos);
});

// Fechar modal de guardar
btns.cancelSave?.addEventListener("click", () => {
  document.getElementById("modal")?.classList.remove("show");
});

// Mostrar ranking Top 10
btns.top10?.addEventListener("click", () => {
  const modal = document.getElementById("top10Modal");
  const lista = document.getElementById("top10List");
  const ranking = obterRankingOrdenado();
  const nomeAtual = document.getElementById("player-name")?.value.trim();

  if (lista) {
    lista.innerHTML = ranking.map((jogador, i) => {
      const medalhaClass  = `medalha-${jogador.medalha}`;
      const destaqueClass = `destaque-${jogador.destaque}`;
      const ehAtual       = nomeAtual && nomeAtual === jogador.nome;
      const classeExtra   = ehAtual ? "jogador-actual" : "";

      return `<li class="${medalhaClass} ${destaqueClass} ${classeExtra}" title="🌟 ${jogador.data}">
        ${i + 1}. ${jogador.nome} — ${jogador.pontos} pts
      </li>`;
    }).join("");
  }

  modal?.classList.add("show");
});

// Fechar modal Top 10
btns.fecharTop10?.addEventListener("click", () => {
  document.getElementById("top10Modal")?.classList.remove("show");
});

// Mostrar estatísticas do jogador
btns.estatisticas?.addEventListener("click", () => {
  atualizarEstatisticasModal();
  document.getElementById("estatisticasModal")?.classList.add("show");
});

// Fechar estatísticas
btns.fecharEstatisticas?.addEventListener("click", () => {
  document.getElementById("estatisticasModal")?.classList.remove("show");
});

// Partilhar resultado final por rede, link ou email
btns.partilhar?.addEventListener("click", partilharResultadoFinal);

// Gerar cartão visual do jogador
btns.cartao?.addEventListener("click", () => {
  const nome   = document.getElementById("player-name")?.value.trim() || "Jogador Anónimo";
  const pontos = parseInt(document.getElementById("score")?.textContent || "0", 10);
  const nivelAtual = parseInt(document.getElementById("level")?.textContent || "1", 10);
  const tempo  = document.getElementById("time")?.textContent || "00:00";
  const ranking = obterRankingOrdenado();
  const jogadorSalvo = ranking.find(j => j.nome === nome);
  const combos = jogadorSalvo?.combos || 0;

  const data = new Date().toLocaleDateString("pt-PT", {
    day: "2-digit", month: "2-digit", year: "numeric"
  });

  const jogador = { nome, pontos, nivel: nivelAtual, data, combos, tempo };
  gerarCartaoJogadorDados(jogador);
});

// Alternar manualmente modo conforto (retro)
btns.modoSeguro?.addEventListener("click", () => {
  const corpo = document.body;
  const ativar = !corpo.classList.contains("modo-seguro");
  corpo.classList.toggle("modo-seguro");
  localStorage.setItem("modoConfortoAtivado", ativar ? "true" : "false");

  mostrarMensagem(ativar
    ? "Modo conforto activado."
    : "Modo conforto desactivado.");
});

// Reiniciar preferências guardadas e ranking
btns.resetPrefs?.addEventListener("click", () => {
  if (confirm("Queres mesmo apagar todas as pontuações e definições guardadas?")) {
    ["modoConfortoAtivado", "rankingTop10", "jogadorRecente"].forEach(chave => {
      localStorage.removeItem(chave);
    });
    document.body.classList.remove("modo-seguro");
    mostrarMensagem("Preferências apagadas.");
    setTimeout(() => location.reload(), 4000);
  }
});

// Alternar efeitos sonoros
btns.alternarEfeitos?.addEventListener("click", () => {
  const silenciado = btns.alternarEfeitos.classList.contains("silenciado");

  alternarEfeitos();
  btns.alternarEfeitos.classList.toggle("silenciado");
  btns.alternarEfeitos.textContent = silenciado
    ? "🔔 Efeitos Activos"
    : "🔕 Efeitos Silenciados";

  mostrarMensagem(silenciado
    ? "Efeitos sonoros activados."
    : "Efeitos sonoros silenciados.");
});

// === Inicialização visual ao carregar a página ===
atualizarTempo(segundos);
aplicarModoAutomatico();
adaptarLayoutPorResolucao();
desenhar();

// Elementos de áudio definidos no HTML
const somRodar    = document.getElementById("rodar");
const somColidir  = document.getElementById("colidir");
const somPerdeu   = document.getElementById("perdeu");
const musicaFundo = document.getElementById("musica-fundo");

// Estado dos efeitos e música (preservado localmente)
let efeitosAtivos = localStorage.getItem("efeitosLigados") !== "false";
let musicaLigada  = localStorage.getItem("musicaLigada") === "true";

/**
 * Verifica se o corpo está em modo conforto
 */
function estaModoConforto() {
  return document.body.classList.contains("modo-seguro");
}

/**
 * Toca um som, se os efeitos estiverem ativos e movimento não estiver reduzido
 */
function tocar(som) {
  if (!efeitosAtivos || !som || typeof som.play !== "function") return;

  try {
    som.pause();
    som.currentTime = 0;

    const prefereSilencio = window.matchMedia("(prefers-reduced-motion)").matches;
    if (!prefereSilencio) {
      som.play().catch(erro => console.warn("Erro ao reproduzir som:", erro));
    }
  } catch (e) {
    console.warn("Falha ao tocar som:", e);
  }
}

/**
 * Toca som de rotação
 */
export function tocarSomRodar() {
  tocar(somRodar);
}

/**
 * Toca som de colisão e ativa tremor visual no tabuleiro
 */
export function tocarSomColidir() {
  tocar(somColidir);

  const canvas = document.querySelector("canvas#board");
  if (canvas) {
    canvas.classList.add("tremor");
    setTimeout(() => canvas.classList.remove("tremor"), 300);
  }
}

/**
 * Toca som de fim de jogo
 */
export function tocarSomPerdeu() {
  tocar(somPerdeu);
}

/**
 * Inicia música de fundo com volume adaptado ao modo conforto
 */
export function iniciarMusicaFundo() {
  if (!musicaFundo || typeof musicaFundo.play !== "function") return;

  musicaFundo.volume = estaModoConforto() ? 0.15 : 0.5;
  musicaFundo.loop = true;

  musicaFundo.play().then(() => {
    musicaLigada = true;
    localStorage.setItem("musicaLigada", "true");
    document.getElementById("toggle-sound")?.classList.add("active");
  }).catch(() => {
    console.warn("Autoplay bloqueado pelo navegador.");
  });
}

/**
 * Interrompe música e atualiza estado visual
 */
export function pararMusicaFundo() {
  if (!musicaFundo || typeof musicaFundo.pause !== "function") return;

  try {
    musicaFundo.pause();
    musicaLigada = false;
    localStorage.setItem("musicaLigada", "false");
    document.getElementById("toggle-sound")?.classList.remove("active");
  } catch (e) {
    console.warn("Erro ao parar música:", e);
  }
}

/**
 * Alterna entre tocar ou silenciar música
 */
export function alternarMusica() {
  if (!musicaFundo) return;
  musicaFundo.paused ? iniciarMusicaFundo() : pararMusicaFundo();
}

/**
 * Alterna efeitos sonoros e atualiza botão visual
 */
export function alternarEfeitos() {
  efeitosAtivos = !efeitosAtivos;
  localStorage.setItem("efeitosLigados", efeitosAtivos ? "true" : "false");

  const btn = document.getElementById("alternarEfeitosBtn");
  if (btn) {
    btn.classList.toggle("active", efeitosAtivos);
    btn.classList.toggle("silenciado", !efeitosAtivos);
    btn.textContent = efeitosAtivos ? "🔔 Efeitos Activos" : "🔕 Efeitos Silenciados";
  }
}

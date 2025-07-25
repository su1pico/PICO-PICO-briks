import { verificarColisao, rodar } from "./motor.js";
import { tocarSomRodar } from "./audio.js";

// Estado actual do modo táctil arcade
let modoArcadeTatil = true;

/**
 * Vibração do dispositivo, se suportado e modo activo
 */
function vibrar(padrao) {
  if (!modoArcadeTatil || !navigator.vibrate) return;
  navigator.vibrate(padrao);
}

/**
 * Movimento lateral da peça
 */
export function moverPeca(direcao, tabuleiro, peca, posicao) {
  posicao.x += direcao;
  if (verificarColisao(tabuleiro, peca, posicao)) {
    posicao.x -= direcao;
  } else {
    vibrar(20);
  }
}

/**
 * Rotação da peça
 */
export function rodarPeca(direcao, peca, tabuleiro, posicao) {
  const rodada = rodar(peca, direcao);
  if (verificarColisao(tabuleiro, rodada, posicao)) return peca;
  tocarSomRodar();
  vibrar(30);
  return rodada;
}

/**
 * Queda da peça (1 linha)
 */
export function descerPeca(tabuleiro, peca, posicao) {
  posicao.y++;
  if (verificarColisao(tabuleiro, peca, posicao)) {
    posicao.y--;
    vibrar([60, 30, 60]);
    return true;
  }
  return false;
}

/**
 * Configura teclado, táctil, repetição de botões e alternador
 */
export function configurarControlos(moverFn, rodarFn, descerFn, quedaFn, pausarFn) {
  // === Teclado físico ===
  window.addEventListener("keydown", e => {
    const tecla = e.code.toLowerCase();
    if (["arrowleft", "arrowright", "arrowup", "arrowdown", "space"].includes(tecla)) {
      e.preventDefault();
    }
    if (e.repeat) return;

    switch (tecla) {
      case "arrowleft":  moverFn(-1); break;
      case "arrowright": moverFn(1); break;
      case "arrowdown":  descerFn(); break;
      case "arrowup":    rodarFn(1); break;
      case "space":      quedaFn(); break;
      case "keyp":       pausarFn(); break;
    }
  });

  // === Repetição contínua para botões visuais ===
  const repetirAoManter = (el, acao) => {
    let intervalo = null;
    const iniciar = () => {
      acao();
      if (!intervalo) intervalo = setInterval(acao, 150);
    };
    const parar = () => {
      clearInterval(intervalo);
      intervalo = null;
    };

    el?.addEventListener("mousedown", iniciar);
    el?.addEventListener("mouseup", parar);
    el?.addEventListener("mouseleave", parar);
    el?.addEventListener("touchstart", iniciar, { passive: true });
    el?.addEventListener("touchend", parar);
  };

  repetirAoManter(document.getElementById("leftBtn"), () => moverFn(-1));
  repetirAoManter(document.getElementById("rightBtn"), () => moverFn(1));
  repetirAoManter(document.getElementById("downBtn"), () => descerFn());

  document.getElementById("rotateBtn")?.addEventListener("click", () => rodarFn(1));
  document.getElementById("dropBtn")?.addEventListener("click", () => quedaFn());

  // === Gestos táctil no canvas ===
  const canvas = document.getElementById("board");
  const overlay = document.getElementById("overlayQuedaRapida");

  let startX = 0, startY = 0, ultimoToque = 0;
  let toqueLongoTimer = null;
  let quedaRapidaLoop = null;
  let movimentoLateralLoop = null;
  let direcaoAtual = null;

  canvas?.addEventListener("touchstart", e => {
    if (e.touches.length > 1) return;
    e.preventDefault();

    const toque = e.touches[0];
    startX = toque.clientX;
    startY = toque.clientY;

    const agora = Date.now();
    const intervalo = agora - ultimoToque;

    if (intervalo < 300 && !toqueLongoTimer) {
      rodarFn(1);
      requestAnimationFrame(() => {
        document.getElementById("board")?.classList.add("efeito-rotacao");
        setTimeout(() => {
          document.getElementById("board")?.classList.remove("efeito-rotacao");
        }, 120);
      });
    }
    ultimoToque = agora;

    if (!toqueLongoTimer) {
      toqueLongoTimer = setTimeout(() => {
        if (!quedaRapidaLoop) {
          quedaRapidaLoop = setInterval(() => {
            quedaFn();
            vibrar([20, 30, 20]);
            overlay?.classList.add("activo");
          }, 80);
        }
      }, 500);
    }
  }, { passive: false });

  canvas?.addEventListener("touchmove", e => {
    const toque = e.touches[0];
    const dx = toque.clientX - startX;
    const dy = toque.clientY - startY;

    if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
      clearInterval(quedaRapidaLoop);
      quedaRapidaLoop = null;
      overlay?.classList.remove("activo");
    }

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 12) {
      const novaDirecao = dx > 0 ? 1 : -1;

      if (novaDirecao !== direcaoAtual) {
        direcaoAtual = novaDirecao;
        moverFn(novaDirecao);
        vibrar(10);

        clearInterval(movimentoLateralLoop);
        movimentoLateralLoop = setInterval(() => moverFn(novaDirecao), 90);
      }
    }
  }, { passive: false });

  canvas?.addEventListener("touchend", e => {
    clearTimeout(toqueLongoTimer);
    clearInterval(quedaRapidaLoop);
    clearInterval(movimentoLateralLoop);
    toqueLongoTimer = null;
    quedaRapidaLoop = null;
    movimentoLateralLoop = null;
    direcaoAtual = null;
    overlay?.classList.remove("activo");

    if (e.changedTouches.length > 1) return;

    const toque = e.changedTouches[0];
    const dx = toque.clientX - startX;
    const dy = toque.clientY - startY;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const angulo = Math.atan2(dy, dx) * 180 / Math.PI;
    const limiar = 10;

    if (Math.max(absX, absY) < limiar && Date.now() - ultimoToque > 300) {
      rodarFn(1);
      ultimoToque = Date.now();
      return;
    }

    if (absX > 24 && (Math.abs(angulo) < 45 || Math.abs(angulo) > 135)) {
      dx > 0 ? moverFn(1) : moverFn(-1);
      return;
    }

    if (absY > absX && dy > 60) {
      quedaFn();
    } else if (absY > absX) {
      descerFn();
    }
  }, { passive: true });

  // === Alternador modo táctil arcade ===
  const btnTatil = document.getElementById("alternarModoTatil");
  if (btnTatil) {
    const actualizarVisual = () => {
      btnTatil.textContent = "Modo Táctil: " + (modoArcadeTatil ? "Activo" : "Inactivo");
      btnTatil.classList.toggle("botao-tatil-activo", modoArcadeTatil);
      btnTatil.classList.toggle("botao-tatil-inactivo", !modoArcadeTatil);
    };
    btnTatil.addEventListener("click", () => {
      modoArcadeTatil = !modoArcadeTatil;
      actualizarVisual();
    });
    actualizarVisual();
  }
}

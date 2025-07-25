/**
 * Partilha compatível com botão legacy id="partilharResultado"
 */
export function partilharResultadoFinal() {
  const pontos = document.getElementById("score")?.textContent || "0";
  const texto = `Joguei Pico-Pico Bricks e fiz ${pontos} pontos. Desafia-me!`;
  const url = window.location.href;

  if (navigator.share) {
    navigator.share({ title: "Pico-Pico Bricks", text: texto, url }).catch(() => {});
  } else {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(url)}`, "_blank");
  }
}

/**
 * Partilha legacy para redes sociais por id fixo
 */
export function configurarPartilhasPerfil() {
  const url = window.location.href;
  const texto = `Este é o meu perfil arcade em Pico-Pico Bricks. Vê se consegues competir.`;
  const abrir = link => window.open(link, "_blank");

  const map = {
    partilharPerfilTwitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(url)}`,
    partilharPerfilFacebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    partilharPerfilWhatsApp: `https://wa.me/?text=${encodeURIComponent(texto + " " + url)}`
  };

  for (const id in map) {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", () => abrir(map[id]));
  }

  const instagram = document.getElementById("partilharPerfilInstagram");
  if (instagram) instagram.addEventListener("click", () => {
    alert("📸 O Instagram não permite partilhas diretas de links. Copia o endereço manualmente.");
  });
}

/**
 * Partilha moderna usando data-partilhar="perfil"
 */
export function configurarPartilhasPerfilFlexivel() {
  document.querySelectorAll('[data-partilhar="perfil"]').forEach(botao => {
    botao.addEventListener("click", () => {
      const rede = botao.getAttribute("data-rede");
      const nome   = document.getElementById("player-name")?.value.trim() || "Jogador";
      const pontos = document.getElementById("score")?.textContent || "0";
      const nivel  = document.getElementById("level")?.textContent || "1";
      const tempo  = document.getElementById("time")?.textContent || "--:--";
      const url    = window.location.href;

      const texto = `🎮 Perfil de ${nome}\nPontuação: ${pontos}\nNível: ${nivel}\nTempo: ${tempo}\n#PicoPicoBricks`;
      const abrir = link => window.open(link, "_blank");

      switch (rede) {
        case "twitter":
          abrir(`https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(url)}`); break;
        case "facebook":
          abrir(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`); break;
        case "whatsapp":
          abrir(`https://wa.me/?text=${encodeURIComponent(texto + " " + url)}`); break;
        case "instagram":
          alert("📸 O Instagram não permite partilhas diretas de links. Copia o endereço manualmente."); break;
      }
    });
  });
}

/**
 * Copia o perfil como texto para a área de transferência
 */
export function configurarPartilhaClipboard() {
  document.querySelectorAll('[data-partilhar="copiar"]').forEach(botao => {
    botao.addEventListener("click", () => {
      const nome   = document.getElementById("player-name")?.value.trim() || "Jogador";
      const pontos = document.getElementById("score")?.textContent || "0";
      const nivel  = document.getElementById("level")?.textContent || "1";
      const tempo  = document.getElementById("time")?.textContent || "--:--";
      const texto = `🎮 Perfil de ${nome}\nPontuação: ${pontos}\nNível: ${nivel}\nTempo: ${tempo}\n#PicoPicoBricks`;

      navigator.clipboard.writeText(texto)
        .then(() => alert("📋 Texto copiado para a área de transferência!"))
        .catch(() => alert("Erro ao copiar. Usa Ctrl+C manualmente."));
    });
  });
}

/**
 * Cria um link curto via TinyURL ou copia o URL em caso de falha (CORS)
 */
export function configurarPartilhaLinkCurto() {
  document.querySelectorAll('[data-partilhar="link"]').forEach(botao => {
    botao.addEventListener("click", () => {
      const url = window.location.href;

      fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`)
        .then(res => {
          if (!res.ok) throw new Error("Resposta inválida");
          return res.text();
        })
        .then(link => {
          navigator.clipboard.writeText(link)
            .then(() => alert(`🔗 Link curto copiado: ${link}`))
            .catch(() => alert("Link gerado mas não foi possível copiá-lo."));
        })
        .catch(() => {
          navigator.clipboard.writeText(url)
            .then(() => alert("📡 Não foi possível encurtar. Link original copiado."))
            .catch(() => alert("Erro ao copiar. Usa Ctrl+C manualmente."));
        });
    });
  });
}

/**
 * Envia o perfil por email
 */
export function configurarPartilhaEmailPerfil() {
  document.querySelectorAll('[data-partilhar="email"]').forEach(botao => {
    botao.addEventListener("click", () => {
      const nome   = document.getElementById("player-name")?.value.trim() || "Jogador";
      const pontos = document.getElementById("score")?.textContent || "0";
      const nivel  = document.getElementById("level")?.textContent || "1";
      const tempo  = document.getElementById("time")?.textContent || "--:--";
      const url    = window.location.href;

      const assunto = "Perfil de Jogo – Pico-Pico Bricks";
      const corpo = `🎮 Perfil de ${nome}\nPontuação: ${pontos}\nNível: ${nivel}\nTempo: ${tempo}\nLink: ${url}`;
      window.open(`mailto:?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`, "_blank");
    });
  });
}

/**
 * Copia o cartão como imagem (via html2canvas)
 */
export function configurarPartilhaImagemCartao() {
  document.querySelectorAll('[data-partilhar="imagem"]').forEach(botao => {
    botao.addEventListener("click", () => {
      const alvo = document.getElementById("cartaoGerado");
      if (!alvo) return;

      html2canvas(alvo, {
        backgroundColor: "#111",
        scale: 2,
        useCORS: true
      }).then(canvas => {
        canvas.toBlob(blob => {
          const item = new ClipboardItem({ "image/png": blob });
          navigator.clipboard.write([item])
            .then(() => alert("🖼️ Cartão copiado como imagem!"))
            .catch(() => alert("Erro ao copiar imagem."));
        });
      });
    });
  });
}

/**
 * Injecta estilos visuais retro no popup de partilha
 */
export function injectarEstilosPartilhas() {
  if (document.getElementById("estilos-partilhas")) return;

  const estilos = document.createElement("style");
  estilos.id = "estilos-partilhas";
  estilos.textContent = `
    #popupPartilhar .popup-content {
      background: #111;
      color: #00ffee;
      padding: 1em;
      border-radius: 10px;
      box-shadow: 0 0 16px rgba(0,255,255,0.4);
      font-family: 'Press Start 2P', monospace;
      text-align: center;
      max-width: 340px;
      margin: 2em auto;
    }
    #popupPartilhar button {
      background: #222;
      color: #00ffcc;
      border: 2px solid #00ffff;
      padding: 0.5em 1em;
      margin: 0.3em auto;
      display: block;
      width: 100%;
      font-size: 0.75em;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    #popupPartilhar button:hover {
      background-color: #00ffff;
      color: #111;
      box-shadow: 0 0 8px rgba(0,255,255,0.5);
    }
    #popupPartilhar h3 {
      font-size: 0.9em;
      margin-bottom: 1em;
      color: #ffff66;
      text-shadow: 1px 1px #000;
    }
    @media (max-width: 420px) {
      #popupPartilhar .popup-content {
        width: 95%;
        font-size: 11px;
      }

      #popupPartilhar button {
        font-size: 0.7em;
      }

      #popupPartilhar h3 {
        font-size: 0.8em;
      }
    }
  `;
  document.head.appendChild(estilos);
}

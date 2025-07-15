export let somAtivo = true;

export const sons = {
  musicaFundo: document.getElementById("musica-fundo"),
  somRodar: document.getElementById("som-rodar"),
  somColidir: document.getElementById("som-colidir"),
  somPontos: document.getElementById("som-pontos"),
  somPerdeu: document.getElementById("som-perdeu"),
};

export function playSound(audio) {
  if (somAtivo) {
    audio.currentTime = 0;
    audio.play();
  }
}

export function toggleSound(button) {
  somAtivo = !somAtivo;
  button.textContent = somAtivo ? "🔊 Som" : "🔇 Silenciar";
  if (somAtivo) sons.musicaFundo.play();
  else sons.musicaFundo.pause();
}

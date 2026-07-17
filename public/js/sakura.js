// Animasi dekoratif: kelopak sakura berjatuhan perlahan
(function () {
  const container = document.getElementById("sakura-container");
  if (!container) return;

  const JUMLAH_KELOPAK = 16;

  for (let i = 0; i < JUMLAH_KELOPAK; i++) {
    const petal = document.createElement("div");
    petal.className = "petal";

    const left = Math.random() * 100;
    const fallDuration = 8 + Math.random() * 8; // 8-16 detik
    const swayDuration = 3 + Math.random() * 3;
    const delay = Math.random() * 12;
    const size = 8 + Math.random() * 10;
    const rotate = Math.random() * 360;

    petal.style.left = left + "vw";
    petal.style.width = size + "px";
    petal.style.height = size + "px";
    petal.style.transform = `rotate(${rotate}deg)`;
    petal.style.animationDuration = `${fallDuration}s, ${swayDuration}s`;
    petal.style.animationDelay = `${delay}s, ${delay}s`;

    container.appendChild(petal);
  }
})();

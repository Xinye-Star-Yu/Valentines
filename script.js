const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const buttonArea = document.getElementById("buttonArea");
const success = document.getElementById("success");
const confetti = document.getElementById("confetti");

let lastPos = { x: null, y: null };
let locked = false;

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function rectsOverlap(a, b, padding = 12) {
  return !(
    a.x + a.w + padding < b.x ||
    a.x > b.x + b.w + padding ||
    a.y + a.h + padding < b.y ||
    a.y > b.y + b.h + padding
  );
}

function getRelativeRect(childRect, parentRect) {
  return {
    x: childRect.left - parentRect.left,
    y: childRect.top - parentRect.top,
    w: childRect.width,
    h: childRect.height,
  };
}

function setNoPosition(x, y) {
  noBtn.style.left = `${x}px`;
  noBtn.style.top = `${y}px`;
  lastPos = { x, y };
}

function moveNoButton() {
  if (locked) return;

  const areaRect = buttonArea.getBoundingClientRect();
  const noRect = noBtn.getBoundingClientRect();
  const yesRect = yesBtn.getBoundingClientRect();

  const maxX = Math.max(0, areaRect.width - noRect.width);
  const maxY = Math.max(0, areaRect.height - noRect.height);

  const yesBox = getRelativeRect(yesRect, areaRect);

  let x = 0;
  let y = 0;
  let tries = 0;

  while (tries < 40) {
    x = Math.random() * maxX;
    y = Math.random() * maxY;

    const noBox = { x, y, w: noRect.width, h: noRect.height };
    const tooClose =
      lastPos.x !== null &&
      Math.hypot(lastPos.x - x, lastPos.y - y) < 18;

    if (!rectsOverlap(noBox, yesBox) && !tooClose) break;

    tries += 1;
  }

  setNoPosition(x, y);
}

function ensureNoWithinBounds() {
  const areaRect = buttonArea.getBoundingClientRect();
  const noRect = noBtn.getBoundingClientRect();
  const maxX = Math.max(0, areaRect.width - noRect.width);
  const maxY = Math.max(0, areaRect.height - noRect.height);

  const currentX = parseFloat(noBtn.style.left || "0");
  const currentY = parseFloat(noBtn.style.top || "0");

  const clampedX = clamp(currentX, 0, maxX);
  const clampedY = clamp(currentY, 0, maxY);

  setNoPosition(clampedX, clampedY);
}

function launchConfetti() {
  if (prefersReducedMotion) return;

  confetti.innerHTML = "";
  const colors = ["#ff4f9a", "#ffd26e", "#5bcf98", "#6ecbff", "#f9b3d1"];

  for (let i = 0; i < 36; i += 1) {
    const piece = document.createElement("span");
    const size = 6 + Math.random() * 8;
    piece.className = "piece";
    piece.style.width = `${size}px`;
    piece.style.height = `${size * 1.6}px`;
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    piece.style.animationDuration = `${1.6 + Math.random() * 1.4}s`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    confetti.appendChild(piece);
  }
}

function handleYesClick() {
  locked = true;
  buttonArea.classList.add("hidden");
  success.classList.remove("hidden");
  launchConfetti();
}

function handleNearTap(event) {
  if (locked) return;
  if (event.target === yesBtn || event.target === noBtn) return;

  const noRect = noBtn.getBoundingClientRect();
  const noCenterX = noRect.left + noRect.width / 2;
  const noCenterY = noRect.top + noRect.height / 2;
  const distance = Math.hypot(noCenterX - event.clientX, noCenterY - event.clientY);

  if (distance < 80) {
    moveNoButton();
  }
}

function init() {
  yesBtn.addEventListener("click", handleYesClick);
  noBtn.addEventListener("mouseenter", moveNoButton);
  noBtn.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    moveNoButton();
  });

  buttonArea.addEventListener("pointerdown", handleNearTap);
  window.addEventListener("resize", ensureNoWithinBounds);

  requestAnimationFrame(() => {
    const areaWidth = buttonArea.clientWidth;
    const areaHeight = buttonArea.clientHeight;
    const x = Math.max(0, areaWidth - noBtn.offsetWidth);
    const y = Math.max(0, Math.floor(areaHeight * 0.15));
    setNoPosition(x, y);

    const areaRect = buttonArea.getBoundingClientRect();
    const yesRect = yesBtn.getBoundingClientRect();
    const noRect = noBtn.getBoundingClientRect();
    const yesBox = getRelativeRect(yesRect, areaRect);
    const noBox = getRelativeRect(noRect, areaRect);

    if (rectsOverlap(noBox, yesBox)) {
      moveNoButton();
    } else {
      ensureNoWithinBounds();
    }
  });
}

init();

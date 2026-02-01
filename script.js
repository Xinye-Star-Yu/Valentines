const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const buttonArea = document.getElementById("buttonArea");
const success = document.getElementById("success");
const confetti = document.getElementById("confetti");
const backBtn = document.getElementById("backBtn");

let lastOffset = { x: null, y: null };
let locked = false;
let noHomeRect = null;

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const MIN_DISTANCE_FROM_POINTER = 120;
const MIN_MOVE_DISTANCE = 60;

function rectsOverlap(a, b, padding = 12) {
  return !(
    a.x + a.w + padding < b.x ||
    a.x > b.x + b.w + padding ||
    a.y + a.h + padding < b.y ||
    a.y > b.y + b.h + padding
  );
}

function rectFromDomRect(rect) {
  return {
    x: rect.left,
    y: rect.top,
    w: rect.width,
    h: rect.height,
  };
}

function setNoOffset(x, y) {
  noBtn.style.transform = `translate(${x}px, ${y}px)`;
  lastOffset = { x, y };
}

function refreshHomeRect() {
  noBtn.style.left = "0px";
  noBtn.style.top = "0px";
  noBtn.style.transform = "translate(0px, 0px)";
  lastOffset = { x: 0, y: 0 };
  noHomeRect = noBtn.getBoundingClientRect();
}

function moveNoButton(event) {
  if (locked) return;
  if (!noHomeRect) refreshHomeRect();

  const areaRect = buttonArea.getBoundingClientRect();
  const yesRect = yesBtn.getBoundingClientRect();
  const yesBox = rectFromDomRect(yesRect);

  const minX = Math.min(
    areaRect.left - noHomeRect.left,
    areaRect.right - noHomeRect.right
  );
  const maxX = Math.max(
    areaRect.left - noHomeRect.left,
    areaRect.right - noHomeRect.right
  );
  const minY = Math.min(
    areaRect.top - noHomeRect.top,
    areaRect.bottom - noHomeRect.bottom
  );
  const maxY = Math.max(
    areaRect.top - noHomeRect.top,
    areaRect.bottom - noHomeRect.bottom
  );
  const rangeX = Math.max(0, maxX - minX);
  const rangeY = Math.max(0, maxY - minY);

  const pointer = event
    ? { x: event.clientX, y: event.clientY }
    : null;

  let x = 0;
  let y = 0;
  let tries = 0;
  let bestCandidate = null;
  let bestPointerDistance = -1;
  let fallbackCandidate = null;
  let fallbackPointerDistance = -1;

  while (tries < 70) {
    x = minX + (rangeX === 0 ? 0 : Math.random() * rangeX);
    y = minY + (rangeY === 0 ? 0 : Math.random() * rangeY);

    const noBox = {
      x: noHomeRect.left + x,
      y: noHomeRect.top + y,
      w: noHomeRect.width,
      h: noHomeRect.height,
    };
    if (rectsOverlap(noBox, yesBox)) {
      tries += 1;
      continue;
    }

    const pointerDistance = pointer
      ? Math.hypot(
          noBox.x + noBox.w / 2 - pointer.x,
          noBox.y + noBox.h / 2 - pointer.y
        )
      : Infinity;

    if (pointerDistance > fallbackPointerDistance) {
      fallbackPointerDistance = pointerDistance;
      fallbackCandidate = { x, y };
    }

    const moveDistance =
      lastOffset.x !== null
        ? Math.hypot(lastOffset.x - x, lastOffset.y - y)
        : MIN_MOVE_DISTANCE;

    if (moveDistance < MIN_MOVE_DISTANCE) {
      tries += 1;
      continue;
    }

    if (pointerDistance > bestPointerDistance) {
      bestPointerDistance = pointerDistance;
      bestCandidate = { x, y };
    }

    if (!pointer || pointerDistance >= MIN_DISTANCE_FROM_POINTER) {
      bestCandidate = { x, y };
      break;
    }

    tries += 1;
  }

  if (bestCandidate) {
    setNoOffset(bestCandidate.x, bestCandidate.y);
  } else if (fallbackCandidate) {
    setNoOffset(fallbackCandidate.x, fallbackCandidate.y);
  } else {
    setNoOffset(0, 0);
  }
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
  success.hidden = false;
  backBtn.classList.remove("hidden");
  backBtn.hidden = false;
  launchConfetti();
}

function handleBackClick() {
  locked = false;
  buttonArea.classList.remove("hidden");
  success.classList.add("hidden");
  success.hidden = true;
  backBtn.classList.add("hidden");
  backBtn.hidden = true;
  confetti.innerHTML = "";
  refreshHomeRect();
}

function handleNearTap(event) {
  if (locked) return;
  if (event.target === yesBtn || event.target === noBtn) return;

  const noRect = noBtn.getBoundingClientRect();
  const noCenterX = noRect.left + noRect.width / 2;
  const noCenterY = noRect.top + noRect.height / 2;
  const distance = Math.hypot(noCenterX - event.clientX, noCenterY - event.clientY);

  if (distance < 80) {
    moveNoButton(event);
  }
}

function init() {
  yesBtn.addEventListener("click", handleYesClick);
  backBtn.addEventListener("click", handleBackClick);
  noBtn.addEventListener("mouseenter", moveNoButton);
  noBtn.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    moveNoButton(event);
  });

  buttonArea.addEventListener("pointerdown", handleNearTap);
  window.addEventListener("resize", refreshHomeRect);

  requestAnimationFrame(() => {
    refreshHomeRect();
  });
}

init();

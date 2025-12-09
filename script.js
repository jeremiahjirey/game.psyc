// Enhanced script.js — Added sound + 10 levels + start/win SFX + popups
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function fitCanvas() {
  const r = canvas.getBoundingClientRect();
  canvas.width = Math.round(r.width);
  canvas.height = Math.round(r.height);
}
window.addEventListener("resize", fitCanvas);
fitCanvas();

// HUD
const hudAngle = document.getElementById("hud-angle");
const hudSpeed = document.getElementById("hud-speed");
const hudVx = document.getElementById("hud-vx");
const hudVy = document.getElementById("hud-vy");
const hudLevel = document.getElementById("hud-level");
const hudScore = document.getElementById("hud-score");

// Sound
const hitSound = new Audio("asset/hitsound.mp3");
hitSound.volume = 0.5;

// Extra Sounds
const gameStartSound = new Audio("asset/startsound.mp3");
const gameWinSound = new Audio("asset/winnersound.mp3");
gameStartSound.volume = 0.6;
gameWinSound.volume = 0.6;

// Slingshot
let sling = { x: 150, y: canvas.height - 150 };
function updateSlingPosition() {
  sling.y = canvas.height - 150;
}
updateSlingPosition();
window.addEventListener("resize", updateSlingPosition);

let ball = { x: sling.x, y: sling.y, r: 18, dragging: false, fired: false, vx: 0, vy: 0 };
let gravity = 0.4;
let levelIndex = 0;
let score = 0;
let enemies = [];

// 10 LEVELS
const levels = Array.from({ length: 10 }, (_, i) => {
  let count = 1 + i; 
  let arr = [];
  for (let k = 0; k < count; k++) {
    arr.push({
      x: 600 + Math.random() * (canvas.width - 700),
      y: canvas.height - (120 + Math.random() * 150),
      r: 20 + Math.random() * 15
    });
  }
  return { enemies: arr };
});

function cloneEnemies(def) {
  return def.map(e => ({ x: e.x, y: e.y, r: e.r, alive: true }));
}

// Popup
let popup = document.createElement("div");
popup.id = "popup-msg";
popup.style.position = "absolute";
popup.style.top = "50%";
popup.style.left = "50%";
popup.style.transform = "translate(-50%, -50%)";
popup.style.padding = "30px 50px";
popup.style.background = "rgba(0,0,0,0.8)";
popup.style.borderRadius = "12px";
popup.style.fontSize = "40px";
popup.style.fontWeight = "bold";
popup.style.color = "#fff";
popup.style.zIndex = "1000";
popup.style.display = "none";
document.body.appendChild(popup);

function showPopup(text) {
  popup.innerHTML = text;
  popup.style.display = "block";
  setTimeout(() => popup.style.display = "none", 1200);
}

showPopup("GAME START");
gameStartSound.play();

function loadLevel(i) {
  levelIndex = i % levels.length;
  enemies = cloneEnemies(levels[levelIndex].enemies);
  resetBall();
  hudLevel.textContent = levelIndex + 1;
}

function resetLevel() { loadLevel(levelIndex); }
function nextLevel() { loadLevel(levelIndex + 1); }

// Buttons
document.getElementById("reset-level").onclick = resetLevel;
document.getElementById("next-level").onclick = nextLevel;

// Draw slingshot
function drawSlingshot() {
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#8b5a2b";

  ctx.beginPath();
  ctx.moveTo(sling.x - 20, sling.y + 50);
  ctx.lineTo(sling.x - 20, sling.y - 40);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(sling.x + 20, sling.y + 50);
  ctx.lineTo(sling.x + 20, sling.y - 40);
  ctx.stroke();

  if (ball.dragging) {
    ctx.strokeStyle = "#553311";
    ctx.beginPath();
    ctx.moveTo(sling.x - 20, sling.y - 40);
    ctx.lineTo(ball.x, ball.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(sling.x + 20, sling.y - 40);
    ctx.lineTo(ball.x, ball.y);
    ctx.stroke();
  }
}

// Trajectory
function drawTrajectory(vx, vy) {
  ctx.fillStyle = "rgba(255,165,0,0.85)";
  let tx = ball.x, ty = ball.y;
  let tvx = vx, tvy = vy;

  for (let i = 0; i < 45; i++) {
    tx += tvx;
    ty += tvy;
    tvy += gravity;
    ctx.beginPath();
    ctx.arc(tx, ty, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Draw ball (fixed)
function drawBall() {
  ctx.fillStyle = "#ffcc00";
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
}

// Draw enemies
function drawEnemies() {
  enemies.forEach(e => {
    if (!e.alive) return;
    ctx.fillStyle = "#4ade80";
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Physics
function updateBall() {
  if (ball.fired) {
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.vy += gravity;
  }

  enemies.forEach(e => {
    if (!e.alive) return;
    let d = Math.hypot(ball.x - e.x, ball.y - e.y);
    if (d < ball.r + e.r) {
      e.alive = false;
      score += 100;
      hudScore.textContent = score;
      hitSound.currentTime = 0;
      hitSound.play();
      ball.vx *= -0.3;
      ball.vy *= -0.3;
    }
  });

  if (ball.y > canvas.height + 150) resetBall();

  if (!enemies.some(e => e.alive)) {
    if (!canvas._pendingLevel) {
      canvas._pendingLevel = true;
      setTimeout(() => {
        canvas._pendingLevel = false;
        gameWinSound.play();
        showPopup("WINNER");
        nextLevel();
      }, 700);
    }
  }
}

function resetBall() {
  ball.x = sling.x;
  ball.y = sling.y;
  ball.fired = false;
  ball.dragging = false;
  ball.vx = 0;
  ball.vy = 0;
}

// Main loop
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, "#b3e5ff");
  g.addColorStop(1, "#0a2740");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#174b1a";
  ctx.fillRect(0, canvas.height - 100, canvas.width, 100);

  drawSlingshot();

  if (ball.dragging) drawTrajectory(ball.vx, ball.vy);

  drawBall();
  drawEnemies();
  updateBall();

  requestAnimationFrame(loop);
}
loop();

// Mouse events
canvas.addEventListener("mousedown", e => {
  let r = canvas.getBoundingClientRect();
  let mx = e.clientX - r.left;
  let my = e.clientY - r.top;
  if (Math.hypot(mx - ball.x, my - ball.y) < ball.r + 5 && !ball.fired) ball.dragging = true;
});

canvas.addEventListener("mousemove", e => {
  if (!ball.dragging) return;
  let r = canvas.getBoundingClientRect();
  ball.x = e.clientX - r.left;
  ball.y = e.clientY - r.top;

  let dx = sling.x - ball.x;
  let dy = sling.y - ball.y;

  const factor = 0.22;
  ball.vx = dx * factor;
  ball.vy = dy * factor;

  hudAngle.textContent = (Math.atan2(dy, dx) * 180 / Math.PI).toFixed(1);
  hudSpeed.textContent = Math.hypot(ball.vx, ball.vy).toFixed(1);
  hudVx.textContent = ball.vx.toFixed(1);
  hudVy.textContent = ball.vy.toFixed(1);
});

canvas.addEventListener("mouseup", () => {
  if (ball.dragging) {
    ball.dragging = false;
    ball.fired = true;
  }
});

loadLevel(0);

// Improved script.js — adds level system + next/reset handling
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// make canvas match CSS size
function fitCanvas() {
  const r = canvas.getBoundingClientRect();
  canvas.width = Math.round(r.width);
  canvas.height = Math.round(r.height);
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

// HUD elements
const hudAngle = document.getElementById("hud-angle");
const hudSpeed = document.getElementById("hud-speed");
const hudVx = document.getElementById("hud-vx");
const hudVy = document.getElementById("hud-vy");
const hudLevel = document.getElementById("hud-level");
const hudScore = document.getElementById("hud-score");

// Slingshot anchor (fixed in world/screen coords since we use canvas pixels)
let sling = { x: 150, y: canvas.height - 150 };
function updateSlingPosition() { sling.y = canvas.height - 150; }
updateSlingPosition();
window.addEventListener('resize', updateSlingPosition);

// Ball state
let ball = { x: sling.x, y: sling.y, r: 18, dragging: false, fired: false, vx: 0, vy: 0 };

// Physics
let gravity = 0.4;

// Level system
let levelIndex = 0;
let score = 0;
let enemies = []; // array of {x,y,r,alive}
const levels = [
  // level 1
  {
    enemies: [{ x: 700, y: canvas.height - 120, r: 25 }],
  },
  // level 2
  {
    enemies: [
      { x: 900, y: canvas.height - 120, r: 25 },
      { x: 1100, y: canvas.height - 140, r: 20 }
    ],
  }
];

// Utilities
function cloneEnemiesFromDef(def) {
  // convert defs into runtime enemy objects (adjust y by current canvas height)
  return def.map(e => ({ x: e.x, y: (e.y || (canvas.height - 120)), r: e.r || 20, alive: true }));
}

// Load / reset / next level
function loadLevel(i) {
  levelIndex = Math.max(0, Math.min(i, levels.length - 1));
  enemies = cloneEnemiesFromDef(levels[levelIndex].enemies);
  resetBall();
  hudLevel.textContent = (levelIndex + 1);
  hudScore.textContent = score;
}

function resetLevel() {
  // reload same level
  enemies = cloneEnemiesFromDef(levels[levelIndex].enemies);
  resetBall();
}

function nextLevel() {
  levelIndex = (levelIndex + 1) % levels.length;
  loadLevel(levelIndex);
}

// hook buttons
const btnReset = document.getElementById('reset-level');
const btnNext = document.getElementById('next-level');
if (btnReset) btnReset.addEventListener('click', () => { resetLevel(); });
if (btnNext) btnNext.addEventListener('click', () => { nextLevel(); });

// Drawing functions (kept similar to original)
function drawSlingshot() {
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#8b5a2b";

  // Two wooden pillars
  ctx.beginPath();
  ctx.moveTo(sling.x - 20, sling.y + 50);
  ctx.lineTo(sling.x - 20, sling.y - 40);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(sling.x + 20, sling.y + 50);
  ctx.lineTo(sling.x + 20, sling.y - 40);
  ctx.stroke();

  // Rubber band
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

function drawTrajectory(vx, vy) {
  ctx.fillStyle = "rgba(255,165,0,0.8)";

  let tempX = ball.x;
  let tempY = ball.y;
  let tVx = vx;
  let tVy = vy;

  // draw dots for predicted positions (use smaller dt steps for smoother)
  for (let i = 0; i < 40; i++) {
    tempX += tVx;
    tempY += tVy;
    tVy += gravity;

    ctx.beginPath();
    ctx.arc(tempX, tempY, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBall() {
  ctx.fillStyle = "#ffcc00";
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemies() {
  enemies.forEach(e => {
    if (!e.alive) return;
    ctx.fillStyle = "#4ade80";
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Physics update
function updateBall() {
  if (ball.fired) {
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.vy += gravity;
  }

  // Collision with enemies
  enemies.forEach(e => {
    if (!e.alive) return;
    let dist = Math.hypot(ball.x - e.x, ball.y - e.y);
    if (dist < ball.r + e.r) {
      e.alive = false;
      score += 100;
      hudScore.textContent = score;
      // slight bounce effect
      ball.vx *= -0.3;
      ball.vy *= -0.3;
    }
  });

  // Reset if off screen
  if (ball.y > canvas.height + 200 || ball.x < -200 || ball.x > canvas.width + 200) {
    resetBall();
  }

  // if all enemies dead -> next level with small delay
  const anyAlive = enemies.some(en => en.alive);
  if (!anyAlive) {
    // prevent multiple triggers: mark a temporary flag on enemies array
    if (!canvas._advancing) {
      canvas._advancing = true;
      setTimeout(() => {
        canvas._advancing = false;
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
  hudAngle.textContent = "0";
  hudSpeed.textContent = "0";
  hudVx.textContent = "0";
  hudVy.textContent = "0";
}

// Main loop
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background (simple)
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, '#a8e0ff'); g.addColorStop(1, '#10324a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ground
  ctx.fillStyle = '#174b1a';
  ctx.fillRect(0, canvas.height - 100, canvas.width, 100);

  drawSlingshot();

  if (ball.dragging) {
    // draw predicted trajectory based on current vx/vy (computed while dragging)
    drawTrajectory(ball.vx, ball.vy);
  }

  drawBall();
  drawEnemies();
  updateBall();

  requestAnimationFrame(loop);
}
loop();

// Mouse controls (works with the pixel-space canvas coordinates)
canvas.addEventListener("mousedown", e => {
  let rect = canvas.getBoundingClientRect();
  let mx = e.clientX - rect.left;
  let my = e.clientY - rect.top;
  let dist = Math.hypot(mx - ball.x, my - ball.y);

  if (dist < ball.r + 5 && !ball.fired) {
    ball.dragging = true;
  }
});

canvas.addEventListener("mousemove", e => {
  if (!ball.dragging) return;
  let rect = canvas.getBoundingClientRect();
  ball.x = e.clientX - rect.left;
  ball.y = e.clientY - rect.top;

  // compute delta from sling to ball (we want sling -> ball vector so shot is opposite)
  let dx = sling.x - ball.x;
  let dy = sling.y - ball.y;

  // speed factor and clamp
  let speedFactor = 0.2;
  let maxSpeed = 18;
  let speed = Math.min(Math.hypot(dx, dy) * speedFactor, maxSpeed);

  ball.vx = dx * speedFactor;
  ball.vy = dy * speedFactor;

  let angle = Math.atan2(dy, dx) * 180 / Math.PI;

  hudAngle.textContent = angle.toFixed(1);
  hudSpeed.textContent = speed.toFixed(1);
  hudVx.textContent = ball.vx.toFixed(1);
  hudVy.textContent = ball.vy.toFixed(1);
});

canvas.addEventListener("mouseup", () => {
  if (ball.dragging) {
    ball.dragging = false;
    ball.fired = true;
  }
});

// init first level on load
loadLevel(0);

// Basic Angry Birds-like physics engine with slingshot visualization
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

// HUD elements
const hudAngle = document.getElementById("hud-angle");
hudAngle.textContent = 0;
const hudSpeed = document.getElementById("hud-speed");
const hudVx = document.getElementById("hud-vx");
const hudVy = document.getElementById("hud-vy");

// Slingshot anchor
let sling = { x: 150, y: canvas.height - 150 };
let ball = { x: sling.x, y: sling.y, r: 18, dragging: false, fired: false, vx: 0, vy: 0 };
let gravity = 0.4;

// Enemy
let enemies = [{ x: 700, y: canvas.height - 120, r: 25, alive: true }];

// Draw slingshot
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

// Draw trajectory prediction
function drawTrajectory(vx, vy) {
  ctx.fillStyle = "rgba(255,165,0,0.8)";

  let tempX = ball.x;
  let tempY = ball.y;
  let tVx = vx;
  let tVy = vy;

  for (let i = 0; i < 40; i++) {
    tempX += tVx;
    tempY += tVy;
    tVy += gravity;

    ctx.beginPath();
    ctx.arc(tempX, tempY, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Draw ball
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
    }
  });

  // Reset if off screen
  if (ball.y > canvas.height + 200) resetBall();
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

  drawSlingshot();

  if (ball.dragging) {
    drawTrajectory(ball.vx, ball.vy);
  }

  drawBall();
  drawEnemies();
  updateBall();

  requestAnimationFrame(loop);
}
loop();

// Mouse controls
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

  let dx = sling.x - ball.x;
  let dy = sling.y - ball.y;

  let angle = Math.atan2(dy, dx) * 180 / Math.PI;
  let speed = Math.min(Math.hypot(dx, dy) * 0.2, 18);

  ball.vx = dx * 0.2;
  ball.vy = dy * 0.2;

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

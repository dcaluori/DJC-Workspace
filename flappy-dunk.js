(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  // ─── Screens ───
  const startScreen = document.getElementById("startScreen");
  const gameOverScreen = document.getElementById("gameOverScreen");
  const finalScoreText = document.getElementById("finalScoreText");
  const bestScoreText = document.getElementById("bestScoreText");

  // ─── Constants ───
  const GRAVITY = 0.45;
  const FLAP_STRENGTH = -8;
  const BALL_RADIUS = 18;
  const HOOP_GAP = 160;
  const HOOP_WIDTH = 70;
  const HOOP_SPEED_BASE = 3;
  const RIM_RADIUS = 6;
  const NET_DEPTH = 30;

  // ─── State ───
  let w, h;
  let ball, hoops, particles, trailParticles;
  let score, bestScore, scrollSpeed;
  let running, dead, started;
  let frameId;
  let combo;
  let screenShake, shakeTimer;
  let flashAlpha;

  // ─── Resize ───
  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  // ─── Best score persistence ───
  bestScore = parseInt(localStorage.getItem("flappyDunkBest") || "0", 10);

  // ─── Init ───
  function init() {
    ball = {
      x: w * 0.25,
      y: h * 0.4,
      vy: 0,
      rotation: 0,
      rotationSpeed: 0,
    };
    hoops = [];
    particles = [];
    trailParticles = [];
    score = 0;
    combo = 0;
    scrollSpeed = HOOP_SPEED_BASE;
    running = false;
    dead = false;
    started = false;
    screenShake = 0;
    shakeTimer = 0;
    flashAlpha = 0;

    // Seed initial hoops
    for (let i = 0; i < 4; i++) {
      spawnHoop(w + i * (w * 0.42));
    }
  }

  function spawnHoop(x) {
    const minY = h * 0.2 + HOOP_GAP / 2;
    const maxY = h * 0.8 - HOOP_GAP / 2;
    const centerY = minY + Math.random() * (maxY - minY);
    hoops.push({
      x,
      centerY,
      scored: false,
      rimHitLeft: false,
      rimHitRight: false,
    });
  }

  // ─── Flap ───
  function flap() {
    if (dead) return;
    if (!started) {
      started = true;
      running = true;
    }
    ball.vy = FLAP_STRENGTH;
    ball.rotationSpeed = -0.3;

    // Flap particles
    for (let i = 0; i < 5; i++) {
      particles.push({
        x: ball.x,
        y: ball.y + BALL_RADIUS,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 2 + 1,
        life: 1,
        decay: 0.03 + Math.random() * 0.02,
        radius: 2 + Math.random() * 3,
        color: `hsl(${30 + Math.random() * 20}, 90%, 60%)`,
      });
    }
  }

  // ─── Input ───
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    flap();
  });

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault();
      flap();
    }
  });

  document.getElementById("startButton").addEventListener("click", () => {
    startScreen.classList.add("hidden");
    init();
    loop();
  });

  document.getElementById("restartButton").addEventListener("click", () => {
    gameOverScreen.classList.add("hidden");
    init();
    loop();
  });

  // ─── Dunk scoring effect ───
  function scoreDunk(hoop) {
    score++;
    combo++;
    flashAlpha = 0.3;

    // Confetti burst
    const colors = ["#ff6b35", "#e94560", "#ffdd57", "#48dbfb", "#0abde3", "#ff9ff3"];
    for (let i = 0; i < 15; i++) {
      const angle = (Math.PI * 2 * i) / 15;
      const speed = 2 + Math.random() * 4;
      particles.push({
        x: hoop.x,
        y: hoop.centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        decay: 0.015 + Math.random() * 0.01,
        radius: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // Increase speed every 5 points
    scrollSpeed = HOOP_SPEED_BASE + Math.floor(score / 5) * 0.5;
  }

  // ─── Death ───
  function die() {
    if (dead) return;
    dead = true;
    running = false;
    screenShake = 8;
    shakeTimer = 15;

    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem("flappyDunkBest", bestScore.toString());
    }

    // Death particles
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      const speed = 2 + Math.random() * 3;
      particles.push({
        x: ball.x,
        y: ball.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.02,
        radius: 3 + Math.random() * 4,
        color: `hsl(${10 + Math.random() * 30}, 80%, 55%)`,
      });
    }

    setTimeout(() => {
      finalScoreText.textContent = `Score: ${score}`;
      bestScoreText.textContent = `Best: ${bestScore}`;
      gameOverScreen.classList.remove("hidden");
    }, 800);
  }

  // ─── Collision ───
  function checkCollisions() {
    // Floor / ceiling
    if (ball.y - BALL_RADIUS < 0 || ball.y + BALL_RADIUS > h) {
      die();
      return;
    }

    for (const hoop of hoops) {
      const rimLeftX = hoop.x - HOOP_WIDTH / 2;
      const rimRightX = hoop.x + HOOP_WIDTH / 2;
      const rimY = hoop.centerY;

      // Check if ball is passing through the hoop zone
      const inHoopX = ball.x > rimLeftX + RIM_RADIUS && ball.x < rimRightX - RIM_RADIUS;
      const nearHoopX = ball.x + BALL_RADIUS > rimLeftX - RIM_RADIUS &&
                        ball.x - BALL_RADIUS < rimRightX + RIM_RADIUS;

      if (nearHoopX) {
        // Rim collision (left)
        const dxL = ball.x - rimLeftX;
        const dyL = ball.y - rimY;
        const distL = Math.sqrt(dxL * dxL + dyL * dyL);
        if (distL < BALL_RADIUS + RIM_RADIUS) {
          die();
          return;
        }

        // Rim collision (right)
        const dxR = ball.x - rimRightX;
        const dyR = ball.y - rimY;
        const distR = Math.sqrt(dxR * dxR + dyR * dyR);
        if (distR < BALL_RADIUS + RIM_RADIUS) {
          die();
          return;
        }

        // Backboard (vertical bar above and below the gap)
        const backboardX = rimRightX + HOOP_WIDTH * 0.15;
        if (ball.x + BALL_RADIUS > backboardX - 4 && ball.x - BALL_RADIUS < backboardX + 4) {
          const aboveRim = ball.y < rimY - HOOP_GAP * 0.05;
          const belowRim = ball.y > rimY + HOOP_GAP * 0.05;
          if (aboveRim || belowRim) {
            die();
            return;
          }
        }
      }

      // Scoring - ball passes through hoop center going downward
      if (!hoop.scored && inHoopX && ball.y > rimY - 5 && ball.y < rimY + 25 && ball.vy > 0) {
        hoop.scored = true;
        scoreDunk(hoop);
      }
    }
  }

  // ─── Update ───
  function update() {
    if (!running && started) return;
    if (!started) return;

    // Ball physics
    ball.vy += GRAVITY;
    ball.y += ball.vy;
    ball.rotation += ball.rotationSpeed;
    ball.rotationSpeed *= 0.98;
    ball.rotationSpeed += 0.02; // spin forward from falling

    // Trail
    if (Math.abs(ball.vy) > 2) {
      trailParticles.push({
        x: ball.x,
        y: ball.y,
        life: 1,
        decay: 0.06,
        radius: BALL_RADIUS * 0.6,
      });
    }

    // Move hoops
    for (const hoop of hoops) {
      hoop.x -= scrollSpeed;
    }

    // Remove off-screen hoops, spawn new ones
    if (hoops.length > 0 && hoops[0].x < -HOOP_WIDTH * 2) {
      hoops.shift();
      const lastX = hoops.length > 0 ? hoops[hoops.length - 1].x : w;
      spawnHoop(lastX + w * 0.38 + Math.random() * w * 0.08);
    }

    // Ensure we always have enough hoops ahead
    while (hoops.length < 5) {
      const lastX = hoops.length > 0 ? hoops[hoops.length - 1].x : w;
      spawnHoop(lastX + w * 0.38 + Math.random() * w * 0.08);
    }

    checkCollisions();

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life -= p.decay;
      if (p.life <= 0) particles.splice(i, 1);
    }

    for (let i = trailParticles.length - 1; i >= 0; i--) {
      const t = trailParticles[i];
      t.life -= t.decay;
      if (t.life <= 0) trailParticles.splice(i, 1);
    }

    // Screen shake decay
    if (shakeTimer > 0) {
      shakeTimer--;
      if (shakeTimer <= 0) screenShake = 0;
    }

    // Flash decay
    if (flashAlpha > 0) flashAlpha -= 0.02;
  }

  // ─── Draw ───
  function drawBall() {
    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.rotation);

    // Shadow
    ctx.beginPath();
    ctx.arc(2, 3, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fill();

    // Ball body
    const grad = ctx.createRadialGradient(-4, -6, 2, 0, 0, BALL_RADIUS);
    grad.addColorStop(0, "#ff8a3d");
    grad.addColorStop(0.7, "#e94560");
    grad.addColorStop(1, "#c0392b");
    ctx.beginPath();
    ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Basketball lines
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 1.5;
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(-BALL_RADIUS, 0);
    ctx.lineTo(BALL_RADIUS, 0);
    ctx.stroke();
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(0, -BALL_RADIUS);
    ctx.lineTo(0, BALL_RADIUS);
    ctx.stroke();
    // Curved lines
    ctx.beginPath();
    ctx.arc(-BALL_RADIUS * 0.35, 0, BALL_RADIUS * 0.9, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(BALL_RADIUS * 0.35, 0, BALL_RADIUS * 0.9, Math.PI * 0.5, -Math.PI * 0.5);
    ctx.stroke();

    // Shine
    ctx.beginPath();
    ctx.arc(-5, -6, 5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fill();

    ctx.restore();
  }

  function drawHoop(hoop) {
    const rimY = hoop.centerY;
    const leftX = hoop.x - HOOP_WIDTH / 2;
    const rightX = hoop.x + HOOP_WIDTH / 2;

    // Backboard
    const bbX = rightX + HOOP_WIDTH * 0.15;
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(bbX - 3, rimY - 50, 6, 100);
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(bbX - 3, rimY - 50, 6, 100);

    // Backboard bracket to rim
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bbX, rimY);
    ctx.lineTo(rightX, rimY);
    ctx.stroke();

    // Net (simple trapezoid lines)
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    const netSegments = 5;
    for (let i = 0; i <= netSegments; i++) {
      const t = i / netSegments;
      const topX = leftX + t * HOOP_WIDTH;
      const narrowFactor = 0.7;
      const bottomX = hoop.x - (HOOP_WIDTH * narrowFactor) / 2 + t * HOOP_WIDTH * narrowFactor;
      ctx.beginPath();
      ctx.moveTo(topX, rimY);
      ctx.lineTo(bottomX, rimY + NET_DEPTH);
      ctx.stroke();
    }
    // Horizontal net lines
    for (let j = 1; j <= 3; j++) {
      const t = j / 4;
      const currentWidth = HOOP_WIDTH * (1 - t * 0.3);
      const nx = hoop.x - currentWidth / 2;
      ctx.beginPath();
      ctx.moveTo(nx, rimY + t * NET_DEPTH);
      ctx.lineTo(nx + currentWidth, rimY + t * NET_DEPTH);
      ctx.stroke();
    }

    // Rim - left
    ctx.beginPath();
    ctx.arc(leftX, rimY, RIM_RADIUS, 0, Math.PI * 2);
    const rimGrad = ctx.createRadialGradient(leftX - 1, rimY - 2, 1, leftX, rimY, RIM_RADIUS);
    rimGrad.addColorStop(0, "#ff6b35");
    rimGrad.addColorStop(1, "#e94560");
    ctx.fillStyle = rimGrad;
    ctx.fill();
    ctx.strokeStyle = "#c0392b";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Rim - right
    ctx.beginPath();
    ctx.arc(rightX, rimY, RIM_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = rimGrad;
    ctx.fill();
    ctx.strokeStyle = "#c0392b";
    ctx.stroke();

    // Rim connector (top of hoop)
    ctx.strokeStyle = "#e94560";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(leftX, rimY);
    ctx.lineTo(rightX, rimY);
    ctx.stroke();

    // Score glow if just scored
    if (hoop.scored) {
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.beginPath();
      ctx.arc(hoop.x, rimY, HOOP_WIDTH * 0.7, 0, Math.PI * 2);
      const glowGrad = ctx.createRadialGradient(hoop.x, rimY, 0, hoop.x, rimY, HOOP_WIDTH * 0.7);
      glowGrad.addColorStop(0, "#ffdd57");
      glowGrad.addColorStop(1, "transparent");
      ctx.fillStyle = glowGrad;
      ctx.fill();
      ctx.restore();
    }
  }

  function drawBackground() {
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, "#0f0c29");
    skyGrad.addColorStop(0.5, "#302b63");
    skyGrad.addColorStop(1, "#24243e");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Stars
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    const seed = 42;
    for (let i = 0; i < 60; i++) {
      const sx = ((seed * (i + 1) * 7919) % w);
      const sy = ((seed * (i + 1) * 6271) % (h * 0.6));
      const sr = ((i * 3571) % 3) * 0.5 + 0.5;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    // City silhouette
    ctx.fillStyle = "#16132b";
    const buildings = [
      [0, 0.7], [0.05, 0.55], [0.1, 0.65], [0.15, 0.45], [0.2, 0.6],
      [0.25, 0.5], [0.3, 0.68], [0.35, 0.4], [0.4, 0.58], [0.45, 0.62],
      [0.5, 0.38], [0.55, 0.55], [0.6, 0.48], [0.65, 0.6], [0.7, 0.42],
      [0.75, 0.58], [0.8, 0.52], [0.85, 0.65], [0.9, 0.5], [0.95, 0.6], [1, 0.7],
    ];
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (const [bx, by] of buildings) {
      ctx.lineTo(bx * w, h * by);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Building windows
    ctx.fillStyle = "rgba(255,200,50,0.15)";
    for (let i = 0; i < buildings.length - 1; i++) {
      const [bx1, by1] = buildings[i];
      const [bx2] = buildings[i + 1];
      const topY = h * by1;
      const bw = (bx2 - bx1) * w;
      for (let wy = topY + 10; wy < h - 10; wy += 14) {
        for (let wx = bx1 * w + 5; wx < bx1 * w + bw - 5; wx += 10) {
          if ((wx * 31 + wy * 17) % 7 < 3) {
            ctx.fillRect(wx, wy, 4, 6);
          }
        }
      }
    }
  }

  function drawUI() {
    // Score
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 48px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.shadowColor = "rgba(233,69,96,0.6)";
    ctx.shadowBlur = 12;
    ctx.fillText(score, w / 2, 40);
    ctx.restore();

    // Combo
    if (combo > 1) {
      ctx.save();
      ctx.fillStyle = "#ffdd57";
      ctx.font = "bold 24px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(`${combo}x combo!`, w / 2, 95);
      ctx.restore();
    }

    // Tap hint before start
    if (!started) {
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "18px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Tap anywhere to flap", w / 2, h * 0.65);
      ctx.restore();
    }
  }

  function draw() {
    ctx.save();

    // Screen shake
    if (screenShake > 0) {
      const sx = (Math.random() - 0.5) * screenShake * 2;
      const sy = (Math.random() - 0.5) * screenShake * 2;
      ctx.translate(sx, sy);
      screenShake *= 0.85;
    }

    drawBackground();

    // Trail particles
    for (const t of trailParticles) {
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius * t.life, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(233, 69, 96, ${t.life * 0.3})`;
      ctx.fill();
    }

    // Hoops
    for (const hoop of hoops) {
      drawHoop(hoop);
    }

    // Particles
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Ball
    drawBall();

    // Score flash
    if (flashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 221, 87, ${flashAlpha})`;
      ctx.fillRect(0, 0, w, h);
    }

    drawUI();
    ctx.restore();
  }

  // ─── Game loop ───
  function loop() {
    update();
    draw();
    frameId = requestAnimationFrame(loop);
  }

  // Show start screen
  init();
})();

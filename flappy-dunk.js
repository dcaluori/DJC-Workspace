(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const startScreen = document.getElementById("startScreen");
  const gameOverScreen = document.getElementById("gameOverScreen");
  const finalScoreText = document.getElementById("finalScoreText");
  const bestScoreText = document.getElementById("bestScoreText");

  // ─── Sprite images ───
  const ballImg = new Image();
  ballImg.src = "data:image/png;base64,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";
  const donutImg = new Image();
  donutImg.src = "data:image/png;base64,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";

  // ─── Constants ───
  const GRAVITY = 0.28;
  const FLAP_STRENGTH = -6;
  const BALL_RADIUS = 16;
  const DONUT_TUBE = 14; // thick visual ring
  const HOLE_RADIUS = BALL_RADIUS * 2; // visual inner hole
  const OUTER_RADIUS = HOLE_RADIUS + DONUT_TUBE; // outer edge of donut
  const RIM_COLLISION = 4; // collision only at outer edge
  const HOOP_SPEED_BASE = 2.2;

  // ─── State ───
  let w, h;
  let ball, hoops, particles, trailParticles;
  let score, bestScore, scrollSpeed, displayScore;
  let running, dead, started;
  let frameId;
  let cleanStreak;
  let screenShake, shakeTimer;
  let flashAlpha;
  let multiplierPopups;
  let waveOffset;
  let clouds;
  let palmTrees;
  let deathTimeout;
  let missedHoops;
  let hoopsSinceStack;
  let nextStackAt;

  // ─── Resize ───
  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    generateScenery();
  }
  window.addEventListener("resize", resize);
  resize();

  bestScore = parseInt(localStorage.getItem("flappyDunkBest") || "0", 10);

  // ─── Scenery generation ───
  function generateScenery() {
    clouds = [];
    for (let i = 0; i < 8; i++) {
      clouds.push({
        x: Math.random() * w * 1.5,
        y: h * 0.05 + Math.random() * h * 0.25,
        width: 60 + Math.random() * 100,
        height: 25 + Math.random() * 30,
        speed: 0.2 + Math.random() * 0.3,
      });
    }
    palmTrees = [];
    for (let i = 0; i < 6; i++) {
      palmTrees.push({
        x: w * 0.1 + (i / 5) * w * 0.85,
        height: 80 + Math.random() * 60,
        lean: (Math.random() - 0.5) * 0.3,
        frondAlphas: Array.from({ length: 8 }, () => 0.6 + Math.random() * 0.3),
      });
    }
  }

  // ─── Init ───
  function init() {
    cancelAnimationFrame(frameId);
    if (deathTimeout) clearTimeout(deathTimeout);

    ball = {
      x: w * 0.25, y: h * 0.4,
      vx: 0, vy: 0,
      rotation: 0, rotationSpeed: 0,
    };
    hoops = [];
    particles = [];
    trailParticles = [];
    multiplierPopups = [];
    score = 0;
    displayScore = 0;
    cleanStreak = 0;
    scrollSpeed = HOOP_SPEED_BASE;
    running = false;
    dead = false;
    started = false;
    screenShake = 0;
    shakeTimer = 0;
    flashAlpha = 0;
    waveOffset = 0;
    missedHoops = 0;
    hoopsSinceStack = 0;
    nextStackAt = 10 + Math.floor(Math.random() * 3); // 10-12

    for (let i = 0; i < 3; i++) spawnHoop(w + i * (w * 0.55));
  }

  function spawnHoop(x) {
    const minY = h * 0.28;
    const maxY = h * 0.58;
    const centerY = minY + Math.random() * (maxY - minY);
    hoops.push({
      x, centerY, scored: false, touchedRim: false,
      phase: Math.random() * Math.PI * 2,
    });
  }

  function spawnStack(x) {
    const count = 2 + Math.floor(Math.random() * 2); // 2-3 hoops
    const spacing = OUTER_RADIUS * 2 + BALL_RADIUS; // tight vertical gap
    const totalHeight = (count - 1) * spacing;
    const topY = Math.max(h * 0.18, h * 0.4 - totalHeight / 2);
    for (let i = 0; i < count; i++) {
      hoops.push({
        x, centerY: topY + i * spacing,
        scored: false, touchedRim: false,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  function maybeSpawn(lastX) {
    const nextX = lastX + w * 0.55 + Math.random() * w * 0.1;
    if (hoopsSinceStack >= nextStackAt) {
      spawnStack(nextX);
      hoopsSinceStack = 0;
      nextStackAt = 10 + Math.floor(Math.random() * 11);
    } else {
      spawnHoop(nextX);
    }
  }

  // ─── Flap ───
  function flap() {
    if (dead) return;
    if (!started) { started = true; running = true; }
    ball.vy = FLAP_STRENGTH;
    ball.rotationSpeed = -0.25;

    for (let i = 0; i < 4; i++) {
      particles.push({
        x: ball.x, y: ball.y + BALL_RADIUS,
        vx: (Math.random() - 0.5) * 2, vy: Math.random() * 1.5 + 0.5,
        life: 1, decay: 0.03 + Math.random() * 0.02,
        radius: 2 + Math.random() * 3,
        color: "hsla(195, 80%, 70%, 0.8)",
      });
    }
  }

  // ─── Input ───
  canvas.addEventListener("pointerdown", (e) => { e.preventDefault(); flap(); });
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); flap(); }
  });

  document.getElementById("startButton").addEventListener("click", (e) => {
    e.stopPropagation();
    startScreen.classList.add("hidden");
    init(); loop();
  });
  document.getElementById("restartButton").addEventListener("click", (e) => {
    e.stopPropagation();
    gameOverScreen.classList.add("hidden");
    init(); loop();
  });

  // ─── Dunk scoring ───
  function scoreDunk(hoop) {
    const clean = !hoop.touchedRim;
    if (clean) {
      cleanStreak++;
      const multiplier = Math.min(Math.pow(2, cleanStreak - 1), 64);
      score += multiplier;
      flashAlpha = 0.25;

      if (cleanStreak > 1) {
        multiplierPopups.push({
          x: w / 2, y: h * 0.18,
          text: "x" + multiplier,
          life: 1, vy: -1,
        });
      }
    } else {
      cleanStreak = 0;
      score += 1;
    }

    const colors = ["#ff69b4", "#ffdd00", "#33cc33", "#3399ff", "#ff6633", "#cc33ff"];
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const speed = 2 + Math.random() * 3;
      particles.push({
        x: hoop.x, y: hoop.centerY,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 2,
        life: 1, decay: 0.02 + Math.random() * 0.01,
        radius: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

  }

  // ─── Death ───
  function die() {
    if (dead) return;
    dead = true; running = false;
    screenShake = 8; shakeTimer = 15;

    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem("flappyDunkBest", bestScore.toString());
    }

    for (let i = 0; i < 15; i++) {
      const angle = (Math.PI * 2 * i) / 15;
      const speed = 1.5 + Math.random() * 2;
      particles.push({
        x: ball.x, y: ball.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 1, decay: 0.02, radius: 3 + Math.random() * 4,
        color: "hsl(" + (190 + Math.random() * 30) + ", 70%, 60%)",
      });
    }

    deathTimeout = setTimeout(() => {
      if (!dead) return;
      finalScoreText.textContent = "Score: " + score;
      bestScoreText.textContent = "Best: " + bestScore;
      if (score > 0 && score >= bestScore) {
        bestScoreText.textContent += " ★ NEW BEST!";
      }
      gameOverScreen.classList.remove("hidden");
    }, 800);
  }

  // ─── Rim bounce ───
  function bounceOffRim(rimX, rimY, hoop) {
    const dx = ball.x - rimX;
    const dy = ball.y - rimY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;

    const nx = dx / dist;
    const ny = dy / dist;
    const overlap = (BALL_RADIUS + RIM_COLLISION) - dist;
    ball.x += nx * overlap;
    ball.y += ny * overlap;

    // Gentle reflection — heavy damping so it doesn't feel jarring
    const dot = ball.vx * nx + ball.vy * ny;
    ball.vx = (ball.vx - 2 * dot * nx) * 0.35;
    ball.vy = (ball.vy - 2 * dot * ny) * 0.35;

    // Strong bias toward hoop center — encourage going in
    const toCenterX = hoop.x - ball.x;
    ball.vx += toCenterX * 0.04;

    // If ball is above rim and moving down, nudge it through
    if (ball.y < rimY) {
      ball.vy = Math.max(ball.vy, 1.5);
    }

    ball.rotationSpeed = (Math.random() - 0.5) * 0.3;
    hoop.touchedRim = true;
    cleanStreak = 0;

    const sprinkleColors = ["#ff69b4", "#ff1493", "#ffdd57", "#44dd44", "#44bbff", "#ff6633"];
    for (let i = 0; i < 6; i++) {
      particles.push({
        x: rimX + nx * DONUT_TUBE, y: rimY + ny * DONUT_TUBE,
        vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4 - 1,
        life: 1, decay: 0.035, radius: 2 + Math.random() * 2,
        color: sprinkleColors[Math.floor(Math.random() * sprinkleColors.length)],
      });
    }
  }

  // ─── Collision ───
  function checkCollisions() {
    if (ball.y - BALL_RADIUS < 0) {
      ball.y = BALL_RADIUS;
      ball.vy = Math.abs(ball.vy) * 0.3;
    }
    if (ball.y + BALL_RADIUS > h * 0.82) {
      die();
      for (let i = 0; i < 10; i++) {
        particles.push({
          x: ball.x + (Math.random() - 0.5) * 30, y: h * 0.82,
          vx: (Math.random() - 0.5) * 4, vy: -Math.random() * 5 - 2,
          life: 1, decay: 0.025, radius: 3 + Math.random() * 4,
          color: "hsla(195, 80%, 65%, 0.8)",
        });
      }
      return;
    }

    for (const hoop of hoops) {
      // Collision at OUTER edge of donut - entire hole + ring is passable
      const rimLeftX = hoop.x - OUTER_RADIUS;
      const rimRightX = hoop.x + OUTER_RADIUS;
      const rimY = hoop.centerY;
      const inHoopX = ball.x > rimLeftX + RIM_COLLISION && ball.x < rimRightX - RIM_COLLISION;

      if (!hoop.scored) {
        const nearHoopX = ball.x + BALL_RADIUS > rimLeftX - RIM_COLLISION * 2 &&
                          ball.x - BALL_RADIUS < rimRightX + RIM_COLLISION * 2;
        const nearHoopY = Math.abs(ball.y - rimY) < BALL_RADIUS + RIM_COLLISION * 2;

        if (nearHoopX && nearHoopY) {
          // Left outer edge collision
          const dxL = ball.x - rimLeftX;
          const dyL = ball.y - rimY;
          const distL = Math.sqrt(dxL * dxL + dyL * dyL);
          if (distL < BALL_RADIUS + RIM_COLLISION) {
            bounceOffRim(rimLeftX, rimY, hoop);
            continue;
          }

          // Right outer edge collision
          const dxR = ball.x - rimRightX;
          const dyR = ball.y - rimY;
          const distR = Math.sqrt(dxR * dxR + dyR * dyR);
          if (distR < BALL_RADIUS + RIM_COLLISION) {
            bounceOffRim(rimRightX, rimY, hoop);
            continue;
          }
        }
      }

      // Scoring - only counts for top-down passes (ball falling through)
      if (!hoop.scored && inHoopX && ball.vy > 0) {
        const prevY = ball.y - ball.vy;
        if (prevY <= rimY && ball.y >= rimY) {
          hoop.scored = true;
          hoopsSinceStack++;
          scoreDunk(hoop);
        }
      }
    }
  }

  // ─── Update ───
  function update() {
    if (!running && started) return;
    if (!started) return;

    waveOffset += 0.02;

    ball.vy += GRAVITY;
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.vx *= 0.98;
    ball.rotation += ball.rotationSpeed;
    ball.rotationSpeed *= 0.97;
    ball.rotationSpeed += 0.015;

    if (ball.x - BALL_RADIUS < 0) { ball.x = BALL_RADIUS; ball.vx = Math.abs(ball.vx) * 0.5; }
    if (ball.x + BALL_RADIUS > w) { ball.x = w - BALL_RADIUS; ball.vx = -Math.abs(ball.vx) * 0.5; }

    if (Math.abs(ball.vy) > 1.5) {
      trailParticles.push({
        x: ball.x, y: ball.y, life: 1, decay: 0.05, radius: BALL_RADIUS * 0.5,
      });
    }

    for (const hoop of hoops) { hoop.x -= scrollSpeed; hoop.phase += 0.08; }

    // Remove off-screen hoops and track misses
    while (hoops.length > 0 && hoops[0].x < -OUTER_RADIUS * 2) {
      const removed = hoops.shift();
      if (!removed.scored) {
        missedHoops++;
        if (missedHoops >= 3) { die(); return; }
      }
      const lastX = hoops.length > 0 ? hoops[hoops.length - 1].x : w;
      maybeSpawn(lastX);
    }
    while (hoops.length < 5) {
      const lastX = hoops.length > 0 ? hoops[hoops.length - 1].x : w;
      maybeSpawn(lastX);
    }

    checkCollisions();

    for (const cloud of clouds) {
      cloud.x -= cloud.speed;
      if (cloud.x + cloud.width < 0) { cloud.x = w + cloud.width; cloud.y = h * 0.05 + Math.random() * h * 0.25; }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life -= p.decay;
      if (p.life <= 0) { particles[i] = particles[particles.length - 1]; particles.pop(); }
    }
    for (let i = trailParticles.length - 1; i >= 0; i--) {
      trailParticles[i].life -= trailParticles[i].decay;
      if (trailParticles[i].life <= 0) { trailParticles[i] = trailParticles[trailParticles.length - 1]; trailParticles.pop(); }
    }
    for (let i = multiplierPopups.length - 1; i >= 0; i--) {
      const m = multiplierPopups[i]; m.y += m.vy; m.life -= 0.02;
      if (m.life <= 0) { multiplierPopups[i] = multiplierPopups[multiplierPopups.length - 1]; multiplierPopups.pop(); }
    }

    if (shakeTimer > 0) { shakeTimer--; if (shakeTimer <= 0) screenShake = 0; }
    if (flashAlpha > 0) flashAlpha -= 0.015;

    if (displayScore < score) {
      displayScore += Math.max(1, Math.floor((score - displayScore) * 0.2));
      if (displayScore > score) displayScore = score;
    }
  }

  // ─── Drawing ───
  function drawBackground() {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.75);
    skyGrad.addColorStop(0, "#0099dd");
    skyGrad.addColorStop(0.4, "#33bbee");
    skyGrad.addColorStop(0.7, "#77ddff");
    skyGrad.addColorStop(1, "#aaeeff");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Sun
    const sunX = w * 0.82, sunY = h * 0.12;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 80);
    sunGrad.addColorStop(0, "rgba(255,250,200,1)");
    sunGrad.addColorStop(0.3, "rgba(255,220,100,0.8)");
    sunGrad.addColorStop(0.7, "rgba(255,180,50,0.2)");
    sunGrad.addColorStop(1, "rgba(255,150,50,0)");
    ctx.fillStyle = sunGrad;
    ctx.beginPath(); ctx.arc(sunX, sunY, 80, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(sunX, sunY, 25, 0, Math.PI * 2);
    ctx.fillStyle = "#fff8e0"; ctx.fill();

    // Clouds
    for (const cloud of clouds) {
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath(); ctx.ellipse(cloud.x, cloud.y, cloud.width / 2, cloud.height / 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cloud.x - cloud.width * 0.25, cloud.y + 5, cloud.width * 0.35, cloud.height * 0.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cloud.x + cloud.width * 0.25, cloud.y + 3, cloud.width * 0.3, cloud.height * 0.35, 0, 0, Math.PI * 2); ctx.fill();
    }

    // Sand
    const sandY = h * 0.72;
    const sandGrad = ctx.createLinearGradient(0, sandY, 0, h * 0.82);
    sandGrad.addColorStop(0, "#f5deb3"); sandGrad.addColorStop(0.5, "#edd9a3"); sandGrad.addColorStop(1, "#dcc48e");
    ctx.fillStyle = sandGrad;
    ctx.beginPath(); ctx.moveTo(0, sandY + 5);
    for (let x = 0; x <= w; x += 20) ctx.lineTo(x, sandY + Math.sin(x * 0.02 + waveOffset * 0.5) * 3);
    ctx.lineTo(w, h * 0.85); ctx.lineTo(0, h * 0.85); ctx.closePath(); ctx.fill();

    // Palm trees
    for (const palm of palmTrees) drawPalmTree(palm);

    // Ocean
    const waterY = h * 0.78;
    const waterGrad = ctx.createLinearGradient(0, waterY, 0, h);
    waterGrad.addColorStop(0, "rgba(0,180,220,0.85)");
    waterGrad.addColorStop(0.3, "rgba(0,150,200,0.9)");
    waterGrad.addColorStop(1, "rgba(0,80,140,0.95)");
    ctx.fillStyle = waterGrad;
    ctx.beginPath(); ctx.moveTo(0, waterY);
    for (let x = 0; x <= w; x += 10) {
      ctx.lineTo(x, waterY + Math.sin(x * 0.025 + waveOffset) * 4 + Math.sin(x * 0.01 + waveOffset * 1.5) * 2);
    }
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();

    // Wave foam
    ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 5) {
      const fy = waterY + Math.sin(x * 0.025 + waveOffset) * 4 + Math.sin(x * 0.01 + waveOffset * 1.5) * 2;
      if (x === 0) ctx.moveTo(x, fy); else ctx.lineTo(x, fy);
    }
    ctx.stroke();
  }

  function drawPalmTree(palm) {
    const sandY = h * 0.72;
    ctx.save();
    ctx.translate(palm.x, sandY - 5);
    ctx.strokeStyle = "#8B6914"; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(0, 0);
    const topX = palm.lean * palm.height;
    ctx.quadraticCurveTo(palm.lean * palm.height * 0.5, -palm.height * 0.5, topX, -palm.height);
    ctx.stroke();

    ctx.translate(topX, -palm.height);
    const frondAngles = [-0.8, -0.3, 0.2, 0.7, -1.2, 1.1, -0.1, 0.5];
    for (let fi = 0; fi < frondAngles.length; fi++) {
      ctx.save();
      ctx.rotate(frondAngles[fi]);
      ctx.beginPath(); ctx.moveTo(5, 0);
      ctx.quadraticCurveTo(25, -18, 55, 10);
      ctx.quadraticCurveTo(25, -5, 5, 0);
      ctx.fillStyle = "rgba(34,139,34," + palm.frondAlphas[fi] + ")";
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawBeachBall() {
    const spriteSize = BALL_RADIUS * 2.4;
    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.rotation);
    ctx.drawImage(ballImg, -spriteSize / 2, -spriteSize / 2, spriteSize, spriteSize);
    ctx.restore();
  }

  // ─── Donut drawing using sprite image ───
  function drawDonut(hoop) {
    const cx = hoop.x, cy = hoop.centerY;
    const outerR = HOLE_RADIUS + DONUT_TUBE;
    const spriteSize = outerR * 2.3;

    ctx.save();
    ctx.drawImage(donutImg, cx - spriteSize / 2, cy - spriteSize / 2, spriteSize, spriteSize);

    // Score glow
    if (hoop.scored) {
      ctx.globalAlpha = 0.25;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerR * 1.2);
      g.addColorStop(0, "#ffdd57"); g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, outerR * 1.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawUI() {
    ctx.save(); ctx.fillStyle = "#fff"; ctx.font = "bold 52px system-ui";
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 8;
    ctx.fillText(displayScore, w / 2, 40); ctx.restore();

    // Miss indicators (3 donuts, X'd out when missed)
    ctx.save(); ctx.font = "22px system-ui"; ctx.textBaseline = "top";
    for (let i = 0; i < 3; i++) {
      const mx = 20 + i * 30;
      const my = 44;
      if (i < missedHoops) {
        ctx.fillStyle = "rgba(255,80,80,0.9)";
        ctx.fillText("\u2718", mx, my);
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillText("\uD83C\uDF69", mx, my);
      }
    }
    ctx.restore();

    if (cleanStreak > 1) {
      ctx.save(); ctx.fillStyle = "#ff6600";
      ctx.font = "bold 26px system-ui"; ctx.textAlign = "center";
      ctx.shadowColor = "rgba(255,100,0,0.5)"; ctx.shadowBlur = 6;
      ctx.fillText("x" + Math.min(Math.pow(2, cleanStreak - 1), 64) + " streak!", w / 2, 98);
      ctx.restore();
    }

    for (const m of multiplierPopups) {
      ctx.save(); ctx.globalAlpha = m.life;
      ctx.fillStyle = "#ffdd00"; ctx.font = "bold 30px system-ui";
      ctx.textAlign = "center"; ctx.shadowColor = "rgba(255,150,0,0.7)"; ctx.shadowBlur = 8;
      ctx.fillText(m.text, m.x, m.y); ctx.restore();
    }

    if (!started) {
      ctx.save(); ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.font = "20px system-ui"; ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 4;
      ctx.fillText("Tap anywhere to flap", w / 2, h * 0.55); ctx.restore();
    }
  }

  function draw() {
    ctx.save();
    if (screenShake > 0) {
      ctx.translate((Math.random() - 0.5) * screenShake * 2, (Math.random() - 0.5) * screenShake * 2);
      screenShake *= 0.88;
    }

    drawBackground();

    for (const t of trailParticles) {
      ctx.beginPath(); ctx.arc(t.x, t.y, t.radius * t.life, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,200,100," + (t.life * 0.25) + ")"; ctx.fill();
    }

    for (const hoop of hoops) drawDonut(hoop);

    for (const p of particles) {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color; ctx.globalAlpha = p.life; ctx.fill(); ctx.globalAlpha = 1;
    }

    drawBeachBall();

    if (flashAlpha > 0) {
      ctx.fillStyle = "rgba(255,200,50," + flashAlpha + ")";
      ctx.fillRect(0, 0, w, h);
    }

    drawUI();
    ctx.restore();
  }

  function loop() {
    update(); draw();
    frameId = requestAnimationFrame(loop);
  }

  init();
})();

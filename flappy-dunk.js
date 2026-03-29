(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const startScreen = document.getElementById("startScreen");
  const gameOverScreen = document.getElementById("gameOverScreen");
  const finalScoreText = document.getElementById("finalScoreText");
  const bestScoreText = document.getElementById("bestScoreText");

  // ─── Constants ───
  const GRAVITY = 0.28;
  const FLAP_STRENGTH = -6;
  const BALL_RADIUS = 20;
  const HOLE_RADIUS = BALL_RADIUS * 1.5; // hole diameter = 1.5x ball diameter
  const DONUT_TUBE = 12; // thickness of the donut ring
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
      });
    }
  }

  // ─── Init ───
  function init() {
    ball = {
      x: w * 0.25,
      y: h * 0.4,
      vx: 0,
      vy: 0,
      rotation: 0,
      rotationSpeed: 0,
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

    for (let i = 0; i < 4; i++) {
      spawnHoop(w + i * (w * 0.42));
    }
  }

  function spawnHoop(x) {
    const minY = h * 0.22;
    const maxY = h * 0.65;
    const centerY = minY + Math.random() * (maxY - minY);
    hoops.push({
      x,
      centerY,
      scored: false,
      firePhase: Math.random() * Math.PI * 2,
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
    ball.rotationSpeed = -0.25;

    for (let i = 0; i < 4; i++) {
      particles.push({
        x: ball.x,
        y: ball.y + BALL_RADIUS,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 1.5 + 0.5,
        life: 1,
        decay: 0.03 + Math.random() * 0.02,
        radius: 2 + Math.random() * 3,
        color: `hsla(195, 80%, 70%, 0.8)`,
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

  // ─── Dunk scoring ───
  function scoreDunk(hoop, clean) {
    if (clean) {
      cleanStreak++;
      const multiplier = Math.pow(2, cleanStreak - 1);
      const points = multiplier;
      score += points;
      flashAlpha = 0.25;

      if (cleanStreak > 1) {
        multiplierPopups.push({
          x: hoop.x,
          y: hoop.centerY - 30,
          text: `x${multiplier}`,
          life: 1,
          vy: -1.5,
        });
      }
    } else {
      cleanStreak = 0;
      score += 1;
    }

    // Sprinkle burst
    const colors = ["#ff69b4", "#ffdd00", "#33cc33", "#3399ff", "#ff6633", "#cc33ff"];
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const speed = 2 + Math.random() * 3;
      particles.push({
        x: hoop.x,
        y: hoop.centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        decay: 0.02 + Math.random() * 0.01,
        radius: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    scrollSpeed = HOOP_SPEED_BASE + Math.floor(score / 8) * 0.3;
  }

  // ─── Death ───
  function die() {
    if (dead) return;
    dead = true;
    running = false;
    screenShake = 6;
    shakeTimer = 12;

    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem("flappyDunkBest", bestScore.toString());
    }

    for (let i = 0; i < 15; i++) {
      const angle = (Math.PI * 2 * i) / 15;
      const speed = 1.5 + Math.random() * 2;
      particles.push({
        x: ball.x,
        y: ball.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.02,
        radius: 3 + Math.random() * 4,
        color: `hsl(${190 + Math.random() * 30}, 70%, 60%)`,
      });
    }

    setTimeout(() => {
      finalScoreText.textContent = `Score: ${score}`;
      bestScoreText.textContent = `Best: ${bestScore}`;
      gameOverScreen.classList.remove("hidden");
    }, 800);
  }

  // ─── Rim bounce ───
  function bounceOffRim(rimX, rimY, hoopCenterX) {
    const dx = ball.x - rimX;
    const dy = ball.y - rimY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;

    const nx = dx / dist;
    const ny = dy / dist;

    // Push ball out of donut edge
    const overlap = (BALL_RADIUS + DONUT_TUBE) - dist;
    ball.x += nx * overlap;
    ball.y += ny * overlap;

    // Reflect velocity
    const dot = ball.vx * nx + ball.vy * ny;
    const bounceFactor = 0.55;
    ball.vx = (ball.vx - 2 * dot * nx) * bounceFactor;
    ball.vy = (ball.vy - 2 * dot * ny) * bounceFactor;

    // Bias towards going in
    ball.vx += (hoopCenterX - ball.x) * 0.012;
    if (ball.y < rimY && ball.vy > 0) ball.vy *= 0.7;

    ball.rotationSpeed = (Math.random() - 0.5) * 0.4;
    cleanStreak = 0;

    // Sprinkle particles on bounce
    const sprinkleColors = ["#ff69b4", "#ff1493", "#ffdd57", "#44dd44", "#44bbff", "#ff6633"];
    for (let i = 0; i < 6; i++) {
      particles.push({
        x: rimX + nx * DONUT_TUBE,
        y: rimY + ny * DONUT_TUBE,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4 - 1,
        life: 1,
        decay: 0.035,
        radius: 2 + Math.random() * 2,
        color: sprinkleColors[Math.floor(Math.random() * sprinkleColors.length)],
      });
    }
  }

  // ─── Collision ───
  function checkCollisions() {
    // Floor / ceiling
    if (ball.y - BALL_RADIUS < 0) {
      ball.y = BALL_RADIUS;
      ball.vy = Math.abs(ball.vy) * 0.3;
    }
    if (ball.y + BALL_RADIUS > h * 0.82) {
      // Hit the water
      die();
      // Splash particles
      for (let i = 0; i < 10; i++) {
        particles.push({
          x: ball.x + (Math.random() - 0.5) * 30,
          y: h * 0.82,
          vx: (Math.random() - 0.5) * 4,
          vy: -Math.random() * 5 - 2,
          life: 1,
          decay: 0.025,
          radius: 3 + Math.random() * 4,
          color: `hsla(195, 80%, 65%, 0.8)`,
        });
      }
      return;
    }

    for (const hoop of hoops) {
      const rimLeftX = hoop.x - HOLE_RADIUS;
      const rimRightX = hoop.x + HOLE_RADIUS;
      const rimY = hoop.centerY;

      const inHoopX = ball.x > rimLeftX + DONUT_TUBE * 0.5 && ball.x < rimRightX - DONUT_TUBE * 0.5;

      // Skip collisions for already-scored hoops so ball passes through
      if (!hoop.scored) {
        const nearHoopX = ball.x + BALL_RADIUS > rimLeftX - DONUT_TUBE * 2 &&
                          ball.x - BALL_RADIUS < rimRightX + DONUT_TUBE * 2;

        if (nearHoopX) {
          // Left edge of donut hole
          const dxL = ball.x - rimLeftX;
          const dyL = ball.y - rimY;
          const distL = Math.sqrt(dxL * dxL + dyL * dyL);
          if (distL < BALL_RADIUS + DONUT_TUBE) {
            bounceOffRim(rimLeftX, rimY, hoop.x);
            continue;
          }

          // Right edge of donut hole
          const dxR = ball.x - rimRightX;
          const dyR = ball.y - rimY;
          const distR = Math.sqrt(dxR * dxR + dyR * dyR);
          if (distR < BALL_RADIUS + DONUT_TUBE) {
            bounceOffRim(rimRightX, rimY, hoop.x);
            continue;
          }

          // Top/bottom of donut body (outside the hole)
          if (!inHoopX) {
            const dxC = ball.x - hoop.x;
            const dyC = ball.y - rimY;
            const distC = Math.sqrt(dxC * dxC + dyC * dyC);
            const outerRadius = HOLE_RADIUS + DONUT_TUBE;
            if (distC < BALL_RADIUS + outerRadius && distC > HOLE_RADIUS - DONUT_TUBE) {
              // Bounce off the outer donut body
              if (distC > 0) {
                const nx = dxC / distC;
                const ny = dyC / distC;
                const targetDist = BALL_RADIUS + outerRadius;
                ball.x = hoop.x + nx * targetDist;
                ball.y = rimY + ny * targetDist;
                const dot = ball.vx * nx + ball.vy * ny;
                ball.vx = (ball.vx - 2 * dot * nx) * 0.5;
                ball.vy = (ball.vy - 2 * dot * ny) * 0.5;
                ball.vx += (hoop.x - ball.x) * 0.01;
                cleanStreak = 0;
              }
            }
          }
        }
      }

      // Scoring - ball passes through donut hole going downward
      if (!hoop.scored && inHoopX && ball.y > rimY - 5 && ball.y < rimY + 30 && ball.vy > 0) {
        hoop.scored = true;
        scoreDunk(hoop, true);
      }
    }
  }

  // ─── Update ───
  function update() {
    if (!running && started) return;
    if (!started) return;

    waveOffset += 0.02;

    // Ball physics
    ball.vy += GRAVITY;
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.vx *= 0.98; // air friction
    ball.rotation += ball.rotationSpeed;
    ball.rotationSpeed *= 0.97;
    ball.rotationSpeed += 0.015;

    // Keep ball from going off left/right
    if (ball.x - BALL_RADIUS < 0) { ball.x = BALL_RADIUS; ball.vx = Math.abs(ball.vx) * 0.5; }
    if (ball.x + BALL_RADIUS > w) { ball.x = w - BALL_RADIUS; ball.vx = -Math.abs(ball.vx) * 0.5; }

    // Trail
    if (Math.abs(ball.vy) > 1.5) {
      trailParticles.push({
        x: ball.x,
        y: ball.y,
        life: 1,
        decay: 0.05,
        radius: BALL_RADIUS * 0.5,
      });
    }

    // Move hoops
    for (const hoop of hoops) {
      hoop.x -= scrollSpeed;
      hoop.firePhase += 0.08;
    }

    // Remove off-screen hoops, spawn new
    if (hoops.length > 0 && hoops[0].x < -(HOLE_RADIUS + DONUT_TUBE) * 2) {
      hoops.shift();
      const lastX = hoops.length > 0 ? hoops[hoops.length - 1].x : w;
      spawnHoop(lastX + w * 0.4 + Math.random() * w * 0.08);
    }

    while (hoops.length < 5) {
      const lastX = hoops.length > 0 ? hoops[hoops.length - 1].x : w;
      spawnHoop(lastX + w * 0.4 + Math.random() * w * 0.08);
    }

    checkCollisions();

    // Update clouds
    for (const cloud of clouds) {
      cloud.x -= cloud.speed;
      if (cloud.x + cloud.width < 0) {
        cloud.x = w + cloud.width;
        cloud.y = h * 0.05 + Math.random() * h * 0.25;
      }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.life -= p.decay;
      if (p.life <= 0) particles.splice(i, 1);
    }

    for (let i = trailParticles.length - 1; i >= 0; i--) {
      trailParticles[i].life -= trailParticles[i].decay;
      if (trailParticles[i].life <= 0) trailParticles.splice(i, 1);
    }

    for (let i = multiplierPopups.length - 1; i >= 0; i--) {
      const m = multiplierPopups[i];
      m.y += m.vy;
      m.life -= 0.02;
      if (m.life <= 0) multiplierPopups.splice(i, 1);
    }

    if (shakeTimer > 0) {
      shakeTimer--;
      if (shakeTimer <= 0) screenShake = 0;
    }
    if (flashAlpha > 0) flashAlpha -= 0.015;

    // Smooth display score
    if (displayScore < score) {
      displayScore += Math.max(1, Math.floor((score - displayScore) * 0.2));
      if (displayScore > score) displayScore = score;
    }
  }

  // ─── Drawing ───
  function drawBackground() {
    // Sky gradient - Bahamas tropical
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.75);
    skyGrad.addColorStop(0, "#0099dd");
    skyGrad.addColorStop(0.4, "#33bbee");
    skyGrad.addColorStop(0.7, "#77ddff");
    skyGrad.addColorStop(1, "#aaeeff");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Sun
    const sunX = w * 0.82;
    const sunY = h * 0.12;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 80);
    sunGrad.addColorStop(0, "rgba(255, 250, 200, 1)");
    sunGrad.addColorStop(0.3, "rgba(255, 220, 100, 0.8)");
    sunGrad.addColorStop(0.7, "rgba(255, 180, 50, 0.2)");
    sunGrad.addColorStop(1, "rgba(255, 150, 50, 0)");
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 80, 0, Math.PI * 2);
    ctx.fill();

    // Sun core
    ctx.beginPath();
    ctx.arc(sunX, sunY, 25, 0, Math.PI * 2);
    ctx.fillStyle = "#fff8e0";
    ctx.fill();

    // Clouds
    for (const cloud of clouds) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.beginPath();
      ctx.ellipse(cloud.x, cloud.y, cloud.width / 2, cloud.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cloud.x - cloud.width * 0.25, cloud.y + 5, cloud.width * 0.35, cloud.height * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cloud.x + cloud.width * 0.25, cloud.y + 3, cloud.width * 0.3, cloud.height * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sand/beach
    const sandY = h * 0.72;
    const sandGrad = ctx.createLinearGradient(0, sandY, 0, h * 0.82);
    sandGrad.addColorStop(0, "#f5deb3");
    sandGrad.addColorStop(0.5, "#edd9a3");
    sandGrad.addColorStop(1, "#dcc48e");
    ctx.fillStyle = sandGrad;
    ctx.beginPath();
    ctx.moveTo(0, sandY + 5);
    for (let x = 0; x <= w; x += 20) {
      ctx.lineTo(x, sandY + Math.sin(x * 0.02 + waveOffset * 0.5) * 3);
    }
    ctx.lineTo(w, h * 0.85);
    ctx.lineTo(0, h * 0.85);
    ctx.closePath();
    ctx.fill();

    // Palm trees
    for (const palm of palmTrees) {
      drawPalmTree(palm.x, sandY - 5, palm.height, palm.lean);
    }

    // Ocean
    const waterY = h * 0.78;
    const waterGrad = ctx.createLinearGradient(0, waterY, 0, h);
    waterGrad.addColorStop(0, "rgba(0, 180, 220, 0.85)");
    waterGrad.addColorStop(0.3, "rgba(0, 150, 200, 0.9)");
    waterGrad.addColorStop(1, "rgba(0, 80, 140, 0.95)");
    ctx.fillStyle = waterGrad;
    ctx.beginPath();
    ctx.moveTo(0, waterY);
    for (let x = 0; x <= w; x += 10) {
      const waveY = waterY + Math.sin(x * 0.025 + waveOffset) * 4 + Math.sin(x * 0.01 + waveOffset * 1.5) * 2;
      ctx.lineTo(x, waveY);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Wave foam
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 5) {
      const fy = waterY + Math.sin(x * 0.025 + waveOffset) * 4 + Math.sin(x * 0.01 + waveOffset * 1.5) * 2;
      if (x === 0) ctx.moveTo(x, fy); else ctx.lineTo(x, fy);
    }
    ctx.stroke();

    // Second wave line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.beginPath();
    for (let x = 0; x <= w; x += 5) {
      const fy = waterY + 15 + Math.sin(x * 0.02 + waveOffset * 0.8 + 1) * 3;
      if (x === 0) ctx.moveTo(x, fy); else ctx.lineTo(x, fy);
    }
    ctx.stroke();
  }

  function drawPalmTree(x, baseY, height, lean) {
    ctx.save();
    ctx.translate(x, baseY);

    // Trunk
    ctx.strokeStyle = "#8B6914";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    const topX = lean * height;
    const topY = -height;
    ctx.quadraticCurveTo(lean * height * 0.5, -height * 0.5, topX, topY);
    ctx.stroke();

    // Trunk texture
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 8;
    for (let i = 1; i < 6; i++) {
      const t = i / 6;
      const tx = lean * height * 0.5 * t * t + (topX - lean * height * 0.5) * t * t;
      const ty = -height * t;
      ctx.beginPath();
      ctx.arc(tx, ty, 5, 0, Math.PI);
      ctx.stroke();
    }

    // Palm fronds
    ctx.translate(topX, topY);
    const frondAngles = [-0.8, -0.3, 0.2, 0.7, -1.2, 1.1, -0.1, 0.5];
    for (const angle of frondAngles) {
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(30, -15, 55, 10);
      ctx.strokeStyle = "#228B22";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Leaf shape
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.quadraticCurveTo(25, -18, 55, 10);
      ctx.quadraticCurveTo(25, -5, 5, 0);
      ctx.fillStyle = `rgba(34, 139, 34, ${0.6 + Math.random() * 0.3})`;
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  function drawBeachBall() {
    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.rotation);

    // Shadow
    ctx.beginPath();
    ctx.arc(2, 3, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fill();

    // Ball base (white)
    ctx.beginPath();
    ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();

    // Beach ball colored stripes
    const stripeColors = ["#ff3333", "#ffcc00", "#3399ff", "#ff3333", "#33cc33", "#ff6600"];
    const numStripes = 6;
    for (let i = 0; i < numStripes; i++) {
      const startAngle = (Math.PI * 2 * i) / numStripes;
      const endAngle = startAngle + Math.PI / numStripes;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, BALL_RADIUS, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = stripeColors[i];
      ctx.fill();
    }

    // Stripe dividing lines
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    for (let i = 0; i < numStripes; i++) {
      const angle = (Math.PI * 2 * i) / numStripes;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * BALL_RADIUS, Math.sin(angle) * BALL_RADIUS);
      ctx.stroke();
    }

    // Top circle
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();

    // Shine
    ctx.beginPath();
    ctx.arc(-5, -7, 6, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fill();

    // Outline
    ctx.beginPath();
    ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,0,0,0.1)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  function drawDonut(hoop) {
    const cy = hoop.centerY;
    const cx = hoop.x;
    const outerR = HOLE_RADIUS + DONUT_TUBE;
    const innerR = HOLE_RADIUS;
    const phase = hoop.firePhase;

    // Shadow
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.ellipse(cx + 3, cy + 4, outerR, outerR * 0.35, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#000";
    ctx.fill();
    ctx.restore();

    // Draw donut body using ellipse (viewed at angle for 3D feel)
    // Back half of donut (behind the hole)
    ctx.save();

    // Donut base color (golden brown)
    ctx.beginPath();
    ctx.ellipse(cx, cy, outerR, outerR * 0.38, 0, 0, Math.PI * 2);
    const donutGrad = ctx.createRadialGradient(cx - 5, cy - 5, innerR * 0.3, cx, cy, outerR);
    donutGrad.addColorStop(0, "#e8a840");
    donutGrad.addColorStop(0.5, "#d4882a");
    donutGrad.addColorStop(1, "#b06820");
    ctx.fillStyle = donutGrad;
    ctx.fill();

    // Cut out the hole
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.ellipse(cx, cy, innerR, innerR * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // Inner hole shadow/depth
    ctx.beginPath();
    ctx.ellipse(cx, cy, innerR + 1, (innerR + 1) * 0.38, 0, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(100, 50, 0, 0.5)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();

    // Pink frosting on top half
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy - 2, outerR - 2, (outerR - 2) * 0.36, 0, Math.PI, Math.PI * 2);
    // Clip to donut shape
    ctx.clip();

    ctx.beginPath();
    ctx.ellipse(cx, cy - 2, outerR - 2, (outerR - 2) * 0.36, 0, 0, Math.PI * 2);
    const frostGrad = ctx.createLinearGradient(cx - outerR, cy, cx + outerR, cy);
    frostGrad.addColorStop(0, "#ff88bb");
    frostGrad.addColorStop(0.3, "#ff69b4");
    frostGrad.addColorStop(0.7, "#ff5599");
    frostGrad.addColorStop(1, "#ff88bb");
    ctx.fillStyle = frostGrad;
    ctx.fill();

    ctx.restore();

    // Cut frosting hole
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.ellipse(cx, cy, innerR - 1, (innerR - 1) * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();

    // Sprinkles on top
    const sprinkleColors = ["#ff3333", "#ffdd00", "#33cc33", "#3399ff", "#ff6600", "#cc33ff"];
    const numSprinkles = 14;
    for (let i = 0; i < numSprinkles; i++) {
      const angle = (Math.PI * 2 * i) / numSprinkles + phase * 0.01;
      const r = innerR + DONUT_TUBE * (0.3 + ((i * 7) % 5) / 10);
      const sx = cx + Math.cos(angle) * r;
      const sy = cy - 2 + Math.sin(angle) * r * 0.35;
      // Only draw sprinkles on top half
      if (Math.sin(angle) < 0.3) {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(angle + 0.5);
        ctx.fillStyle = sprinkleColors[i % sprinkleColors.length];
        ctx.fillRect(-4, -1.5, 8, 3);
        ctx.restore();
      }
    }

    // Shine highlight
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.ellipse(cx - outerR * 0.25, cy - outerR * 0.15, outerR * 0.3, outerR * 0.1, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.restore();

    // Outer edge definition
    ctx.beginPath();
    ctx.ellipse(cx, cy, outerR, outerR * 0.38, 0, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(120, 60, 0, 0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Score glow
    if (hoop.scored) {
      ctx.save();
      ctx.globalAlpha = 0.25;
      const scoreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerR * 1.2);
      scoreGrad.addColorStop(0, "#ffdd57");
      scoreGrad.addColorStop(1, "transparent");
      ctx.fillStyle = scoreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR * 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawUI() {
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 52px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 8;
    ctx.fillText(displayScore, w / 2, 30);
    ctx.restore();

    // Clean streak multiplier
    if (cleanStreak > 1) {
      ctx.save();
      ctx.fillStyle = "#ff6600";
      ctx.font = "bold 26px system-ui";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(255,100,0,0.5)";
      ctx.shadowBlur = 6;
      ctx.fillText(`x${Math.pow(2, cleanStreak - 1)} streak!`, w / 2, 88);
      ctx.restore();
    }

    // Multiplier popups
    for (const m of multiplierPopups) {
      ctx.save();
      ctx.globalAlpha = m.life;
      ctx.fillStyle = "#ffdd00";
      ctx.font = "bold 30px system-ui";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(255,150,0,0.7)";
      ctx.shadowBlur = 8;
      ctx.fillText(m.text, m.x, m.y);
      ctx.restore();
    }

    if (!started) {
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.font = "20px system-ui";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.3)";
      ctx.shadowBlur = 4;
      ctx.fillText("Tap anywhere to flap", w / 2, h * 0.55);
      ctx.restore();
    }
  }

  function draw() {
    ctx.save();

    if (screenShake > 0) {
      ctx.translate((Math.random() - 0.5) * screenShake * 2, (Math.random() - 0.5) * screenShake * 2);
      screenShake *= 0.85;
    }

    drawBackground();

    // Trail
    for (const t of trailParticles) {
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius * t.life, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 200, 100, ${t.life * 0.25})`;
      ctx.fill();
    }

    // Hoops
    for (const hoop of hoops) drawDonut(hoop);

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
    drawBeachBall();

    // Flash
    if (flashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 200, 50, ${flashAlpha})`;
      ctx.fillRect(0, 0, w, h);
    }

    drawUI();
    ctx.restore();
  }

  function loop() {
    update();
    draw();
    frameId = requestAnimationFrame(loop);
  }

  init();
})();

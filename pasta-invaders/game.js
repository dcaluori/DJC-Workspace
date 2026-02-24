const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Sprite images (optional, loaded if present)
const pastaSprites = {};
const playerSprite = new Image();
const bulletSprite = new Image();
let spritesLoaded = false;

// UI elements
const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const gameOverTitle = document.getElementById("gameOverTitle");
const finalScoreText = document.getElementById("finalScoreText");
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const levelEl = document.getElementById("level");

const KEY_CODES = {
  LEFT: ["ArrowLeft", "a", "A"],
  RIGHT: ["ArrowRight", "d", "D"],
  SHOOT: [" ", "Spacebar"],
};

const PLAYER = {
  width: 60,
  height: 30,
  speed: 10, // fast bowl movement
};

const BULLET = {
  width: 4,
  height: 14,
  speed: 8,
};

const PASTA_TYPES = [
  {
    name: "PENNE",
    color: "#facc6b",
    score: 10,
  },
  {
    name: "FARFALLE",
    color: "#fde68a",
    score: 15,
  },
  {
    name: "FUSILLI",
    color: "#fb923c",
    score: 20,
  },
  {
    name: "RIGATONI",
    color: "#ea580c",
    score: 25,
  },
  {
    name: "SPAGHETTI_NEST",
    color: "#facc6b",
    score: 30,
  },
  {
    name: "TORTELLINI",
    color: "#fbbf24",
    score: 35,
  },
  {
    name: "ORECCHIETTE",
    color: "#fde68a",
    score: 40,
  },
  {
    name: "GNOCCHI",
    color: "#f97316",
    score: 45,
  },
];

let gameState = {
  running: false,
  gameOver: false,
  score: 0,
  lives: 3,
  level: 1,
};

let player;
let bullets = [];
let pastas = [];
let doubleShot = false;
let input = {
  left: false,
  right: false,
  shooting: false,
  canShoot: true,
};

let lastTime = 0;

function loadSprites() {
  const names = [
    "PENNE",
    "FARFALLE",
    "FUSILLI",
    "RIGATONI",
    "SPAGHETTI_NEST",
    "TORTELLINI",
    "ORECCHIETTE",
    "GNOCCHI",
  ];

  let remaining = names.length + 2; // pasta + bowl + meatball

  function handleLoaded() {
    remaining -= 1;
    if (remaining <= 0) {
      spritesLoaded = true;
    }
  }

  // Cache-bust so new sprites show after re-running generate_sprites.py
  const cacheBust = "?v=" + Date.now();

  // player bowl
  playerSprite.src = "sprites/bowl.png" + cacheBust;
  playerSprite.onload = handleLoaded;
  playerSprite.onerror = handleLoaded;

  // meatball projectile
  bulletSprite.src = "sprites/meatball.png" + cacheBust;
  bulletSprite.onload = handleLoaded;
  bulletSprite.onerror = handleLoaded;

  names.forEach((name) => {
    const img = new Image();
    img.src = `sprites/${name}.png` + cacheBust;
    img.onload = handleLoaded;
    img.onerror = handleLoaded;
    pastaSprites[name] = img;
  });
}

function resetPlayer() {
  player = {
    x: canvas.width / 2 - PLAYER.width / 2,
    y: canvas.height - PLAYER.height - 20,
    width: PLAYER.width,
    height: PLAYER.height,
    speed: PLAYER.speed,
  };
}

function createPastaWave(level) {
  pastas = [];
  const rows = 3 + Math.min(level, 3); // up to 6 rows
  const cols = 9;
  const paddingX = 14;
  const paddingY = 18;
  const startX = 60;
  const startY = 60;
  const baseWidth = 46;
  const baseHeight = 24;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const type = PASTA_TYPES[(row * 2 + col) % PASTA_TYPES.length];
      const wobblePhase = Math.random() * Math.PI * 2;
      const wobbleAmplitude = 6 + Math.random() * 10;
      const speedFactor = 0.4 + Math.random() * 0.9;
      pastas.push({
        type,
        x: startX + col * (baseWidth + paddingX),
        y: startY + row * (baseHeight + paddingY),
        width: baseWidth,
        height: baseHeight,
        wobblePhase,
        wobbleAmplitude,
        speedFactor,
      });
    }
  }

  // special fast flashing pasta for this level
  const specialType = PASTA_TYPES[Math.floor(Math.random() * PASTA_TYPES.length)];
  const fromLeft = Math.random() < 0.5;
  const specialY =
    startY - 10 + Math.random() * Math.min(120, rows * (baseHeight + paddingY));
  pastas.push({
    type: specialType,
    x: fromLeft ? -80 : canvas.width + 80,
    y: specialY,
    width: baseWidth,
    height: baseHeight,
    wobblePhase: Math.random() * Math.PI * 2,
    wobbleAmplitude: 10,
    speedFactor: 2.5,
    isSpecial: true,
    specialDir: fromLeft ? 1 : -1,
  });
}

function resetGame() {
  gameState = {
    running: false,
    gameOver: false,
    score: 0,
    lives: 3,
    level: 1,
  };

  bullets = [];
  doubleShot = false;
  resetPlayer();
  createPastaWave(gameState.level);
  updateUI();
}

function startGame() {
  resetGame();
  gameState.running = true;
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
}

function endGame(won) {
  gameState.running = false;
  gameState.gameOver = true;
  gameOverTitle.textContent = won ? "Kitchen Defended!" : "Overcooked!";
  finalScoreText.textContent = `Final Score: ${gameState.score}`;
  gameOverScreen.classList.remove("hidden");
}

function updateUI() {
  scoreEl.textContent = gameState.score;
  livesEl.textContent = gameState.lives;
  levelEl.textContent = gameState.level;
}

// Input handling
window.addEventListener("keydown", (e) => {
  if (KEY_CODES.LEFT.includes(e.key)) input.left = true;
  if (KEY_CODES.RIGHT.includes(e.key)) input.right = true;
  if (KEY_CODES.SHOOT.includes(e.key)) input.shooting = true;
});

window.addEventListener("keyup", (e) => {
  if (KEY_CODES.LEFT.includes(e.key)) input.left = false;
  if (KEY_CODES.RIGHT.includes(e.key)) input.right = false;
  if (KEY_CODES.SHOOT.includes(e.key)) input.shooting = false;
});

startButton.addEventListener("click", () => {
  startGame();
});

restartButton.addEventListener("click", () => {
  startGame();
});

// Shooting
function tryShoot() {
  if (!input.shooting || !input.canShoot || !gameState.running) return;
  input.canShoot = false;
  const centerX = player.x + player.width / 2;

  if (doubleShot) {
    const offset = 14;
    bullets.push(
      {
        x: centerX - offset - BULLET.width / 2,
        y: player.y - BULLET.height,
        width: BULLET.width,
        height: BULLET.height,
        speed: BULLET.speed,
      },
      {
        x: centerX + offset - BULLET.width / 2,
        y: player.y - BULLET.height,
        width: BULLET.width,
        height: BULLET.height,
        speed: BULLET.speed,
      },
    );
  } else {
    bullets.push({
      x: centerX - BULLET.width / 2,
      y: player.y - BULLET.height,
      width: BULLET.width,
      height: BULLET.height,
      speed: BULLET.speed,
    });
  }

  // small cooldown
  setTimeout(() => {
    input.canShoot = true;
  }, 180);
}

// Collision helper
function rectsOverlap(a, b) {
  return !(
    a.x + a.width < b.x ||
    a.x > b.x + b.width ||
    a.y + a.height < b.y ||
    a.y > b.y + b.height
  );
}

// Game update
let pastaDirection = 1; // 1 = right, -1 = left
let pastaStepDown = false;

function update(delta) {
  if (!gameState.running) return;

  // Player movement
  if (input.left) {
    player.x -= player.speed;
  } else if (input.right) {
    player.x += player.speed;
  }

  player.x = Math.max(10, Math.min(canvas.width - player.width - 10, player.x));

  tryShoot();

  // Bullets
  bullets.forEach((b) => {
    b.y -= b.speed;
  });
  bullets = bullets.filter((b) => b.y + b.height >= 0);

  // Pasta movement: individual, slightly chaotic, scales slowly with level
  const difficultyScale = 0.7 + gameState.level * 0.2;
  const baseHorizontalSpeed = 3 * difficultyScale;
  const dt = delta / 16.67;
  pastaStepDown = false;

  let hitEdge = false;
  for (const p of pastas) {
    if (p.isSpecial) {
      // special pasta: bounces around the play area until shot down
      const dir = p.specialDir || 1;
      p.x += baseHorizontalSpeed * 3.2 * dir * dt;
      p.wobblePhase += 0.12 * dt;
      p.y += Math.sin(p.wobblePhase) * (p.wobbleAmplitude / 10) * dt;
      // bounce off left/right so it stays on screen
      if (p.x <= 20) {
        p.x = 20;
        p.specialDir = 1;
      } else if (p.x + p.width >= canvas.width - 20) {
        p.x = canvas.width - 20 - p.width;
        p.specialDir = -1;
      }
      // bounce off top/bottom
      if (p.y <= 30) {
        p.y = 30;
      } else if (p.y + p.height >= canvas.height - 100) {
        p.y = canvas.height - 100 - p.height;
      }
    } else {
      // regular pasta drift
      p.x += baseHorizontalSpeed * p.speedFactor * pastaDirection * dt;
      p.wobblePhase += 0.04 * dt;
      p.y += Math.sin(p.wobblePhase) * (p.wobbleAmplitude / 20) * dt;

      if (p.x <= 20 || p.x + p.width >= canvas.width - 20) {
        hitEdge = true;
      }
    }
  }

  if (hitEdge) {
    pastaDirection *= -1;
    pastaStepDown = true;
  }

  if (pastaStepDown) {
    for (const p of pastas) {
      p.y += 18;
    }
  }

  // Bullet-pasta collision (1 hit = cleared pasta)
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    let hitIndex = -1;
    for (let j = 0; j < pastas.length; j++) {
      const p = pastas[j];
      if (rectsOverlap(b, p)) {
        hitIndex = j;
        gameState.score += p.type.score;
        if (p.isSpecial) {
          doubleShot = true;
        }
        pastas.splice(j, 1);
        break;
      }
    }
    if (hitIndex !== -1) {
      bullets.splice(i, 1);
    }
  }

  // Pasta reaching player or bottom
  let lowestY = 0;
  for (const p of pastas) {
    if (p.y + p.height > lowestY) {
      lowestY = p.y + p.height;
    }
    if (rectsOverlap(p, player)) {
      handlePlayerHit();
      break;
    }
  }

  if (lowestY >= canvas.height - 80 && pastas.length > 0) {
    handlePlayerHit();
  }

  // Win condition: cleared wave
  if (pastas.length === 0) {
    gameState.level += 1;
    doubleShot = false; // new level = back to single meatball
    createPastaWave(gameState.level);
  }

  updateUI();
}

function handlePlayerHit() {
  gameState.lives -= 1;
  bullets = [];
  resetPlayer();
  if (gameState.lives <= 0) {
    endGame(false);
  }
}

// Drawing helpers
function drawPlayer() {
  ctx.save();
  ctx.translate(player.x + player.width / 2, player.y + player.height / 2);

  if (spritesLoaded && playerSprite.complete && playerSprite.naturalWidth > 0) {
    const scale = 1.2;
    const w = player.width * scale;
    const h = player.height * 2.2 * scale;
    ctx.drawImage(
      playerSprite,
      -w / 2,
      -h / 2,
      w,
      h
    );
    ctx.restore();
    return;
  }

  // bowl
  ctx.fillStyle = "#fdfaf5";
  ctx.beginPath();
  ctx.ellipse(0, 8, player.width / 2, player.height / 2, 0, Math.PI, 0, true);
  ctx.fill();

  ctx.strokeStyle = "#c9b39a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-player.width / 2, 8);
  ctx.quadraticCurveTo(0, player.height, player.width / 2, 8);
  ctx.stroke();

  // spaghetti
  ctx.strokeStyle = "#f5d28a";
  ctx.lineWidth = 2;
  for (let i = -player.width / 2 + 6; i < player.width / 2 - 6; i += 6) {
    ctx.beginPath();
    ctx.moveTo(i, 2);
    ctx.bezierCurveTo(i + 4, -4, i - 2, -10, i + 2, -14);
    ctx.stroke();
  }

  // meatballs in the bowl
  ctx.fillStyle = "#8b3b22";
  ctx.beginPath();
  ctx.arc(-14, -4, 5, 0, Math.PI * 2);
  ctx.arc(4, -10, 6, 0, Math.PI * 2);
  ctx.arc(18, -2, 5, 0, Math.PI * 2);
  ctx.fill();

  // spoon flicking upwards
  ctx.strokeStyle = "#d0d0d0";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(12, -player.height / 2);
  ctx.lineTo(2, -6);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(14, -player.height / 2 - 4, 5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawBullet(b) {
  ctx.save();
  const centerX = b.x + b.width / 2;
  const centerY = b.y + b.height / 2;

  if (spritesLoaded && bulletSprite.complete && bulletSprite.naturalWidth > 0) {
    const size = 22;
    ctx.drawImage(
      bulletSprite,
      centerX - size / 2,
      centerY - size / 2,
      size,
      size
    );
    ctx.restore();
    return;
  }

  const radius = 7;
  // fallback saucy meatball
  ctx.fillStyle = "#8b3b22";
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e74c3c";
  ctx.beginPath();
  ctx.arc(centerX - 2, centerY - 2, radius - 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawPasta(p) {
  ctx.save();
  ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
  ctx.fillStyle = p.type.color;
  ctx.strokeStyle = "#8c4b1b";
  ctx.lineWidth = 2;

  if (p.isSpecial) {
    // flashing effect for special pasta
    const flash = (Math.sin(p.wobblePhase * 8) + 1) / 2;
    ctx.globalAlpha = 0.6 + 0.4 * flash;
  }

  const sprite = pastaSprites[p.type.name];
  if (spritesLoaded && sprite && sprite.complete && sprite.naturalWidth > 0) {
    const scale = 1.2;
    const w = p.width * scale;
    const h = p.height * 2 * scale;
    ctx.drawImage(
      sprite,
      -w / 2,
      -h / 2,
      w,
      h
    );
    ctx.restore();
    return;
  }

  if (p.type.name === "PENNE") {
    // tilted tube
    ctx.rotate(-0.25);
    ctx.beginPath();
    ctx.roundRect(-p.width / 2, -p.height / 2, p.width, p.height, 8);
    ctx.fill();
    ctx.stroke();
  } else if (p.type.name === "FARFALLE") {
    // bow tie
    ctx.beginPath();
    ctx.moveTo(-p.width / 2, 0);
    ctx.quadraticCurveTo(-p.width / 4, -p.height / 2, 0, 0);
    ctx.quadraticCurveTo(-p.width / 4, p.height / 2, -p.width / 2, 0);
    ctx.moveTo(p.width / 2, 0);
    ctx.quadraticCurveTo(p.width / 4, -p.height / 2, 0, 0);
    ctx.quadraticCurveTo(p.width / 4, p.height / 2, p.width / 2, 0);
    ctx.fill();
    ctx.stroke();
  } else if (p.type.name === "FUSILLI") {
    // spiral-ish
    ctx.beginPath();
    const segments = 4;
    const segW = p.width / segments;
    for (let i = 0; i < segments; i++) {
      const x = -p.width / 2 + i * segW;
      const yOffset = i % 2 === 0 ? -p.height / 4 : p.height / 4;
      ctx.roundRect(x, yOffset - p.height / 4, segW, p.height / 2, 4);
    }
    ctx.fill();
    ctx.stroke();
  } else if (p.type.name === "RIGATONI") {
    // chunky tube
    ctx.beginPath();
    ctx.roundRect(-p.width / 2, -p.height / 2, p.width, p.height, 6);
    ctx.fill();
    ctx.stroke();
    // stripes
    ctx.strokeStyle = "rgba(140,75,27,0.6)";
    ctx.lineWidth = 1;
    for (let i = -p.width / 2 + 4; i < p.width / 2; i += 6) {
      ctx.beginPath();
      ctx.moveTo(i, -p.height / 2 + 2);
      ctx.lineTo(i + 3, p.height / 2 - 2);
      ctx.stroke();
    }
  } else if (p.type.name === "SPAGHETTI_NEST") {
    // little spaghetti swirl nest
    ctx.beginPath();
    ctx.ellipse(0, 0, p.width / 2.4, p.height / 1.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#facc6b";
    ctx.lineWidth = 1.5;
    for (let r = p.height / 3; r < p.width / 2.4; r += 3) {
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.6, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (p.type.name === "TORTELLINI") {
    // little stuffed ring
    ctx.beginPath();
    ctx.ellipse(0, 0, p.width / 3, p.height / 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fef3c7";
    ctx.beginPath();
    ctx.ellipse(0, 0, p.width / 5, p.height / 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.type.name === "ORECCHIETTE") {
    // ear-shaped cup
    ctx.beginPath();
    ctx.ellipse(0, 0, p.width / 3, p.height / 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fcd34d";
    ctx.beginPath();
    ctx.ellipse(0, 2, p.width / 4, p.height / 3, 0, 0, Math.PI);
    ctx.fill();
  } else if (p.type.name === "GNOCCHI") {
    // pillowy dumpling
    ctx.beginPath();
    ctx.roundRect(-p.width / 4, -p.height / 3, p.width / 2, (2 * p.height) / 3, 8);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(140,75,27,0.6)";
    ctx.lineWidth = 1;
    for (let y = -p.height / 4; y <= p.height / 4; y += 4) {
      ctx.beginPath();
      ctx.moveTo(-p.width / 4 + 2, y);
      ctx.lineTo(p.width / 4 - 2, y + 2);
      ctx.stroke();
    }
  } else {
    ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
  }

  // tiny face
  ctx.fillStyle = "#3b2313";
  ctx.beginPath();
  ctx.arc(-6, -3, 2, 0, Math.PI * 2);
  ctx.arc(6, -3, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#3b2313";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 4, 5, 0, Math.PI);
  ctx.stroke();

  ctx.restore();
}

function drawBackground() {
  // subtle kitchen counters
  const counterHeight = 80;
  ctx.save();
  ctx.fillStyle = "rgba(255, 248, 226, 0.7)";
  ctx.fillRect(0, canvas.height - counterHeight, canvas.width, counterHeight);
  ctx.strokeStyle = "rgba(80, 46, 20, 0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - counterHeight);
  ctx.lineTo(canvas.width, canvas.height - counterHeight);
  ctx.stroke();
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  bullets.forEach(drawBullet);
  pastas.forEach(drawPasta);
  drawPlayer();
}

function loop(timestamp) {
  const delta = timestamp - lastTime;
  lastTime = timestamp;

  update(delta);
  draw();

  requestAnimationFrame(loop);
}

// Initialize
loadSprites();
resetGame();
startScreen.classList.remove("hidden");
requestAnimationFrame(loop);

/* bg.js — gradient sky + uneven multi-gradient ground
   with falling seeds that grow into colorful Pythagoras trees */

(() => {
  // --- setup ---------------------------------------------------------------
  const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const canvas = document.createElement('canvas');
  canvas.id = 'bg-canvas';
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '1',
    pointerEvents: 'none',
    width: '100vw',
    height: '100vh',
  });
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, groundY = 0, grassH = 120;

  function resize() {
    W = Math.floor(innerWidth);
    H = Math.floor(innerHeight);
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    groundY = H - grassH;
  }
  addEventListener('resize', resize, { passive: true });
  resize();

  // --- utils ---------------------------------------------------------------
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  // --- ground terrain generation -------------------------------------------
  function generateGroundProfile() {
    const segments = 8;
    const segmentWidth = W / segments;
    const heights = [];
    const colors = [];
    
    // Generate uneven heights and different green shades
    for (let i = 0; i <= segments; i++) {
      // Create gentle hills and valleys
      const baseHeight = groundY;
      const variation = rand(-15, 15);
      heights.push(baseHeight + variation);
      
      // Different green shades for each segment
      const hueVariation = rand(-8, 8);
      const baseHue = 140; // Base green hue
      colors.push({
        hue: baseHue + hueVariation,
        saturation: rand(50, 70),
        lightness: rand(35, 45)
      });
    }
    
    return { heights, colors, segmentWidth };
  }

  let groundProfile = generateGroundProfile();

  // Regenerate ground on resize for responsive terrain
  addEventListener('resize', () => {
    resize();
    groundProfile = generateGroundProfile();
  }, { passive: true });

  // --- sky + uneven ground -------------------------------------------------
  function drawBackground() {
    // Sky gradient (unchanged)
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#7ec8ff');
    sky.addColorStop(0.6, '#bfe6ff');
    sky.addColorStop(1, '#e8f6ff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Draw uneven ground with multiple gradients
    const { heights, colors, segmentWidth } = groundProfile;
    
    for (let i = 0; i < heights.length - 1; i++) {
      const x1 = i * segmentWidth;
      const x2 = (i + 1) * segmentWidth;
      const y1 = heights[i];
      const y2 = heights[i + 1];
      
      // Create gradient for this segment
      const ground = ctx.createLinearGradient(0, y1, 0, H);
      const color = colors[i];
      
      // Multi-stop gradient for depth
      ground.addColorStop(0.0, `hsl(${color.hue}, ${color.saturation}%, ${color.lightness + 10}%)`);
      ground.addColorStop(0.3, `hsl(${color.hue}, ${color.saturation}%, ${color.lightness}%)`);
      ground.addColorStop(0.7, `hsl(${color.hue}, ${color.saturation}%, ${color.lightness - 8}%)`);
      ground.addColorStop(1.0, `hsl(${color.hue}, ${color.saturation}%, ${color.lightness - 15}%)`);
      
      ctx.fillStyle = ground;
      
      // Draw trapezoid for this ground segment
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x2, H);
      ctx.lineTo(x1, H);
      ctx.closePath();
      ctx.fill();
    }

    // Add some subtle texture with noise
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i < W; i += 4) {
      for (let j = groundY; j < H; j += 4) {
        if (Math.random() > 0.9) {
          ctx.fillRect(i, j, 1, 1);
        }
      }
    }
  }

  // --- seeds ---------------------------------------------------------------
  class Seed {
    constructor() { this.reset(); }
    reset() {
      this.x = rand(20, W - 20);
      this.y = rand(-80, -10);
      this.vx = rand(-10, 10);
      this.vy = rand(10, 30);
      this.phase = rand(0, Math.PI * 2);
      this.r = rand(3, 5);
      this.spin = rand(-2, 2);
      this.angle = 0;
      this.color = `hsl(${rand(15, 45)}, 70%, 55%)`;
      this.alive = true;
    }
    update(dt, t) {
      this.vx += Math.sin(t * 1.3 + this.phase) * 2 * dt;
      this.vy += 60 * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.angle += this.spin * dt;

      // Check collision with uneven ground
      const groundHeight = getGroundHeightAt(this.x);
      if (this.y + this.r >= groundHeight - 1) {
        this.alive = false;
        spawnTree(this.x);
      }
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, this.r * 1.2, this.r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Helper function to get ground height at specific x position
  function getGroundHeightAt(x) {
    const { heights, segmentWidth } = groundProfile;
    const segmentIndex = Math.floor(x / segmentWidth);
    
    if (segmentIndex >= heights.length - 1) {
      return heights[heights.length - 1];
    }
    
    const x1 = segmentIndex * segmentWidth;
    const x2 = (segmentIndex + 1) * segmentWidth;
    const y1 = heights[segmentIndex];
    const y2 = heights[segmentIndex + 1];
    
    // Linear interpolation between segment points
    const t = (x - x1) / (x2 - x1);
    return y1 + (y2 - y1) * t;
  }

  // --- trees (Pythagoras) --------------------------------------------------
  const trees = [];
  const seeds = [];
  let maxTrees = 18;
  let nextSeedAt = 0;

  class Tree {
    constructor(x) {
      this.x = clamp(x, 30, W - 30);
      this.base = getGroundHeightAt(this.x); // Plant at ground height
      this.baseSize = rand(22, 42);
      this.angle = rand(25, 42) * Math.PI / 180;
      this.hue = rand(0, 360);
      this.maxDepth = Math.floor(rand(6, 9));
      this.growth = 0;
      this.growthSpeed = rand(0.6, 1.2);
    }
    update(dt) {
      this.growth = clamp(this.growth + this.growthSpeed * dt, 0, this.maxDepth + 0.999);
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.base);
      this.#drawNode(this.baseSize, 0, this.angle, Math.floor(this.growth));
      ctx.restore();
    }
    #color(depth) {
      const l = 30 + depth * 6;
      return `hsl(${(this.hue + depth * 8) % 360}, 60%, ${l}%)`;
    }
    #drawNode(size, depth, a, limit) {
      ctx.save();
      ctx.fillStyle = this.#color(depth);
      ctx.fillRect(-size / 2, -size, size, size);

      if (depth < limit) {
        // Left branch
        ctx.save();
        ctx.translate(-size / 2, -size);
        ctx.rotate(-Math.PI / 2 + a);
        this.#drawNode(size * Math.sin(a), depth + 1, a, limit);
        ctx.restore();

        // Right branch
        ctx.save();
        ctx.translate(size / 2, -size);
        ctx.rotate(a);
        this.#drawNode(size * Math.cos(a), depth + 1, a, limit);
        ctx.restore();
      }
      ctx.restore();
    }
  }

  function spawnTree(x) {
    if (trees.length >= maxTrees) trees.shift();
    trees.push(new Tree(x));
  }

  // --- animation loop ------------------------------------------------------
  let last = performance.now();
  let perfTime = 0;

  function tick(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    perfTime += dt;

    // seed spawning
    if (now > nextSeedAt && trees.length < maxTrees + 4) {
      seeds.push(new Seed());
      nextSeedAt = now + rand(1500, 4000);
    }

    // update
    seeds.forEach(s => s.update(dt, perfTime));
    for (let i = seeds.length - 1; i >= 0; i--) if (!seeds[i].alive) seeds.splice(i, 1);
    trees.forEach(t => t.update(dt));

    // draw
    drawBackground();
    seeds.forEach(s => s.draw());
    trees.forEach(t => t.draw());

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
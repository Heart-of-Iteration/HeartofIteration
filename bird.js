// Flying bird animation and interaction
document.addEventListener('DOMContentLoaded', () => {
  const bird = document.getElementById('flying-bird');
  let posX = window.innerWidth / 2;
  let posY = window.innerHeight / 2;
  let targetX = posX;
  let targetY = posY;
  let speed = 2;
  let birdScale = 1;
  let birdDirection = 1; // 1 for right, -1 for left

  // Set random target position
  function setRandomTarget() {
    targetX = Math.random() * (window.innerWidth - 100) + 50;
    targetY = Math.random() * (window.innerHeight - 100) + 50;
    
    // Update bird direction based on movement
    if (targetX > posX) {
      birdDirection = 1;
    } else {
      birdDirection = -1;
    }
    
    // Add slight bobbing motion
    birdScale = 0.9 + Math.random() * 0.2;
  }

  // Initialize first target
  setRandomTarget();

  function animateBird() {
    // Move towards target
    const dx = targetX - posX;
    const dy = targetY - posY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 20) {
      // Reached target, set new one
      setRandomTarget();
    } else {
      // Move towards target
      posX += (dx / distance) * speed;
      posY += (dy / distance) * speed;
    }
    
    // Apply movement and transformations
    bird.style.left = (posX - 40) + 'px'; // Center the bird
    bird.style.top = (posY - 40) + 'px';
    bird.style.transform = `scaleX(${birdDirection}) scale(${birdScale})`;
    
    // Add flapping animation
    const flap = Math.sin(Date.now() * 0.01) * 0.1 + 1;
    bird.style.transform += ` scaleY(${flap})`;
    
    requestAnimationFrame(animateBird);
  }

  // Make bird clickable to open game
  bird.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'games/ClickBox/index.html';
  });

  // Add keyboard support for accessibility
  bird.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.location.href = 'games/ClickBox/index.html';
    }
  });

  // Make bird focusable for accessibility
  bird.setAttribute('tabindex', '0');
  bird.setAttribute('role', 'button');
  bird.setAttribute('aria-label', 'Open ClickBox Game');

  // Start animation
  animateBird();

  // Update bird position on resize
  window.addEventListener('resize', () => {
    // Keep bird within bounds
    posX = Math.min(posX, window.innerWidth - 50);
    posY = Math.min(posY, window.innerHeight - 50);
    targetX = Math.min(targetX, window.innerWidth - 50);
    targetY = Math.min(targetY, window.innerHeight - 50);
  });
});
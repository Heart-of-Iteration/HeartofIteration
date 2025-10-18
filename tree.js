// Pythagorean Tree rendered in SVG (visual only layer)
document.addEventListener('DOMContentLoaded', () => {
  const treeContainer = document.getElementById('central-tree');

  // Layout
  const svgWidth  = 1000;
  const svgHeight = 650;
  const centerX   = svgWidth / 2;
  const baseY     = svgHeight;
  const baseSize  = 120;
  const maxDepth  = 9;
  const angleRad  = 40 * Math.PI / 180;
  const angleDeg  = 40;

  // SVG root
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('id', 'tree-svg');
  svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
  svg.setAttribute('width', svgWidth);
  svg.setAttribute('height', svgHeight);
  svg.setAttribute('aria-hidden', 'true');
  treeContainer.appendChild(svg);

  const root = document.createElementNS(SVG_NS, 'g');
  root.setAttribute('transform', `translate(${centerX}, ${baseY})`);
  svg.appendChild(root);

  function makeSquare(parent, size, depth) {
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', (-size / 2).toString());
    rect.setAttribute('y', (-size).toString());
    rect.setAttribute('width', size.toString());
    rect.setAttribute('height', size.toString());
    const hue = (120 + depth * 8) % 360;
    const lightness = 30 + depth * 6;
    rect.setAttribute('fill', `hsl(${hue}, 60%, ${lightness}%)`);
    parent.appendChild(rect);
  }

  function drawBranch(parent, size, depth) {
    makeSquare(parent, size, depth);
    if (depth >= maxDepth) return;

    const leftG = document.createElementNS(SVG_NS, 'g');
    leftG.setAttribute('transform', `translate(${-size / 2}, ${-size}) rotate(${-90 + angleDeg})`);
    parent.appendChild(leftG);
    drawBranch(leftG, size * Math.sin(angleRad), depth + 1);

    const rightG = document.createElementNS(SVG_NS, 'g');
    rightG.setAttribute('transform', `translate(${size / 2}, ${-size}) rotate(${angleDeg})`);
    parent.appendChild(rightG);
    drawBranch(rightG, size * Math.cos(angleRad), depth + 1);
  }

  drawBranch(root, baseSize, 0);

  // --- UI overlay: trigger + dropdown ABOVE ground ---
  const uiOverlay = document.getElementById('tree-ui');

  function createGamesTrigger() {
    const trigger = document.createElement('div');
    trigger.className = 'games-trigger';
    trigger.style.width  = baseSize + 'px';
    trigger.style.height = baseSize + 'px';
    trigger.style.left   = (centerX - baseSize / 2) + 'px';
    trigger.style.top    = (baseY - baseSize) + 'px';
    trigger.style.position = 'absolute';
    trigger.style.cursor = 'pointer';
    trigger.setAttribute('role', 'button');
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.tabIndex = 0;

    // Move dropdown INTO the trigger so it anchors to the base square
    const dropdown = document.querySelector('#central-tree .games-dropdown');
    if (dropdown) trigger.appendChild(dropdown);

    // Hover/focus state for desktop
    trigger.addEventListener('mouseenter', () => trigger.classList.add('is-hover'));
    trigger.addEventListener('mouseleave', () => trigger.classList.remove('is-hover'));
    trigger.addEventListener('focus', () => trigger.classList.add('is-hover'));
    trigger.addEventListener('blur', () => trigger.classList.remove('is-hover'));

    // Toggle open/close
    const toggleOpen = (force) => {
      const open = force ?? !trigger.classList.contains('open');
      trigger.classList.toggle('open', open);
      trigger.setAttribute('aria-expanded', String(open));
    };

    // IMPORTANT: don't block link clicks inside the dropdown
    trigger.addEventListener('click', (e) => {
      const inDropdown = e.target.closest('.games-dropdown');
      if (inDropdown) {
        // Let anchors navigate normally
        return;
      }
      e.preventDefault();
      toggleOpen();
    });

    // Keyboard
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleOpen(); }
      if (e.key === 'Escape') { toggleOpen(false); }
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (!trigger.contains(e.target)) toggleOpen(false);
    });

    return trigger;
  }

  const trigger = createGamesTrigger();
  uiOverlay.appendChild(trigger);
});

/* The Kiln — landing-mock interactions
   - Reveal-on-scroll for sections/cards
   - Pointer parallax on the hero gradient tiles (Exa-style)
   - Tilt-on-hover for case study frames
*/

(function () {
  'use strict';

  /* ---------- Reveal on scroll ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Pointer parallax for hero tiles ----------
     Each tile has a data-parallax="<strength>" between 0 and 1.
     We translate it slightly based on distance from cursor center.
  */
  const hero = document.querySelector('.hero');
  const tiles = Array.from(document.querySelectorAll('.hero .tile'));
  if (hero && tiles.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let raf = 0;
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;

    hero.addEventListener('pointermove', (e) => {
      const rect = hero.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      targetX = (e.clientX - cx) / rect.width;
      targetY = (e.clientY - cy) / rect.height;
      if (!raf) raf = requestAnimationFrame(tick);
    });

    hero.addEventListener('pointerleave', () => {
      targetX = 0; targetY = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    });

    function tick() {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      tiles.forEach((tile) => {
        const strength = parseFloat(tile.getAttribute('data-parallax') || '0.2');
        const tx = currentX * 60 * strength;
        const ty = currentY * 60 * strength;
        // preserve any existing rotation set via float keyframes by using CSS variable
        tile.style.setProperty('--px', tx.toFixed(2) + 'px');
        tile.style.setProperty('--py', ty.toFixed(2) + 'px');
        tile.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) ` + getRotationFor(tile);
      });

      if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    }

    // tile rotations (mirrors CSS class assignments)
    function getRotationFor(tile) {
      if (tile.classList.contains('tile-1')) return 'rotate(-9deg)';
      if (tile.classList.contains('tile-2')) return 'rotate(14deg)';
      if (tile.classList.contains('tile-3')) return 'rotate(-4deg)';
      if (tile.classList.contains('tile-4')) return 'rotate(8deg)';
      if (tile.classList.contains('tile-5')) return 'rotate(-6deg)';
      if (tile.classList.contains('tile-6')) return 'rotate(18deg)';
      return '';
    }
  }

  /* ---------- Subtle tilt on case study frames ---------- */
  const frames = document.querySelectorAll('.case-frame');
  frames.forEach((frame) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let bounds;
    frame.addEventListener('pointerenter', () => { bounds = frame.getBoundingClientRect(); });
    frame.addEventListener('pointermove', (e) => {
      if (!bounds) bounds = frame.getBoundingClientRect();
      const rx = (e.clientX - bounds.left) / bounds.width - 0.5;
      const ry = (e.clientY - bounds.top) / bounds.height - 0.5;
      frame.style.transform = `translateY(-3px) rotateX(${(-ry * 3).toFixed(2)}deg) rotateY(${(rx * 3).toFixed(2)}deg)`;
    });
    frame.addEventListener('pointerleave', () => {
      frame.style.transform = '';
    });
  });

  /* ---------- Smooth-scroll for in-page anchors ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();

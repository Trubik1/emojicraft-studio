import { useEffect } from 'react';

/**
 * Hook that activates 3D Tilt and Spotlight Radial Glow on all .cyber-frame elements
 * Exactly matching the physics and aesthetics of the reference "КАРТОЧКА" site.
 */
export function useCyberTilt() {
  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia('(hover: none)').matches) {
      return;
    }

    const cleanups: (() => void)[] = [];

    const cards = document.querySelectorAll<HTMLElement>('.cyber-frame');
    cards.forEach((card) => {
      let bounds: DOMRect | null = null;

      const onMouseEnter = () => {
        bounds = card.getBoundingClientRect();
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!bounds) bounds = card.getBoundingClientRect();
        const mouseX = e.clientX - bounds.left;
        const mouseY = e.clientY - bounds.top;

        card.style.setProperty('--mouse-x', `${mouseX}px`);
        card.style.setProperty('--mouse-y', `${mouseY}px`);

        const centerX = bounds.width / 2;
        const centerY = bounds.height / 2;
        const rotateX = ((mouseY - centerY) / centerY) * -4;
        const rotateY = ((mouseX - centerX) / centerX) * 4;

        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-2px)`;
      };

      const onMouseLeave = () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
        card.style.setProperty('--mouse-x', '-500px');
        card.style.setProperty('--mouse-y', '-500px');
        bounds = null;
      };

      card.addEventListener('mouseenter', onMouseEnter);
      card.addEventListener('mousemove', onMouseMove);
      card.addEventListener('mouseleave', onMouseLeave);

      cleanups.push(() => {
        card.removeEventListener('mouseenter', onMouseEnter);
        card.removeEventListener('mousemove', onMouseMove);
        card.removeEventListener('mouseleave', onMouseLeave);
      });
    });

    return () => {
      cleanups.forEach((fn) => fn());
    };
  });
}

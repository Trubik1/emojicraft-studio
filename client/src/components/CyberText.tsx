import React, { useEffect, useState } from 'react';

const GLYPHS = '/\\|<>[]{}#%&*+=01!@?~';

interface Props {
  text: string;
  delay?: number;
  className?: string;
  triggerOnHover?: boolean;
}

export const CyberText: React.FC<Props> = ({
  text,
  delay = 0,
  className = '',
  triggerOnHover = true,
}) => {
  const [displayText, setDisplayText] = useState(text);

  const runScramble = () => {
    const startTime = performance.now();
    const duration = Math.max(500, 350 + text.length * 22);

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const charsSolved = Math.floor(text.length * progress);

      let out = '';
      for (let i = 0; i < text.length; i++) {
        if (text[i] === ' ' || text[i] === '/' || text[i] === '[' || text[i] === ']' || text[i] === '•') {
          out += text[i];
        } else if (i < charsSolved) {
          out += text[i];
        } else if (i < charsSolved + 4) {
          out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        } else {
          out += ' ';
        }
      }

      setDisplayText(out);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setDisplayText(text);
      }
    };

    requestAnimationFrame(tick);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      runScramble();
    }, delay);
    return () => clearTimeout(timer);
  }, [text, delay]);

  return (
    <span
      className={className}
      onMouseEnter={triggerOnHover ? runScramble : undefined}
      data-cipher
    >
      {displayText}
    </span>
  );
};

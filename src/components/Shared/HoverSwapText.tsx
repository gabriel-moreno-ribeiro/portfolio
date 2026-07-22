import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

interface HoverSwapTextProps {
  original: string;
  hovered: string;
  className?: string;
  style?: React.CSSProperties;
}

function HoverSwapText({ original, hovered, className, style }: HoverSwapTextProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <span
      className={className}
      style={{ ...style, position: 'relative', cursor: 'default' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence mode="wait">
        {isHovered ? (
          <motion.span
            key="hovered"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            style={{ fontStyle: 'italic', opacity: 0.8 }}
          >
            {hovered}
          </motion.span>
        ) : (
          <motion.span
            key="original"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
          >
            {original}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export default HoverSwapText;

import { motion } from "motion/react";
import React from "react";

interface MenuIconProps {
  isHovered: boolean;
  setIsHovered: React.Dispatch<React.SetStateAction<boolean>>;
}

const MenuIcon: React.FC<MenuIconProps> = ({ isHovered, setIsHovered }) => {
  return (
    // A button, not a div: the navbar itself is no longer a tab stop, so this is how
    // keyboard visitors open the menu (focusing it expands the pill).
    <motion.button
      type="button"
      className="menu-icon"
      aria-expanded={isHovered}
      aria-label={isHovered ? "Close menu" : "Open menu"}
      layout
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      onClick={() => {
        if (isHovered) {
          setIsHovered(false);
        }
      }}
    >
      <motion.div
        className="line"
        animate={isHovered ? { rotate: 45, y: 0 } : { rotate: 0, y: -4 }}
        transition={{ duration: 0.3 }}
      />
      <motion.div
        className="line"
        animate={isHovered ? { rotate: -45, y: 0 } : { rotate: 0, y: 4 }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
};

export default MenuIcon;

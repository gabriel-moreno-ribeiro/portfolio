import { motion } from "framer-motion";
import React from "react";

interface MenuIconProps {
  isHovered: boolean;
  setIsHovered: React.Dispatch<React.SetStateAction<boolean>>;
}

const MenuIcon: React.FC<MenuIconProps> = ({ isHovered, setIsHovered }) => {
  return (
    <div
      className="menu-icon"
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
    </div>
  );
};

export default MenuIcon;

import { motion } from "framer-motion";
import { useState } from "react";
import MenuIcon from "./MenuIcon";

function Navbar() {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const links = [
    {
      name: "Skills.",
      href: "#skills",
    },
    {
      name: "Work.",
      href: "#work",
    },
    {
      name: "LinkedIn.",
      href: "https://linkedin.com/in/avivashishta",
    },
    {
      name: "Github.",
      href: "https://github.com/AVIVASHISHTA29",
    },
  ];
  return (
    <motion.div
      className="navbar"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{
        width: isHovered ? "700px" : "auto",
      }}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 15,
      }}
    >
      <MenuIcon isHovered={isHovered} setIsHovered={setIsHovered} />
      <h1 className="heading">Avi Vashishta.</h1>
      <motion.div
        className={`links`}
        initial={{ opacity: 0 }}
        animate={{
          opacity: isHovered ? 1 : 0,
          display: isHovered ? "flex" : "none",
        }}
        transition={{ delay: isHovered ? 0.3 : 0, duration: 0.3 }}
      >
        {links.map((link, i) => (
          <a
            href={link.href}
            key={`link-${i}`}
            className={!isHovered ? "hidden" : ""}
          >
            {link.name}
          </a>
        ))}
      </motion.div>
    </motion.div>
  );
}

export default Navbar;

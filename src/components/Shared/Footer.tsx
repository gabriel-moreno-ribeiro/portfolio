import { motion } from "motion/react";
import { useMemo, useState } from "react";
import useIsMobile from "../../hooks/useIsMobile";

function Footer() {
  const isMobile = useIsMobile();
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const links = [
    {
      name: "LinkedIn.",
      href: "https://linkedin.com/in/avivashishta",
    },
    {
      name: "Github.",
      href: "https://github.com/AVIVASHISHTA29",
    },
    {
      name: "Email.",
      href: "mailto:avivashishta29@gmail.com",
    },
  ];
  const expandedWidth = useMemo(
    () => (isMobile ? "300px" : "600px"),
    [isMobile]
  );

  return (
    <motion.div
      className="footer"
      onMouseEnter={!isMobile ? () => setIsHovered(true) : undefined}
      onMouseLeave={!isMobile ? () => setIsHovered(false) : undefined}
      onClick={() => setIsHovered(!isHovered)}
      animate={{
        width: isHovered ? expandedWidth : "auto",
      }}
      transition={
        isHovered
          ? { type: "spring", stiffness: isMobile ? 300 : 180, damping: 12 }
          : { type: "tween", duration: 0.4, ease: "easeInOut" }
      }
    >
      <motion.h1
        className="heading"
        style={{ textAlign: "center" }}
        animate={{
          flexGrow: isHovered ? 0 : 1,
        }}
        transition={
          isHovered
            ? { type: "spring", stiffness: isMobile ? 300 : 180, damping: 12 }
            : { type: "tween", duration: 0.4, ease: "easeInOut" }
        }
      >
        Footer.
      </motion.h1>
      <motion.div
        className="links"
        initial={{ opacity: 0 }}
        animate={{
          opacity: isHovered ? 1 : 0,
          display: isHovered ? "flex" : "none",
        }}
        transition={{ delay: isHovered ? 0.3 : 0, duration: 0.3 }}
      >
        {links.map((link, i) => (
          <p
            onClick={(e) => {
              e.stopPropagation();
              window.open(link.href, "_blank");
            }}
            key={`footer-link-${i}`}
            className={!isHovered ? "hidden" : ""}
          >
            {link.name}
          </p>
        ))}
      </motion.div>
    </motion.div>
  );
}

export default Footer;

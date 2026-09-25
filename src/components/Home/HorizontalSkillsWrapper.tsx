import { useRef } from "react";
import d_icon1 from "../../assets/skills/dark/icon1.webp";
import d_icon2 from "../../assets/skills/dark/icon2.webp";
import d_icon3 from "../../assets/skills/dark/icon3.webp";
import d_icon4 from "../../assets/skills/dark/icon4.webp";
import d_icon5 from "../../assets/skills/dark/icon5.webp";
import d_icon6 from "../../assets/skills/dark/icon6.webp";
import d_icon7 from "../../assets/skills/dark/icon7.webp";
import d_icon8 from "../../assets/skills/dark/icon8.webp";
import d_icon9 from "../../assets/skills/dark/icon9.webp";
import d_icon10 from "../../assets/skills/dark/icon10.webp";
import l_icon1 from "../../assets/skills/light/icon1.webp";
import l_icon2 from "../../assets/skills/light/icon2.webp";
import l_icon3 from "../../assets/skills/light/icon3.webp";
import l_icon4 from "../../assets/skills/light/icon4.webp";
import l_icon5 from "../../assets/skills/light/icon5.webp";
import l_icon6 from "../../assets/skills/light/icon6.webp";
import l_icon7 from "../../assets/skills/light/icon7.webp";
import l_icon8 from "../../assets/skills/light/icon8.webp";
import l_icon9 from "../../assets/skills/light/icon9.webp";
import l_icon10 from "../../assets/skills/light/icon10.webp";
import { useThemeStore } from "../../store/themeStore";
import HorizontalSkills from "./HorizontalSkills";

const lightIcons1 = [
  l_icon1, l_icon2, l_icon3, l_icon4, l_icon5,
  l_icon1, l_icon2, l_icon3, l_icon4, l_icon5,
];
const lightIcons2 = [
  l_icon6, l_icon7, l_icon8, l_icon9, l_icon10,
  l_icon6, l_icon7, l_icon8, l_icon9, l_icon10,
];

const darkIcons1 = [
  d_icon1, d_icon2, d_icon3, d_icon4, d_icon5,
  d_icon1, d_icon2, d_icon3, d_icon4, d_icon5,
];
const darkIcons2 = [
  d_icon6, d_icon7, d_icon8, d_icon9, d_icon10,
  d_icon6, d_icon7, d_icon8, d_icon9, d_icon10,
];

function HorizontalSkillsWrapper() {
  const { darkMode } = useThemeStore();
  const containerRef1 = useRef<HTMLDivElement | null>(null);
  const containerRef2 = useRef<HTMLDivElement | null>(null);

  const icons1 = darkMode ? darkIcons1 : lightIcons1;
  const icons2 = darkMode ? darkIcons2 : lightIcons2;

  return (
    <div className="horizontal-skills-parent">
      <HorizontalSkills icons={icons1} ref={containerRef1} />
      <HorizontalSkills icons={icons2} reverse={true} ref={containerRef2} />
    </div>
  );
}

export default HorizontalSkillsWrapper;

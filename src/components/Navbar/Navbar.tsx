import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { FiVideoOff, FiX } from 'react-icons/fi';
import { IoMoonOutline, IoSunnyOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import useIsMobile from '../../hooks/useIsMobile';
import { useHandsfreeStore } from '../../store/handsfreeStore';
import { useThemeStore } from '../../store/themeStore';
import { scrollToComponent } from '../../utils/scrollToComponent';
import MenuIcon from './MenuIcon';

const supportsCamera =
  typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

function Navbar() {
  const isMobile = useIsMobile();
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const { darkMode, toggleDarkMode } = useThemeStore();
  const {
    isEnabled: cameraEnabled,
    hasSeenIntro,
    setEnabled: setCameraEnabled,
    setShowIntroModal,
    setShowGestureTutorial,
  } = useHandsfreeStore();

  useEffect(() => {
    if (isMobile) {
      document.body.classList.toggle('nav-expanded', isHovered);
    }
    return () => {
      document.body.classList.remove('nav-expanded');
    };
  }, [isHovered, isMobile]);

  const handleCameraClick = () => {
    if (!hasSeenIntro) {
      setShowIntroModal(true);
      return;
    }
    if (cameraEnabled) {
      setCameraEnabled(false);
    } else {
      setCameraEnabled(true);
      setTimeout(() => setShowGestureTutorial(true), 1500);
    }
  };

  const links = [
    {
      name: 'Library.',
      href: '/library',
    },
    {
      name: 'Contact.',
      href: '/#contact',
    },
    {
      name: 'LinkedIn.',
      href: 'https://linkedin.com/in/gabriel-moreno-ribeiro',
    },
    {
      name: 'Github.',
      href: 'https://github.com/gabriel-moreno-ribeiro',
    },
  ];
  const collapsedWidth = isMobile ? '175px' : 'auto';
  const expandedWidth = isMobile ? 'calc(100vw - 32px)' : '700px';

  const navigate = useNavigate();

  const handleLinkClick = (link: { href: string; top?: number }) => {
    if (link.href.includes('#')) {
      const id = link.href.split('#')[1];
      if (document.getElementById(id)) {
        scrollToComponent(id, link.top);
      } else {
        navigate(link.href);
      }
    } else if (link.href.startsWith('/')) {
      navigate(link.href);
    } else {
      window.open(link.href, '_blank');
    }
  };

  return (
    <motion.div
      className="navbar"
      onMouseEnter={!isMobile ? () => setIsHovered(true) : undefined}
      onMouseLeave={!isMobile ? () => setIsHovered(false) : undefined}
      onClick={() => setIsHovered(!isHovered)}
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        width: isHovered ? expandedWidth : collapsedWidth,
      }}
      transition={{
        opacity: { delay: 0.5, duration: 0.6, ease: 'easeOut' },
        width: isMobile
          ? { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }
          : { type: 'spring', stiffness: 100, damping: 15 },
      }}
      style={{
        justifyContent: isHovered ? 'flex-start' : 'center',
      }}
    >
      <MenuIcon isHovered={isHovered} setIsHovered={setIsHovered} />
      {isMobile ? (
        <p
          className="heading"
          aria-hidden="true"
          style={{ visibility: isHovered ? 'hidden' : 'visible' }}
        >
          Gabriel Moreno Ribeiro.
        </p>
      ) : (
        <motion.p
          className="heading"
          aria-hidden="true"
          layout
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        >
          Gabriel Moreno Ribeiro.
        </motion.p>
      )}
      <motion.div
        className="links"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{
          delay: isHovered ? 0.15 : 0,
          duration: 0.2,
        }}
        style={{ pointerEvents: isHovered ? 'auto' : 'none' }}
      >
        {links.map((link, i) => (
          <p
            onClick={() => handleLinkClick(link)}
            key={`link-${i}`}
          >
            {link.name}
          </p>
        ))}
      </motion.div>
      {isMobile && (
        <motion.div
          className="navbar-toggles"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{
            delay: isHovered ? 0.15 : 0,
            duration: 0.2,
          }}
          style={{ pointerEvents: isHovered ? 'auto' : 'none' }}
        >
          {supportsCamera && (
            <button
              className={`navbar-toggle-btn ${cameraEnabled ? 'active' : ''}`}
              onClick={e => {
                e.stopPropagation();
                handleCameraClick();
              }}
              title={cameraEnabled ? 'Disable camera' : 'Enable camera'}
            >
              {cameraEnabled ? <FiX /> : <FiVideoOff />}
            </button>
          )}
          <button
            className="navbar-toggle-btn"
            onClick={e => {
              e.stopPropagation();
              toggleDarkMode();
            }}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <IoSunnyOutline /> : <IoMoonOutline />}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

export default Navbar;

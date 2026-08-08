import { useRef, useEffect, useMemo } from 'react';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import './StickerPeel.css';

gsap.registerPlugin(Draggable);

const StickerPeel = ({
  imageSrc,
  rotate = 15,
  peelBackHoverPct = 22,
  peelBackActivePct = 35,
  peelEasing = 'power3.out',
  peelHoverEasing = 'power2.out',
  width = 160,
  shadowIntensity = 0.5,
  lightingIntensity = 0.08,
  initialPosition = 'center',
  peelDirection = 0,
  className = ''
}) => {
  const containerRef = useRef(null);
  const dragTargetRef = useRef(null);
  const pointLightRef = useRef(null);
  const pointLightFlippedRef = useRef(null);
  const draggableInstanceRef = useRef(null);

  useEffect(() => {
    const target = dragTargetRef.current;
    if (!target || initialPosition === 'center') return;
    if (typeof initialPosition === 'object') {
      gsap.set(target, { x: initialPosition.x || 0, y: initialPosition.y || 0 });
    }
  }, [initialPosition]);

  useEffect(() => {
    const target = dragTargetRef.current;
    const boundsEl = target?.parentNode;
    if (!target || !boundsEl) return;

    draggableInstanceRef.current = Draggable.create(target, {
      type: 'x,y',
      bounds: boundsEl,
      inertia: true,
      onDrag() {
        const rot = gsap.utils.clamp(-20, 20, this.deltaX * 0.35);
        gsap.to(target, { rotation: rot, duration: 0.15, ease: 'power1.out' });
      },
      onDragEnd() {
        gsap.to(target, { rotation: 0, duration: 0.8, ease: 'power2.out' });
      }
    })[0];

    return () => {
      draggableInstanceRef.current?.kill();
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const updateLight = e => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      gsap.set(pointLightRef.current, { attr: { x, y } });
      const normalizedAngle = Math.abs(peelDirection % 360);
      if (normalizedAngle !== 180) {
        gsap.set(pointLightFlippedRef.current, { attr: { x, y: rect.height - y } });
      } else {
        gsap.set(pointLightFlippedRef.current, { attr: { x: -1000, y: -1000 } });
      }
    };
    container.addEventListener('mousemove', updateLight);
    return () => container.removeEventListener('mousemove', updateLight);
  }, [peelDirection]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onTouchStart = () => container.classList.add('touch-active');
    const onTouchEnd = () => container.classList.remove('touch-active');
    container.addEventListener('touchstart', onTouchStart);
    container.addEventListener('touchend', onTouchEnd);
    container.addEventListener('touchcancel', onTouchEnd);
    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  const cssVars = useMemo(() => ({
    '--sticker-rotate': `${rotate}deg`,
    '--sticker-p': '10px',
    '--sticker-peelback-hover': `${peelBackHoverPct}%`,
    '--sticker-peelback-active': `${peelBackActivePct}%`,
    '--sticker-peel-easing': peelEasing,
    '--sticker-peel-hover-easing': peelHoverEasing,
    '--sticker-width': `${width}px`,
    '--sticker-shadow-opacity': shadowIntensity,
    '--sticker-lighting-constant': lightingIntensity,
    '--peel-direction': `${peelDirection}deg`
  }), [rotate, peelBackHoverPct, peelBackActivePct, peelEasing, peelHoverEasing, width, shadowIntensity, lightingIntensity, peelDirection]);

  return (
    <div className={`draggable ${className}`} ref={dragTargetRef} style={cssVars}>
      <svg width="0" height="0">
        <defs>
          <filter id="pointLight">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feSpecularLighting result="spec" in="blur" specularExponent="100" specularConstant={lightingIntensity} lightingColor="white">
              <fePointLight ref={pointLightRef} x="100" y="100" z="300" />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceGraphic" result="lit" />
            <feComposite in="lit" in2="SourceAlpha" operator="in" />
          </filter>
          <filter id="pointLightFlipped">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feSpecularLighting result="spec" in="blur" specularExponent="100" specularConstant={lightingIntensity * 7} lightingColor="white">
              <fePointLight ref={pointLightFlippedRef} x="100" y="100" z="300" />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceGraphic" result="lit" />
            <feComposite in="lit" in2="SourceAlpha" operator="in" />
          </filter>
          <filter id="dropShadow">
            <feDropShadow dx="2" dy="4" stdDeviation={3 * shadowIntensity} floodColor="black" floodOpacity={shadowIntensity} />
          </filter>
          <filter id="expandAndFill">
            <feOffset dx="0" dy="0" in="SourceAlpha" result="shape" />
            <feFlood floodColor="rgb(179,179,179)" result="flood" />
            <feComposite operator="in" in="flood" in2="shape" />
          </filter>
        </defs>
      </svg>
      <div className="sticker-container" ref={containerRef}>
        <div className="sticker-main">
          <div className="sticker-lighting">
            <img src={imageSrc} alt="HIBEEX sticker" className="sticker-image" draggable="false" onContextMenu={e => e.preventDefault()} />
          </div>
        </div>
        <div className="flap">
          <div className="flap-lighting">
            <img src={imageSrc} alt="" className="flap-image" draggable="false" onContextMenu={e => e.preventDefault()} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickerPeel;

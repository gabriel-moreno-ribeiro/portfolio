// A silent video that plays only while it's on screen (and the tab is visible),
// shows its poster until then, and loads nothing before it's needed. With
// reduced motion it never starts on its own: the poster and controls stay.
import { useEffect, useRef } from 'react';
import { usePageVisible, useReducedMotion } from '../../lib/motion';

interface Props {
  src: string;
  poster: string;
  className?: string;
  label?: string;
  loop?: boolean;
  controls?: boolean;
  onEnded?: () => void;
}

export default function AutoVideo({ src, poster, className, label, loop = true, controls = false, onEnded }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  const pageVisible = usePageVisible();

  useEffect(() => {
    const video = ref.current;
    if (!video || reduced) return;
    let onScreen = false;
    const sync = () => {
      if (onScreen && pageVisible) video.play().catch(() => {});
      else video.pause();
    };
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); }, { threshold: 0.25 });
    io.observe(video);
    return () => { io.disconnect(); video.pause(); };
  }, [src, reduced, pageVisible]);

  return (
    <video
      ref={ref}
      key={src}
      className={className}
      src={src}
      poster={poster}
      muted
      playsInline
      loop={loop}
      preload="none"
      controls={controls || reduced}
      onEnded={onEnded}
      aria-label={label}
      width={1280}
      height={720}
    />
  );
}

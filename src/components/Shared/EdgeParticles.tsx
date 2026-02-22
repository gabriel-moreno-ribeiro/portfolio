import React, { useEffect, useRef } from "react";
import {
  useWindowSyncStore,
  type PeerInfo,
} from "../../store/windowSyncStore";

// --- Particle system ---

interface Particle {
  edgeX: number; // position along the edge (0..1 normalized)
  offset: number; // perpendicular offset from edge (px)
  speed: number; // drift speed along edge (normalized/frame)
  wobblePhase: number;
  wobbleAmp: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
}

type Edge = "left" | "right" | "top" | "bottom";

const MAX_PARTICLES_PER_EDGE = 30;
const PARTICLE_COLOR = [240, 115, 45]; // $primary-orange
const BASE_SPEED = 0.001;
const ACTIVE_SPEED_MULT = 3;
const EDGE_DEPTH = 40; // how far from edge particles can wander (px)

function createParticle(active: boolean): Particle {
  const speedMult = active ? ACTIVE_SPEED_MULT : 1;
  return {
    edgeX: Math.random(),
    offset: Math.random() * EDGE_DEPTH,
    speed: (BASE_SPEED + Math.random() * BASE_SPEED) * speedMult,
    wobblePhase: Math.random() * Math.PI * 2,
    wobbleAmp: 2 + Math.random() * 6,
    size: 2 + Math.random() * 3,
    opacity: 0.3 + Math.random() * 0.5,
    life: 0,
    maxLife: 120 + Math.floor(Math.random() * 180),
  };
}

function determineEdges(
  peers: Map<string, PeerInfo>
): Set<Edge> {
  const edges = new Set<Edge>();
  const myX = window.screenX;
  const myY = window.screenY;
  const myW = window.innerWidth;
  const myH = window.innerHeight;
  const myCX = myX + myW / 2;
  const myCY = myY + myH / 2;

  for (const [, peer] of peers) {
    const peerCX = peer.screenX + peer.innerWidth / 2;
    const peerCY = peer.screenY + peer.innerHeight / 2;
    const dx = peerCX - myCX;
    const dy = peerCY - myCY;

    if (Math.abs(dx) > Math.abs(dy)) {
      edges.add(dx > 0 ? "right" : "left");
    } else {
      edges.add(dy > 0 ? "bottom" : "top");
    }
  }

  return edges;
}

function drawParticle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  opacity: number,
  dpr: number
) {
  const r = size * dpr;
  const [pr, pg, pb] = PARTICLE_COLOR;

  // Glow
  ctx.shadowColor = `rgba(${pr}, ${pg}, ${pb}, ${opacity * 0.6})`;
  ctx.shadowBlur = 12 * dpr;

  // Core dot
  ctx.beginPath();
  ctx.arc(x * dpr, y * dpr, r, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${pr}, ${pg}, ${pb}, ${opacity})`;
  ctx.fill();

  // Reset shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
}

function getParticlePosition(
  particle: Particle,
  edge: Edge,
  w: number,
  h: number,
  timestamp: number
): { x: number; y: number } {
  const wobble =
    Math.sin(timestamp * 0.002 + particle.wobblePhase) * particle.wobbleAmp;

  switch (edge) {
    case "left":
      return {
        x: particle.offset + wobble,
        y: particle.edgeX * h,
      };
    case "right":
      return {
        x: w - particle.offset + wobble,
        y: particle.edgeX * h,
      };
    case "top":
      return {
        x: particle.edgeX * w,
        y: particle.offset + wobble,
      };
    case "bottom":
      return {
        x: particle.edgeX * w,
        y: h - particle.offset + wobble,
      };
  }
}

// --- Component ---

const EdgeParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlePoolRef = useRef<Map<Edge, Particle[]>>(new Map());

  const hasPeers = useWindowSyncStore((s) => s.connectedPeers.size > 0);

  useEffect(() => {
    if (!hasPeers) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pool = particlePoolRef.current;
    let rafId: number;

    const loop = (timestamp: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const syncState = useWindowSyncStore.getState();
      const edges = determineEdges(syncState.connectedPeers);
      const isActive = syncState.activePeerId !== null;

      // Target particle count per edge
      const targetCount = isActive
        ? MAX_PARTICLES_PER_EDGE
        : Math.round(MAX_PARTICLES_PER_EDGE * 0.4);

      // Ensure particles exist for active edges, remove for inactive
      for (const edge of ["left", "right", "top", "bottom"] as Edge[]) {
        if (edges.has(edge)) {
          let particles = pool.get(edge);
          if (!particles) {
            particles = [];
            pool.set(edge, particles);
          }
          // Spawn new particles up to target
          while (particles.length < targetCount) {
            particles.push(createParticle(isActive));
          }
        } else {
          pool.delete(edge);
        }
      }

      // Clear
      ctx.clearRect(0, 0, w * dpr, h * dpr);

      // Update and draw
      for (const [edge, particles] of pool) {
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];

          // Update position
          p.edgeX += p.speed;
          if (p.edgeX > 1) p.edgeX -= 1;

          // Update life
          p.life++;

          // Fade in/out
          const lifeRatio = p.life / p.maxLife;
          let fadeOpacity = p.opacity;
          if (lifeRatio < 0.1) {
            fadeOpacity *= lifeRatio / 0.1;
          } else if (lifeRatio > 0.8) {
            fadeOpacity *= (1 - lifeRatio) / 0.2;
          }

          // Remove dead particles
          if (p.life >= p.maxLife) {
            particles[i] = createParticle(isActive);
            continue;
          }

          // Trim excess particles (for when going from active → idle)
          if (i >= targetCount && p.life >= p.maxLife * 0.8) {
            particles.splice(i, 1);
            continue;
          }

          const pos = getParticlePosition(p, edge, w, h, timestamp);
          drawParticle(ctx, pos.x, pos.y, p.size, fadeOpacity, dpr);
        }
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [hasPeers]);

  if (!hasPeers) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 10000,
      }}
    />
  );
};

export default EdgeParticles;

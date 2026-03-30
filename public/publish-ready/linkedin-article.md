# LINKEDIN ARTICLE — Copy, paste, publish as-is
# Post as a LinkedIn Article (not a feed post) — minimum 500 words for AI citation
# Title: "I Built a Portfolio You Control With Your Hands. Here's How (and Why)."

---

I built a developer portfolio that you can navigate entirely using hand gestures and head movement — no mouse, no keyboard, no touch.

It's live at **avivashishta.com**. Allow camera access and move your hand in front of your webcam. The cursor follows your palm. Pinch to click. Tilt your head to scroll.

Here's why I built it, how it works technically, and what I learned.

---

## Why This Exists

After two years shipping AI products at AccioJob (YC 2021) — where I also taught MERN Stack to 90,000+ students — and then a stint as Founding Engineer at Turgon AI where my team shipped three AI products in 9 months, I needed a portfolio that *showed* what I could build, not just listed it.

Most developer portfolios are identical: hero section, skills, project cards, contact form. They're fine. They're also forgettable.

I wanted mine to be a demonstration. If someone asks "what kind of developer is Avi?" I'd rather they experience the answer than read it.

The constraint I set: the entire site must be navigable without mouse or keyboard.

---

## The Technical Stack

- **MediaPipe** — Google's computer vision library, running entirely in the browser via WebAssembly. No server. No frames sent over the network. ~30fps hand landmark detection.
- **Three.js + React Three Fiber** — 3D robot model and particle effects on the hero section
- **React 19 + TypeScript** — the underlying SPA, bundled with Vite
- **GSAP ScrollTrigger** — scroll-driven animations tied to the user's gesture-based scroll position
- **Vercel** — deployment

---

## The Hard Part: Smoothing

Raw MediaPipe output at 30fps is jittery. A finger moving 2cm registers as 40px of cursor jump. Without smoothing, the cursor feels like it's having a seizure.

The fix: exponential moving average on landmark coordinates. A smoothing factor of 0.7 (70% previous position, 30% new) keeps the cursor fluid without feeling laggy.

Getting that number right took more iteration than building the entire gesture layer.

---

## What "Running in the Browser" Actually Means for Performance

MediaPipe's hand detection model is ~8MB of WebAssembly. Combined with Three.js rendering a 3D scene, you're asking a lot of the main thread.

The optimizations that kept it at 60fps:
1. MediaPipe input capped at 640×480 — more than enough for landmark detection
2. 3D canvas components lazy-loaded with React Suspense
3. On mobile, gesture tracking disabled entirely — MediaPipe is CPU-heavy and mobile cameras are high-latency
4. Frame skipping on devices with fewer than 4 CPU cores (detected via `navigator.hardwareConcurrency`)

---

## The Interactive Terminal (Ctrl+J)

Beyond gestures, the portfolio has a custom terminal with 27 commands. Type `chat` to start an AI conversation powered by GPT-4o. Type `projects`, `experience`, `skills`, or `theme` for the standard stuff.

The terminal state is managed with Zustand, synchronized with a window manager that lets you drag panels around the screen like a desktop OS.

---

## What I learned

Three things surprised me:

**1. Computer vision in the browser is production-ready.** Two years ago I'd have said this required a backend. Today, WebAssembly + WebGL makes MediaPipe fast enough for real-time tracking on a laptop.

**2. Smoothing is an underrated craft.** A lot of "AI/ML" work feels like magic until you realize 40% of the work is making the output feel natural. Gesture tracking is the same — the model is the easy part.

**3. Constraints breed creativity.** "Navigate without mouse/keyboard" sounds like an annoying constraint. It turned out to be the creative engine behind the whole thing.

---

## Try it

Live at **avivashishta.com** — allow camera access on Chrome or Edge, desktop or laptop.

The LLM context file is at **avivashishta.com/llms.txt** if you want the machine-readable version.

I'm currently building AI features at Dock.us (YC 2021). If you're working on something interesting in AI or React, I'm always up for a conversation.

— Avi

---

# POSTING INSTRUCTIONS:
# 1. Go to linkedin.com → Write article (not a post)
# 2. Paste this content exactly
# 3. Add 3-5 tags: #React #MediaPipe #ThreeJS #WebDevelopment #AI
# 4. Publish — do NOT share as draft
# 5. Then share the article link as a regular LinkedIn feed post

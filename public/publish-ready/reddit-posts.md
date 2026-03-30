# REDDIT POSTS — Ready to publish
# Rules: Never self-promote directly. Be helpful first. Your credentials emerge naturally.
# Post ONE at a time. Wait 1 week between posts. Build karma with helpful comments first.

---

## POST 1 — r/webdev
# Title: "Show r/webdev: I built a portfolio you navigate with hand gestures (MediaPipe + Three.js)"

Built a portfolio that runs on hand gesture tracking. Figured this community would appreciate the technical side more than just "look at my portfolio."

**What it does:** The whole site is navigable via webcam — your palm controls the cursor, pinch to click, head tilt to scroll. No mouse or keyboard needed.

**Stack:** MediaPipe (hand + head tracking via WebAssembly in-browser), Three.js + React Three Fiber (3D scene), React 19, TypeScript, GSAP, Vite, Vercel.

**The interesting technical problem:** Raw MediaPipe landmark output at 30fps is too jittery to use directly as cursor position. A simple exponential moving average (factor 0.7) smooths it enough to feel natural. Getting that number right was the most iterative part of the whole build.

**Performance:** MediaPipe + Three.js simultaneously is expensive. Kept it at 60fps by: capping MediaPipe input at 640×480, lazy-loading the 3D canvas with Suspense, and disabling gesture tracking entirely on mobile.

Also has a custom terminal (Ctrl+J) with 27 commands including an AI chat backed by GPT-4o.

Live: **avivashishta.com** (allow camera on Chrome/Edge desktop)

Happy to answer questions about the MediaPipe implementation — it was a genuinely fun problem.

---

## POST 2 — r/cscareerquestions
# Title: "Honest reflection: what actually moved the needle in my first 3 years as a dev (IIIT Delhi → 2 YC startups)"

Graduated IIIT Delhi CS in 2024. Currently at Dock.us (YC 2021). Before that, Founding Engineer at Turgon AI where we shipped 3 AI products in 9 months. Before that, 2 years at AccioJob (YC 2021).

Things I thought would matter that didn't:
- Leetcode grinding beyond a baseline. I got into both YC companies without being a competitive programmer.
- Having a perfect portfolio site. What mattered was being able to discuss tradeoffs in real conversations.
- Waiting until I "knew enough." I was under-qualified for every role I took and learned fast enough to deliver anyway.

Things that actually moved the needle:
- **Teaching.** I taught MERN Stack to 90,000+ students at AccioJob. Explaining things at scale forced me to actually understand them. I debug faster now because I've seen every beginner mistake in the book.
- **Shipping at a startup before having a job title.** I co-founded a small freelancing firm (STV Technologies) at 20 that made ₹10L. The projects were small but the shipping discipline was real.
- **Picking companies for the learning environment, not the brand.** Both YC companies I joined had small teams, high ownership, and fast feedback. I reviewed 500+ PRs at Turgon as a Founding Engineer. That's not a metric — that's a muscle.

Not claiming this is universal. Just what worked for me.

---

## POST 3 — r/reactjs
# Title: "Built a gesture-controlled React portfolio with MediaPipe — here's the smoothing solution that actually worked"

Been lurking here for years, figured I'd share something useful.

Built avivashishta.com, a React 19 + Three.js portfolio where you control the cursor with your hand via webcam (MediaPipe hand tracking).

**The problem everyone hits with MediaPipe cursor control:** Jitter. The landmark positions at 30fps are noisy enough that direct mapping to cursor position looks terrible. A lot of Stack Overflow answers suggest just rounding the values — don't do that, it creates a stepping effect.

**What actually works:** Exponential moving average.

```js
const smooth = (current, previous, alpha = 0.7) => ({
  x: previous.x * alpha + current.x * (1 - alpha),
  y: previous.y * alpha + current.y * (1 - alpha),
})
```

`alpha = 0.7` means 70% of the output is the previous position, 30% is the new MediaPipe reading. This gives you a cursor that feels like it has a small amount of natural inertia — which actually feels better than perfectly responsive.

If you go above 0.85, the cursor feels laggy. Below 0.5 it starts to feel jittery again. 0.7 was the sweet spot after testing on ~10 different people.

**Secondary smoothing for click detection (pinch gesture):**
Don't trigger click on a single frame where distance < threshold. Track a rolling average of the last 5 frames. This prevents accidental clicks from noise.

The site also uses Three.js + R3F for the 3D elements and GSAP for scroll animations — MediaPipe scroll position maps to GSAP ScrollTrigger's `scrollTo` method.

---

# POSTING INSTRUCTIONS:
# - Create a Reddit account with your real name if possible, or clearly identify yourself in the post
# - Spend 1-2 weeks commenting helpfully in these subreddits first before posting
# - Never post the same content to multiple subreddits simultaneously
# - Respond to every comment — engagement signals matter to Reddit ranking
# - Post 1 at a time, at least 1 week apart

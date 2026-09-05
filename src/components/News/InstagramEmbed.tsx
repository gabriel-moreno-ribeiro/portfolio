import { useEffect, useRef } from "react";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

let embedScript: Promise<void> | null = null;

// Instagram's official embed: a blockquote that embed.js upgrades into the post preview.
function loadEmbedScript() {
  if (window.instgrm) return Promise.resolve();
  if (!embedScript) {
    embedScript = new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = "https://www.instagram.com/embed.js";
      s.async = true;
      s.onload = () => resolve();
      document.body.appendChild(s);
    });
  }
  return embedScript;
}

export default function InstagramEmbed({ url, caption }: { url: string; caption?: string }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadEmbedScript().then(() => {
      if (!cancelled) window.instgrm?.Embeds.process();
    });
    return () => { cancelled = true; };
  }, [url]);

  // embed.js swaps the blockquote for an iframe with no title; give it an accessible name.
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const name = () => host.querySelectorAll("iframe:not([title])").forEach((f) => f.setAttribute("title", "Instagram post"));
    name();
    const mo = new MutationObserver(name);
    mo.observe(host, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  return (
    <figure className="news__ig" ref={ref}>
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={url}
        data-instgrm-version="14"
        style={{ margin: 0, width: "100%", minWidth: 0, border: 0, background: "transparent" }}
      >
        <a href={url} target="_blank" rel="noreferrer">View this post on Instagram</a>
      </blockquote>
      {caption && <figcaption className="news__ig-caption">{caption}</figcaption>}
    </figure>
  );
}

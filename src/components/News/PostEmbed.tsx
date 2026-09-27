import { useRef } from "react";
import { useVisible } from "../../lib/motion";
import InstagramEmbed from "./InstagramEmbed";

// Fallback only: /news shows a saved photo for every post listed in news-media.json and
// renders this embed just for a post that has none.
// Reserved box for one Instagram post. The embed (script, iframe) only mounts once the
// box comes within 300px of the viewport; until then, and if embed.js is blocked, the
// box shows a plain link to the post. The height lives in CSS (.news__media in
// news.scss: 600px, 520px under 800px wide) and is fixed so nothing shifts when the
// iframe arrives at 550 to 900px; posts taller than the box scroll inside it.
export default function PostEmbed({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const near = useVisible(ref, { rootMargin: "300px", once: true });

  return (
    <div className="news__media" ref={ref}>
      {near ? (
        <InstagramEmbed url={url} />
      ) : (
        <a className="news__media-link" href={url} target="_blank" rel="noreferrer">Open on Instagram</a>
      )}
    </div>
  );
}

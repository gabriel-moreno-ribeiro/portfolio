// Content for /news. Edit this file to add items; no code changes needed.

export interface PressItem {
  title: string;
  outlet: string;      // publication or organization
  date: string;        // shown as-is, e.g. "Mar 2026"
  url: string;
  excerpt?: string;
}

export interface InstagramItem {
  /** Public post or reel URL, e.g. "https://www.instagram.com/p/ABC123xyz/" */
  url: string;
  /** Optional short line shown under the embed */
  caption?: string;
}

// Newest first.
export const press: PressItem[] = [
  {
    title: "HIBEEX selected for the Canastra Ventures AI Residency",
    outlet: "Canastra Ventures",
    date: "2026",
    url: "https://www.hibeex.com.br/",
    excerpt:
      "One of 6 startups in the R1'26 cohort. Backoffice AI for small and medium businesses: raw data in, decisions out.",
  },
];

// Paste Instagram post/reel links here. Each renders as a live preview of the post.
export const instagram: InstagramItem[] = [
  // { url: "https://www.instagram.com/p/XXXXXXXXXXX/", caption: "Canastra Ventures demo day" },
];

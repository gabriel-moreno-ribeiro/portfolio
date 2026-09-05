// Content for /story. Write the statement in story.md (Markdown: ## headings,
// paragraphs, > quotes, **bold**, *italic*, [links](url), --- for a divider).
import body from "./story.md?raw";

export const story = {
  eyebrow: "Personal statement",
  title: "My Story.",
  subtitle: "Where I come from, what I've built, and why I chose to build before studying.",
  // Drop the file in public/story/ and set the path here to show a download button, e.g. "/story/personal-statement.pdf"
  pdf: "",
  body,
};

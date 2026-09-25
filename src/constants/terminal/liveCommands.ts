// Commands added on top of the built-in set through the registry API (CONTRACTS.md §5).
// Importing this module registers them; `src/components/Terminal/Terminal.tsx` does that.
//
// The terminal runs outside React: it reads everything through the synchronous `getSnapshot()`
// (no fetch, no hooks). Live values may be null when nothing has been loaded yet.
import { projects } from "../../content/projects";
import { formatRelative, getSnapshot, type NumberStat } from "../../lib/data";
import { useThemeStore } from "../../store/themeStore";
import { registerCommands, type TerminalCommand } from "./commands";
import { contact } from "./portfolioData";

const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[1;33m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[90m${s}\x1b[0m`;

const PANEL_HINT = "live data: open the By the Numbers panel.";

function formatStat(stat: NumberStat): string {
  const value = stat.value.toLocaleString("en-US", {
    minimumFractionDigits: stat.decimals ?? 0,
    maximumFractionDigits: stat.decimals ?? 0,
    useGrouping: stat.grouping ?? true,
  });
  return `${stat.prefix ?? ""}${value}${stat.suffix ?? ""}`;
}

const liveCommands: TerminalCommand[] = [
  {
    name: "now",
    category: "Live",
    description: "What Gabriel is doing right now",
    execute: (ctx) => {
      const { local, clock } = getSnapshot();
      ctx.writeln(yellow(`building ${local.now.building}`));
      if (local.now.reading) {
        ctx.writeln(`reading ${local.now.reading.title} · ${local.now.reading.author}`);
      }
      ctx.writeln(`${clock.hhmm} in ${local.config.location.city}`);
    },
  },
  {
    name: "stats",
    category: "Live",
    description: "The numbers behind the work",
    execute: (ctx) => {
      const { local, github } = getSnapshot();
      ctx.writeln(yellow("By the Numbers"));
      for (const stat of local.numbers) {
        const value = formatStat(stat).padEnd(8);
        const sub = stat.sub ? dim(`  ${stat.sub.replace(/\*\*/g, "")}`) : "";
        ctx.writeln(`  ${green(value)} ${stat.label}${sub}`);
      }
      ctx.writeln("");
      if (github) {
        const commit = github.lastCommit ? ` · last commit ${formatRelative(github.lastCommit.at)}` : "";
        ctx.writeln(dim(`live: ${github.publicRepos} repos${commit}`));
      } else {
        ctx.writeln(dim(PANEL_HINT));
      }
    },
  },
  {
    name: "projects",
    category: "Portfolio",
    description: "List projects (open <slug> to read one)",
    execute: (ctx) => {
      ctx.writeln(yellow(`Projects (${projects.length})`));
      for (const project of projects) {
        ctx.writeln(`  ${green(project.slug.padEnd(10))} ${project.title} — ${project.eyebrow}`);
      }
      ctx.writeln("");
      ctx.writeln(`Type ${green("open <slug>")} to go to a project page.`);
    },
  },
  {
    name: "open",
    category: "Portfolio",
    description: "Open a project page: open <slug>",
    execute: (ctx) => {
      const slug = (ctx.args[0] || "").toLowerCase();
      const project = projects.find((p) => p.slug === slug);
      if (!project) {
        if (slug) ctx.writeln(red(`open: ${slug}: no such project`));
        ctx.writeln(`Available: ${projects.map((p) => green(p.slug)).join(", ")}`);
        return;
      }
      ctx.writeln(`Opening ${project.title}…`);
      window.location.assign(`/work/${project.slug}`);
    },
  },
  {
    name: "contact",
    category: "Portfolio",
    description: "How to reach Gabriel",
    execute: (ctx) => {
      ctx.writeln(yellow("Contact"));
      ctx.writeln(`  Email:    ${green(contact.email)}`);
      ctx.writeln(`  LinkedIn: ${contact.linkedin}`);
      ctx.writeln(`  GitHub:   ${contact.github}`);
      ctx.writeln(`  Call:     ${green("https://cal.com/gabrielmribeiro")}`);
      ctx.writeln("");
      const { local, clock } = getSnapshot();
      ctx.writeln(dim(`It is ${clock.hhmm} in ${local.config.location.city}. Replies usually take a day.`));
    },
  },
  {
    name: "theme",
    category: "Fun",
    description: "Switch theme: theme dark | light | toggle",
    execute: (ctx) => {
      const wanted = (ctx.args[0] || "toggle").toLowerCase();
      const { darkMode, toggleDarkMode } = useThemeStore.getState();
      if (wanted === "dark" || wanted === "light") {
        if ((wanted === "dark") !== darkMode) toggleDarkMode();
      } else if (wanted === "toggle") {
        toggleDarkMode();
      } else {
        ctx.writeln(red(`theme: ${wanted}: use dark, light or toggle`));
        return;
      }
      ctx.writeln(yellow(`Theme: ${useThemeStore.getState().darkMode ? "dark" : "light"}.`));
    },
  },
  {
    name: "sound",
    category: "Fun",
    description: "Sound settings",
    execute: (ctx) => {
      ctx.writeln("no sound system on this site yet.");
    },
  },
  {
    name: "whoami",
    category: "Portfolio",
    description: "Who are you?",
    execute: (ctx) => {
      ctx.writeln("visitor@gabriel-portfolio");
      ctx.writeln("");
      ctx.writeln("A visitor, poking around Gabriel Moreno Ribeiro's terminal.");
      ctx.writeln(`He is building ${yellow(getSnapshot().local.now.building)} right now.`);
      ctx.writeln(`Type ${green('"help"')} to see what you can do here.`);
    },
  },
];

registerCommands(liveCommands);

export { liveCommands };

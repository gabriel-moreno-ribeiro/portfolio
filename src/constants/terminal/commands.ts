import { OutputLine } from "../../store/terminalStore";
import {
  DirectoryNode,
  FileSystemNode,
  buildFileSystem,
  resolvePath,
  resolvePathToNode,
} from "./fileSystem";
import { bio, contact, education, experience, skills } from "./portfolioData";
import { cowsayTemplate, nameAscii, neofetchArt } from "./asciiArt";
import { fortunes } from "./fortunes";

export interface CommandContext {
  args: string[];
  flags: Record<string, string | boolean>;
  currentDirectory: string;
  setDirectory: (dir: string) => void;
  addOutput: (lines: Omit<OutputLine, "id">[]) => void;
  clearOutput: () => void;
  toggleTheme: () => void;
  setMatrixActive: (active: boolean) => void;
  setAiLoading: (loading: boolean) => void;
  fileSystem: DirectoryNode;
  rawInput: string;
}

interface CommandDefinition {
  name: string;
  description: string;
  execute: (ctx: CommandContext) => void | Promise<void>;
}

const out = (content: string): Omit<OutputLine, "id"> => ({
  type: "output",
  content,
});
const err = (content: string): Omit<OutputLine, "id"> => ({
  type: "error",
  content,
});
const sys = (content: string): Omit<OutputLine, "id"> => ({
  type: "system",
  content,
});

function treeNode(
  node: FileSystemNode,
  prefix: string,
  isLast: boolean
): string[] {
  const connector = isLast ? "└── " : "├── ";
  const lines: string[] = [`${prefix}${connector}${node.name}${node.type === "directory" ? "/" : ""}`];
  if (node.type === "directory") {
    const entries = Object.values(node.children);
    entries.forEach((child, i) => {
      const childPrefix = prefix + (isLast ? "    " : "│   ");
      lines.push(...treeNode(child, childPrefix, i === entries.length - 1));
    });
  }
  return lines;
}

const commands: CommandDefinition[] = [
  // === UTILITY ===
  {
    name: "help",
    description: "Show available commands",
    execute: (ctx) => {
      const grouped: Record<string, CommandDefinition[]> = {
        "Portfolio": [],
        "File System": [],
        "Fun": [],
        "Utility": [],
        "AI": [],
      };
      const categoryMap: Record<string, string> = {
        about: "Portfolio", skills: "Portfolio", experience: "Portfolio",
        projects: "Portfolio", contact: "Portfolio", resume: "Portfolio",
        education: "Portfolio", socials: "Portfolio", whoami: "Portfolio",
        ls: "File System", cd: "File System", cat: "File System",
        pwd: "File System", tree: "File System",
        neofetch: "Fun", sudo: "Fun", matrix: "Fun", cowsay: "Fun",
        fortune: "Fun", theme: "Fun", ascii: "Fun",
        help: "Utility", clear: "Utility", history: "Utility",
        ai: "AI", chat: "AI",
      };
      for (const cmd of commands) {
        const cat = categoryMap[cmd.name] || "Utility";
        grouped[cat]?.push(cmd);
      }
      const lines: Omit<OutputLine, "id">[] = [sys("Available Commands:")];
      for (const [category, cmds] of Object.entries(grouped)) {
        if (cmds.length === 0) continue;
        lines.push(out(""));
        lines.push(sys(`  ${category}:`));
        for (const cmd of cmds) {
          lines.push(out(`    ${cmd.name.padEnd(14)} ${cmd.description}`));
        }
      }
      lines.push(out(""));
      lines.push(sys('Type "ai <message>" to chat with an AI that knows about Avi.'));
      ctx.addOutput(lines);
    },
  },
  {
    name: "clear",
    description: "Clear terminal",
    execute: (ctx) => ctx.clearOutput(),
  },
  {
    name: "history",
    description: "Show command history",
    execute: (ctx) => {
      // history is passed via rawInput context - we read from store externally
      ctx.addOutput([sys("Command history is shown in-terminal. Use arrow keys to navigate.")]);
    },
  },

  // === PORTFOLIO ===
  {
    name: "about",
    description: "Display bio and about info",
    execute: (ctx) => {
      ctx.addOutput([
        sys(bio.name),
        out(bio.title),
        out(""),
        out(bio.summary),
        out(""),
        out(`Interests: ${bio.interests.join(", ")}`),
      ]);
    },
  },
  {
    name: "skills",
    description: "List technical skills",
    execute: (ctx) => {
      ctx.addOutput([
        sys("Frontend:"),
        out(`  ${skills.frontend.join(", ")}`),
        out(""),
        sys("Backend:"),
        out(`  ${skills.backend.join(", ")}`),
        out(""),
        sys("Tools & Platforms:"),
        out(`  ${skills.tools.join(", ")}`),
      ]);
    },
  },
  {
    name: "experience",
    description: "Show work experience",
    execute: (ctx) => {
      const lines: Omit<OutputLine, "id">[] = [];
      for (const exp of experience) {
        lines.push(sys(`${exp.title} @ ${exp.company}`));
        lines.push(out(`  ${exp.date}`));
        lines.push(out(`  ${exp.description}`));
        lines.push(out(""));
      }
      ctx.addOutput(lines);
    },
  },
  {
    name: "projects",
    description: "List projects (--personal, --youtube, --published)",
    execute: (ctx) => {
      const fs = ctx.fileSystem;
      const projectsDir = resolvePathToNode(fs, "~/projects") as DirectoryNode;
      if (!projectsDir) return;

      const showCategory = (name: string, dir: DirectoryNode) => {
        const lines: Omit<OutputLine, "id">[] = [sys(`  ${name}/`)];
        for (const child of Object.values(dir.children)) {
          lines.push(out(`    ${child.name}`));
        }
        return lines;
      };

      const lines: Omit<OutputLine, "id">[] = [sys("~/projects/")];

      if (ctx.flags.personal) {
        lines.push(...showCategory("personal", projectsDir.children.personal as DirectoryNode));
      } else if (ctx.flags.youtube) {
        lines.push(...showCategory("youtube", projectsDir.children.youtube as DirectoryNode));
      } else if (ctx.flags.published) {
        lines.push(...showCategory("published", projectsDir.children.published as DirectoryNode));
      } else {
        for (const [name, child] of Object.entries(projectsDir.children)) {
          if (child.type === "directory") {
            lines.push(...showCategory(name, child));
          }
        }
      }
      ctx.addOutput(lines);
    },
  },
  {
    name: "contact",
    description: "Show contact info",
    execute: (ctx) => {
      ctx.addOutput([
        sys("Contact Information"),
        out(`  Email:    ${contact.email}`),
        out(`  LinkedIn: ${contact.linkedin}`),
        out(`  GitHub:   ${contact.github}`),
      ]);
    },
  },
  {
    name: "resume",
    description: "Open resume",
    execute: (ctx) => {
      ctx.addOutput([sys("Opening resume..."), out("(Resume link would open in a new tab)")]);
    },
  },
  {
    name: "education",
    description: "Show education details",
    execute: (ctx) => {
      ctx.addOutput([
        sys("Education"),
        out(`  ${education.degree}`),
        out(`  ${education.university}`),
        out(`  Graduated: ${education.year}`),
      ]);
    },
  },
  {
    name: "socials",
    description: "Show social links",
    execute: (ctx) => {
      ctx.addOutput([
        sys("Social Links"),
        out(`  LinkedIn:  ${contact.linkedin}`),
        out(`  GitHub:    ${contact.github}`),
        out(`  Email:     ${contact.email}`),
      ]);
    },
  },
  {
    name: "whoami",
    description: "Who are you?",
    execute: (ctx) => {
      ctx.addOutput([
        out("visitor@avi-portfolio"),
        out(""),
        out("Welcome! You're exploring Avi Vashishta's portfolio terminal."),
        out('Type "help" to see what you can do here.'),
      ]);
    },
  },

  // === FILE SYSTEM ===
  {
    name: "ls",
    description: "List directory contents",
    execute: (ctx) => {
      const target = ctx.args[0]
        ? resolvePath(ctx.currentDirectory, ctx.args[0])
        : ctx.currentDirectory;
      const node = resolvePathToNode(ctx.fileSystem, target);
      if (!node || node.type !== "directory") {
        ctx.addOutput([err(`ls: cannot access '${ctx.args[0] || "."}': No such directory`)]);
        return;
      }
      const entries = Object.entries(node.children).map(([name, child]) => {
        if (child.type === "directory") return `${name}/`;
        return name;
      });
      if (entries.length === 0) {
        ctx.addOutput([out("(empty directory)")]);
        return;
      }
      ctx.addOutput(entries.map((e) => out(e)));
    },
  },
  {
    name: "cd",
    description: "Change directory",
    execute: (ctx) => {
      const target = ctx.args[0] || "~";
      const resolved = resolvePath(ctx.currentDirectory, target);
      const node = resolvePathToNode(ctx.fileSystem, resolved);
      if (!node || node.type !== "directory") {
        ctx.addOutput([err(`cd: ${target}: No such directory`)]);
        return;
      }
      ctx.setDirectory(resolved);
    },
  },
  {
    name: "cat",
    description: "Read a file",
    execute: (ctx) => {
      const fileName = ctx.args[0];
      if (!fileName) {
        ctx.addOutput([err("cat: missing file operand")]);
        return;
      }
      const resolved = resolvePath(ctx.currentDirectory, fileName);
      const node = resolvePathToNode(ctx.fileSystem, resolved);
      if (!node) {
        ctx.addOutput([err(`cat: ${fileName}: No such file or directory`)]);
        return;
      }
      if (node.type === "directory") {
        ctx.addOutput([err(`cat: ${fileName}: Is a directory`)]);
        return;
      }
      ctx.addOutput(node.content.split("\n").map((line) => out(line)));
    },
  },
  {
    name: "pwd",
    description: "Print working directory",
    execute: (ctx) => {
      ctx.addOutput([out(ctx.currentDirectory)]);
    },
  },
  {
    name: "tree",
    description: "Show directory tree",
    execute: (ctx) => {
      const target = ctx.args[0]
        ? resolvePath(ctx.currentDirectory, ctx.args[0])
        : ctx.currentDirectory;
      const node = resolvePathToNode(ctx.fileSystem, target);
      if (!node || node.type !== "directory") {
        ctx.addOutput([err(`tree: '${ctx.args[0] || "."}': Not a directory`)]);
        return;
      }
      const lines = [out(node.name + "/")];
      const entries = Object.values(node.children);
      entries.forEach((child, i) => {
        const treeLines = treeNode(child, "", i === entries.length - 1);
        lines.push(...treeLines.map((l) => out(l)));
      });
      ctx.addOutput(lines);
    },
  },

  // === FUN / EASTER EGGS ===
  {
    name: "neofetch",
    description: "System info",
    execute: (ctx) => {
      const artLines = neofetchArt.split("\n");
      const infoLines = [
        "avi@portfolio",
        "-----------------",
        "OS: Portfolio OS v2.0.26",
        "Host: avivashishta.com",
        "Kernel: React 19 + Vite 7",
        "Shell: TypeScript 5.7",
        "DE: SCSS + Motion",
        "WM: Zustand 5",
        "Terminal: portfolio-term",
        "CPU: BTech CS @ IIIT Delhi",
        "GPU: Fullstack Developer",
        "Memory: 2+ years SDE exp",
        "Uptime: Since Oct 2022",
      ];
      const maxArt = Math.max(artLines.length, infoLines.length);
      const lines: Omit<OutputLine, "id">[] = [];
      for (let i = 0; i < maxArt; i++) {
        const art = (artLines[i] || "").padEnd(22);
        const info = infoLines[i] || "";
        lines.push(out(`${art}  ${info}`));
      }
      ctx.addOutput(lines);
    },
  },
  {
    name: "sudo",
    description: "Run with superuser privileges",
    execute: (ctx) => {
      if (ctx.args.join(" ").toLowerCase() === "hire-me") {
        ctx.addOutput([
          sys("=== PERMISSION GRANTED ==="),
          out(""),
          out("Excellent decision! Avi would love to hear from you."),
          out(""),
          out(`  Email:    ${contact.email}`),
          out(`  LinkedIn: ${contact.linkedin}`),
          out(""),
          sys("Initiating hiring sequence... Done."),
        ]);
      } else {
        ctx.addOutput([
          err(`sudo: ${ctx.args[0] || ""}: command not found`),
          out('Did you mean: sudo hire-me?'),
        ]);
      }
    },
  },
  {
    name: "matrix",
    description: "Enter the Matrix",
    execute: (ctx) => {
      ctx.setMatrixActive(true);
      ctx.addOutput([sys("Entering the Matrix... (press any key to exit)")]);
    },
  },
  {
    name: "cowsay",
    description: "ASCII cow says your message",
    execute: (ctx) => {
      const message = ctx.args.join(" ") || "Moo! Hire Avi!";
      const result = cowsayTemplate(message);
      ctx.addOutput(result.split("\n").map((l) => out(l)));
    },
  },
  {
    name: "fortune",
    description: "Random programming quote",
    execute: (ctx) => {
      const quote = fortunes[Math.floor(Math.random() * fortunes.length)];
      ctx.addOutput([out(""), out(quote), out("")]);
    },
  },
  {
    name: "theme",
    description: "Toggle theme (dark/light)",
    execute: (ctx) => {
      ctx.toggleTheme();
      ctx.addOutput([sys("Theme toggled.")]);
    },
  },
  {
    name: "ascii",
    description: "ASCII art of name",
    execute: (ctx) => {
      ctx.addOutput(nameAscii.split("\n").map((l) => out(l)));
    },
  },

  // === AI ===
  {
    name: "ai",
    description: "Chat with AI about Avi",
    execute: async (ctx) => {
      const message = ctx.args.join(" ");
      if (!message) {
        ctx.addOutput([err('Usage: ai <message>'), out('Example: ai tell me about Avi\'s experience')]);
        return;
      }
      ctx.setAiLoading(true);
      ctx.addOutput([sys("Thinking...")]);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });
        const data = await res.json();
        if (data.reply) {
          ctx.addOutput(data.reply.split("\n").map((l: string) => out(`  ${l}`)));
        } else {
          ctx.addOutput([err("AI service returned an empty response.")]);
        }
      } catch {
        ctx.addOutput([err("AI service is currently unavailable. Try again later.")]);
      } finally {
        ctx.setAiLoading(false);
      }
    },
  },
  {
    name: "chat",
    description: "Alias for ai command",
    execute: async (ctx) => {
      const aiCmd = commands.find((c) => c.name === "ai");
      if (aiCmd) await aiCmd.execute(ctx);
    },
  },
];

// Build registry map
const commandRegistry = new Map<string, CommandDefinition>();
for (const cmd of commands) {
  commandRegistry.set(cmd.name, cmd);
}

export { commandRegistry, commands };

// Input parser
export function parseInput(raw: string): {
  command: string;
  args: string[];
  flags: Record<string, string | boolean>;
} {
  const tokens = raw.trim().split(/\s+/);
  const command = (tokens[0] || "").toLowerCase();
  const args: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.startsWith("--")) {
      const [key, value] = token.slice(2).split("=");
      flags[key] = value || true;
    } else if (token.startsWith("-") && token.length > 1) {
      flags[token.slice(1)] = true;
    } else {
      args.push(token);
    }
  }

  return { command, args, flags };
}

// Cached file system
let cachedFS: ReturnType<typeof buildFileSystem> | null = null;
export function getFileSystem() {
  if (!cachedFS) cachedFS = buildFileSystem();
  return cachedFS;
}

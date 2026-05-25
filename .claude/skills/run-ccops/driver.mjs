/**
 * CCoops — Pu'er Tea Writing Project Driver
 *
 * Commands:
 *   node driver.mjs preview [--port PORT]   Start a live preview server
 *   node driver.mjs render                  Generate static HTML to /tmp/ccops-preview.html
 *   node driver.mjs stats                   Show writing stats
 *   node driver.mjs watch                   Watch for changes and auto-refresh
 *   node driver.mjs wechat <file>           Render article to WeChat-friendly HTML
 */

import { readFileSync, writeFileSync, watchFile } from "fs";
import { createServer } from "http";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { marked } from "marked";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "../../..");
const MAIN_DOC = resolve(PROJECT_ROOT, "普洱茶系列大纲.md");
const PORT = parseInt(process.argv[3]?.replace("--port=", ""), 10) || 3456;

// ── Helpers ──────────────────────────────────────────────

function read() {
  return readFileSync(MAIN_DOC, "utf-8");
}

function render(md) {
  const body = marked.parse(md);
  const title = md.match(/^#\s+(.+)/m)?.[1] || "CCoops";
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
    font-size: 17px; line-height: 1.8; color: #1a1a1a;
    max-width: 780px; margin: 0 auto; padding: 48px 24px 120px;
    background: #fff;
  }
  h1 { font-size: 2em; margin: 0 0 0.5em; padding-bottom: 0.3em; border-bottom: 2px solid #e8e8e8; }
  h2 { font-size: 1.5em; margin: 1.5em 0 0.5em; color: #1a3a2a; }
  h3 { font-size: 1.2em; margin: 1.2em 0 0.4em; color: #2a5a3a; }
  h4 { font-size: 1.05em; margin: 1em 0 0.3em; }
  p { margin: 0.6em 0; }
  ul, ol { margin: 0.6em 0; padding-left: 1.5em; }
  li { margin: 0.3em 0; }
  blockquote {
    margin: 1em 0; padding: 12px 20px; background: #f5f7f5;
    border-left: 4px solid #3a7a5a; color: #444;
  }
  blockquote p { margin: 0; }
  code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }
  pre { background: #f5f5f5; padding: 16px; border-radius: 6px; overflow-x: auto; }
  hr { margin: 2em 0; border: none; border-top: 1px solid #e0e0e0; }
  strong { color: #1a3a2a; }
  table { width: 100%; border-collapse: collapse; margin: 1em 0; }
  th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
  th { background: #f0f4f0; }
  .stats-bar { background: #e8f0e8; border-radius: 6px; padding: 8px 16px; margin: 1em 0; font-size: 0.9em; color: #555; }
  @media (prefers-color-scheme: dark) {
    body { background: #1a1a1a; color: #e0e0e0; }
    h2 { color: #6aaa7a; } h3 { color: #5a9a6a; }
    blockquote { background: #252525; border-left-color: #3a7a5a; }
    code { background: #333; }
    pre { background: #252525; }
    th { background: #2a2a2a; }
    .stats-bar { background: #252525; }
  }
</style>
</head>
<body>
${body}
</body>
</html>`;
}

// ── Commands ─────────────────────────────────────────────

function cmdStats() {
  const md = read();
  const totalChars = md.length;
  const totalLines = md.split("\n").length;
  const heading1 = md.match(/^#\s+(.+)/gm) || [];
  const heading2 = md.match(/^##\s+(.+)/gm) || [];
  const heading3 = md.match(/^###\s+(.+)/gm) || [];
  const sections = md.match(/^##\s+(.+)/gm) || [];
  const wordCount = md.replace(/#{1,6}\s+/g, "").replace(/[#*`>|\[\]()\-]/g, "")
    .split(/\s+/).filter(Boolean).length;

  // Count Chinese chars as "words"
  const chineseChars = (md.match(/[一-鿿]/g) || []).length;

  console.log(`
╔══════════════════════════════════╗
║       CCoops Writing Stats       ║
╠══════════════════════════════════╣
║  Title:    ${(heading1[0]?.replace("# ", "") || "N/A").padEnd(25)}║
║  Sections: ${String(sections.length).padStart(2)} lessons               ║
║  Sub-topics: ${String(heading3.length).padStart(2)} articles              ║
║  Lines:    ${String(totalLines).padStart(5)}                   ║
║  Chars:    ${String(totalChars).padStart(6)}                   ║
║  Chinese chars: ${String(chineseChars).padStart(5)}               ║
║  Est. words: ${String(wordCount).padStart(5)}                   ║
║  Est. reading: ~${String(Math.ceil(chineseChars / 500)).padStart(2)} min                   ║
╚══════════════════════════════════╝
`);
}

function renderWechat(md) {
  const body = marked.parse(md);
  const title = md.match(/^#\s+(.+)/m)?.[1] || "CCoops";

  let html = body
    .replace(/<h1>/g, '<h1 style="font-size:22px;text-align:center;margin:0 0 8px;color:#1a1a1a;">')
    .replace(/<h2>/g, '<h2 style="font-size:18px;margin:28px 0 12px;color:#1a3a2a;border-bottom:1px solid #e8e8e8;padding-bottom:6px;">')
    .replace(/<h3>/g, '<h3 style="font-size:16px;margin:20px 0 8px;color:#2a5a3a;">')
    .replace(/<p>/g, '<p style="margin:8px 0;text-indent:2em;">')
    .replace(/<blockquote>/g, '<blockquote style="margin:12px 0;padding:10px 16px;background:#f5f7f5;border-left:3px solid #3a7a5a;color:#555;">')
    .replace(/<ul>/g, '<ul style="padding-left:2em;margin:8px 0;">')
    .replace(/<ol>/g, '<ol style="padding-left:2em;margin:8px 0;">')
    .replace(/<li>/g, '<li style="margin:4px 0;">')
    .replace(/<hr>/g, '<hr style="margin:28px 0;border:none;border-top:2px solid #e0e0e0;">')
    .replace(/<strong>/g, '<strong style="color:#1a3a2a;">')
    .replace(/<code>/g, '<code style="background:#f0f0f0;padding:2px 5px;border-radius:3px;font-size:0.9em;">')
    .replace(/<pre>/g, '<pre style="background:#f5f5f5;padding:12px;border-radius:4px;overflow-x:auto;font-size:14px;">');

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>${title}</title></head>
<body style="font-family:-apple-system,PingFang SC,Microsoft YaHei,sans-serif;max-width:680px;margin:0 auto;padding:20px 16px 80px;font-size:16px;line-height:1.75;color:#333;">
${html}
</body>
</html>`;
}

function cmdWechat(fileArg) {
  const filePath = resolve(process.cwd(), fileArg);
  const md = readFileSync(filePath, "utf-8");
  const html = renderWechat(md);

  const base = fileArg.replace(/\.md$/i, "").replace(/^.*[/\\]/, "");
  const out = `/tmp/wechat-${base}.html`;
  writeFileSync(out, html, "utf-8");
  console.log(`WeChat HTML → file://${out}`);
  console.log(`Open in browser, Cmd+A → Copy → Paste into 公众号编辑器`);
}

function cmdRender() {
  const html = render(read());
  const out = "/tmp/ccops-preview.html";
  writeFileSync(out, html, "utf-8");
  console.log(`Rendered to file://${out}`);
}

function cmdPreview(port) {
  const server = createServer((req, res) => {
    if (req.url === "/stats") {
      const md = read();
      const heading1 = md.match(/^#\s+(.+)/m);
      const sections = md.match(/^##\s+(.+)/gm) || [];
      const chineseChars = (md.match(/[一-鿿]/g) || []).length;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        title: heading1?.[1] || "",
        lessons: sections.length,
        chineseChars,
        readingMinutes: Math.ceil(chineseChars / 500),
      }));
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(render(read()));
  });
  server.listen(port, () => {
    console.log(`CCoops preview server → http://localhost:${port}`);
    console.log(`Stats endpoint → http://localhost:${port}/stats`);
  });
}

function cmdWatch() {
  let html = render(read());
  const out = "/tmp/ccops-preview.html";
  writeFileSync(out, html, "utf-8");

  const server = createServer((req, res) => {
    if (req.url === "/hot") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(html);
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
  });
  server.listen(PORT, () => {
    console.log(`CCoops watch server → http://localhost:${PORT} (reloads on save)`);
  });

  watchFile(MAIN_DOC, { interval: 500 }, () => {
    try {
      html = render(read());
      writeFileSync(out, html, "utf-8");
      console.log(`[${new Date().toLocaleTimeString()}] Updated`);
    } catch (e) {
      console.error("Watch error:", e.message);
    }
  });
}

// ── Main ─────────────────────────────────────────────────

const cmd = process.argv[2] || "preview";

switch (cmd) {
  case "stats":
    cmdStats();
    break;
  case "render":
    cmdRender();
    break;
  case "preview":
    cmdPreview(PORT);
    break;
  case "watch":
    cmdWatch();
    break;
  case "wechat":
    cmdWechat(process.argv[3]);
    break;
  default:
    console.log(`Usage:
  node driver.mjs stats                  Show writing statistics
  node driver.mjs render                 Generate static HTML
  node driver.mjs preview                Start live preview server (default)
  node driver.mjs watch                  Watch for changes & auto-refresh
  node driver.mjs wechat <file.md>       Render article to WeChat-friendly HTML
`);
}

---
name: run-ccops
description: Preview, render, and get stats on the Pu'er tea writing project (普洱茶系列大纲). Run `ccops` to start preview server, `ccops stats` for writing statistics.
---

# CCoops — Pu'er Tea Writing Project Runner

This project is a markdown-based educational series outline about Pu'er tea
(《普洱茶的十五堂课》系列大纲). The driver provides a preview server,
static HTML rendering, and writing statistics.

All commands run from `<project-root>` (`/Users/a1234/Public/CCoops`).

## Prerequisites

- Node.js >= 18 (v24.15.0 installed)
- Dependencies already installed in `.claude/skills/run-ccops/node_modules/`

## Commands

### Start preview server (agent path)

```bash
cd /Users/a1234/Public/CCoops
node .claude/skills/run-ccops/driver.mjs preview
```

Opens an HTML preview of the document at `http://localhost:3456`.
A JSON stats endpoint is also available at `http://localhost:3456/stats`.

### Show writing stats

```bash
node .claude/skills/run-ccops/driver.mjs stats
```

Displays: total lessons, sub-topics, line count, Chinese character count,
estimated reading time.

### Generate static HTML

```bash
node .claude/skills/run-ccops/driver.mjs render
```

Writes a self-contained HTML file to `/tmp/ccops-preview.html`.

### Render article to WeChat-friendly HTML

```bash
node .claude/skills/run-ccops/driver.mjs wechat <article.md>
```

Converts a markdown article to inline-styled HTML suitable for pasting
into WeChat public account (公众号) editor. Opens in browser, copy all,
paste into the editor.

Example:

```bash
node .claude/skills/run-ccops/driver.mjs wechat 001-什么是普洱茶.md
# → /tmp/wechat-001-什么是普洱茶.html
```

### Watch mode (auto-refresh on save)

```bash
node .claude/skills/run-ccops/driver.mjs watch
```

Like `preview` but polls the source file every 500ms and updates on change.

## Direct invocation

For programmatic access, import `marked` and the source document directly:

```js
import { marked } from ".claude/skills/run-ccops/node_modules/marked/index.js";
import { readFileSync } from "fs";
const md = readFileSync("普洱茶系列大纲.md", "utf-8");
const html = marked.parse(md);
```

## Human path

Open `普洱茶系列大纲.md` directly in any markdown editor or IDE.
The built-in VS Code/Cursor markdown preview (`Cmd+Shift+V`) works well.

## Gotchas

- The preview server binds to localhost only. No external access.
- Watch mode uses `fs.watchFile` with 500ms polling — it may miss rapid
  successive saves; wait ~1s between Ctrl+S and reload.
- Chinese character rendering depends on system fonts. The preview HTML
  includes `PingFang SC`, `Microsoft YaHei`, and `Noto Sans SC` font
  stack for CJK support.
- `stats` counts Chinese characters (`[一-鿿]` regex) separately from
  ASCII words for more accurate CJK word count.

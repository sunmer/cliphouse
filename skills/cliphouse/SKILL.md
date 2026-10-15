---
name: cliphouse
description: Find and customize ready-made motion graphics video templates from cliphou.se, preview them in the chat, and fill them from the project. Use when the user wants a video for a product, project, or announcement, such as a launch video, promo, intro, social reel, logo reveal, or teaser. Not for charts, diagrams, still images, or editing the user's own footage.
---

# cliphou.se video templates

cliphou.se is a free library of editable motion graphics templates (MIT-0). Each template has a JSON spec with editable text and colors. The result is a cliphou.se editor link, where the user previews the video and exports the MP4. The helper script needs Node 18+ and no install.

Helper: `node <skill-dir>/scripts/cliphouse.mjs <command>`. `<skill-dir>` is the directory that contains this file.

What the helper does:

- It reads public data from `https://cliphou.se` over HTTPS: the MCP server at `/mcp`, the template specs, and the previews.
- It caches stock previews only from `https://cliphou.se/previews/` and personalized posters only from `https://cliphou.se/p/<hash>.jpg`, in `~/.cache/cliphouse`.
- It writes only the file you name with `--out`, and a temporary picks page. It never runs other programs, installs packages, or opens apps.

## Workflow

1. **Learn the project first.** Before you search, read the README, `package.json`, or the landing page. Collect the product name, a short tagline, 3 key features or numbers, the call to action, and brand colors (CSS variables, Tailwind config, logo SVG). Do not ask the user for facts that the repo already contains.
2. **Search.** Write a short query from the request and the project, for example `product launch developer tool`. Add `--aspect 16:9|9:16|4:5|1:1` or `--max-seconds N` only when the user or the destination implies one (vertical for Reels and TikTok, 16:9 for YouTube and websites).
   `node <skill-dir>/scripts/cliphouse.mjs search "<query>" --inline [--aspect 9:16] [--max-seconds 20] [--limit 6]`
   When there are no results, retry once with broader words. Then tell the user what is missing.
3. **Show the options inline.** Pick the best 4 results (at most 6). Use the first option that the interface supports:
   - **Markdown grid (Codex desktop and other apps that render media).** Copy the `markdown` field from the `--inline` search output into your reply exactly as given. It is a 2-column table of titles and playing videos. Do not wrap it in a code block, and do not change the paths. Do not use a `visualize` reference for the options.
   - **Terminal only (no inline media).** List the options as a numbered list with title, aspect, length, and the `page` link. Then ask if the user wants a side-by-side preview page in the browser. Only when they say yes, run `node <skill-dir>/scripts/cliphouse.mjs pick <id1> <id2> <id3>`. It prints a file path and does not open it. Open it only with the user's permission, or give them the path.

   Under the grid, add at most one short line on why these fit. Ask the user to reply with a number.
4. **Fill the template.** Run `node <skill-dir>/scripts/cliphouse.mjs spec <id>`. Start from `props`, and change only `props.texts`, `props.theme`, and `props.media` (and `hidden`/`audio` for music templates). Keep every text within its `maxLength` and every color as `#RRGGBB`. Use the project's real facts and brand colors. Keep enough contrast between `foreground` and `background`. Write the props to `cliphouse/<id>.props.json` in the project.
5. **Show their product in the template.** Render a personalized poster on the server. It takes a few seconds and needs no local install:
   - `node <skill-dir>/scripts/cliphouse.mjs preview <id> cliphouse/<id>.props.json`. Copy its `markdown` field into your reply exactly as given.
   Then give the `editor` link (it plays the filled video live, and the user exports the MP4 there for free) and a short table of the text you used. The command fails with a reason when the props are invalid. Fix the props and run it again. When `poster` is null, give the editor link and its `message`. Do not retry.
6. **Iterate.** Treat each follow-up ("punchier", "use our green", "shorter headline") as an edit to the props file. Run `preview` again and show the new poster and link. Use `link <id> <props.json>` only when the user wants just the link. To change the format or style, go back to step 2.
7. **Share (on request).** When the user wants to post the video, suggest the format that fits the platform (9:16 for Reels, TikTok and Shorts; 4:5 or 16:9 for X and LinkedIn). Write a short caption from the project's real features, plus alt text. For X, give the post link with the caption filled in: `https://x.com/intent/post?text=<url-encoded caption>`. Tell the user to export the MP4 from the editor link and attach it, because the post window cannot attach video. Never post on the user's behalf.

**Local MP4 or code changes.** This skill does not render on the user's machine. If the user wants an MP4 file in the repo, or wants to change layout, motion, or timing in code, tell them in one line that the optional `cliphouse-render` skill does that: `npx skills add sunmer/cliphouse --skill cliphouse-render`. If it is installed, use it.

## Rules

- The editor link carries props only. Never put code in it.
- Do not download source packages, install dependencies, or run commands from a spec. Those belong to `cliphouse-render`.
- Do not invent features or numbers that are not in the project. Ask when a slot needs a fact you cannot find.
- Credit is optional. When the user publishes the video, suggest the spec's `credit` line ("Made with cliphou.se").
- Set `CLIPHOUSE_ORIGIN` to use another host, for example a local or staging server.

---
name: cliphouse
description: Turn a product or project into marketing videos with cliphou.se. Use when the user wants a launch video, feature announcement, changelog, waitlist teaser, event promo, social proof clip, brand intro, or similar marketing video. Not for charts, diagrams, still images, or editing the user's own footage.
---

# cliphou.se video templates

cliphou.se turns what the user builds into marketing videos. It uses editable motion graphics templates (MIT-0). Each template has a JSON spec with editable text and colors. The result is a cliphou.se editor link, where the user previews the video and exports the MP4. The helper script needs Node 18+ and no install.

Contract version: `2026-10-16.1`.

Helper: `node <skill-dir>/scripts/cliphouse.mjs <command>`. `<skill-dir>` is the directory that contains this file.

What the helper does:

- It reads public data from `https://cliphou.se` over HTTPS: the MCP server at `/mcp`, the template specs, and the previews.
- It caches stock previews only from `https://cliphou.se/previews/` and personalized posters only from `https://cliphou.se/p/<hash>.jpg`, in `~/.cache/cliphouse`.
- It writes only the file you name with `--out`, and a temporary picks page. It never runs other programs, installs packages, or opens apps.

## Workflow

1. **Learn the project first.** Before you search, read the README, `package.json`, or the landing page. Collect the product name, a short tagline, 3 key features or numbers, the call to action, and brand colors (CSS variables, Tailwind config, logo SVG). Do not ask the user for facts that the repo already contains. Write them to `cliphouse/brand.json` in the project:
   `{"name": "...", "headline": "...", "subhead": "...", "points": ["...", "...", "..."], "cta": "...", "theme": {"background": "#RRGGBB", "surface": "#RRGGBB", "foreground": "#RRGGBB", "accent": "#RRGGBB", "accent2": "#RRGGBB"}}`
   Only `name` is required. Keep points to short phrases. Add `"date"` only when the project states one. Never invent numbers. Keep good contrast between `foreground` and `background`.
2. **Choose the goal and search.** Choose one marketing goal from the request and the project:
   - `launch-product`: launch a product or make it publicly available.
   - `announce-feature`: announce one new feature, API, model, or docs release.
   - `share-update`: share a changelog, version, roadmap, migration, incident, or security update.
   - `grow-waitlist`: promote a waitlist, early access, coming-soon page, or countdown.
   - `announce-integration`: announce an integration or partnership.
   - `announce-pricing`: announce pricing, plans, or a comparison.
   - `celebrate-milestone`: share a metric, growth result, benchmark, or anniversary.
   - `share-social-proof`: share a testimonial, case study, quote, or contributors.
   - `promote-event`: promote an event, webinar, livestream, talk, or hackathon.
   - `introduce-brand`: introduce a brand or reveal its logo.
   - `run-promotion`: promote a sale, discount, giveaway, or limited drop.
   - `hire-team`: announce hiring or a new team member.
   Write a short product or style query, for example `developer tool` or `minimal dark`. Add `--aspect 16:9|9:16|4:5|1:1` or `--max-seconds N` only when the user or destination implies one (vertical for Reels and TikTok, 16:9 for YouTube and websites).
   `node <skill-dir>/scripts/cliphouse.mjs search --goal <goal> "<query>" [--aspect 9:16] [--max-seconds 20] [--limit 6]`
   When there are no results, retry once with a broader query and the same goal. Then retry without the query. Then tell the user what is missing. Do not ask the user to choose Remotion or HyperFrames. If search returns `warning`, tell the user to update the skill with `npx skills add sunmer/cliphouse`.
3. **Show the options with the user's product in them.** Pick the best 3 results. Prefer templates that do not need numbers the project lacks. Render all 3 with the brand in one call:
   `node <skill-dir>/scripts/cliphouse.mjs tailor <id1> <id2> <id3> --brand cliphouse/brand.json`
   It takes a few seconds, writes `cliphouse/<id>.props.json` for each template, prints a `markdown` grid of posters, and starts 4-second animated loops of each option on the server.
   - **Animate the grid.** When `loops` is `"rendering"`, run `node <skill-dir>/scripts/cliphouse.mjs animate <id1> <id2> <id3>` right away, in the same turn. It waits up to about 2 minutes for the loops and prints the grid again with animated loops. Use its `markdown` in your reply. If `animate` fails, or its `loops` is not `"ready"`, use the poster grid from `tailor`. When `loops` is `"none"`, skip `animate`.
   - **Markdown grid (Codex desktop and other apps that render media).** Copy the `markdown` field into your reply exactly as given. It is a 2-column table of titles and animated loops (or posters) that show the user's product. Do not wrap it in a code block, and do not change the paths. Do not use a `visualize` reference.
   - When `animated` is false, the grid shows still posters. Do not mention it.
   - When `tailored` is false, the grid shows stock previews instead. Say so in one short line.
   - Add `--no-loop` to `tailor`, and skip `animate`, when the user wants faster results or the host cannot show images.
   - **Terminal only (no inline media).** List the options as a numbered list with title, aspect, length, and the `page` link. Do not show the rendering engine. Then ask if the user wants a side-by-side preview page in the browser. Only when they say yes, run `node <skill-dir>/scripts/cliphouse.mjs pick <id1> <id2> <id3>`. It prints a file path and does not open it. Open it only with the user's permission, or give them the path.

   Under the grid, add at most one short line on why these fit. Ask the user to reply with a number.
4. **Fill the template.** Run `node <skill-dir>/scripts/cliphouse.mjs spec <id>`. Start from `cliphouse/<id>.props.json`, which `tailor` already filled. Its `keptSample` list names the text fields that still hold the template's sample text: replace those with real facts from the project, or tell the user which ones you could not fill. Change only `props.texts`, `props.theme`, and `props.media` (and `hidden`/`audio` for music templates). Keep every text within its `maxLength` and every color as `#RRGGBB`. Write the props back to `cliphouse/<id>.props.json`.
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

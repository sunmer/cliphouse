---
name: cliphouse
description: Find and customize ready-made motion graphics video templates from cliphou.se, then preview, edit, and render them as MP4. Use when the user wants a video for a product, project, or announcement, such as a launch video, promo, intro, social reel, logo reveal, or teaser. Not for charts, diagrams, still images, or editing the user's own footage.
---

# cliphou.se video templates

cliphou.se is a free library of editable motion graphics templates (MIT-0). Each template has a JSON spec with editable text, colors, and a source package that renders locally. The helper script needs Node 18+ and no install.

Helper: `node <skill-dir>/scripts/cliphouse.mjs <command>`. `<skill-dir>` is the directory that contains this file.

## Workflow

1. **Learn the project first.** Before you search, read the README, `package.json`, or the landing page. Collect the product name, a short tagline, 3 key features or numbers, the call to action, and brand colors (CSS variables, Tailwind config, logo SVG). Do not ask the user for facts that the repo already contains.
2. **Search.** Write a short query from the request and the project, for example `product launch developer tool`. Add `--aspect 16:9|9:16|4:5|1:1` or `--max-seconds N` only when the user or the destination implies one (vertical for Reels and TikTok, 16:9 for YouTube and websites).
   `node <skill-dir>/scripts/cliphouse.mjs search "<query>" --inline [--aspect 9:16] [--max-seconds 20] [--limit 6]`
   When there are no results, retry once with broader words. Then tell the user what is missing.
3. **Show the options inline.** Pick the best 4 results (at most 6). Use the first option that the interface supports:
   - **Interactive picker (Codex desktop, when the `visualize` skill is available).** Build a grid of autoplaying previews. A click selects a template:
     `node <skill-dir>/scripts/cliphouse.mjs picker <id1> <id2> <id3> <id4> --out <visualization-dir>/cliphouse-picker.html`
     `<visualization-dir>` is the thread-scoped visualization directory in the writable roots. The command prints a `reference` line. Put that line on its own line in your final response, exactly as printed. Do not add a Markdown link to the file or repeat the options as a table.
   - **Markdown grid (other apps that render media).** Copy the `markdown` field from the `--inline` search output into your reply exactly as given. It is a 2-column table of titles and playing videos. Do not wrap it in a code block, and do not change the paths.
   - **Terminal only.** Open the browser page: `node <skill-dir>/scripts/cliphouse.mjs pick <id1> <id2> <id3>`.
   Under the grid, add at most one short line on why these fit. Ask the user to click a template or reply with a number. A message like `$cliphouse: use template <id> and fill it for this project` selects that template. Continue at step 4 with that id.
4. **Fill the template.** Run `node <skill-dir>/scripts/cliphouse.mjs spec <id>`. Start from `props`, and change only `props.texts`, `props.theme`, and `props.media` (and `hidden`/`audio` for music templates). Keep every text within its `maxLength` and every color as `#RRGGBB`. Use the project's real facts and brand colors. Keep enough contrast between `foreground` and `background`. Write the props to `cliphouse/<id>.props.json` in the project.
5. **Show the result.** Validate and get an editor link:
   `node <skill-dir>/scripts/cliphouse.mjs link <id> cliphouse/<id>.props.json`
   The command fails with a reason when the props are invalid. Fix the props and run it again. Give the user the link and a short table of the text you used.
6. **Iterate.** Treat each follow-up ("punchier", "use our green", "shorter headline") as an edit to the props file. Run `link` again and give the new link. To change the format or style, go back to step 2.
7. **Render or edit code (on request).** When the user wants an MP4 in the repo, or wants changes to layout, motion, or timing:
   - Download `source.package` from the spec into `cliphouse/<id>/` and extract it (`curl -L <package> | tar xz`).
   - Copy the props into the package: `props.json` for Remotion. For HyperFrames, set `text_<role>`, `theme_<role>`, and `hide_<role>` in `variables.json`.
   - Run `source.renderCommand` in the package directory. The output is `out/video.mp4`. Packages need Node 22.6+. Remotion runs `npm ci`, and the first render downloads a headless browser.
   - For code changes, edit the package code, render again, and show the file path.

## Rules

- The editor link carries props only. Never put code in it.
- Ask before you download packages or install dependencies.
- Do not invent features or numbers that are not in the project. Ask when a slot needs a fact you cannot find.
- Credit is optional. When the user publishes the video, suggest the spec's `credit` line ("Made with cliphou.se").
- Set `CLIPHOUSE_ORIGIN` to use another host, for example a local or staging server.

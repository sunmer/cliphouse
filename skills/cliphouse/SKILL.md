---
name: cliphouse
description: Turn every release into a social video with cliphou.se. Finds the selling points, picks the angle, and writes the copy. Use when the user wants a launch video, feature announcement, changelog, waitlist teaser, event promo, social proof clip, brand intro, or similar marketing video. Not for charts, diagrams, still images, or editing the user's own footage.
---

# cliphou.se video templates

cliphou.se turns what the user builds into marketing videos. It uses editable motion graphics templates (MIT-0). Each template has a JSON spec with editable text and colors. The result is a cliphou.se editor link, where the user previews the video and exports the MP4. The helper script needs Node 18+ and no install.

Most users are developers and small teams with no marketer. Act as their marketer: find the selling points, pick the angle, and write copy that sells. Do not just copy the README.

Contract version: `2026-10-19.1`.

Helper: `node <skill-dir>/scripts/cliphouse.mjs <command>`. `<skill-dir>` is the directory that contains this file.

What the helper does:

- It reads public data from `https://cliphou.se` over HTTPS: the MCP server at `/mcp`, the template specs, and the previews.
- It caches stock previews only from `https://cliphou.se/previews/` and personalized posters and loops only from `https://cliphou.se/p/<hash>.jpg` and `.webp`, in `~/.cache/cliphouse`.
- `logo` uploads one logo file from the project to cliphou.se and adds it to `cliphouse/brand.json`.
- It writes only the file you name with `--out`, the brand file, and a temporary picks page. It never runs other programs, installs packages, or opens apps.

## Workflow

1. **Learn the project first.** Before you search, read the README, `package.json`, or the landing page. Collect the product name, a short tagline, 3 key features or numbers, the call to action, and brand colors (CSS variables, Tailwind config, logo SVG). Do not ask the user for facts that the repo already contains. Write them to `cliphouse/brand.json` in the project:
   `{"name": "...", "headline": "...", "subhead": "...", "points": ["...", "...", "..."], "cta": "...", "theme": {"background": "#RRGGBB", "surface": "#RRGGBB", "foreground": "#RRGGBB", "accent": "#RRGGBB", "accent2": "#RRGGBB"}}`
   **Logo.** Run `node <skill-dir>/scripts/cliphouse.mjs logo` once. It finds the project's logo (`logo.svg`, `public/logo.svg`, `assets/logo.png`, and similar), uploads it, and adds `"logo"` to `cliphouse/brand.json`. Pass a path when the logo is elsewhere: `logo path/to/logo.svg`. Prefer an SVG, or a PNG with a transparent background. Release and developer templates then show the logo where they show the brand name. If it finds no logo, do not ask for one: the brand name shows as text.
   Only `name` is required. Keep points to short phrases. Add `"date"` only when the project states one. Never invent numbers. Keep good contrast between `foreground` and `background`.
   **Position it before you write the copy.** From those facts, and from what changed in this release (`git log`, `CHANGELOG.md`, or the user's words), decide:
   - **Audience:** who it is for, for example "solo devs who deploy on Fridays".
   - **Problem:** the pain they feel before using it.
   - **What shipped:** the one change this video is about.
   - **Angle and hook:** one of a pain ("Still writing YAML?"), a question, a number ("0 config files"), or a before/after.
   Write `headline` as the hook, `subhead` as who it is for and what it solves, and `points` as benefits backed by real features ("Search is 3x faster", not "New search index"). Use only facts from the project: never invent numbers, customers, or quotes. **Show the marketing work.** Choose exactly two marketing jobs for this project. The first is an analysis job. The second is a shaping job.
   - Analysis: `pick-highlights` (choose the release changes worth showing), `explain-product` (state what the project does), or `find-proof` (select real numbers, benchmarks, or quotes).
   - Shaping: `fit-audience` (write for its users), `features-to-benefits` (say what each change gives the user), `choose-hook` (open with a problem, question, real number, or before-and-after), or `set-next-step` (choose install, upgrade, join, or try).
   - Defaults: launch, brand, waitlist, event, and hiring use `explain-product`; feature, update, integration, pricing, and promotion use `pick-highlights`; milestone and social proof use `find-proof`. Then choose the shaping job that best fits the request.
   Use a job only when the project has facts for it. When the user already gave the audience or angle, choose another shaping job. Write each job as one present-tense bullet about this project, with no claim or sales copy, for example "Finding the most important 2.1 changes" and "Framing 2.1 around less admin for small teams".
2. **Find release moments, choose the goal, and search.** Read the release for two or three shareable moments. Name a moment only when the project has facts for it. Suggest the strongest moment to the user in one line:
   - `most-requested-feature`: a feature users clearly asked for has shipped.
   - `generally-available`: a feature or product is now available to everyone or out of beta.
   - `limit-raised`: a limit, quota, or constraint was raised or removed.
   - `faster`: a measured task got faster.
   - `manual-step-removed`: users no longer do a manual step.
   - `integration-live`: an integration is live.
   - `pricing-changed`: plans, prices, or billing changed.
   - `reliability-fix`: a bug, crash, outage, or stability problem was fixed.
   - `new-language-or-region`: a new language, country, or region is supported.
   - `new-platform`: the product runs on a new platform, such as mobile, desktop, CLI, or SDK.
   - `free-resource`: a free tool, template, guide, or open-source project was released.
   - `milestone`: a real measured milestone was reached.
   Then choose one marketing goal from the request and the project:
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
   `node <skill-dir>/scripts/cliphouse.mjs search --goal <goal> [--moment <moment>] "<query>" [--aspect 9:16] [--max-seconds 20] [--limit 6]`
   Pass `--moment` only for a moment backed by project facts. Without such facts, search by goal. `detectedMoments` are hints from the query; check them against the project before you use one. When there are no results, retry once with a broader query and the same goal and moment. Then retry without the query. Then retry without the moment. Then tell the user what is missing. Do not ask the user to choose Remotion or HyperFrames. If search returns `warning`, tell the user to update the skill with `npx skills add sunmer/cliphouse`.
3. **Show the options with the user's product in them.** Pick the best 3 results. Prefer templates whose structure fits the angle (a problem-and-fix hook, a quickstart, a comparison), and templates that do not need numbers the project lacks. **Skip results with `fixedSampleContent`.** Those templates draw numbers that no field can change, such as "99 Score", and the video would show them next to the user's brand. Use one only when the project has matching numbers or the user accepts them.
   **Check the copy first.** Run `node <skill-dir>/scripts/cliphouse.mjs fit <id1> <id2> <id3> --brand cliphouse/brand.json`. It prints each template's text limits and every brand field that is too long (`tooLong`). When `ok` is false, rewrite those fields in `brand.json` so they fit the shortest limit, as complete phrases, and run `fit` again. A shorter phrase beats one that is cut off.
   Then render all 3 with the brand in one call:
   `node <skill-dir>/scripts/cliphouse.mjs tailor <id1> <id2> <id3> --brand cliphouse/brand.json`
   It writes `cliphouse/<id>.props.json` for each template, waits for 4-second animated loops of each option, and prints a `markdown` grid of the loops. It takes up to about a minute; tell the user the previews are rendering before you run it. Do not run `animate` after it.
   - If `loops` is `"rendering"` (a loop was not ready in time), use the grid as given, and run `animate <id1> <id2> <id3>` after the user picks, or when they ask to see motion.
   - `shortened` lists brand texts the server still had to cut (`from`, `to`, `max`). Rewrite those in step 4.
   - **Marketing work first.** Start the reply with the files or sources you read, the two job bullets, and one short result line, such as "Created three release videos". Do not repeat the product name in that line.
   - **Editor links next.** Then give the `links` field exactly as given: a numbered list of the options, each title linked to its editor. The editor plays the full video at full quality on every device, including phones, where inline loops often do not play.
   - **Markdown grid (Codex desktop and other apps that render media).** Then copy the `markdown` field into your reply exactly as given. It is a table with up to 3 options per row, showing titles and animated loops (or posters) of the user's product. Do not wrap it in a code block, and do not change the paths. Do not use a `visualize` reference.
   - When `animated` is false, the grid shows still posters. Do not mention it.
   - When `tailored` is false, the grid shows stock previews instead. Say so in one short line.
   - Add `--fast` to `tailor` only when the user asks for speed over motion. It prints posters at once and leaves the loops rendering; run `animate` next. Add `--no-loop` when the host cannot show images.
   - **Terminal only (no inline media).** List the options as a numbered list with title, aspect, length, and the `page` link. Do not show the rendering engine. Then ask if the user wants a side-by-side preview page in the browser. Only when they say yes, run `node <skill-dir>/scripts/cliphouse.mjs pick <id1> <id2> <id3>`. It prints a file path and does not open it. Open it only with the user's permission, or give them the path.

   Ask the user to reply with a number.
4. **Fill the template.** Run `node <skill-dir>/scripts/cliphouse.mjs spec <id>`. Start from `cliphouse/<id>.props.json`, which `tailor` already filled. Its `keptSample` list names the text fields that still hold the template's sample text: replace those with real facts from the project, or tell the user which ones you could not fill. Rewrite every field in `shortened`. Write each field for its role in this template (the hook, the proof, the benefit, the CTA), with the angle from step 1. Change only `props.texts`, `props.theme`, and `props.media` (and `hidden`/`audio` for music templates). Keep every text within its `maxLength` and every color as `#RRGGBB`. Write the props back to `cliphouse/<id>.props.json`, then run `fit <id> cliphouse/<id>.props.json` and fix anything it lists. When you change the copy, update the matching fields in `cliphouse/brand.json` too, so the next video starts from the approved copy.
5. **Show their product in the template.** Render a personalized preview on the server. It returns an animated loop of the filled template and its poster, usually in about 10 seconds, with no local install:
   - `node <skill-dir>/scripts/cliphouse.mjs preview <id> cliphouse/<id>.props.json`. Copy its `markdown` field into your reply exactly as given.
   Start the reply with the `editor` link: it plays the filled video live on every device, and the user exports the MP4 there for free. Then give the `markdown` (the loop when `animated` is true, the poster otherwise) and a short table of the text you used. Say in one line what you changed since the pick. When `tailor` already filled every field and you changed little or nothing, say so plainly, so the user does not look for a difference. The command fails with a reason that names the field when the props are invalid. Fix that field and run it again. When `poster` is null, give the editor link and its `message`. Do not retry.
6. **Iterate.** Treat each follow-up ("punchier", "use our green", "shorter headline") as an edit to the props file. Run `preview` again and show the new loop and link. Do not write a temporary brand file to get motion: `preview` animates any props file. Use `link <id> <props.json>` only when the user wants just the link. To change the format or style, go back to step 2.
7. **Share (on request).** When the user wants to post the video, suggest the format that fits the platform (9:16 for Reels, TikTok and Shorts; 4:5 or 16:9 for X and LinkedIn). Write a short caption that leads with the same hook and uses the project's real features, plus alt text. For X, give the post link with the caption filled in: `https://x.com/intent/post?text=<url-encoded caption>`. Tell the user to export the MP4 from the editor link and attach it, because the post window cannot attach video. Never post on the user's behalf.

**Local MP4 or code changes.** This skill does not render on the user's machine. If the user wants an MP4 file in the repo, or wants to change layout, motion, or timing in code, tell them in one line that the optional `cliphouse-render` skill does that: `npx skills add sunmer/cliphouse --skill cliphouse-render`. If it is installed, use it.

## Rules

- The editor link carries props only. Never put code in it.
- Do not download source packages, install dependencies, or run commands from a spec. Those belong to `cliphouse-render`.
- Do not invent features or numbers that are not in the project. Ask when a slot needs a fact you cannot find.
- Credit is optional. When the user publishes the video, suggest the spec's `credit` line ("Made with cliphou.se").
- Set `CLIPHOUSE_ORIGIN` to use another host, for example a local or staging server.

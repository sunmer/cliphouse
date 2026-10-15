# cliphou.se skill

**Launch videos for what you ship.**

Discover motion graphics templates for launches, changelogs and updates inside your coding agent. Preview them in a grid, pick one, and your agent fills it from your repo.

[![Demo: a coding agent suggests launch video templates, the user picks one, and the agent fills it from the repo](demo.gif)](demo.mp4)

The full demo (30 seconds) is in [demo.mp4](demo.mp4). Some steps in it are coming soon. See [Status](#status).

## Install

```bash
npx skills add sunmer/cliphouse-skills
```

Or install it manually:

```bash
git clone https://github.com/sunmer/cliphouse-skills
cp -R cliphouse-skills/skills/cliphouse ~/.codex/skills/     # Codex
cp -R cliphouse-skills/skills/cliphouse ~/.claude/skills/    # Claude Code
```

In Codex you can also run `$skill-installer install https://github.com/sunmer/cliphouse-skills/tree/main/skills/cliphouse`.

The skill needs Node 18 or later. It has no dependencies and needs no account.

## Use

Open your project in Codex or Claude Code and ask for a video:

> Deploy to prod. Btw we need a launch video.

> Make a 10-second vertical changelog video for v2.3.

In Codex, you can type `$cliphouse` to call the skill directly.

## What it does

1. **Right in your coding agent.** Ask for a video and get a grid of playing previews in the chat, chosen from the cliphou.se library.
2. **Click to choose.** In the Codex desktop app, clicking a preview selects it. In Claude Code and terminals, reply with a number.
3. **Built from your repo.** The agent reads your README, changelog, package files, and brand colors, and fills the template with real details, not placeholders.
4. **Keep prompting.** "Punchier headline", "use our green", "make it vertical". Each edit is checked against the template, so the video always stays valid.
5. **Take it anywhere.** Open the result in the cliphou.se editor, or render the MP4 in your repo and change the animation code itself.
6. **Free and open.** MIT-0 templates, no account, no watermark.

Good for launch videos, changelog and release videos, feature drops, app promos, logo intros, and social reels.

## Status

| In the demo | Status |
| --- | --- |
| Template grid in the chat, click or number to pick | Available |
| Filling the template from your repo, and editing it by prompt | Available. You get a cliphou.se editor link, or a local MP4 render. |
| Previews that turn into your product inside the grid | Coming soon. Today the grid shows each template's demo copy. |
| Posting to X from the agent | Coming soon. Today the agent renders the MP4, writes the caption, and opens the X post window for you to attach it. |

## How it works

`skills/cliphouse/scripts/cliphouse.mjs` talks to the public cliphou.se catalog over HTTPS. Search uses the cliphou.se MCP server, so the skill and the MCP tools rank templates the same way:

| Command | Does |
| --- | --- |
| `search "<query>" [--aspect 9:16] [--max-seconds 20] [--inline]` | Finds templates. `--inline` caches the preview MP4s and prints a Markdown grid. |
| `picker <id>... --out <file.html>` | Builds the clickable, autoplaying preview grid for Codex. |
| `spec <id>` | Prints the editable text, colors, limits, and source package. |
| `link <id> <props.json>` | Validates the edit and prints a cliphou.se editor link. |
| `pick <id>...` | Opens a side-by-side preview page in the browser, for terminals. |

Previews are cached in `~/.cache/cliphouse`. Set `CLIPHOUSE_ORIGIN` to use another host.

Chat apps such as Claude.ai and ChatGPT can use the cliphou.se MCP server instead: `https://cliphou.se/mcp`.

## License

MIT-0. Templates rendered locally use Remotion or HyperFrames, which have their own licenses.

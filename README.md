# cliphou.se

**You ship it. Cliphouse shows it off.**

Your coding agent turns every release into a video for your socials. It finds the selling points, picks the angle, writes the copy, and uses your brand colors. Free skill and MCP server for Claude Code, Codex, Cursor, Claude, and ChatGPT.

You can preview and edit without an account. MP4 download and editing more than 3 gallery templates need a free Google sign-in.

[![Demo: a coding agent suggests release video templates, the user picks one, and the agent fills it from the repo](demo.gif)](https://github.com/sunmer/cliphouse/releases/download/demo-v1/cliphouse-agent-demo.mp4)

[Watch the full demo (31 seconds)](https://github.com/sunmer/cliphouse/releases/download/demo-v1/cliphouse-agent-demo.mp4), or see it play at [cliphou.se/agents](https://cliphou.se/agents/). Some steps in it are coming soon. See [Status](#status).

## Install

<table>
<tr>
<th width="50%">Coding agents (Codex, Claude Code)</th>
<th width="50%">Chat apps (Claude, ChatGPT, Cursor)</th>
</tr>
<tr>
<td valign="top">

```bash
npx skills add sunmer/cliphouse
```

Installs the `cliphouse` skill. It needs Node 18 or later, has no dependencies, and runs no commands besides its own helper.

In Codex you can also run `$skill-installer install https://github.com/sunmer/cliphouse/tree/main/skills/cliphouse`.

</td>
<td valign="top">

MCP server URL, no key needed:

```text
https://cliphou.se/mcp
```

[Add to Cursor](cursor://anysphere.cursor-deeplink/mcp/install?name=cliphouse&config=eyJ1cmwiOiJodHRwczovL2NsaXBob3Uuc2UvbWNwIn0=) · [Add to VS Code](vscode:mcp/install?%7B%22name%22%3A%22cliphouse%22%2C%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Fcliphou.se%2Fmcp%22%7D)

Claude.ai and ChatGPT: add a custom connector with the URL above.

</td>
</tr>
</table>

Claude Code with MCP instead of the skill:

```bash
claude mcp add --transport http cliphouse https://cliphou.se/mcp
```

Codex with MCP, in `~/.codex/config.toml`:

```toml
[mcp_servers.cliphouse]
url = "https://cliphou.se/mcp"
```

GitHub does not open `cursor://` and `vscode:` links from a README in every browser. If a link does nothing, use the buttons on [cliphou.se/agents](https://cliphou.se/agents/).

## Try it

Open your project and ask:

> Let's ship 2.1. Btw we need a release video for our socials.

> Make a vertical changelog video for this week's updates.

> Turn this API release into a 16:9 video for X and LinkedIn.

In Codex, type `$cliphouse` to call the skill directly.

## Status

| In the demo | Status |
| --- | --- |
| Template grid in the chat that already shows your product, with short animated previews | Available |
| Filling the template from your repo, and editing it by prompt | Available. You get a cliphou.se editor link, where you export the MP4. |
| A preview of your own product in the picked template | Available as a poster image. An animated preview is coming. |
| Posting to X from the agent | Coming soon. Today the agent writes the caption and opens the X post window for you to attach the MP4. |

## Skills in this repo

| Skill | Does | Install |
| --- | --- | --- |
| `cliphouse` | Search, preview, fill from your repo, editor link, share. Reads public cliphou.se data only. | `npx skills add sunmer/cliphouse` |
| `cliphouse-render` (optional) | Renders the MP4 in your project, or lets the agent change layout, motion, and timing in code. Asks before it downloads or installs anything. | `npx skills add sunmer/cliphouse --skill cliphouse-render` |

## How it works

`skills/cliphouse/scripts/cliphouse.mjs` talks to the public cliphou.se catalog over HTTPS. Search uses the cliphou.se MCP server, so the skill and the MCP tools rank templates the same way.

Goals: `launch-product`, `announce-feature`, `share-update`, `grow-waitlist`, `announce-integration`, `announce-pricing`, `celebrate-milestone`, `share-social-proof`, `promote-event`, `introduce-brand`, `run-promotion`, and `hire-team`.

The cliphou.se deploy checks this skill against its MCP contract. If the installed skill is older than the server, search returns a warning with the update command.

| Command | Does |
| --- | --- |
| `search --goal <goal> "<query>" [--aspect 9:16] [--max-seconds 20] [--inline]` | Finds templates for a marketing goal. `--inline` caches the preview MP4s and prints a Markdown grid. |
| `tailor <id>... --brand <brand.json>` | Renders up to 4 templates with your brand in one server call, writes `cliphouse/<id>.props.json` for each, and prints a Markdown grid of the posters. |
| `spec <id>` | Prints the editable text, colors, and limits. |
| `preview <id> <props.json>` | Renders a poster of your product in the template on the server, and prints the editor link. |
| `link <id> <props.json>` | Validates the edit and prints a cliphou.se editor link. |
| `pick <id>...` | Writes a side-by-side preview page for terminals and prints its path. The agent asks before opening it. |

What the default skill does not do:

- It does not run `npm`, `curl`, `tar`, or any command from a downloaded spec.
- It does not download source packages into your repo.
- It does not open your browser on its own.

It caches stock previews only from `https://cliphou.se/previews/` and personalized posters only from `https://cliphou.se/p/<hash>.jpg`, in `~/.cache/cliphouse`. Set `CLIPHOUSE_ORIGIN` to use another host.

In the Codex picker, a click on a tile sends one fixed message: `$cliphouse: use template <id> and fill it for this project`. It is sent only on your click, and the id must match `^[a-z0-9-]+$`.

`cliphouse-render` uses fixed render commands written in its `SKILL.md`. It checks each package against `source.packageSha256` before it extracts it into `.cliphouse/<id>/`, and asks before it adds `.cliphouse/` to `.gitignore` or installs dependencies.

## Links

- [cliphou.se/agents](https://cliphou.se/agents/): install page with the demo
- [MCP Registry entry](https://registry.modelcontextprotocol.io/v0.1/servers?search=se.cliphou%2Ftemplates) (`se.cliphou/templates`)
- [llms.txt](https://cliphou.se/llms.txt)
- [Gallery](https://cliphou.se/)

## License

MIT-0. Templates rendered locally use Remotion or HyperFrames, which have their own licenses.

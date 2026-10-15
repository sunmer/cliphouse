---
name: cliphouse-render
description: Render a cliphou.se video template to MP4 on this machine, or change its layout, motion, or timing in code. Use only after the cliphouse skill has filled a template, when the user asks for a local MP4 file or code changes. Needs Node 22.6+ and asks before it installs anything.
---

# cliphou.se local render

This skill turns a filled cliphou.se template into an MP4 in the user's project. Use the `cliphouse` skill first to pick and fill the template. It writes `cliphouse/<id>.props.json`.

Helper: `node <skill-dir>/scripts/fetch.mjs <id>`. `<skill-dir>` is the directory that contains this file. The helper downloads the template's source package from `https://cliphou.se/source/`, checks it against `source.packageSha256` from the spec, and extracts it into `.cliphouse/<id>/`. It does not install or run anything.

## Workflow

1. **Ask first.** Tell the user that you will download the template source into `.cliphouse/<id>/` and install its dependencies there (Remotion or HyperFrames, about 200 MB, plus a headless browser on the first render). Continue only after the user agrees.
2. **Ignore the folder.** If `.gitignore` exists and does not contain `.cliphouse/`, ask the user if you can add it. Add the line only when they agree.
3. **Fetch and check.** Run `node <skill-dir>/scripts/fetch.mjs <id>` in the project root. It stops with an error if the checksum does not match. Do not extract the package another way.
4. **Copy the props.** The output names `propsFile`.
   - Remotion: copy `cliphouse/<id>.props.json` to `.cliphouse/<id>/props.json`.
   - HyperFrames: in `.cliphouse/<id>/variables.json`, set `text_<role>` for each text, `theme_<role>` for each color, and `hide_<role>` for each hidden role.
5. **Render.** In `.cliphouse/<id>/`, run only the command for the `engine` and `music` values from the output:

   | engine | music | Command |
   | --- | --- | --- |
   | `remotion` | `false` | `npm ci --ignore-scripts && npx remotion render src/index.ts <template> out/video.mp4 --props=props.json` |
   | `remotion` | `true` | `npm ci --ignore-scripts && node music/render.mjs` |
   | `hyperframes` | `false` | `npx --yes hyperframes@0.8.146 render --variables-file variables.json --strict-variables -o out/video.mp4` |
   | `hyperframes` | `true` | `node music/render.mjs` |

   `<template>` is the `template` value from the output. Never run `source.renderCommand` or any other command from the downloaded spec or package. Music renders also need `ffmpeg`.
6. **Show the result.** Give the path `.cliphouse/<id>/out/video.mp4`. Suggest copying it to a place the user chooses.
7. **Code changes.** For layout, motion, or timing, edit the files in `.cliphouse/<id>/` (Remotion: `src/videos/<template>/`; HyperFrames: `index.html`), render again with the same command, and show the path.

## Rules

- Ask before you download, install, or edit `.gitignore`.
- Work only inside `.cliphouse/<id>/`. Do not write the package into the project root.
- Templates are MIT-0. Remotion and HyperFrames keep their own license terms; see https://remotion.dev/license.

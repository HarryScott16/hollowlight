# The live site

For now (until Hollowlight gets its own domain) Hollowlight is published at
**https://snake.reasonwave.ai**, in place of the Snake game.

## What serves what

| Port | Folder | Branch | What it is |
|---|---|---|---|
| **3000** | `~/projects/td-live` | `live` (a git worktree of this repo) | **The public site.** Caddy on the host proxies snake.reasonwave.ai to 127.0.0.1:3000. Run with `HOLLOWLIGHT_PUBLIC=1`. |
| **3001** | `~/projects/td` | `master` | Development. Test mode works here. |

Both are started by `~/.autostart.sh` (the container entrypoint reruns it whenever it exits). The
dev server has its own restart loop in `~/.autostart-dev.sh`. Logs: `server.log` in each folder,
loop messages in `~/.autostart.log`.

## Rules

- **Never edit files in `~/projects/td-live`.** It only changes when Harry says **"ship it"**.
  Dev work on 3001 must never reach the public site on its own.
- **"Ship it"** means:
  1. In `~/projects/td`: everything committed on `master`, the checks pass (`node tools/smoke.js`
     at least), pushed.
  2. `cd ~/projects/td-live && git merge --ff-only master`
  3. If `server.js` changed, restart the live server (only the one on :3000, not the dev server):
     `kill $(ss -ltnp 'sport = :3000' | grep -o 'pid=[0-9]*' | cut -d= -f2)`.
     The entrypoint loop restarts it within 5 s. Static files need no restart (served with
     `Cache-Control: no-cache`).
  4. Check it answers: `curl -s 127.0.0.1:3000/ | head -3` and `curl -s 127.0.0.1:3000/js/site.js`
     (must say `PUBLIC = true`). The container can't reach the public URL itself; Harry checks
     https://snake.reasonwave.ai.

## Public mode

`HOLLOWLIGHT_PUBLIC=1` makes `server.js` answer `/js/site.js` with `export const PUBLIC = true`
instead of the file in the repo (which says `false`). With `PUBLIC` true, test mode is off:
`?test=1` is ignored and Shift+T does nothing (`TEST_ALLOWED` in `ui/testmode.js`).

## Content-Security-Policy

The public site has a strict CSP. `server.js` sends the same kind of policy itself
(`default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'`), so
anything that breaks it shows up on 3001 first. Keep it that way:

- no inline `<script>` or `<style>`, no `style="..."` attributes, no `on...=` handlers;
- no `eval` / `new Function`;
- nothing from other sites (fonts, scripts, images, CDNs), no `data:` or `blob:` images;
- setting styles from JS through the CSSOM (`el.style.width = ...`) is fine.

## Switching back to the Snake game

The Snake game is untouched in `~/projects/test-game` (its own repo; its work worktree is
`~/projects/snake-td`). To put it back on snake.reasonwave.ai:

1. In `~/.autostart.sh`, swap the live-site lines back (the Snake line is kept there, commented
   out):
   ```sh
   cd ~/projects/test-game && exec node server.js >> server.log 2>&1
   ```
2. Restart the live server (step 3 of "ship it"); the entrypoint loop reruns `~/.autostart.sh`
   within 5 s.
3. `curl -s 127.0.0.1:3000/ | grep -i title` should show the Snake game's title.

Note that the Snake game's own dev setup (`~/projects/snake-td`) was on port 3001, which
Hollowlight's dev server now uses.

#!/bin/sh
# Re-renders every concept image and prints every number quoted in the docs.
# Needs CANVAS_MODULES and FONT_DIR (see README.md). Runs one script at a time to keep memory low.
set -e
cd "$(dirname "$0")/../../.."
for s in render-current render-directions render-compare render-new render-palette render-crowd; do
  echo "== $s"
  node "docs/concepts/_src/$s.mjs" | { grep -v '^wrote ' || true; }
done

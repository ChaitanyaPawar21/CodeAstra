#!/usr/bin/env bash
# Render markdown sources -> PDF via marked + Chrome headless.
# Usage: bash render.sh        (renders manual.pdf, context-log.pdf, and chapters/*.pdf)
# plan.md is intentionally NOT rendered — it's your editable working doc.
set -euo pipefail
cd "$(dirname "$0")"

CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
[ -x "$CHROME" ] || CHROME="/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"

# render <path-without-extension>   e.g. "manual" or "chapters/00-overview-architecture"
render() {
  local name="$1"
  local base; base="$(basename "$name")"
  local tmp; tmp="$(mktemp -d)"
  {
    cat <<'HTML'
<!doctype html><html><head><meta charset="utf-8"><style>
  @page { margin: 18mm 16mm; }
  body { font: 13px/1.55 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#1a1a1a; max-width:none; }
  h1 { font-size:24px; border-bottom:2px solid #333; padding-bottom:6px; }
  h2 { font-size:18px; margin-top:1.6em; border-bottom:1px solid #ddd; padding-bottom:3px; }
  h3 { font-size:14px; margin-top:1.2em; }
  code { background:#f2f2f2; padding:1px 4px; border-radius:3px; font-family:Consolas,Menlo,monospace; font-size:12px; }
  pre { background:#f6f8fa; border:1px solid #e1e4e8; border-radius:6px; padding:12px; overflow:auto; font-size:11px; line-height:1.4; page-break-inside:avoid; }
  pre code { background:none; padding:0; }
  table { border-collapse:collapse; width:100%; font-size:12px; margin:0.6em 0; }
  th,td { border:1px solid #ccc; padding:5px 8px; text-align:left; vertical-align:top; }
  th { background:#f2f2f2; }
  img { max-width:100%; border:1px solid #ddd; border-radius:6px; margin:0.5em 0; page-break-inside:avoid; }
  blockquote { border-left:3px solid #ccc; margin:0.8em 0; padding:2px 12px; color:#555; background:#fafafa; }
  a { color:#0a58ca; }
</style></head><body>
HTML
    # Rewrite ../.docs/ and ../../.docs/ (chapters live one level deeper) -> .docs/
    npx --yes marked -i "${name}.md" | sed -E 's#(\.\./)+\.docs/#.docs/#g'
    echo "</body></html>"
  } > "${tmp}/${base}.html"

  # Copy referenced architecture PNGs next to the html (paths rewritten to .docs/ above).
  mkdir -p "${tmp}/.docs"
  cp ../.docs/*.png "${tmp}/.docs/" 2>/dev/null || true

  # Chrome is native Windows -> needs Windows paths, not MSYS /tmp paths.
  local win_html win_pdf
  win_html="$(cygpath -w "${tmp}/${base}.html")"
  win_pdf="$(cygpath -w "$(pwd)/${name}.pdf")"

  "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
    --run-all-compositor-stages-before-draw --virtual-time-budget=4000 \
    --print-to-pdf="${win_pdf}" "${win_html}" 2>/dev/null

  rm -rf "$tmp"
  [ -f "${name}.pdf" ] && echo "  -> ${name}.pdf" || echo "  !! ${name}.pdf NOT created"
}

echo "Rendering PDFs..."
render manual
render context-log
for md in chapters/*.md; do
  render "${md%.md}"
done
echo "Done."

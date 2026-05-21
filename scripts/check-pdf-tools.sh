#!/usr/bin/env bash
set -u

tools=(
  pdfinfo
  pdftotext
  pdftoppm
  gs
  qpdf
)

echo "Optional PDF tool check"
echo "-----------------------"

missing=0

for tool in "${tools[@]}"; do
  if command -v "$tool" >/dev/null 2>&1; then
    printf "OK      %s\n" "$tool"
  else
    printf "MISSING %s (optional)\n" "$tool"
    missing=1
  fi
done

echo ""

if [ "$missing" -eq 1 ]; then
  echo "Some optional PDF tools are missing. This is fine unless you need PDF import, inspection, visual regression tests, or CI validation."
else
  echo "All optional PDF tools are available."
fi

exit 0

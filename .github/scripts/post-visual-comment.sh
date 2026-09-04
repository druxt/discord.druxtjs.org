#!/usr/bin/env bash
# Report visual-test failures as a sticky pull request comment, with the
# expected, actual and diff images visible in the thread.
#
# GitHub has no API for attaching an image to a comment: the drag-and-drop
# uploader in the web UI is session-authenticated and not reachable from a
# token. Images that are already reachable over HTTPS do render, though, so
# the PNGs are pushed to an orphan `visual-reports` branch and referenced by
# their raw.githubusercontent URL. That branch is never merged and never
# deployed - GitHub Pages publishes the default branch only.
#
# Run as the visual job's final step, whether it passed or failed.
set -uo pipefail

cd "$(dirname "$0")/../.." || exit 1

marker="<!-- visual-report -->"
results_dir="test-results"
branch="visual-reports"

mapfile -t actuals < <(find "$results_dir" -name "*-actual.png" -type f 2>/dev/null | sort)

if [ ${#actuals[@]} -eq 0 ]; then
  echo "No visual differences."
  bash .github/scripts/delete-pr-comment.sh "$marker" || true
  exit 0
fi

# One directory per run, so a re-run never shows a cached image from the last
# one. The PR's previous directories go, so the branch does not grow forever.
dest="pr-${PR_NUMBER}/${GITHUB_RUN_ID}"
work=$(mktemp -d)
repo_url="https://x-access-token:${GH_TOKEN}@github.com/${GH_REPO}.git"

if git clone --depth 1 --branch "$branch" "$repo_url" "$work" 2>/dev/null; then
  rm -rf "${work:?}/pr-${PR_NUMBER}"
else
  git init -q "$work"
  git -C "$work" checkout -q --orphan "$branch"
fi

mkdir -p "$work/$dest"
for actual in "${actuals[@]}"; do
  label=$(basename "$(dirname "$actual")" | sed 's/-retry[0-9]*$//')
  for kind in actual expected diff; do
    src="${actual%-actual.png}-${kind}.png"
    [ -f "$src" ] && cp "$src" "$work/$dest/${label}-${kind}.png"
  done
done

git -C "$work" config user.name "github-actions[bot]"
git -C "$work" config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git -C "$work" add -A
git -C "$work" commit -q -m "chore(visual): report for PR ${PR_NUMBER} run ${GITHUB_RUN_ID}"
git -C "$work" push -q "$repo_url" "$branch"

raw="https://raw.githubusercontent.com/${GH_REPO}/${branch}/${dest}"

body_file=$(mktemp)
{
  echo "$marker"
  echo "### Visual differences at \`${GITHUB_SHA:0:7}\`"
  echo
  echo "Baselines are per architecture. These were compared against the"
  echo "\`x64\` set, which is what this runner produces."
  echo
  for actual in "${actuals[@]}"; do
    label=$(basename "$(dirname "$actual")" | sed 's/-retry[0-9]*$//')
    echo "#### \`${label}\`"
    echo
    echo "| Baseline | Current | Diff |"
    echo "| --- | --- | --- |"
    echo -n "| <img src=\"${raw}/${label}-expected.png\" width=\"260\"> "
    echo -n "| <img src=\"${raw}/${label}-actual.png\" width=\"260\"> "
    echo "| <img src=\"${raw}/${label}-diff.png\" width=\"260\"> |"
    echo
  done
  echo "If the change is intended, regenerate the baselines with the manual"
  echo "\`Update visual baselines\` workflow (x64) and the \`visual:update\`"
  echo "job (arm64), then commit both sets."
} > "$body_file"

bash .github/scripts/upsert-pr-comment.sh "$marker" "$body_file"
rm -rf "$body_file" "$work"

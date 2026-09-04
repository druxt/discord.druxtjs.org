#!/usr/bin/env bash
# Report visual-test failures as a sticky merge request note, with the
# expected, actual and diff images inline.
#
# GitLab has an uploads API, so unlike the GitHub side this needs no report
# branch: the PNGs are attached to the project and referenced by the markdown
# the API hands back. Run as the visual job's after_script.
set -uo pipefail

cd "$(dirname "$0")/../.." || exit 1

# The note needs an API token. Without one the comparison still gates the
# pipeline; only the comment is lost, so say so rather than failing the job.
if [ -z "${GITLAB_API_TOKEN:-}" ]; then
  echo "GITLAB_API_TOKEN is not set - skipping the merge request note."
  exit 0
fi

marker="<!-- visual-failure -->"
results_dir="test-results"

mapfile -t actuals < <(find "$results_dir" -name "*-actual.png" -type f 2>/dev/null | sort)

if [ ${#actuals[@]} -eq 0 ]; then
  echo "No visual differences."
  bash .gitlab/scripts/delete-mr-note.sh "$marker" 2>/dev/null || true
  exit 0
fi

curl_retry=(curl -s --retry 3 --retry-delay 2 --max-time 30 --header "PRIVATE-TOKEN: $GITLAB_API_TOKEN")
upload_url="$CI_API_V4_URL/projects/$CI_PROJECT_ID/uploads"

upload() {
  "${curl_retry[@]}" --request POST --form "file=@$1" "$upload_url" \
    | node -e "
let body = '';
try { body = JSON.parse(require('fs').readFileSync(0, 'utf8')).markdown || ''; } catch {}
process.stdout.write(body);
"
}

body_file=$(mktemp)
{
  echo "$marker"
  echo "### Visual differences at \`${CI_COMMIT_SHORT_SHA:-unknown}\`"
  echo
  echo "Compared against the \`arm64\` baselines, which is what this runner"
  echo "produces. The \`x64\` set is regenerated on the GitHub side."
  echo
  for actual in "${actuals[@]}"; do
    label=$(basename "$(dirname "$actual")" | sed 's/-retry[0-9]*$//')
    expected="${actual%-actual.png}-expected.png"
    diff_file="${actual%-actual.png}-diff.png"

    expected_md=""
    [ -f "$expected" ] && expected_md=$(upload "$expected")
    actual_md=$(upload "$actual")
    diff_md=""
    [ -f "$diff_file" ] && diff_md=$(upload "$diff_file")

    echo "#### \`${label}\`"
    echo
    echo "| Baseline | Current | Diff |"
    echo "| --- | --- | --- |"
    echo "| ${expected_md:-missing} | ${actual_md:-missing} | ${diff_md:-missing} |"
    echo
  done
  echo "_If the change is intended, regenerate both baseline sets: the manual"
  echo "\`visual:update\` job here (arm64) and the \`Update visual baselines\`"
  echo "workflow on GitHub (x64)._"
} > "$body_file"

bash .gitlab/scripts/upsert-mr-note.sh "$marker" "$body_file"
rm -f "$body_file"

#!/usr/bin/env bash
# Upsert a pull request comment identified by a hidden HTML-comment marker.
# Usage: upsert-pr-comment.sh <marker> <body-file>
#
# Same idea as the GitLab note scripts: the marker is invisible in the
# rendered comment but findable through the API, so each run edits its own
# comment instead of adding another one.
set -euo pipefail

marker="$1"
body_file="$2"

existing_id=$(gh api "repos/$GH_REPO/issues/$PR_NUMBER/comments" --paginate \
  --jq "map(select(.body | contains(\"$marker\"))) | .[0].id // empty")

if [ -n "$existing_id" ]; then
  gh api --method PATCH "repos/$GH_REPO/issues/comments/$existing_id" \
    -F "body=@$body_file" >/dev/null
  echo "Updated comment $existing_id"
else
  gh api --method POST "repos/$GH_REPO/issues/$PR_NUMBER/comments" \
    -F "body=@$body_file" >/dev/null
  echo "Created comment"
fi

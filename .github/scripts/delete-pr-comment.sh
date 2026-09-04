#!/usr/bin/env bash
# Delete a pull request comment identified by a hidden HTML-comment marker,
# if one exists. Usage: delete-pr-comment.sh <marker>
set -euo pipefail

marker="$1"

existing_id=$(gh api "repos/$GH_REPO/issues/$PR_NUMBER/comments" --paginate \
  --jq "map(select(.body | contains(\"$marker\"))) | .[0].id // empty")

if [ -n "$existing_id" ]; then
  gh api --method DELETE "repos/$GH_REPO/issues/comments/$existing_id"
  echo "Deleted stale comment $existing_id"
fi

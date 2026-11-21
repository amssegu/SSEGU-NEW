#!/usr/bin/env bash
set -euo pipefail

snapshot_path=${1:?usage: push-work-snapshot.sh SNAPSHOT_PATH}
git config user.name 'github-actions[bot]'
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
git add "$snapshot_path"

if git diff --cached --quiet; then
  echo 'changed=false' >> "$GITHUB_OUTPUT"
  exit 0
fi

git commit -m "Update ${snapshot_path##*/} work snapshot"
for attempt in 1 2 3 4 5; do
  if git push origin HEAD:main; then
    echo 'changed=true' >> "$GITHUB_OUTPUT"
    exit 0
  fi
  git fetch origin main
  git rebase origin/main
done

echo 'failed to push work snapshot after five attempts' >&2
exit 1

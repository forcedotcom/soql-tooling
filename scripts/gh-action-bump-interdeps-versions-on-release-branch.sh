#!/usr/bin/env bash
set -e

RELEASE_BRANCH_PREFIX=$1
if [ -z "$RELEASE_BRANCH_PREFIX" ]; then
  echo "Must release branch prefix to filter out the PRs"
  exit 1
fi
echo RELEASE_BRANCH_PREFIX=$RELEASE_BRANCH_PREFIX

gh --version
PR_LIST_FILE=$(mktemp)
gh pr list --label "autorelease: pending" |grep ${RELEASE_BRANCH_PREFIX} >> $PR_LIST_FILE
PR_COUNT=$(cat $PR_LIST_FILE | wc -l)

echo PR_COUNT:$PR_COUNT
if [ $PR_COUNT -ne 1 ]; then
  echo "Error: the given pattern must match one and only one PR"
  exit 2
fi

PR=$(cat $PR_LIST_FILE | cut -f 1)
rm $PR_LIST_FILE
echo "PR is ${PR}"

gh pr checkout $PR
echo "Updating internal dependencies..."
./scripts/update-interdependency-versions.js packages/*/package*.json
if ! git diff --ignore-all-space --exit-code; then
  git config --local user.email "$(git log --format='%ae' HEAD^!)"
  git config --local user.name "$(git log --format='%an' HEAD^!)"
  git commit -a -m "chore: bump version of internal dependencies"
  git push
else
  echo "No version changes"
fi

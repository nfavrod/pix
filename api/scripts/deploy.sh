#! /bin/bash
set -e

BUILD_ENV=$1
GIT_BRANCH=$2

case $BUILD_ENV in
  "integration")
    if [ -n "$GIT_BRANCH" ]
    then
      cd ..
      # Save HEAD commit SHA1
      current_sha1=$(git rev-parse HEAD)

      # Create new orphan branch (no commits)
      git branch -D temporary-branch-for-deployment 2>/dev/null || true
      git checkout --orphan temporary-branch-for-deployment

      # Commit current index, quietly, skipping commit hooks, reusing commit info from previous HEAD
      git commit --quiet --no-verify -C${current_sha1}

      # Replace the root with the contents of api/ (will only rewrite one commit)
      git filter-branch --force --prune-empty --subdirectory-filter api temporary-branch-for-deployment

      # Push our streamlined commit to dokku
      git push --force dokku@pix-app.ovh:${GIT_BRANCH} temporary-branch-for-deployment:master
    fi
  ;;
  "staging")
    git remote add scalingo git@scalingo.com:pix-api-staging.git
    git push --force scalingo dev:master
  ;;
  "production")
    git remote add scalingo git@scalingo.com:pix-api-production.git
    git push scalingo master:master
  ;;
esac

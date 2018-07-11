#! /bin/bash
set -e

BUILD_ENV=$1
GIT_BRANCH=$2

case $BUILD_ENV in
  "integration")
    if [ -n "$GIT_BRANCH" ]
    then
      cd ..

      # Create Dokku app
      ssh dokku@pix-app.ovh apps:report "$GIT_BRANCH" || ssh dokku@pix-app.ovh apps:create "$GIT_BRANCH"
      ssh dokku@pix-app.ovh config:set --no-restart "$GIT_BRANCH" NODE_ENV=integration

      # Destroy existing PG database
      if ssh dokku@pix-app.ovh postgres:info "$GIT_BRANCH"; then
        ssh dokku@pix-app.ovh ps:stop "$GIT_BRANCH" || true
        ssh dokku@pix-app.ovh postgres:unlink "$GIT_BRANCH" "$GIT_BRANCH" || true
        ssh dokku@pix-app.ovh postgres:destroy "$GIT_BRANCH" --force || true
      fi

      # Create PG database
      ssh dokku@pix-app.ovh postgres:create "$GIT_BRANCH"

      # Link PG database to our app
      ssh dokku@pix-app.ovh postgres:link "$GIT_BRANCH" "$GIT_BRANCH"

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

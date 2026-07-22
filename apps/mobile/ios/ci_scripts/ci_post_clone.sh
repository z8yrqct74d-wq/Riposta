#!/bin/sh
set -eo pipefail

echo "== ci_post_clone.sh starting =="

# Xcode Cloud Mac images ship Homebrew but not Node.js by default.
NODE_MAJOR=$(cat "$CI_PRIMARY_REPOSITORY_PATH/apps/mobile/.nvmrc")
brew install node@"$NODE_MAJOR"
export PATH="/opt/homebrew/opt/node@$NODE_MAJOR/bin:$PATH"
node --version
npm --version

# $CI_PRIMARY_REPOSITORY_PATH is the monorepo root (Apple-documented CI var).
# npm ci at the root resolves @riposte/core for the mobile workspace.
cd "$CI_PRIMARY_REPOSITORY_PATH"
npm ci

cd apps/mobile/ios
pod install --repo-update

echo "== ci_post_clone.sh done =="

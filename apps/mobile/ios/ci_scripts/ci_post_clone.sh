#!/bin/bash
# Xcode Cloud runs this right after cloning, before it resolves dependencies.
# It has to leave the machine with: Node (major version pinned by
# apps/mobile/.nvmrc), CocoaPods, an installed npm workspace tree, and a
# generated Riposte.xcworkspace.
set -euo pipefail

log()  { echo "[ci_post_clone] $*"; }
fail() { echo "[ci_post_clone] error: $*" >&2; exit 1; }

log "== starting =="

# ---------------------------------------------------------------- repo root --
# $CI_PRIMARY_REPOSITORY_PATH is the monorepo root (Apple-documented CI var).
# Fall back to walking up from this script so it stays runnable by hand:
# ios/ci_scripts -> ios -> mobile -> apps -> root.
REPO_ROOT="${CI_PRIMARY_REPOSITORY_PATH:-}"
if [ -z "$REPO_ROOT" ]; then
  REPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
  log "CI_PRIMARY_REPOSITORY_PATH is unset — falling back to $REPO_ROOT"
fi
[ -f "$REPO_ROOT/package.json" ] || fail "no package.json at $REPO_ROOT — wrong repo root"

MOBILE_DIR="$REPO_ROOT/apps/mobile"
NVMRC="$MOBILE_DIR/.nvmrc"
[ -f "$NVMRC" ] || fail "missing $NVMRC — it pins the Node major version"
NODE_MAJOR="$(tr -d '[:space:]' < "$NVMRC" | sed 's/^v//' | cut -d. -f1)"
[ -n "$NODE_MAJOR" ] || fail "could not read a Node major version out of $NVMRC"
log "Node major pinned by .nvmrc: $NODE_MAJOR"

# --------------------------------------------------------------------- node --
# Xcode Cloud's Mac images don't ship Node.js. Install the official build
# straight from nodejs.org: no Homebrew formula naming to keep in sync, no
# `brew update` in the critical path, and a checksum we can verify. Homebrew
# stays as a fallback in case nodejs.org is unreachable.
node_major_of() { "$1" --version 2>/dev/null | sed 's/^v//' | cut -d. -f1; }

install_node_from_nodejs_org() {
  local arch tarball url version_dir dest tmp
  case "$(uname -m)" in
    arm64)  arch="darwin-arm64" ;;
    x86_64) arch="darwin-x64" ;;
    *)      log "unsupported architecture $(uname -m)"; return 1 ;;
  esac

  version_dir="https://nodejs.org/dist/latest-v${NODE_MAJOR}.x"
  tmp="$(mktemp -d)"

  curl -fsSL --retry 3 --retry-delay 2 -o "$tmp/SHASUMS256.txt" "$version_dir/SHASUMS256.txt" || return 1
  tarball="$(grep -o "node-v${NODE_MAJOR}\.[0-9.]*-${arch}\.tar\.xz" "$tmp/SHASUMS256.txt" | head -1)"
  [ -n "$tarball" ] || { log "no ${arch} build listed for Node ${NODE_MAJOR}.x"; return 1; }

  url="$version_dir/$tarball"
  log "downloading $url"
  curl -fsSL --retry 3 --retry-delay 2 -o "$tmp/$tarball" "$url" || return 1
  ( cd "$tmp" && grep " $tarball\$" SHASUMS256.txt | shasum -a 256 -c - ) \
    || { log "checksum mismatch for $tarball"; return 1; }

  dest="$HOME/.ci-node"
  rm -rf "$dest"
  mkdir -p "$dest"
  tar -xJf "$tmp/$tarball" -C "$dest" --strip-components=1 || return 1
  rm -rf "$tmp"

  export PATH="$dest/bin:$PATH"
}

install_node_from_homebrew() {
  command -v brew >/dev/null 2>&1 || { log "Homebrew is not available"; return 1; }
  export HOMEBREW_NO_AUTO_UPDATE=1
  export HOMEBREW_NO_INSTALL_CLEANUP=1
  brew install "node@$NODE_MAJOR" || return 1
  # node@N is keg-only, so it is never symlinked into the prefix's bin. Ask
  # brew for its prefix rather than hardcoding /opt/homebrew — Intel images
  # use /usr/local.
  export PATH="$(brew --prefix)/opt/node@$NODE_MAJOR/bin:$PATH"
}

if command -v node >/dev/null 2>&1 && [ "$(node_major_of node)" = "$NODE_MAJOR" ]; then
  log "Node $NODE_MAJOR already on PATH at $(command -v node)"
elif install_node_from_nodejs_org; then
  log "installed Node from nodejs.org"
elif install_node_from_homebrew; then
  log "installed Node from Homebrew"
else
  fail "could not install Node $NODE_MAJOR"
fi

command -v node >/dev/null 2>&1 || fail "node is still not on PATH after install"
command -v npm  >/dev/null 2>&1 || fail "npm is still not on PATH after install"
[ "$(node_major_of node)" = "$NODE_MAJOR" ] \
  || fail "expected Node $NODE_MAJOR, got $(node --version)"
log "node $(node --version) / npm $(npm --version) at $(command -v node)"

# The archive's "Bundle React Native code and images" build phase sources
# ios/.xcode.env, whose `command -v node` runs with Xcode's PATH — which does
# not include the Node installed above. Pin the absolute path in
# .xcode.env.local (gitignored, sourced after .xcode.env) so that phase
# resolves the same binary this script used.
NODE_BINARY_PATH="$(command -v node)"
echo "export NODE_BINARY=$NODE_BINARY_PATH" > "$MOBILE_DIR/ios/.xcode.env.local"
log "wrote ios/.xcode.env.local with NODE_BINARY=$NODE_BINARY_PATH"

# ---------------------------------------------------------------- cocoapods --
# Not preinstalled on Xcode Cloud images — Apple's own sample post-clone script
# brew-installs it.
if command -v pod >/dev/null 2>&1; then
  log "CocoaPods already available: $(pod --version)"
elif command -v brew >/dev/null 2>&1; then
  log "installing CocoaPods via Homebrew"
  export HOMEBREW_NO_AUTO_UPDATE=1
  export HOMEBREW_NO_INSTALL_CLEANUP=1
  brew install cocoapods || fail "brew install cocoapods failed"
else
  fail "CocoaPods is missing and Homebrew is not available to install it"
fi

# --------------------------------------------------------------- npm + pods --
# npm ci at the root resolves @riposte/core for the mobile workspace.
log "npm ci at $REPO_ROOT"
cd "$REPO_ROOT"
npm ci || fail "npm ci failed"

log "pod install in apps/mobile/ios"
cd "$MOBILE_DIR/ios"
pod install --repo-update || fail "pod install failed"

log "== done =="

#!/bin/bash
# Run this ONCE after 'npx cap add ios' to register the OAuth URL scheme.
# Usage: bash scripts/ios-setup.sh

set -e
PLIST="ios/App/App/Info.plist"

if [ ! -f "$PLIST" ]; then
  echo "Error: $PLIST not found. Run 'npx cap add ios' first." >&2
  exit 1
fi

PB="/usr/libexec/PlistBuddy"
"$PB" -c "Add :CFBundleURLTypes array" "$PLIST" 2>/dev/null || true
"$PB" -c "Add :CFBundleURLTypes:0 dict" "$PLIST" 2>/dev/null || true
"$PB" -c "Add :CFBundleURLTypes:0:CFBundleURLSchemes array" "$PLIST" 2>/dev/null || true
"$PB" -c "Add :CFBundleURLTypes:0:CFBundleURLSchemes:0 string riposte" "$PLIST" 2>/dev/null || true
"$PB" -c "Add :CFBundleURLTypes:0:CFBundleURLName string ro.sportriposta.riposte" "$PLIST" 2>/dev/null || true

echo "✓ URL scheme 'riposte://' registered in $PLIST"

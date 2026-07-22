#!/bin/sh
# Writes .env from the Xcode Cloud workflow's environment variables before
# the archive's "Bundle React Native code" build phase runs Metro. Apple's
# docs only guarantee custom-build-script env vars reach *scripts*, not
# necessarily that build phase — writing .env guarantees Expo's own
# @expo/env loader picks the values up regardless of that propagation.
set -eo pipefail

cd "$CI_PRIMARY_REPOSITORY_PATH/apps/mobile"
cat > .env <<EOF
EXPO_PUBLIC_SUPABASE_URL=${EXPO_PUBLIC_SUPABASE_URL}
EXPO_PUBLIC_SUPABASE_ANON_KEY=${EXPO_PUBLIC_SUPABASE_ANON_KEY}
EOF

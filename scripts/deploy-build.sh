#!/bin/bash
set -e
# Build the API server TypeScript → dist/ before deployment starts.
# This must run on every deploy so events routes (and any future changes) are included.
pnpm --filter @workspace/api-server run build
# Clean up pnpm store to reduce deployment size
pnpm store prune

#!/usr/bin/env bash
# Cloudflare build: OpenNext build (required for Workers deploy)
# Use this as Build command in Cloudflare: bash scripts/cloudflare-build.sh
set -e
npx opennextjs-cloudflare build

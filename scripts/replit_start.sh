#!/usr/bin/env bash
set -euo pipefail

echo "[replit] installing dependencies (mobile + api)"
npm --prefix apps/mobile install
npm --prefix services/api install

echo "[replit] building Expo web"
npm --prefix apps/mobile run web:build

echo "[replit] starting static web server on PORT=${PORT:-3000}"
node scripts/serve_mobile_web.mjs


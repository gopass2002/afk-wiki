#!/usr/bin/env bash
set -euo pipefail

readonly ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly BASE_PATH="${1:-/afk-wiki}"
readonly SITE_DIR="${ROOT_DIR}/_site"

cd "${ROOT_DIR}"
node tools/verify-data.mjs
node tools/verify-media.mjs
bundle exec jekyll build --baseurl "${BASE_PATH}" --destination "${SITE_DIR}"
node tools/verify-site.mjs "${SITE_DIR}" "${BASE_PATH}"

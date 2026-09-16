#!/usr/bin/env bash
set -euo pipefail

# Run git commit with project commit-msg hooks (blocks Co-authored-by trailers).
exec git -c core.hooksPath=.githooks commit "$@"

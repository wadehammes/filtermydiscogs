#!/usr/bin/env bash
# Shared helpers for Cursor hooks.

hook_input() {
  INPUT="$(cat)"
}

project_dir() {
  local from_input
  from_input="$(printf '%s' "$INPUT" | jq -r '.cwd // empty')"
  if [ -n "$from_input" ]; then
    printf '%s' "$from_input"
  else
    pwd
  fi
}

tool_file_path() {
  printf '%s' "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""'
}

tool_added_text() {
  printf '%s' "$INPUT" | jq -r '
    [
      .tool_input.new_string?,
      .tool_input.content?,
      .tool_input.string?,
      (.tool_input.edits[]?.new_string)
    ]
    | map(select(. != null))
    | join("\n")
  '
}

abs_path() {
  local file="$1"
  local root
  root="$(project_dir)"
  case "$file" in
    /*) printf '%s' "$file" ;;
    *) printf '%s' "$root/$file" ;;
  esac
}

deny_tool() {
  local reason="$1"
  jq -n --arg r "$reason" '{
    permission: "deny",
    user_message: $r,
    agent_message: $r
  }'
}

advise_context() {
  local ctx="$1"
  jq -n --arg c "$ctx" '{ additional_context: $c }'
}

emit_followup() {
  local reason="$1"
  jq -n --arg r "$reason" '{ followup_message: $r }'
}

hook_loop_count() {
  printf '%s' "$INPUT" | jq -r '.loop_count // 0'
}

hook_cwd() {
  printf '%s' "$INPUT" | jq -r '.cwd // empty'
}

# Sanitized id for per-conversation stop-hook state under .cursor/hooks-state/ (gitignored).
hook_conversation_id() {
  printf '%s' "$INPUT" | jq -r '.conversation_id // .generation_id // "unknown"' | tr -cd 'a-zA-Z0-9._-'
}

stop_state_file() {
  local root state_dir
  root="${STOP_ROOT:-$(hook_cwd)}"
  [ -z "$root" ] && root="$(pwd)"
  state_dir="$root/.cursor/hooks-state"
  mkdir -p "$state_dir"
  printf '%s/%s.json' "$state_dir" "$(hook_conversation_id)"
}

# All changed paths: committed diff, staged, and untracked (deduped).
changed_files_worktree() {
  {
    git diff --name-only HEAD 2>/dev/null
    git diff --cached --name-only 2>/dev/null
    git ls-files --others --exclude-standard 2>/dev/null
  } | sort -u
}

files_fingerprint() {
  printf '%s' "$1" | shasum -a 256 | awk '{print $1}'
}

# True when this check already emitted a follow-up for the same worktree fingerprint.
stop_notified_for_fingerprint() {
  local key="$1" fp="$2"
  local state_file stored
  state_file="$(stop_state_file)"
  [ ! -f "$state_file" ] && return 1
  stored="$(jq -r --arg k "$key" '.notified[$k] // empty' "$state_file" 2>/dev/null || true)"
  [ -n "$stored" ] && [ "$stored" = "$fp" ]
}

stop_mark_notified() {
  local key="$1" fp="$2"
  local state_file tmp
  state_file="$(stop_state_file)"
  tmp="$(mktemp)"
  if [ -f "$state_file" ]; then
    jq --arg k "$key" --arg fp "$fp" '.notified[$k] = $fp' "$state_file" >"$tmp"
  else
    jq -n --arg k "$key" --arg fp "$fp" '{notified: {($k): $fp}}' >"$tmp"
  fi
  mv "$tmp" "$state_file"
}

stop_clear_notified() {
  local key="$1"
  local state_file tmp
  state_file="$(stop_state_file)"
  [ ! -f "$state_file" ] && return 0
  tmp="$(mktemp)"
  jq --arg k "$key" 'del(.notified[$k])' "$state_file" >"$tmp"
  mv "$tmp" "$state_file"
}

# Cursor hook shells often still have asdf shims on PATH. Prefer mise so
# project .tool-versions / mise.toml resolve (same as interactive zsh).
run_pnpm() {
  if [ -x "${HOME}/.local/bin/mise" ]; then
    "${HOME}/.local/bin/mise" exec -- pnpm "$@"
  elif command -v mise >/dev/null 2>&1; then
    mise exec -- pnpm "$@"
  elif command -v pnpm >/dev/null 2>&1; then
    command pnpm "$@"
  else
    return 127
  fi
}

# Map a changed repo-relative path to handbook chapter filenames (space-separated, unique).
# Used by stop-hook drift checks and optional postToolUse nudges.
handbook_chapters_for_path() {
  local file="$1"
  local chapters=()

  case "$file" in
    docs/handbook/*)
      return 0
      ;;
    .jest/*)
      chapters+=("conventions.md" "platform.md")
      ;;
    jest.config.ts | jest.config.js | jest.config.mjs)
      chapters+=("platform.md" "conventions.md")
      ;;
    e2e/*)
      chapters+=("platform.md" "conventions.md")
      ;;
    playwright.config.ts)
      chapters+=("platform.md")
      ;;
    next.config.ts | next.config.js | next.config.mjs)
      chapters+=("platform.md")
      ;;
    src/tests/msw/*)
      chapters+=("conventions.md" "platform.md" "factories.md")
      ;;
    src/tests/factories/*)
      chapters+=("factories.md")
      ;;
    src/components/Crates/* | src/lib/crate-layout* | src/lib/crate-section-layout*)
      chapters+=("database.md" "source-layout.md" "conventions.md" "factories.md")
      ;;
    *.spec.ts | *.spec.tsx)
      chapters+=("conventions.md")
      ;;
    *.module.css)
      chapters+=("conventions.md")
      ;;
    src/app/api/*)
      chapters+=("database.md" "patterns.md")
      ;;
    src/app/*)
      chapters+=("patterns.md")
      ;;
    src/components/*)
      chapters+=("components.md")
      ;;
    src/hooks/* | src/context/* | src/atoms/*)
      chapters+=("patterns.md")
      ;;
    src/lib/* | prisma/*)
      chapters+=("database.md")
      ;;
  esac

  if [ "${#chapters[@]}" -eq 0 ]; then
    chapters+=("conventions.md")
  fi

  printf '%s\n' "${chapters[@]}" | awk '!seen[$0]++' | tr '\n' ' '
}


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


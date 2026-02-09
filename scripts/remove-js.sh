#!/usr/bin/env bash
set -euo pipefail

# Remove .js files throughout the repo (safe defaults)
# Usage:
#   ./scripts/remove-js.sh --dry-run   # show files that would be removed
#   ./scripts/remove-js.sh --yes       # remove without confirmation

DRY_RUN=0
FORCE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    -n|--dry-run) DRY_RUN=1; shift ;;
    -y|--yes) FORCE=1; shift ;;
    -h|--help)
      sed -n '1,120p' "$0"
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 2 ;;
  esac
done

EXCLUDES=(
  "./node_modules"
  "./.git"
  "./dist"
  "./playwright-report"
  "./test-results"
  "./workspace"
)

EXCLUDE_ARGS=()
for ex in "${EXCLUDES[@]}"; do
  EXCLUDE_ARGS+=( -not -path "${ex}/*" )
done

# Build the find command and run
if [[ ${#EXCLUDE_ARGS[@]} -gt 0 ]]; then
  echo "Searching for .js files (excluding: ${EXCLUDES[*]})"
  if [[ $DRY_RUN -eq 1 ]]; then
    find . -type f -name "*.js" "${EXCLUDE_ARGS[@]}" -print
    exit 0
  fi
  mapfile -t FILES_TO_DELETE < <(find . -type f -name "*.js" "${EXCLUDE_ARGS[@]}" -print)
else
  if [[ $DRY_RUN -eq 1 ]]; then
    find . -type f -name "*.js" -print
    exit 0
  fi
  mapfile -t FILES_TO_DELETE < <(find . -type f -name "*.js" -print)
fi

if [[ ${#FILES_TO_DELETE[@]} -eq 0 ]]; then
  echo "No .js files found (after excluding common folders)."
  exit 0
fi

echo "Found ${#FILES_TO_DELETE[@]} .js files to remove."

if [[ $FORCE -ne 1 ]]; then
  printf '%s\n' "${FILES_TO_DELETE[@]}"
  printf '\nConfirm deletion? (y/N): '
  read -r ans
  if [[ "$ans" != "y" ]]; then
    echo "Aborted by user."
    exit 0
  fi
fi

for f in "${FILES_TO_DELETE[@]}"; do
  rm -v -- "$f"
done

echo "Done."

#!/usr/bin/env bash
# Ensure the exact pnpm version pinned by package.json is available.
# Source this file to add the validated pnpm binary directory to the caller's PATH.
# A fresh Freebuff workspace installs the pin into $HOME/.local when necessary.

_bootstrap_pnpm_entry() {
  local script_dir repo_root package_manager pnpm_version path_pnpm candidate candidate_version pnpm_bin="" bootstrap_bin_dir

  script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)" || {
    printf '❌ pnpm bootstrap: could not resolve the script directory\n' >&2
    return 1
  }
  repo_root="$(cd -- "$script_dir/.." && pwd -P)" || {
    printf '❌ pnpm bootstrap: could not resolve the repository root\n' >&2
    return 1
  }
  if [[ ! -f "$repo_root/package.json" ]]; then
    printf '❌ pnpm bootstrap: no package.json found in %s\n' "$repo_root" >&2
    return 1
  fi

  if ! package_manager="$(cd -- "$repo_root" && node -p "require('./package.json').packageManager || ''" 2>/dev/null)"; then
    printf '❌ pnpm bootstrap: could not read package.json#packageManager\n' >&2
    return 1
  fi
  if [[ "$package_manager" != pnpm@* ]]; then
    printf '❌ pnpm bootstrap: package.json must pin the package manager, e.g. "packageManager": "pnpm@10.30.3" (found: %s)\n' "$package_manager" >&2
    return 1
  fi

  pnpm_version="${package_manager#pnpm@}"
  if [[ ! "$pnpm_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    printf '❌ pnpm bootstrap: packageManager must pin an exact pnpm version, e.g. "pnpm@10.30.3" (found: %s)\n' "$package_manager" >&2
    return 1
  fi

  path_pnpm="$(type -P pnpm 2>/dev/null || true)"
  for candidate in "$path_pnpm" "$HOME/.local/bin/pnpm"; do
    # Ignore relative PATH results: they can resolve through the working directory.
    [[ "$candidate" == /* && -x "$candidate" ]] || continue
    if candidate_version="$("$candidate" --version 2>/dev/null)" && [[ "$candidate_version" == "$pnpm_version" ]]; then
      pnpm_bin="$candidate"
      break
    fi
  done

  if [[ -z "$pnpm_bin" ]]; then
    printf 'Installing pnpm %s into %s/.local ...\n' "$pnpm_version" "$HOME" >&2
    if ! npm install -g "pnpm@$pnpm_version" --prefix "$HOME/.local" >&2; then
      printf '❌ pnpm bootstrap: could not install pnpm %s into %s/.local\n' "$pnpm_version" "$HOME" >&2
      return 1
    fi
    pnpm_bin="$HOME/.local/bin/pnpm"
    if [[ ! -x "$pnpm_bin" ]] || ! candidate_version="$("$pnpm_bin" --version 2>/dev/null)" || [[ "$candidate_version" != "$pnpm_version" ]]; then
      printf '❌ pnpm bootstrap: installed pnpm does not report version %s\n' "$pnpm_version" >&2
      return 1
    fi
  fi

  bootstrap_bin_dir="$(dirname -- "$pnpm_bin")" || {
    printf '❌ pnpm bootstrap: could not determine directory of pnpm binary (%s)\n' "$pnpm_bin" >&2
    return 1
  }
  if [[ -z "$bootstrap_bin_dir" || "$bootstrap_bin_dir" == "." || "$bootstrap_bin_dir" != /* ]]; then
    printf '❌ pnpm bootstrap: refusing unsafe pnpm binary directory (%s)\n' "$bootstrap_bin_dir" >&2
    return 1
  fi
  bootstrap_bin_dir="$(cd -- "$bootstrap_bin_dir" && pwd -P)" || {
    printf '❌ pnpm bootstrap: could not resolve pnpm binary directory (%s)\n' "$bootstrap_bin_dir" >&2
    return 1
  }
  if [[ -z "$bootstrap_bin_dir" || "$bootstrap_bin_dir" != /* ]]; then
    printf '❌ pnpm bootstrap: refusing unsafe pnpm binary directory (%s)\n' "$bootstrap_bin_dir" >&2
    return 1
  fi

  if [[ -n "$PATH" ]]; then
    export PATH="$bootstrap_bin_dir:$PATH"
  else
    export PATH="$bootstrap_bin_dir"
  fi
  printf '✅ Using pnpm %s (%s)\n' "$pnpm_version" "$pnpm_bin"
  return 0
}

# Keep helper state private to the function; remove it before returning to a sourced caller.
if _bootstrap_pnpm_entry; then
  unset -f _bootstrap_pnpm_entry
  if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    return 0
  fi
  exit 0
else
  unset -f _bootstrap_pnpm_entry
  if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    return 1
  fi
  exit 1
fi

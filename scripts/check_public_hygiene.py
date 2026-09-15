#!/usr/bin/env python3
"""Fail-closed hygiene checks for the public submission repository.

The gate intentionally focuses on classes of files/secrets/infrastructure hints
that should never be committed here. It does not replace a human privacy/IP or
brand-rights review.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from urllib.parse import unquote


FORBIDDEN_SUFFIXES = {
    ".wav", ".mp3", ".flac", ".m4a", ".ogg",
    ".ipynb", ".pt", ".pth", ".ckpt", ".joblib", ".pkl", ".pickle",
    ".parquet", ".zip", ".7z", ".rar",
}

FORBIDDEN_NAMES = {
    ".env", ".env.local", ".env.production",
    ".htpasswd", ".htpasswd.example",
    "id_rsa", "id_ed25519", "credentials.json", "service-account.json",
    # Bank trademark assets are not stored in public Git unless publication
    # rights are explicitly confirmed. Textual references to the case are fine.
    "Gazprombank.svg",
}

SKIP_DIRS = {
    ".git", ".venv", "venv", "__pycache__", ".pytest_cache", ".mypy_cache",
    ".ruff_cache", "dist", "build",
}

SENSITIVE_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("private_key", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----")),
    ("github_classic_token", re.compile(r"\bghp_[A-Za-z0-9]{30,}\b")),
    ("github_fine_grained_token", re.compile(r"\bgithub_pat_[A-Za-z0-9_]{40,}\b")),
    ("internal_colab_drive_path", re.compile("/content/drive/" + "MyDrive/")),
    # Public source/docs should not contain a live deployment hostname. Use
    # documented placeholders (example.com) and inject the real value at deploy.
    ("deployment_host_sslip", re.compile(r"\b(?:[a-z0-9-]+\.)?sslip\.io\b", re.I)),
)

MARKDOWN_LINK_RE = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")


def iter_repo_files(root: Path):
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        try:
            relative = path.relative_to(root)
        except ValueError:
            continue
        if any(part in SKIP_DIRS for part in relative.parts):
            continue
        yield path, relative


def check_forbidden_files(root: Path) -> list[str]:
    errors: list[str] = []
    for path, relative in iter_repo_files(root):
        if path.name in FORBIDDEN_NAMES:
            errors.append(f"forbidden file name: {relative}")
        if path.suffix.lower() in FORBIDDEN_SUFFIXES:
            errors.append(f"forbidden public artifact type: {relative}")
    return errors


def _read_text(path: Path) -> str | None:
    try:
        raw = path.read_bytes()
    except OSError:
        return None
    if b"\x00" in raw:
        return None
    try:
        return raw.decode("utf-8")
    except UnicodeDecodeError:
        return None


def check_sensitive_text(root: Path) -> list[str]:
    errors: list[str] = []
    for path, relative in iter_repo_files(root):
        text = _read_text(path)
        if text is None:
            continue
        for label, pattern in SENSITIVE_PATTERNS:
            if pattern.search(text):
                errors.append(f"sensitive pattern {label}: {relative}")
    return errors


def _clean_link_target(raw_target: str) -> str | None:
    target = raw_target.strip()
    if not target:
        return None
    if target.startswith("<") and target.endswith(">"):
        target = target[1:-1].strip()
    lower = target.lower()
    if lower.startswith(("http://", "https://", "mailto:", "tel:", "data:")):
        return None
    if target.startswith("#"):
        return None
    target = target.split("#", 1)[0].split("?", 1)[0]
    if not target:
        return None
    return unquote(target)


def check_markdown_links(root: Path) -> list[str]:
    errors: list[str] = []
    resolved_root = root.resolve()
    for path, relative in iter_repo_files(root):
        if path.suffix.lower() != ".md":
            continue
        text = _read_text(path)
        if text is None:
            continue
        for match in MARKDOWN_LINK_RE.finditer(text):
            cleaned = _clean_link_target(match.group(1))
            if cleaned is None:
                continue
            candidate = (path.parent / cleaned).resolve()
            try:
                candidate.relative_to(resolved_root)
            except ValueError:
                errors.append(f"markdown link escapes repository: {relative} -> {cleaned}")
                continue
            if not candidate.exists():
                errors.append(f"broken markdown link: {relative} -> {cleaned}")
    return errors


def run(root: Path) -> list[str]:
    root = root.resolve()
    errors: list[str] = []
    errors.extend(check_forbidden_files(root))
    errors.extend(check_sensitive_text(root))
    errors.extend(check_markdown_links(root))
    return sorted(set(errors))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", nargs="?", type=Path, default=Path.cwd())
    args = parser.parse_args()

    errors = run(args.root)
    if errors:
        print("PUBLIC HYGIENE: FAIL")
        for error in errors:
            print(f"- {error}")
        return 1

    print("PUBLIC HYGIENE: PASS")
    print("Checked forbidden artifacts, obvious secrets/infrastructure hints and relative Markdown links.")
    print("Human privacy/IP/brand review is still required for new public content and commit messages.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

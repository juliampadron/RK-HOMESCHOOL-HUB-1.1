#!/usr/bin/env python3
"""
sort_files.py – Renaissance Kids Homeschool Hub file organiser.

Scans every file in the repository (skipping .git / .github) and classifies
each one as:

  auto_generated  – structured YAML/JSON with rich metadata blocks, version
                    numbers, or standardised keys that suggest a tool like
                    Microsoft 365 Copilot produced or scaffolded the file.
  personal        – plain-markdown or lightly-structured files that appear to
                    have been written by hand.
  system          – database migrations, CI configs, and other infrastructure
                    files that are neither content templates nor personal notes.

A sorted report is printed to the console and written to file_sort_report.md.
"""

import os
import re
import textwrap
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).parent
SKIP_DIRS = {".git", ".github"}
REPORT_FILE = REPO_ROOT / "file_sort_report.md"

# Keys that strongly suggest a machine-generated / Copilot-style template.
AUTO_GENERATED_YAML_KEYS = {
    "metadata",
    "branding",
    "layout",
    "version",
    "standards",
    "grade_range",
    "duration_minutes",
    "created",
    "template",
}

# File extensions recognised as system / infrastructure files.
SYSTEM_EXTENSIONS = {".sql", ".json", ".toml", ".ini", ".cfg", ".env"}

# File extensions recognised as system by their parent directory names.
SYSTEM_DIRS = {"migrations", "supabase"}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _read_text(path: Path) -> str:
    """Return file contents as a string, ignoring decode errors."""
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def _has_auto_generated_markers(text: str) -> bool:
    """
    Return True when the file content contains multiple structural markers
    that are characteristic of a tool-generated template (rich YAML metadata
    block, version fields, standards lists, branding sections, etc.).
    """
    found = 0
    for key in AUTO_GENERATED_YAML_KEYS:
        # Match the key at the start of a YAML line (e.g. "  version: " or "version:")
        if re.search(rf"^\s*{re.escape(key)}\s*:", text, re.MULTILINE | re.IGNORECASE):
            found += 1
    # Two or more auto-generated markers → classify as auto_generated.
    return found >= 2


def classify_file(path: Path) -> str:
    """
    Return one of 'auto_generated', 'personal', or 'system' for *path*.
    """
    suffix = path.suffix.lower()
    parts = {p.lower() for p in path.parts}

    # ── System files ──────────────────────────────────────────────────────
    if suffix in SYSTEM_EXTENSIONS:
        return "system"
    if parts & SYSTEM_DIRS and suffix not in {".yml", ".yaml", ".md"}:
        return "system"
    # The script itself and its generated report are system/utility files.
    if path.name in {"sort_files.py", "file_sort_report.md"}:
        return "system"

    # ── Content files (.yml / .yaml / .md) ───────────────────────────────
    text = _read_text(path)

    if suffix in {".yml", ".yaml"}:
        if _has_auto_generated_markers(text):
            return "auto_generated"
        return "personal"

    if suffix == ".md":
        # README is not a content template.
        if path.name.lower() == "readme.md":
            return "system"
        # Markdown files with a generated-style YAML front-matter block.
        if _has_auto_generated_markers(text):
            return "auto_generated"
        return "personal"

    # ── Everything else ───────────────────────────────────────────────────
    return "system"


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def collect_files() -> list[Path]:
    """Walk the repo and return all files that should be classified."""
    files: list[Path] = []
    for dirpath, dirnames, filenames in os.walk(REPO_ROOT):
        # Prune directories we never want to enter.
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in filenames:
            fp = Path(dirpath) / name
            files.append(fp)
    return sorted(files)


def build_report(files: list[Path]) -> dict[str, list[Path]]:
    """Classify all files and return a dict keyed by category."""
    categories: dict[str, list[Path]] = {
        "auto_generated": [],
        "personal": [],
        "system": [],
    }
    for fp in files:
        category = classify_file(fp)
        categories[category].append(fp)
    return categories


def relative(path: Path) -> str:
    """Return *path* relative to REPO_ROOT as a POSIX string."""
    try:
        return path.relative_to(REPO_ROOT).as_posix()
    except ValueError:
        return str(path)


def format_report(categories: dict[str, list[Path]]) -> str:
    """Return the full report as a Markdown string."""
    lines: list[str] = [
        "# File Sort Report",
        "",
        textwrap.dedent("""\
            Each repository file has been classified into one of three categories:

            | Category | Meaning |
            |---|---|
            | **auto_generated** | Structured YAML/template with rich metadata — likely scaffolded by a tool such as Microsoft 365 Copilot. |
            | **personal** | Plain-markdown or lightly-structured files written by hand. |
            | **system** | Database migrations, CI configs, and other infrastructure files. |
        """),
    ]

    category_labels = {
        "auto_generated": "🤖 Auto-Generated (Copilot / Tool-Created)",
        "personal": "✍️  Personal (Hand-Written)",
        "system": "⚙️  System / Infrastructure",
    }

    for key in ("auto_generated", "personal", "system"):
        paths = categories[key]
        count = len(paths)
        lines.append(f"## {category_labels[key]}  ({count} {'file' if count == 1 else 'files'})")
        lines.append("")
        if paths:
            for p in sorted(paths):
                lines.append(f"- `{relative(p)}`")
        else:
            lines.append("_None_")
        lines.append("")

    total = sum(len(v) for v in categories.values())
    lines.append(f"---")
    lines.append(f"_Total files scanned: {total}_")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    files = collect_files()
    categories = build_report(files)
    report_text = format_report(categories)

    # ── Console output ────────────────────────────────────────────────────
    print(report_text)

    # ── Write Markdown report ─────────────────────────────────────────────
    REPORT_FILE.write_text(report_text, encoding="utf-8")
    print(f"Report saved to: {relative(REPORT_FILE)}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
RK Homeschool Hub — Feature Validation Suite
Validates worksheet templates, SQL migration, and Solfege Staircase game.
"""

import os
import re
import sys
import json
import yaml

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PASS = "PASS"
FAIL = "FAIL"
WARN = "WARN"

results = []


def record(category, test_name, status, detail=""):
    results.append({
        "category": category,
        "test": test_name,
        "status": status,
        "detail": detail,
    })
    icon = "✅" if status == PASS else ("⚠️ " if status == WARN else "❌")
    print(f"  {icon} [{status}] {test_name}" + (f" — {detail}" if detail else ""))


# ---------------------------------------------------------------------------
# 1. YAML TEMPLATE VALIDATION
# ---------------------------------------------------------------------------

def load_yaml_file(path):
    with open(path, encoding="utf-8") as f:
        content = f.read()
    # Strip leading/trailing --- fence if present
    content = re.sub(r"^---\s*\n", "", content)
    content = re.sub(r"\n---\s*$", "", content)
    return yaml.safe_load(content)


def test_yaml_templates():
    print("\n=== YAML Template Validation ===")

    yaml_files = [
        ("supabase/templates/elementary_science/forces_ramps_motion.yml",
         ["category", "subject", "levels"]),
        ("supabase/templates/middle_science/chemistry_states_of_matter.yml",
         ["Title", "Subject"]),
        ("supabase/templates/science/elementary/forces/push-pull-basics.yaml",
         ["metadata", "levels", "branding", "layout", "footer"]),
        ("supabase/templates/worksheet_template.yml",
         []),  # general template — no required top-level keys
    ]

    for rel_path, required_keys in yaml_files:
        full_path = os.path.join(REPO_ROOT, rel_path)
        name = os.path.basename(rel_path)

        # File existence
        if not os.path.isfile(full_path):
            record("YAML Templates", f"{name} — file exists", FAIL, f"Missing: {rel_path}")
            continue
        record("YAML Templates", f"{name} — file exists", PASS)

        # YAML parse
        try:
            data = load_yaml_file(full_path)
            record("YAML Templates", f"{name} — valid YAML", PASS)
        except yaml.YAMLError as exc:
            record("YAML Templates", f"{name} — valid YAML", FAIL, str(exc))
            continue

        # Required keys
        for key in required_keys:
            if isinstance(data, dict) and key in data:
                record("YAML Templates", f"{name} — has '{key}' key", PASS)
            else:
                record("YAML Templates", f"{name} — has '{key}' key", FAIL, "Key not found")

    # push-pull-basics: check all 3 difficulty levels
    pb_path = os.path.join(REPO_ROOT,
                           "supabase/templates/science/elementary/forces/push-pull-basics.yaml")
    if os.path.isfile(pb_path):
        data = load_yaml_file(pb_path)
        if isinstance(data, dict) and "levels" in data:
            levels = data["levels"]
            for lvl in ["[BELOW]", "[STANDARD]", "[ADVANCED]"]:
                if lvl in levels:
                    record("YAML Templates", f"push-pull-basics — level '{lvl}' present", PASS)
                else:
                    record("YAML Templates", f"push-pull-basics — level '{lvl}' present", FAIL)

        # metadata completeness
        if isinstance(data, dict) and "metadata" in data:
            meta = data["metadata"]
            for field in ["id", "title", "subject", "grade_range", "standards", "version", "created"]:
                if field in meta:
                    record("YAML Templates", f"push-pull-basics metadata — '{field}'", PASS)
                else:
                    record("YAML Templates", f"push-pull-basics metadata — '{field}'", FAIL)


# ---------------------------------------------------------------------------
# 2. MARKDOWN TEMPLATE VALIDATION
# ---------------------------------------------------------------------------

def test_markdown_templates():
    print("\n=== Markdown Template Validation ===")

    md_files = [
        ("science_investigation_templates/light_and_shadows_template.md",
         ["# Light and Shadows Investigation Template",
          "## Beginner Level:",
          "## Intermediate Level:",
          "## Advanced Level:",
          "### Materials Needed:",
          "### Activities:",
          "### Reflection:"]),
    ]

    for rel_path, required_sections in md_files:
        full_path = os.path.join(REPO_ROOT, rel_path)
        name = os.path.basename(rel_path)

        if not os.path.isfile(full_path):
            record("Markdown Templates", f"{name} — file exists", FAIL)
            continue
        record("Markdown Templates", f"{name} — file exists", PASS)

        with open(full_path, encoding="utf-8") as f:
            content = f.read()

        record("Markdown Templates", f"{name} — non-empty", PASS if content.strip() else FAIL)

        for section in required_sections:
            found = section in content
            record("Markdown Templates", f"{name} — contains '{section}'",
                   PASS if found else FAIL)


# ---------------------------------------------------------------------------
# 3. SQL MIGRATION VALIDATION
# ---------------------------------------------------------------------------

def test_sql_migration():
    print("\n=== SQL Migration Validation ===")

    sql_path = os.path.join(REPO_ROOT, "supabase/migrations/20260226_init_hub.sql")
    name = "20260226_init_hub.sql"

    if not os.path.isfile(sql_path):
        record("SQL Migration", f"{name} — file exists", FAIL)
        return
    record("SQL Migration", f"{name} — file exists", PASS)

    with open(sql_path, encoding="utf-8") as f:
        sql = f.read()

    # RBAC roles
    for role in ["guest", "registered", "verified_family", "admin"]:
        found = f"CREATE ROLE {role}" in sql
        record("SQL Migration", f"RBAC role '{role}' defined", PASS if found else FAIL)

    # Required tables
    for table in ["profiles", "hub_resources"]:
        found = f"CREATE TABLE {table}" in sql
        record("SQL Migration", f"Table '{table}' defined", PASS if found else FAIL)

    # profiles columns
    for col in ["id", "user_id", "username", "created_at"]:
        found = col in sql
        record("SQL Migration", f"profiles column '{col}'", PASS if found else FAIL)

    # hub_resources columns
    for col in ["id", "title", "description", "created_at"]:
        found = col in sql
        record("SQL Migration", f"hub_resources column '{col}'", PASS if found else FAIL)

    # Foreign key to auth.users
    fk = "auth.users" in sql
    record("SQL Migration", "profiles references auth.users", PASS if fk else FAIL)

    # No plain-text secrets
    secret_patterns = [r"password\s*=\s*['\"].+['\"]", r"secret\s*=\s*['\"].+['\"]"]
    clean = all(not re.search(p, sql, re.IGNORECASE) for p in secret_patterns)
    record("SQL Migration", "No hardcoded secrets", PASS if clean else FAIL,
           "" if clean else "Possible hardcoded credentials found")


# ---------------------------------------------------------------------------
# 4. SOLFEGE STAIRCASE GAME VALIDATION (static analysis of inline HTML/JS)
# ---------------------------------------------------------------------------

def extract_solfege_html():
    """Extract the Solfege Staircase HTML block from README.md."""
    readme_path = os.path.join(REPO_ROOT, "README.md")
    with open(readme_path, encoding="utf-8") as f:
        content = f.read()
    # The README contains the full HTML starting from <!DOCTYPE html>
    match = re.search(r"(<!DOCTYPE html>.*?</html>)", content, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1)
    return content  # fallback: return whole content


def test_solfege_game():
    print("\n=== Solfege Staircase Game Validation ===")

    html = extract_solfege_html()

    # Structural checks
    checks = [
        ("DOCTYPE declaration", "<!DOCTYPE html>"),
        ("lang attribute on <html>", 'lang="en"'),
        ("viewport meta tag", 'name="viewport"'),
        ("Page title set", "<title>"),
        ("SEO description meta", 'name="description"'),
        ("Open Graph type meta", 'property="og:type"'),
        ("Twitter card meta", 'name="twitter:card"'),
        ("Score display element", 'id="scoreDisplay"'),
        ("Play button", 'id="playBtn"'),
        ("Reset button", 'id="resetBtn"'),
        ("Staircase container", 'id="staircase"'),
        ("Message box", 'id="messageBox"'),
        ("Print button", "window.print()"),
        ("ARIA label on staircase", 'aria-label="Solfege staircase"'),
        ("ARIA label on score board", 'aria-label="Score"'),
        ("Keyboard event (Enter/Space)", '"Enter"'),
        ("Audio context creation", "AudioContext"),
        ("Sine wave oscillator", '"sine"'),
        ("LocalStorage save", "localStorage.setItem"),
        ("LocalStorage load", "localStorage.getItem"),
        ("Score reset function", "function resetScore"),
        ("DOMContentLoaded listener", "DOMContentLoaded"),
        ("8 solfege steps defined", "523.25"),  # high DO frequency
        ("DO-RE-MI-FA-SOL-LA-TI sequence", '"SOL"'),
        ("Correct answer feedback", "CORRECT!"),
        ("Wrong answer feedback with replay", "playTone(steps[currentNoteIndex]"),
        ("Gentle audio envelope", "exponentialRampToValueAtTime"),
        ("Print stylesheet", "@media print"),
        ("Print hides buttons", ".btn,"),
        ("Print shows teacher notes", "Teacher/Parent Notes"),
        ("RK brand colors defined", "--rk-green"),
        ("Footer attribution", "renkids.org"),
        ("Responsive layout (min clamp)", "min(860px"),
    ]

    for label, pattern in checks:
        found = pattern in html
        record("Solfege Game", label, PASS if found else FAIL)

    # JS logic checks
    js_match = re.search(r"<script>(.*?)</script>", html, re.DOTALL | re.IGNORECASE)
    if js_match:
        js = js_match.group(1)
        record("Solfege Game", "Inline <script> block present", PASS)

        # Check score increments on correct answer
        score_inc = "score++" in js
        record("Solfege Game", "Score increments on correct answer", PASS if score_inc else FAIL)

        # Check disableSteps called after correct answer
        disable_after = "disableSteps(true)" in js
        record("Solfege Game", "Steps disabled after answer", PASS if disable_after else FAIL)

        # Check random note selection
        random_note = "Math.floor(Math.random()" in js
        record("Solfege Game", "Random note selection", PASS if random_note else FAIL)
    else:
        record("Solfege Game", "Inline <script> block present", FAIL)


# ---------------------------------------------------------------------------
# 5. REPO STRUCTURE VALIDATION
# ---------------------------------------------------------------------------

def test_repo_structure():
    print("\n=== Repository Structure Validation ===")

    expected_paths = [
        "README.md",
        "supabase/migrations/20260226_init_hub.sql",
        "supabase/templates/worksheet_template.yml",
        "supabase/templates/elementary_science/forces_ramps_motion.yml",
        "supabase/templates/middle_science/chemistry_states_of_matter.yml",
        "supabase/templates/science/elementary/forces/push-pull-basics.yaml",
        "science_investigation_templates/light_and_shadows_template.md",
        ".github/GITHUB_SECRETS.md",
    ]

    for rel_path in expected_paths:
        full_path = os.path.join(REPO_ROOT, rel_path)
        exists = os.path.isfile(full_path)
        record("Repo Structure", rel_path, PASS if exists else FAIL,
               "" if exists else "File missing")


# ---------------------------------------------------------------------------
# MAIN — Run all suites and print summary
# ---------------------------------------------------------------------------

def main():
    print("=" * 60)
    print("  RK Homeschool Hub — Manager App Feature Validation")
    print("=" * 60)

    test_repo_structure()
    test_sql_migration()
    test_yaml_templates()
    test_markdown_templates()
    test_solfege_game()

    # Summary
    passed = sum(1 for r in results if r["status"] == PASS)
    warned = sum(1 for r in results if r["status"] == WARN)
    failed = sum(1 for r in results if r["status"] == FAIL)
    total = len(results)

    print("\n" + "=" * 60)
    print(f"  SUMMARY: {passed}/{total} passed  |  {warned} warnings  |  {failed} failures")
    print("=" * 60)

    if failed > 0:
        print("\nFailed tests:")
        for r in results:
            if r["status"] == FAIL:
                print(f"  ❌ [{r['category']}] {r['test']}" +
                      (f" — {r['detail']}" if r['detail'] else ""))

    # Emit machine-readable results for report generation
    out_path = os.path.join(REPO_ROOT, "tests", "results.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\nResults written to {out_path}")

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())

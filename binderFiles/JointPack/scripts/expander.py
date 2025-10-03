import argparse, os, re, json, hashlib, datetime, glob, sys
from pathlib import Path

def load_rules(rules_path):
    with open(rules_path, "r", encoding="utf-8") as f:
        return json.load(f)

def read_text(p):
    with open(p, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()

def write_text(p, s):
    with open(p, "w", encoding="utf-8") as f:
        f.write(s)

def inject_footer(next_path):
    return f"""

---
## CONTINUE
NEXT_BINDER: {next_path}
AUGMENT_EXECUTION_MODE: SEQUENTIAL_STRICT
RETRY_POLICY: LOCAL_IDEMPOTENT
"""

def expand_content(original, rules, binder_name):
    # Simple expansion: attach rule-pack summaries + guardrails + chain directive placeholder
    hdr = f"# FULL EXPANSION of {binder_name}\nGenerated: {datetime.datetime.utcnow().isoformat()}Z\n\n"
    core = original
    # Append rule snapshots (compact)
    snap = json.dumps(rules, indent=2)
    appendix = f"""\n\n---\n## RULE PACK SNAPSHOT (embedded for local reference)\n```json\n{snap}\n```\n"""
    return hdr + core + appendix

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", required=True)
    ap.add_argument("--report", default=None)
    ap.add_argument("--rules", default=str(Path(__file__).resolve().parents[1] / "rules" / "joint_rules.json"))
    args = ap.parse_args()

    rules = load_rules(args.rules)
    root = Path(args.root)
    binders = sorted([p for p in root.glob("**/binder*.md") if "_FULL" not in p.name], key=lambda p: p.name.lower())
    report_lines = []
    prev_full = None

    for b in binders:
        try:
            src = read_text(b)
            expanded = expand_content(src, rules, b.name)
            # Decide next binder for footer chaining
            # Find next original binder file
            next_candidates = [p for p in binders if p.name.lower() > b.name.lower()]
            next_path = next_candidates[0].name if next_candidates else "END"
            expanded += inject_footer(next_path if next_candidates else "END")

            full_path = b.with_name(b.stem + "_FULL.md")
            write_text(full_path, expanded)
            report_lines.append(f"[OK] Expanded {b} -> {full_path.name} (next={next_path})")
        except Exception as e:
            report_lines.append(f"[ERROR] {b}: {e}")

    # Conflicting Next.js pages vs app detection (high-signal check)
    conflicts = []
    for pair in [
        ("pages/leads/[id].tsx", "app/(app)/leads/[id]/page.tsx"),
        ("pages/leads.tsx", "app/(app)/leads/page.tsx"),
    ]:
        if (root / pair[0]).exists() and (root / pair[1]).exists():
            conflicts.append(pair)

    if args.report:
        with open(args.report, "a", encoding="utf-8") as rf:
            rf.write(f"# EXPAND REPORT {datetime.datetime.utcnow().isoformat()}Z\n")
            rf.write("\n".join(report_lines) + "\n")
            if conflicts:
                rf.write("\n[CONFLICTS]\n")
                for a,b in conflicts:
                    rf.write(f"Duplicate route files: {a} <> {b}\n")

if __name__ == "__main__":
    main()

import argparse, os, re, json, datetime
from pathlib import Path

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", required=True)
    ap.add_argument("--report", required=False)
    args = ap.parse_args()

    root = Path(args.root)
    issues = []
    for p in root.glob("**/*_FULL.md"):
        txt = p.read_text(encoding="utf-8", errors="ignore")
        for m in re.finditer(r"\((app/[^)]+|pages/[^)]+)\)", txt):
            candidate = root / m.group(1)
            if not candidate.exists():
                issues.append(f"[MISSING] {p.name} -> {m.group(1)}")

    if args.report:
        with open(args.report, "a", encoding="utf-8") as rf:
            rf.write(f"\n# LINK VALIDATION {datetime.datetime.utcnow().isoformat()}Z\n")
            if issues:
                rf.write("\n".join(issues) + "\n")
            else:
                rf.write("No missing route links detected.\n")

if __name__ == "__main__":
    main()

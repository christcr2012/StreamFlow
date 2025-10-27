# One-time Setup: Let Copilot work without prompts (Auto-Allow)

This short guide makes VS Code trust this workspace and remember your “Always allow” choices so I can run commands, modify files, and push changes without waiting for you to click Allow each time.

Total time: 3–5 minutes

---

## 1) Trust this workspace

Why: VS Code blocks some features in untrusted folders. Trusting the folder removes many prompts.

Steps:

1. In VS Code, press Ctrl+Shift+P to open the Command Palette.
2. Type: Workspace: Manage Workspace Trust and press Enter.
3. Make sure this folder (Cortiware) shows as Trusted. If not, click Trust.

You’re done with trust. This only needs to be done once per folder.

---

## 2) Tell Copilot Chat to "Always allow" in this workspace

Why: When I run tools (run a command, edit files, use git), VS Code may ask for permission. We’ll teach it to remember your answer.

Steps (do this the first time you see each prompt):

1. Trigger an action that asks for approval (for example, I run a command or modify files).
2. In the prompt/notification, expand the dropdown or details arrow.
3. Choose: "Always allow in this workspace" (or "Don’t ask again for this workspace").

Common prompts you may see and should set to "Always allow":

- Run in terminal
- Modify files
- Run git commands (add/commit/push)
- Open a link in the browser

Note: You can repeat this once per prompt type. VS Code will remember your choice for this folder.

---

## 3) Reduce other confirmations (nice to have)

Why: Some background prompts can still pause runs.

Steps:

1. Open Settings (File > Preferences > Settings).
2. Search and set the following:
   - Terminal > Integrated: Confirm On Exit → Off
   - Git: Confirm Sync → Off
   - Tasks: Close When Finished → On (optional)
   - Security: Workspace → Ensure this folder is Trusted

These reduce interruptions when I run tasks, tests, and git commands.

---

## 4) Optional: Make runs use CI (no local prompts at all)

If you’re away from the computer, I can run long or interactive work in GitHub Actions instead of locally. Nothing will wait on your machine. You don’t need to change anything—just tell me to use CI and I’ll route it there.

---

## 5) How to undo or review these choices later

- To change trust: Command Palette → Workspace: Manage Workspace Trust.
- To reset a remembered prompt: Settings → search for the feature (e.g., "Copilot" or "Git"); toggle the related confirmation setting, or choose a different option next time the prompt appears.

---

## Quick Troubleshooting

- I still see prompts: The workspace may not be trusted. Re-run Step 1.
- It asks again later: Some prompts are per-feature. When it appears, pick "Always allow in this workspace" once.
- You don’t see the exact setting names: It’s OK—just ensure workspace is Trusted and choose "Always allow" in Copilot prompts as they come up.

If you’d like, I can guide you live over a call/screen-share and click through these once. After that, we won’t be interrupted again.

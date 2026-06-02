# Branching Guide

Dream Invoice currently works best with a simple branch model. The goal is to
keep `main` stable, make changes in short-lived branches when the work is risky,
and avoid keeping many backup branches around.

## Main Branches

| Branch | Purpose |
| --- | --- |
| `main` | Stable branch. This should build and be safe to deploy. |
| `feature/*` | New product features or UI work. |
| `fix/*` | Bug fixes. |
| `security/*` | Security hardening and sensitive configuration fixes. |
| `release/*` | Optional release preparation branch when a release needs more review. |

## When To Use `main` Directly

Small, low-risk changes can be committed directly to `main` when they are
tested before push.

Examples:

- README or documentation updates.
- Small copy changes.
- Tiny UI polish with local verification.
- Safe config cleanup after tests pass.

## When To Create A Feature Branch

Create a branch when the work can take more than one session, touches many
files, changes production behavior, or may need visual review.

Examples:

- `feature/ocr-import-polish`
- `feature/document-action-toolbar`
- `fix/login-rate-limit`
- `security/runtime-env-validation`

Recommended flow:

```bash
git switch main
git pull origin main
git switch -c feature/example-name

# make changes and test

git add .
git commit -m "Describe the change"
git push -u origin feature/example-name
```

After review and testing, merge into `main`.

## Backup Branches

Backup branches are useful before risky operations, but they should be temporary.
They are not a replacement for commits, tags, or a clean Git history.

Good temporary names:

- `backup/before-history-cleanup-YYYYMMDD`
- `backup/before-large-refactor-YYYYMMDD`

Cleanup rule:

- Delete backup branches after the work is merged and verified.
- Keep only branches that still contain useful code or an intentional old design.
- Do not push many backup branches to the remote unless they are needed by the
  team.

## Develop Branch

A permanent `develop` branch is optional. It is useful when a team has multiple
developers, pull requests, release candidates, and a fixed release process.

For Dream Invoice right now, `main` plus short-lived feature/fix/security
branches is simpler and cleaner.

Use a permanent `develop` branch later only if:

- multiple people work on the repository at the same time,
- releases are prepared separately from daily work,
- pull requests need a shared staging branch,
- CI/CD deploys `main` automatically and feature work must stay isolated.

## Current Branch Cleanup Rule

The repository should not keep old `backup-*` branches forever. If a branch is
already merged into `main`, delete it. If it is not merged, inspect it first and
either preserve it intentionally or delete it with `git branch -D`.

Useful commands:

```bash
git branch --merged main
git branch --no-merged main
git log --oneline main..branch-name
git diff --stat main...branch-name
```

If Git reports "no merge base", the branch likely comes from an older history.
Treat it as an archive snapshot, not normal active work.

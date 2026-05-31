# Security Policy

## Supported Versions

DawnDesk is in early development. Security fixes are applied to the active development branch.

## Reporting a Vulnerability

Please report security issues privately to the maintainer instead of opening a public issue.

Include:

- A clear description of the issue.
- Steps to reproduce it.
- Affected files, routes, commands, or configuration.
- Any known impact.

## Security Areas to Watch

- Tauri filesystem permissions.
- Tauri shell sidecar execution.
- Supabase authentication and row-level access.
- Local file import/export behavior.
- Media processing through FFmpeg and FFprobe.
- Sensitive data in logs, local storage, and app config files.

## Project Expectations

- Keep native permissions as narrow as practical.
- Do not log secrets, tokens, private file contents, or credentials.
- Validate file paths and user-provided data before passing them to native commands.
- Review dependency updates before merging.

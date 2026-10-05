# Security

## Reporting a vulnerability

Email security@modelbrain.net with a description and steps to reproduce. Please do not open a public issue for security reports.

We acknowledge reports within 72 hours and aim to ship a fix or a mitigation within 90 days. We ask for the same window before public disclosure.

## What this package does

`modelbrain-mcp` is a small launcher. It finds the `mcp_server` binary that the ModelBrain desktop app installs on your computer and runs it, passing stdio through. It makes no network requests, reads no files other than checking for the installed binary, and stores nothing.

The ModelBrain app itself is separate software. Its data stays on your computer. See https://modelbrain.net/privacy.html for what leaves the machine and what does not.

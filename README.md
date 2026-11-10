# modelbrain-mcp

[![Listed on mcpservers.org](https://mcpservers.org/badge.svg)](https://mcpservers.org/servers/modelbrain/modelbrain-mcp)

A thin [MCP](https://modelcontextprotocol.io) stdio client for [ModelBrain](https://modelbrain.net): the private memory layer for AI assistants: one memory for every assistant you use, kept on your own computer.

This package does not install or bundle ModelBrain. It connects to the ModelBrain desktop app already running on your machine.

## If ModelBrain is not installed

The launcher still starts and answers the MCP handshake, so your client shows the server and its tools instead of a start-up failure. Every tool call then returns one plain result: ModelBrain is not installed, and where to get it. Nothing is stored or recalled in this state. The same message is printed to standard error.

The tool list it shows comes from `bin/tools.json`, a copy of what the real server reports. Maintainers refresh it with `npm run snapshot-tools` on a machine that has ModelBrain installed.

To get the old behaviour, where the launcher exits with status 1 when the app is missing, pass `--require-app` or set `MODELBRAIN_MCP_REQUIRE_APP=1`.

## Why a separate package

ModelBrain's own installed app already ships a binary, `mcp_server`, that speaks MCP over stdio and talks to the local ModelBrain daemon. This package finds that binary on the current machine and runs it. It exists so ModelBrain can be registered with the MCP Registry and the directories that list from it, with a reviewable package as the distribution target, while the actual engine stays out of this repository.

## Requirements

- macOS (Apple Silicon), Windows (x64 or arm64) or Linux (x86_64 or aarch64, glibc 2.28 or newer)
- [ModelBrain](https://modelbrain.net/get-it.html) installed

## Use

In ModelBrain's Allow or Block prompt this client shows up as your assistant's name with `node` as the program (`mcp_server.exe` on Windows). If you turn on Require client tokens in ModelBrain, mint a token for your assistant with `modelbrain_admin setup tokens --mint NAME` and put it in your client's `env` block as `MODELBRAIN_CLIENT_TOKEN`; the launcher passes it through.

Most MCP clients run a server with `npx`. Point your client's MCP config at:

```json
{
  "mcpServers": {
    "modelbrain": {
      "command": "npx",
      "args": ["-y", "modelbrain-mcp"]
    }
  }
}
```

Claude Desktop, Claude Code and Cursor users do not need this: ModelBrain's own app registers itself with those clients directly. See [modelbrain.net/docs](https://modelbrain.net/docs.html) for the full tool surface (14 tools: `remember`, `recall`, `list_memories`, `expand`, `forget`, six partition tools, `diagnostics`, `usage`, `ping`) and the [connect guides](https://modelbrain.net/docs.html#guides) for other clients.

## License

MIT, for this wrapper package. ModelBrain itself is separate, proprietary software; see [modelbrain.net](https://modelbrain.net) for its own terms.

## Security

See [SECURITY.md](SECURITY.md).

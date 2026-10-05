# modelbrain-mcp

A thin [MCP](https://modelcontextprotocol.io) stdio client for [ModelBrain](https://modelbrain.net): a memory layer for AI assistants that runs on your own computer.

This package does not install or bundle ModelBrain. It connects to the ModelBrain desktop app already running on your machine. If ModelBrain is not installed, running this prints where to get it and exits, rather than failing silently.

## Why a separate package

ModelBrain's own installed app already ships a binary, `mcp_server`, that speaks MCP over stdio and talks to the local ModelBrain daemon. This package finds that binary on the current machine and runs it. It exists so ModelBrain can be registered with the MCP Registry and the directories that list from it, with a reviewable package as the distribution target, while the actual engine stays out of this repository.

## Requirements

- macOS (Apple Silicon) or Windows (x64 or arm64)
- [ModelBrain](https://modelbrain.net/get-it.html) installed

## Use

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

Claude Desktop, Claude Code and Cursor users do not need this: ModelBrain's own app registers itself with those clients directly. See [modelbrain.net/docs](https://modelbrain.net/docs.html) for the full tool surface (`remember`, `recall`, `forget`, `expand`, `connector_sync`) and the [connect guides](https://modelbrain.net/docs.html#guides) for other clients.

## License

MIT, for this wrapper package. ModelBrain itself is separate, proprietary software; see [modelbrain.net](https://modelbrain.net) for its own terms.

## Security

See [SECURITY.md](SECURITY.md).

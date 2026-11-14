# ModelBrain plugin for Claude Code

This plugin teaches Claude Code when to use your [ModelBrain](https://modelbrain.net) memory: recall before answering questions about you or your projects, save decisions and facts worth keeping, and correct or forget on request.

It adds one skill, `/modelbrain:memory`. Claude also loads it on its own when the ModelBrain tools are present.

## What it does not do

It does not install ModelBrain and it does not add an MCP server. The ModelBrain desktop app registers its own server with Claude Code, so adding a second copy here would show every tool twice. Without the app the skill tells Claude to say that memory is not available.

## Install

1. Install the free ModelBrain app from [modelbrain.net/get-it.html](https://modelbrain.net/get-it.html) and open it once.
2. Add this repository as a marketplace and install the plugin:

```bash
claude plugin marketplace add ModelBrain/modelbrain-mcp
claude plugin install modelbrain@modelbrain
```

## License

MIT, for this plugin. ModelBrain itself is separate, proprietary software.

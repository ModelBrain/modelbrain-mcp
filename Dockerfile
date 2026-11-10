# Container for automated checks (for example Glama's). The shim is a thin
# client for the ModelBrain desktop app, which cannot run inside a container,
# so here it answers the MCP handshake, lists the tools from bin/tools.json,
# and returns "ModelBrain is not installed" for every tool call.
FROM node:20-slim
WORKDIR /app
COPY package.json README.md LICENSE SECURITY.md ./
COPY bin ./bin
ENTRYPOINT ["node", "bin/modelbrain-mcp.js"]

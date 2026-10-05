# Container for automated checks (for example Glama's). The shim is a thin
# client for the ModelBrain desktop app, which cannot run inside a container,
# so here it only prints its "app not detected" message and exits.
FROM node:20-slim
WORKDIR /app
COPY package.json README.md LICENSE SECURITY.md ./
COPY bin ./bin
ENTRYPOINT ["node", "bin/modelbrain-mcp.js"]

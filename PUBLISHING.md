# Publishing checklist

Everything in this repo is ready. Nothing here has been published or run
against npm, GitLab, GitHub, or the MCP Registry yet. The steps below need
your own npm account and DNS access to modelbrain.net, so they're left for
you to run.

## 0. Smoke test locally first

From a real terminal (not through the device bridge), with ModelBrain
installed and running:

```
node bin/modelbrain-mcp.js
```

It should find the installed `mcp_server` binary and hand off to it
(it'll sit there waiting for MCP stdio input, same as `mcp_server` does
today). Ctrl-C to exit. If it prints the "not detected" message instead,
something about the install-path guesses in `bin/modelbrain-mcp.js` is
wrong for your actual install and needs fixing before anything below.

## 1. Publish the npm package

```
cd modelbrain-mcp
npm login          # if not already
npm publish --access public
```

The package name `modelbrain-mcp` was unclaimed on npm as of 2026-10-04.

## 2. Install mcp-publisher

```
curl -L "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_$(uname -s | tr '[:upper:]' '[:lower:]')_$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/').tar.gz" | tar xz mcp-publisher
sudo mv mcp-publisher /usr/local/bin/
```

## 3. DNS authentication (proves you own modelbrain.net)

```
openssl genpkey -algorithm Ed25519 -out key.pem
PUBLIC_KEY="$(openssl pkey -in key.pem -pubout -outform DER | tail -c 32 | base64)"
echo "modelbrain.net. IN TXT \"v=MCPv1; k=ed25519; p=${PUBLIC_KEY}\""
```

Add that as a TXT record on `modelbrain.net` itself (not a subdomain)
through your DNS provider. Wait for it to propagate (a few minutes to an
hour), then:

```
PRIVATE_KEY="$(openssl pkey -in key.pem -noout -text | grep -A3 "priv:" | tail -n +2 | tr -d ' :\n')"
mcp-publisher login dns --domain modelbrain.net --private-key "${PRIVATE_KEY}"
```

`key.pem` is already in `.gitignore`. Don't commit it, and don't paste the
private key anywhere outside this command.

## 4. Publish to the registry

Check `server.json` against whatever `mcp-publisher init` generates first
(the registry's schema is still in preview and may have moved since this
was drafted on 2026-10-04 against schema version `2025-12-11`):

```
mcp-publisher init    # compare its output to the existing server.json
mcp-publisher publish
```

Verify:

```
curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=net.modelbrain/mcp"
```

## 5. After that

- PulseMCP ingests from the official registry automatically; check back
  in a week or two, and submit directly there if it hasn't picked it up.
- This unblocks nothing else that needs a public GitHub repo (mcp.so,
  Glama, Smithery's GitHub flow, mcpservers.org, awesome-mcp-servers) --
  those still wait on the open-source decision, which is intentionally
  separate and still open.

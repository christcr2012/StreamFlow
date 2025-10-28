# Using custom MCP servers with Copilot / local agents

If you want Copilot (or other local agents) to use your custom, linked MCP servers, run the MCP servers locally (see `docs/MCP_ENV_VARS.md`) and then ensure the agent process spawns or connects to the MCP server over stdio or the configured transport.

Two common approaches:

1. Spawn the MCP server as a subprocess and communicate over stdio (recommended for local development).
2. Connect to the MCP server over a TCP/HTTP transport if the server exposes one (ensure TLS and auth).

Example (spawn + stdio) - how an agent would start and talk to a local MCP server:

```ts
// minimal example showing how to spawn a server and list tools using @modelcontextprotocol/sdk
import { execFile } from 'child_process'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'

const child = execFile('npx', ['-y','@robinsonai/github-mcp'], { stdio: 'pipe' })

// wire stdio to the MCP client transport
const client = new Client({
  transport: {
    type: 'stdio',
    input: child.stdout,
    output: child.stdin
  }
})

async function listTools() {
  await client.connect()
  const tools = await client.listTools()
  console.log('tools:', tools.map(t => t.name))
  await client.disconnect()
  child.kill()
}

listTools().catch(console.error)
```

If Copilot/your agent runs in a separate process and you already have the MCP servers up (detached), the agent should be configured to connect to the server process via the same transport the server exposes. In practice, the simplest pattern is to have a single launcher (our `scripts/mcp-launcher.ts`) bring up MCP servers locally, then run agents that assume the servers are available.

Security note: keep sensitive tokens out of committed configs and prefer env vars. The launcher merges `process.env` into each server process so set the variables in `.env.local` or your environment before starting the launcher.

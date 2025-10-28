# MCP Servers Environment Variables

This file lists the environment variables used by MCP servers in this repository. These are placeholders — do NOT commit real secrets.

Add the values to your `.env.local` (development) or your secret store (Vercel/GitHub Actions) using the names below.

Example `.env.local`:

```bash
# GitHub
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxx_replace

# Vercel
VERCEL_TOKEN=vercel_xxx_replace

# Redis
REDIS_URL=redis://default:password@redis-host:17153

# Neon
NEON_MCP_KEY=napi_xxx_replace

# Resend
RESEND_API_KEY=re_xxx_replace

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here

# Cloudflare
CLOUDFLARE_API_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Usage
Running local, linked MCP servers with the repo

- Link the MCP packages (from `robinsonai-mcp-servers`) into your project:
	1. In each package directory run: `npm link`
	2. In the Cortiware repo root run: `npm link @robinsonai/github-mcp @robinsonai/vercel-mcp @robinsonai/neon-mcp`

- Start MCP servers then start development (one-liner):

```powershell
npm run dev:with-mcp
```

This will:
- start the listed MCP servers (detached), writing logs to `./logs/` and pidfiles to `./logs/mcp-<name>.pid`.
- run the normal `npm run dev` (turbo) so the app and agents pick up the running MCP servers.

How agents discover the servers
- The launcher reads `mcp-config-working.json` at repo root and spawns the configured MCP servers.
- Agents and tooling that use MCP should connect to servers the repo spawns via stdio or through whatever transport that MCP server implements.

Security

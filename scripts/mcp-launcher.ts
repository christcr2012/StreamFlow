#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'

type MCPServer = {
  command: string
  args?: string[]
  env?: Record<string, string>
}

type MCPConfig = {
  mcpServers: Record<string, MCPServer>
}

const root = path.resolve(__dirname, '..')
const workingConfigPath = path.join(root, 'mcp-config-working.json')

const argv = process.argv.slice(2)
const dryRun = argv.includes('--dry') || argv.includes('dry')
const detach = argv.includes('--detach') || argv.includes('detached')

function parseServersArg(): string[] | null {
  const serversArg = argv.find(a => a.startsWith('--servers='))
  if (!serversArg) return null
  return serversArg.replace('--servers=', '').split(',').map(s => s.trim()).filter(Boolean)
}

const requestedServers = parseServersArg()

function loadConfig(): MCPConfig {
  if (!fs.existsSync(workingConfigPath)) {
    throw new Error(`Config not found: ${workingConfigPath}`)
  }
  const raw = fs.readFileSync(workingConfigPath, 'utf8')
  return JSON.parse(raw) as MCPConfig
}

function startServer(name: string, cfg: MCPServer) {
  const env = { ...process.env, ...(cfg.env || {}) }
  const args = cfg.args || []

  console.log(`Starting MCP server '${name}': ${cfg.command} ${args.join(' ')}`)

  if (detach) {
    // Ensure logs directory
    const logsDir = path.join(root, 'logs')
    try { fs.mkdirSync(logsDir, { recursive: true }) } catch (e) {}
    const outPath = path.join(logsDir, `mcp-${name}.log`)
    const errPath = path.join(logsDir, `mcp-${name}.err`)
    const outFd = fs.openSync(outPath, 'a')
    const errFd = fs.openSync(errPath, 'a')

    const child = spawn(cfg.command, args, { env, stdio: ['ignore', outFd, errFd], shell: true, detached: true })
    // detach and allow process to run after this script exits
    child.unref()

    // write pid file
    const pidPath = path.join(logsDir, `mcp-${name}.pid`)
    fs.writeFileSync(pidPath, String(child.pid), 'utf8')
    console.log(`Started (detached) '${name}' PID=${child.pid} stdout=${outPath} stderr=${errPath} pidfile=${pidPath}`)
    return
  }

  const child = spawn(cfg.command, args, { env, stdio: 'inherit', shell: true })

  child.on('exit', (code, signal) => {
    console.log(`MCP server '${name}' exited with code=${code} signal=${signal}`)
  })

  child.on('error', (err) => {
    console.error(`MCP server '${name}' failed to start:`, err.message)
  })
}

function main() {
  try {
    const config = loadConfig()
    const servers = config.mcpServers || {}
    const names = Object.keys(servers)
    if (names.length === 0) {
      console.log('No MCP servers defined in config.')
      return
    }

    console.log(`Loaded ${names.length} MCP server(s) from ${workingConfigPath}`)

    for (const name of names) {
      const cfg = servers[name]
      if (dryRun) {
        console.log(`[dry-run] ${name}: command=${cfg.command} args=${JSON.stringify(cfg.args)} envKeys=${Object.keys(cfg.env||{})}`)
      } else {
        startServer(name, cfg)
      }
    }

    if (dryRun) process.exit(0)
  } catch (err: any) {
    console.error('Error:', err.message || err)
    process.exit(1)
  }
}

main()

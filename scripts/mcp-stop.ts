#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const root = path.resolve(__dirname, '..')
const logs = path.join(root, 'logs')
const servers = process.argv.slice(2).length ? process.argv.slice(2) : ['github-robinsonai','vercel-robinsonai','neon-robinsonai']

for (const s of servers) {
  const pidFile = path.join(logs, `mcp-${s}.pid`)
  if (!fs.existsSync(pidFile)) {
    console.log(`${s}: pidfile missing (${pidFile})`)
    continue
  }
  const pid = Number(fs.readFileSync(pidFile, 'utf8').trim())
  try {
    process.kill(pid, 'SIGTERM')
    console.log(`${s}: sent SIGTERM to PID ${pid}`)
    // remove pidfile
    try { fs.unlinkSync(pidFile) } catch (e) {}
  } catch (err: any) {
    console.log(`${s}: failed to kill PID ${pid}: ${err.message}`)
  }
}

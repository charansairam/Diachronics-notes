#!/usr/bin/env node
import { cleanPlugins, installPlugins, parsePluginSource } from "./gitLoader.js"
import config from "../../../quartz.js"

async function main() {
  const quartzConfig: any = config
  const externalPlugins = quartzConfig.externalPlugins || []

  if (externalPlugins.length === 0) {
    console.log("No external plugins to install.")
    return
  }

  console.log(`Installing ${externalPlugins.length} plugin(s) from Git...`)

  // Treat checked-in plugin sources as the build input of record.
  // Reinstall into a clean plugin tree so builds cannot reuse stale artifacts.
  cleanPlugins()

  const specs = externalPlugins.map((source: string) => parsePluginSource(source))
  const installed = await installPlugins(specs, { verbose: true })

  if (installed.size === externalPlugins.length) {
    console.log("✓ All plugins installed successfully")
  } else {
    console.error(`✗ Only ${installed.size}/${externalPlugins.length} plugins installed`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error("Failed to install plugins:", err)
  process.exit(1)
})

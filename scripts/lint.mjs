#!/usr/bin/env node

import { execSync } from "child_process"
import process from "process"

// Get the path argument (if provided)
const path = process.argv[2] || "./"

console.log(`Running lint on: ${path}`)

try {
  // Run prettier --write
  console.log("Running prettier...")
  execSync(`prettier --write ${path}`, { stdio: "inherit" })

  // Run eslint --fix
  console.log("Running eslint...")
  execSync(`eslint ${path} --fix`, { stdio: "inherit" })

  console.log("✅ Linting completed successfully!")
} catch {
  console.error("❌ Linting failed!")
  process.exit(1)
}

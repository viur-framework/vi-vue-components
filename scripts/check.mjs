#!/usr/bin/env node

import { execSync } from "child_process"
import process from "process"

// Get the path argument (if provided)
const path = process.argv[2] || "./"

console.log(`Running check on: ${path}`)

try {
  // Run prettier -c (check)
  console.log("Checking prettier...")
  execSync(`prettier -c ${path}`, { stdio: "inherit" })

  // Run eslint --quiet
  console.log("Checking eslint...")
  execSync(`eslint ${path} --quiet`, { stdio: "inherit" })

  console.log("✅ All checks passed!")
} catch {
  console.error("❌ Check failed! Please fix the issues above.")
  process.exit(1)
}

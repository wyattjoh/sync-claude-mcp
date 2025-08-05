# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

This is a single-file Deno CLI tool that synchronizes MCP (Model Context
Protocol) servers between Claude Code (`~/.claude.json`) and Claude Desktop
(`~/Library/Application Support/Claude/claude_desktop_config.json`)
configurations. The tool performs a one-way sync, replacing Claude Desktop's MCP
servers with those from Claude Code.

## Architecture

### Core Design Principles

- **Functional Programming**: Built using pure functions with explicit error
  handling via `Result<T, E>` types
- **Single Responsibility**: Each function has a clear, single purpose (path
  generation, file I/O, config merging)
- **Immutable Operations**: Uses spread operators and pure functions to avoid
  side effects

### Key Types

- `McpServer`: Represents an MCP server configuration (stdio, http, or sse
  types)
- `Result<T, E>`: Functional error handling pattern with
  `{ success: boolean, data?: T, error?: E }`
- Config types for both Claude Code and Claude Desktop JSON structures

### Core Flow

1. `getHomeDirectory()` → `getClaudeCodeConfigPath()` /
   `getClaudeDesktopConfigPath()`
2. `readJsonFile()` for both config files
3. `extractMcpServers()` from Claude Code config
4. `mergeMcpServers()` to update Desktop config structure
5. `writeJsonFile()` to persist changes

## Development Commands

```bash
# Run the sync tool locally
deno task sync

# Build standalone binary
deno task build

# Format code (required for CI)
deno task fmt

# Lint code (required for CI) 
deno task lint

# Type check (required for CI)
deno task check

# Test formatting without changes
deno task fmt --check

# Run compiled binary
./sync-claude-mcp
```

## CI/CD Pipeline

The project uses GitHub Actions for automated publishing to JSR:

- Triggers on pushes to `main` branch and published releases
- Runs formatting check, linting, type checking, then publishes to JSR
- Requires all CI tasks (`fmt --check`, `lint`, `check`) to pass before
  publishing

## Configuration Files

### MCP Server Types Supported

- **stdio**: Command-line servers with `command`, `args`, and `env`
- **http**: HTTP servers with `url` and optional `headers`
- **sse**: Server-sent events servers with `url`

### File Locations

- Claude Code: `~/.claude.json` (contains global `mcpServers` object)
- Claude Desktop:
  `~/Library/Application Support/Claude/claude_desktop_config.json`

## Key Constraints

- **Platform Specific**: Hardcoded macOS path for Claude Desktop config
- **One-way Sync**: Only syncs FROM Claude Code TO Claude Desktop (overwrites)
- **No Backup**: Does not create backup files before overwriting
- **Home Directory Dependent**: Requires `$HOME` environment variable

## Error Handling Pattern

All async operations use the `Result<T, E>` pattern for explicit error handling:

```typescript
const result = await readJsonFile<ConfigType>(path);
if (!result.success) {
  return { success: false, error: new Error(result.error.message) };
}
// Use result.data safely
```

## Logging

Uses emoji-prefixed logging functions (`logInfo`, `logSuccess`, `logError`,
`logWarning`) for clear user feedback during sync operations.

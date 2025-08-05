# Claude MCP Sync Tool

A Deno CLI tool that synchronizes MCP (Model Context Protocol) servers between Claude Code and Claude Desktop configurations.

## Features

- **Functional Programming**: Built using pure functions and immutable data structures
- **Cross-platform**: Works with any home directory (automatically detects `$HOME`)
- **Safe Operation**: Validates file existence and handles errors gracefully
- **Detailed Logging**: Provides informative output about the sync process
- **One-way Sync**: Replaces Claude Desktop MCP servers with those from Claude Code

## Installation

### Global Installation (Recommended)

Install globally from JSR:

```bash
deno install --global --allow-read --allow-write --allow-env jsr:@wyattjoh/sync-claude-mcp
```

Then run from anywhere:

```bash
sync-claude-mcp
```

### Local Usage

```bash
# Run the sync tool from source
deno task sync

# Build a standalone binary
deno task build

# Run the compiled binary
./sync-claude-mcp

# Or run directly with permissions
deno run --allow-read --allow-write --allow-env sync-claude-mcp.ts
```

## How It Works

1. **Reads** MCP servers from Claude Code config (`~/.claude.json`)
2. **Reads** existing Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`)
3. **Replaces** the `mcpServers` section in Claude Desktop with servers from Claude Code
4. **Writes** the updated configuration back to Claude Desktop
5. **Logs** the process and reminds you to restart Claude Desktop

## Configuration Files

### Claude Code Config
Location: `~/.claude.json`
- Contains global MCP servers and project-specific configurations
- Structure: `{ "mcpServers": { "server-name": { ... } } }`

### Claude Desktop Config  
Location: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Contains MCP servers for Claude Desktop app
- Structure: `{ "mcpServers": { "server-name": { ... } } }`

## Supported MCP Server Types

- **stdio**: Command-line based servers
- **http**: HTTP-based servers with optional headers
- **sse**: Server-sent events servers

## Requirements

- Deno runtime
- Read/write access to both configuration files
- Environment variable access (for `$HOME`)

## Example Output

```
ℹ️  Starting MCP servers sync...
ℹ️  Claude Code config: /Users/username/.claude.json
ℹ️  Claude Desktop config: /Users/username/Library/Application Support/Claude/claude_desktop_config.json
ℹ️  Found 5 MCP server(s) in Claude Code config:
ℹ️    - context7: npx -y @upstash/context7-mcp
ℹ️    - github: https://api.githubcopilot.com/mcp/
ℹ️    - puppeteer: npx -y @modelcontextprotocol/server-puppeteer
✅ Successfully synced 5 MCP server(s) to Claude Desktop
ℹ️  Please restart Claude Desktop for changes to take effect
```

## License

MIT License - see the [LICENSE](LICENSE) file for details.
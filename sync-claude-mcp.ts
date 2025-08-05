#!/usr/bin/env -S deno run --allow-read --allow-write

import { join } from "@std/path";
import { exists } from "@std/fs";

type McpServer = {
  type: "stdio" | "sse" | "http";
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
  description?: string;
};

type McpServers = Record<string, McpServer>;

type ClaudeCodeConfig = {
  mcpServers: McpServers;
  [key: string]: unknown;
};

type ClaudeDesktopConfig = {
  mcpServers: McpServers;
  [key: string]: unknown;
};

type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

const getHomeDirectory = (): string => {
  const home = Deno.env.get("HOME");
  if (!home) {
    throw new Error("HOME environment variable not found");
  }
  return home;
};

const getClaudeCodeConfigPath = (homeDir: string): string => 
  join(homeDir, ".claude.json");

const getClaudeDesktopConfigPath = (homeDir: string): string => 
  join(homeDir, "Library", "Application Support", "Claude", "claude_desktop_config.json");

const readJsonFile = async <T>(filePath: string): Promise<Result<T>> => {
  try {
    const fileExists = await exists(filePath);
    if (!fileExists) {
      return { success: false, error: new Error(`File not found: ${filePath}`) };
    }

    const content = await Deno.readTextFile(filePath);
    const parsed = JSON.parse(content) as T;
    return { success: true, data: parsed };
  } catch (error) {
    return { success: false, error: error as Error };
  }
};

const writeJsonFile = async <T>(filePath: string, data: T): Promise<Result<void>> => {
  try {
    const content = JSON.stringify(data, null, 2);
    await Deno.writeTextFile(filePath, content);
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: error as Error };
  }
};

const extractMcpServers = (config: ClaudeCodeConfig): McpServers => 
  config.mcpServers || {};

const mergeMcpServers = (
  desktopConfig: ClaudeDesktopConfig, 
  codeServers: McpServers
): ClaudeDesktopConfig => ({
  ...desktopConfig,
  mcpServers: codeServers,
});

const logInfo = (message: string): void => {
  console.log(`ℹ️  ${message}`);
};

const logSuccess = (message: string): void => {
  console.log(`✅ ${message}`);
};

const logError = (message: string): void => {
  console.error(`❌ ${message}`);
};

const logWarning = (message: string): void => {
  console.warn(`⚠️  ${message}`);
};

const syncMcpServers = async (): Promise<Result<void>> => {
  try {
    const homeDir = getHomeDirectory();
    const claudeCodePath = getClaudeCodeConfigPath(homeDir);
    const claudeDesktopPath = getClaudeDesktopConfigPath(homeDir);

    logInfo("Starting MCP servers sync...");
    logInfo(`Claude Code config: ${claudeCodePath}`);
    logInfo(`Claude Desktop config: ${claudeDesktopPath}`);

    const codeConfigResult = await readJsonFile<ClaudeCodeConfig>(claudeCodePath);
    if (!codeConfigResult.success) {
      return { success: false, error: new Error(`Failed to read Claude Code config: ${codeConfigResult.error.message}`) };
    }

    const desktopConfigResult = await readJsonFile<ClaudeDesktopConfig>(claudeDesktopPath);
    if (!desktopConfigResult.success) {
      return { success: false, error: new Error(`Failed to read Claude Desktop config: ${desktopConfigResult.error.message}`) };
    }

    const codeServers = extractMcpServers(codeConfigResult.data);
    const serverCount = Object.keys(codeServers).length;
    
    if (serverCount === 0) {
      logWarning("No MCP servers found in Claude Code configuration");
      return { success: true, data: undefined };
    }

    logInfo(`Found ${serverCount} MCP server(s) in Claude Code config:`);
    Object.keys(codeServers).forEach(name => {
      const server = codeServers[name];
      const serverInfo = server.type === "stdio" 
        ? `${server.command} ${server.args?.join(" ") || ""}`
        : server.url || server.type;
      logInfo(`  - ${name}: ${serverInfo}`);
    });

    const updatedConfig = mergeMcpServers(desktopConfigResult.data, codeServers);
    
    const writeResult = await writeJsonFile(claudeDesktopPath, updatedConfig);
    if (!writeResult.success) {
      return { success: false, error: new Error(`Failed to write Claude Desktop config: ${writeResult.error.message}`) };
    }

    logSuccess(`Successfully synced ${serverCount} MCP server(s) to Claude Desktop`);
    logInfo("Please restart Claude Desktop for changes to take effect");
    
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: error as Error };
  }
};

const main = async (): Promise<void> => {
  const result = await syncMcpServers();
  
  if (!result.success) {
    logError(result.error.message);
    Deno.exit(1);
  }
};

if (import.meta.main) {
  await main();
}
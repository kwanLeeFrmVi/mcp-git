import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { spawnSync } from "child_process";

class GitManager {
  private executeGitCommand(repoPath: string, args: string[]): string {
    const result = spawnSync("git", args, {
      cwd: repoPath,
      encoding: "utf-8",
    });

    if (result.status !== 0) {
      throw new Error(`Git command failed: ${result.stderr}`);
    }

    return result.stdout;
  }

  async gitStatus(repoPath: string): Promise<string> {
    return this.executeGitCommand(repoPath, ["status"]);
  }

  async gitDiffUnstaged(repoPath: string): Promise<string> {
    return this.executeGitCommand(repoPath, ["diff"]);
  }

  async gitDiffStaged(repoPath: string): Promise<string> {
    return this.executeGitCommand(repoPath, ["diff", "--cached"]);
  }

  async gitDiff(repoPath: string, target: string): Promise<string> {
    return this.executeGitCommand(repoPath, ["diff", target]);
  }

  async gitCommit(repoPath: string, message: string): Promise<string> {
    return this.executeGitCommand(repoPath, ["commit", "-m", message]);
  }

  async gitAdd(repoPath: string, files: string[]): Promise<string> {
    return this.executeGitCommand(repoPath, ["add", ...files]);
  }

  async gitReset(repoPath: string): Promise<string> {
    return this.executeGitCommand(repoPath, ["reset"]);
  }

  async gitLog(repoPath: string, maxCount: number = 10): Promise<string> {
    return this.executeGitCommand(repoPath, [
      "log",
      `-n ${maxCount}`,
      "--pretty=format:%H %an %ad %s",
    ]);
  }

  async gitCreateBranch(
    repoPath: string,
    branchName: string,
    startPoint?: string
  ): Promise<string> {
    const args = ["branch", branchName];
    if (startPoint) args.push(startPoint);
    return this.executeGitCommand(repoPath, args);
  }

  async gitCheckout(repoPath: string, branchName: string): Promise<string> {
    return this.executeGitCommand(repoPath, ["checkout", branchName]);
  }

  async gitShow(repoPath: string, revision: string): Promise<string> {
    return this.executeGitCommand(repoPath, ["show", revision]);
  }

  async gitInit(repoPath: string): Promise<string> {
    return this.executeGitCommand(repoPath, ["init"]);
  }
}

const gitManager = new GitManager();

const server = new Server(
  {
    name: "git-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "git_status",
        description: "Shows the working tree status",
        inputSchema: {
          type: "object",
          properties: {
            repo_path: {
              type: "string",
              description: "Path to Git repository",
            },
          },
          required: ["repo_path"],
        },
      },
      {
        name: "git_diff_unstaged",
        description: "Shows changes in working directory not yet staged",
        inputSchema: {
          type: "object",
          properties: {
            repo_path: {
              type: "string",
              description: "Path to Git repository",
            },
          },
          required: ["repo_path"],
        },
      },
      {
        name: "git_diff_staged",
        description: "Shows changes that are staged for commit",
        inputSchema: {
          type: "object",
          properties: {
            repo_path: {
              type: "string",
              description: "Path to Git repository",
            },
          },
          required: ["repo_path"],
        },
      },
      {
        name: "git_diff",
        description: "Shows differences between branches or commits",
        inputSchema: {
          type: "object",
          properties: {
            repo_path: {
              type: "string",
              description: "Path to Git repository",
            },
            target: {
              type: "string",
              description: "Target branch or commit to compare with",
            },
          },
          required: ["repo_path", "target"],
        },
      },
      {
        name: "git_commit",
        description: "Records changes to the repository",
        inputSchema: {
          type: "object",
          properties: {
            repo_path: {
              type: "string",
              description: "Path to Git repository",
            },
            message: {
              type: "string",
              description: "Commit message",
            },
          },
          required: ["repo_path", "message"],
        },
      },
      {
        name: "git_add",
        description: "Adds file contents to the staging area",
        inputSchema: {
          type: "object",
          properties: {
            repo_path: {
              type: "string",
              description: "Path to Git repository",
            },
            files: {
              type: "array",
              items: { type: "string" },
              description: "Array of file paths to stage",
            },
          },
          required: ["repo_path", "files"],
        },
      },
      {
        name: "git_reset",
        description: "Unstages all staged changes",
        inputSchema: {
          type: "object",
          properties: {
            repo_path: {
              type: "string",
              description: "Path to Git repository",
            },
          },
          required: ["repo_path"],
        },
      },
      {
        name: "git_log",
        description: "Shows the commit logs",
        inputSchema: {
          type: "object",
          properties: {
            repo_path: {
              type: "string",
              description: "Path to Git repository",
            },
            max_count: {
              type: "number",
              description: "Maximum number of commits to show (default: 10)",
            },
          },
          required: ["repo_path"],
        },
      },
      {
        name: "git_create_branch",
        description: "Creates a new branch",
        inputSchema: {
          type: "object",
          properties: {
            repo_path: {
              type: "string",
              description: "Path to Git repository",
            },
            branch_name: {
              type: "string",
              description: "Name of the new branch",
            },
            start_point: {
              type: "string",
              description: "Starting point for the new branch",
            },
          },
          required: ["repo_path", "branch_name"],
        },
      },
      {
        name: "git_checkout",
        description: "Switches branches",
        inputSchema: {
          type: "object",
          properties: {
            repo_path: {
              type: "string",
              description: "Path to Git repository",
            },
            branch_name: {
              type: "string",
              description: "Name of branch to checkout",
            },
          },
          required: ["repo_path", "branch_name"],
        },
      },
      {
        name: "git_show",
        description: "Shows the contents of a commit",
        inputSchema: {
          type: "object",
          properties: {
            repo_path: {
              type: "string",
              description: "Path to Git repository",
            },
            revision: {
              type: "string",
              description:
                "The revision (commit hash, branch name, tag) to show",
            },
          },
          required: ["repo_path", "revision"],
        },
      },
      {
        name: "git_init",
        description: "Initializes a Git repository",
        inputSchema: {
          type: "object",
          properties: {
            repo_path: {
              type: "string",
              description: "Path to directory to initialize git repo",
            },
          },
          required: ["repo_path"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error(`No arguments provided for tool: ${name}`);
  }

  switch (name) {
    case "git_status":
      return {
        content: [
          {
            type: "text",
            text: await gitManager.gitStatus(args.repo_path as string),
          },
        ],
      };
    case "git_diff_unstaged":
      return {
        content: [
          {
            type: "text",
            text: await gitManager.gitDiffUnstaged(args.repo_path as string),
          },
        ],
      };
    case "git_diff_staged":
      return {
        content: [
          {
            type: "text",
            text: await gitManager.gitDiffStaged(args.repo_path as string),
          },
        ],
      };
    case "git_diff":
      return {
        content: [
          {
            type: "text",
            text: await gitManager.gitDiff(
              args.repo_path as string,
              args.target as string
            ),
          },
        ],
      };
    case "git_commit":
      return {
        content: [
          {
            type: "text",
            text: await gitManager.gitCommit(
              args.repo_path as string,
              args.message as string
            ),
          },
        ],
      };
    case "git_add":
      return {
        content: [
          {
            type: "text",
            text: await gitManager.gitAdd(
              args.repo_path as string,
              args.files as string[]
            ),
          },
        ],
      };
    case "git_reset":
      return {
        content: [
          {
            type: "text",
            text: await gitManager.gitReset(args.repo_path as string),
          },
        ],
      };
    case "git_log":
      return {
        content: [
          {
            type: "text",
            text: await gitManager.gitLog(
              args.repo_path as string,
              args.max_count as number
            ),
          },
        ],
      };
    case "git_create_branch":
      return {
        content: [
          {
            type: "text",
            text: await gitManager.gitCreateBranch(
              args.repo_path as string,
              args.branch_name as string,
              args.start_point as string | undefined
            ),
          },
        ],
      };
    case "git_checkout":
      return {
        content: [
          {
            type: "text",
            text: await gitManager.gitCheckout(
              args.repo_path as string,
              args.branch_name as string
            ),
          },
        ],
      };
    case "git_show":
      return {
        content: [
          {
            type: "text",
            text: await gitManager.gitShow(
              args.repo_path as string,
              args.revision as string
            ),
          },
        ],
      };
    case "git_init":
      return {
        content: [
          {
            type: "text",
            text: await gitManager.gitInit(args.repo_path as string),
          },
        ],
      };
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Git MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});

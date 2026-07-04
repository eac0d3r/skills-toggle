# skills-toggle

[![npm version](https://img.shields.io/npm/v/skills-toggle)](https://www.npmjs.com/package/skills-toggle)
[![license](https://img.shields.io/npm/l/skills-toggle)](./LICENSE)
[![node](https://img.shields.io/node/v/skills-toggle)](https://nodejs.org)

Interactively toggle AI coding assistant skill invocation modes — supports **GitHub Copilot**, **Claude Code**, **Pi**, and the **Agent Skills** open standard.

## Quick Start

```bash
npx skills-toggle
```

## What It Does

AI coding skills (`.agents/skills/`, `.github/skills/`, `.copilot/skills/`, `.claude/skills/`, `.pi/skills/`) use two YAML frontmatter flags to control who can invoke them:

| `disable-model-invocation` | `user-invocable` | Who Can Invoke? | Mode |
| :--- | :--- | :--- | :--- |
| `false` *(or omitted)* | `true` *(or omitted)* | **User & Model (AI)** | **Full** — User invokes manually (`/skill`) and AI invokes autonomously when relevant. |
| `true` | `true` *(or omitted)* | **User Only** | **User Only** — AI is blocked from invoking. Use for critical actions like `deploy`, `drop-db`. |
| `false` *(or omitted)* | `false` | **Model (AI) Only** | **Model Only** — Hidden from user; AI consults in background (architecture rules, style guides). |
| `true` | `false` | **Nobody** | **Disabled** — Completely deactivated. Useful for drafts or temporary deactivation. |

`skills-toggle` scans your skill directories, shows the current mode for each skill, and lets you change them interactively.

## Usage

```bash
# Toggle local (project) skills (default)
npx skills-toggle

# Explicitly local
npx skills-toggle --local
npx skills-toggle -l

# Toggle global (personal) skills
npx skills-toggle --global
npx skills-toggle -g

# Use a different working directory
npx skills-toggle --cwd /path/to/project
```

### Options

| Option | Description |
| --- | --- |
| `-l`, `--local` | Scan project skills only *(default)* |
| `-g`, `--global` | Scan personal/global skills only |
| `--cwd <path>` | Set working directory (default: current directory) |
| `--help` | Show help message |
| `--version` | Show version number |

`-l`/`--local` and `-g`/`--global` are mutually exclusive.

## Supported Skill Locations

### Local (Project) — `-l`, `--local` (default)

| Directory | Source |
| --- | --- |
| `.agents/skills/` | Agent Skills standard |
| `.github/skills/` | GitHub Copilot |
| `.claude/skills/` | Claude Code |
| `.pi/skills/` | Pi |

### Global (Personal) — `-g`, `--global`

| Directory | Source |
| --- | --- |
| `~/.agents/skills/` | Agent Skills standard |
| `~/.copilot/skills/` | GitHub Copilot |
| `~/.claude/skills/` | Claude Code |
| `~/.pi/skills/` | Pi |

## How It Works

1. Scans the relevant skill directories for `SKILL.md` files
2. Parses the YAML frontmatter to determine the current invocation mode
3. Presents an interactive multi-select to choose skills to modify
4. For each selected skill, lets you pick a new invocation mode
5. Shows a summary of pending changes for confirmation
6. Updates the YAML frontmatter in each `SKILL.md`, preserving the body content

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Lint
npm run lint

# Format
npm run format

# Run locally
node dist/cli/index.js
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'feat: add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## License

[MIT](./LICENSE)

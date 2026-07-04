import { run } from "./ui.js";
import type { CliOptions, SkillScope } from "../core/types.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

function printHelp(): void {
    console.log(`
  skills-toggle — Toggle AI skill invocation modes

  Usage:
    npx skills-toggle [options]

  Options:
        -l, --local     Scan project skills only (default)
        -g, --global    Scan personal/global skills only
        --cwd <path>    Set working directory (default: process.cwd())
        --help          Show this help message
        --version       Show version number

  Scope directories:
        Local:   .agents/skills/  .github/skills/   .claude/skills/  .pi/skills/
        Global:  ~/.agents/skills/ ~/.copilot/skills/ ~/.claude/skills/ ~/.pi/skills/
`);
}

function getVersion(): string {
    try {
        const dir = path.dirname(fileURLToPath(import.meta.url));
        // Walk up to find package.json (works from dist/ or src/)
        for (const base of [dir, path.join(dir, ".."), path.join(dir, "..", "..")]) {
            try {
                const pkg = JSON.parse(readFileSync(path.join(base, "package.json"), "utf-8"));
                if (pkg.version) return pkg.version;
            } catch {
                // continue searching
            }
        }
    } catch {
        // fallback
    }
    return "0.0.0";
}

function parseArgs(argv: string[]): CliOptions {
    let scope: SkillScope = "local";
    let cwd = process.cwd();
    let hasLocal = false;
    let hasGlobal = false;

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        switch (arg) {
            case "-l":
            case "--local":
                hasLocal = true;
                break;
            case "-g":
            case "--global":
                hasGlobal = true;
                break;
            case "--cwd":
                cwd = argv[++i] ?? cwd;
                break;
            case "--help":
                printHelp();
                process.exit(0);
                break;
            case "--version":
                console.log(getVersion());
                process.exit(0);
                break;
            default:
                if (arg.startsWith("-")) {
                    console.error(`Unknown option: ${arg}\nRun with --help for usage.`);
                    process.exit(1);
                }
        }
    }

    if (hasLocal && hasGlobal) {
        console.error("Error: -l/--local and -g/--global are mutually exclusive.\nRun with --help for usage.");
        process.exit(1);
    }

    if (hasGlobal) scope = "global";

    return { scope, cwd: path.resolve(cwd) };
}

const options = parseArgs(process.argv.slice(2));

process.on("SIGINT", () => {
    console.log("\nCancelled.");
    process.exit(0);
});

run(options).catch((err: unknown) => {
    console.error(err);
    process.exit(1);
});

import pc from "picocolors";
import readline from "node:readline";
import type { InvocationMode, SkillEntry, SkillChange } from "../core/types.js";
import { formatSource, formatMode } from "./format.js";

const MODES: InvocationMode[] = ["full", "user-only", "model-only", "disabled"];

function nextMode(mode: InvocationMode): InvocationMode {
    const idx = MODES.indexOf(mode);
    return MODES[(idx + 1) % MODES.length];
}

interface RowState {
    skill: SkillEntry;
    originalMode: InvocationMode;
    currentMode: InvocationMode;
}

type ActionRow = "save" | "cancel";
type FocusTarget = number | ActionRow;

function isSkillRow(target: FocusTarget): target is number {
    return typeof target === "number";
}

const MODE_HINTS: Record<InvocationMode, string> = {
    full: "User & AI can invoke",
    "user-only": "Only user can invoke (/command)",
    "model-only": "Only AI invokes (background)",
    disabled: "Completely deactivated",
};

const ANSI_PATTERN = new RegExp(String.raw`\x1B\[[0-?]*[ -/]*[@-~]`, "g");

function visibleLength(value: string): number {
    return Array.from(value.replace(ANSI_PATTERN, "")).length;
}

export function getRenderedLineCount(output: string, columns: number): number {
    const safeColumns = Math.max(1, columns);

    return output
        .split("\n")
        .reduce((lineCount, line) => lineCount + Math.max(1, Math.ceil(visibleLength(line) / safeColumns)), 0);
}

function render(rows: RowState[], focus: FocusTarget, columns: number): string {
    const lines: string[] = [];

    lines.push(
        pc.cyan("◆") +
        "  Toggle skill modes " +
        pc.dim("(↑↓ navigate · space toggle · enter confirm)"),
    );
    lines.push(pc.dim("│"));

    const nameWidth = Math.max(...rows.map((r) => r.skill.name.length));

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const focused = isSkillRow(focus) && focus === i;
        const changed = row.currentMode !== row.originalMode;

        const cursor = focused ? pc.cyan("❯") : " ";
        const source = formatSource(row.skill.source, row.skill.scope);
        const name = row.skill.name.padEnd(nameWidth);
        const mode = formatMode(row.currentMode);
        const marker = changed ? pc.yellow(" ✎") : "";
        const hint = focused ? pc.dim(`  ${MODE_HINTS[row.currentMode]}`) : "";

        lines.push(`${pc.dim("│")}  ${cursor} ${source} ${pc.bold(name)}  ${mode}${marker}${hint}`);
    }

    lines.push(pc.dim("│"));
    lines.push(pc.dim("│") + pc.dim("  ─".repeat(Math.min(30, Math.floor(columns / 2)))));
    lines.push(pc.dim("│"));

    const changeCount = rows.filter((r) => r.currentMode !== r.originalMode).length;

    const saveFocused = focus === "save";
    const cancelFocused = focus === "cancel";

    const saveLabel = changeCount > 0 ? `Save ${changeCount} change${changeCount > 1 ? "s" : ""}` : "Save (no changes)";

    lines.push(
        `${pc.dim("│")}  ${saveFocused ? pc.cyan("❯") : " "} ${saveFocused ? pc.green(pc.bold(saveLabel)) : changeCount > 0 ? pc.green(saveLabel) : pc.dim(saveLabel)}`,
    );
    lines.push(
        `${pc.dim("│")}  ${cancelFocused ? pc.cyan("❯") : " "} ${cancelFocused ? pc.red(pc.bold("Cancel")) : "Cancel"}`,
    );

    lines.push(pc.dim("│"));

    return lines.join("\n");
}

export function togglePrompt(skills: SkillEntry[]): Promise<SkillChange[] | null> {
    return new Promise((resolve) => {
        const rows: RowState[] = skills.map((skill) => ({
            skill,
            originalMode: skill.invocationMode,
            currentMode: skill.invocationMode,
        }));

        let focus: FocusTarget = 0;
        const totalItems = rows.length + 2; // skills + save + cancel
        let renderedLineCount = 0;

        function getFocusIndex(): number {
            if (isSkillRow(focus)) return focus;
            if (focus === "save") return rows.length;
            return rows.length + 1;
        }

        function setFocusFromIndex(idx: number): void {
            if (idx < 0) idx = 0;
            if (idx >= totalItems) idx = totalItems - 1;

            if (idx < rows.length) {
                focus = idx;
            } else if (idx === rows.length) {
                focus = "save";
            } else {
                focus = "cancel";
            }
        }

        function clearRendered(): void {
            if (renderedLineCount > 0) {
                readline.moveCursor(process.stdout, 0, -renderedLineCount);
                readline.cursorTo(process.stdout, 0);
                readline.clearScreenDown(process.stdout);
                renderedLineCount = 0;
            }
        }

        function draw(): void {
            clearRendered();
            const columns = process.stdout.columns || 80;
            const output = render(rows, focus, columns);
            process.stdout.write(output + "\n");
            renderedLineCount = getRenderedLineCount(output, columns);
        }

        function cleanup(): void {
            process.stdin.setRawMode(false);
            process.stdin.removeListener("data", onData);
            process.stdin.pause();
        }

        function onData(buf: Buffer): void {
            const key = buf.toString();

            // Ctrl+C
            if (key === "\x03") {
                cleanup();
                clearRendered();
                resolve(null);
                return;
            }

            // Arrow up
            if (key === "\x1b[A") {
                setFocusFromIndex(getFocusIndex() - 1);
                draw();
                return;
            }

            // Arrow down
            if (key === "\x1b[B") {
                setFocusFromIndex(getFocusIndex() + 1);
                draw();
                return;
            }

            // Space — toggle mode on skill rows
            if (key === " " && isSkillRow(focus)) {
                rows[focus].currentMode = nextMode(rows[focus].currentMode);
                draw();
                return;
            }

            // Enter
            if (key === "\r" || key === "\n") {
                cleanup();

                clearRendered();

                if (focus === "cancel") {
                    resolve(null);
                    return;
                }

                if (focus === "save") {
                    const changes: SkillChange[] = rows
                        .filter((r) => r.currentMode !== r.originalMode)
                        .map((r) => ({ skill: r.skill, newMode: r.currentMode }));
                    resolve(changes);
                    return;
                }

                // Enter on a skill row — also toggle
                if (isSkillRow(focus)) {
                    rows[focus].currentMode = nextMode(rows[focus].currentMode);
                    draw();
                    // Re-attach since we cleaned up
                    process.stdin.setRawMode(true);
                    process.stdin.resume();
                    process.stdin.on("data", onData);
                }
            }
        }

        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on("data", onData);

        draw();
    });
}

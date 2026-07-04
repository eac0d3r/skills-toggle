import pc from "picocolors";
import type { InvocationMode, SkillEntry, SkillSource } from "../core/types.js";

const SOURCE_LABELS: Record<SkillSource, string> = {
    copilot: pc.blue("Copilot"),
    claude: pc.yellow("Claude"),
    agents: pc.green("Agents"),
};

const MODE_LABELS: Record<InvocationMode, string> = {
    full: pc.green("User & Model"),
    "user-only": pc.cyan("User Only"),
    "model-only": pc.magenta("Model Only"),
    disabled: pc.red("Disabled"),
};

const MODE_DESCRIPTIONS: Record<InvocationMode, string> = {
    full: "Default — user can invoke manually and AI can invoke autonomously",
    "user-only": "Security — AI is blocked from invoking; user-only via /command",
    "model-only": "Context injection — AI consults in background; hidden from user",
    disabled: "Inert — skill is completely deactivated (draft/temporary off)",
};

export function formatSource(source: SkillSource): string {
    return `[${SOURCE_LABELS[source]}]`;
}

export function formatMode(mode: InvocationMode): string {
    return MODE_LABELS[mode];
}

export function formatSkillLabel(skill: SkillEntry): string {
    const source = formatSource(skill.source);
    const mode = formatMode(skill.invocationMode);
    const desc = skill.description ? pc.dim(` — ${truncate(skill.description, 60)}`) : "";
    return `${source} ${pc.bold(skill.name)} ${pc.dim("(")}${mode}${pc.dim(")")}${desc}`;
}

export function modeChoices(): { value: InvocationMode; label: string; hint: string }[] {
    return [
        { value: "full", label: "User & Model", hint: MODE_DESCRIPTIONS["full"] },
        { value: "user-only", label: "User Only", hint: MODE_DESCRIPTIONS["user-only"] },
        { value: "model-only", label: "Model Only", hint: MODE_DESCRIPTIONS["model-only"] },
        { value: "disabled", label: "Disabled", hint: MODE_DESCRIPTIONS["disabled"] },
    ];
}

function truncate(str: string, max: number): string {
    const oneLine = str.replace(/\n/g, " ").trim();
    if (oneLine.length <= max) return oneLine;
    return oneLine.slice(0, max - 1) + "…";
}

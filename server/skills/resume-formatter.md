---
name: resume-tailor
description: "Use whenever a job description (JD) is provided and the goal is a resume tailored to it — pasted JD text, a JD link, a JD file, or phrasing like 'tailor my resume to this', 'make a resume for this role', 'tune to this posting', 'which of my bullets match this', or 'pick the 10/10 keyword matches'. Generates a targeted 1.5-page LaTeX resume (.tex + compiled PDF) from the candidate's MASTER resume (bundled with this skill at assets/Bhargavi-master.tex) by removal only — bullets and skills are copied verbatim and pruned, never reworded: (1) apply ATS-result feedback to cut weak lines while preserving target keywords, (2) prune the skills section to the JD's tech stack, and (3) select bullets whose action-verb category matches the JD's responsibilities using a curated verb bank. Trigger even if the JD is pasted with no explicit instruction — a JD in the message IS the signal. Do NOT use for building or editing the master resume itself, or for generic resume advice with no JD attached."
---

# Resume Tailor

Turn a MASTER resume into a targeted 1.5-page resume for a specific JD. The master is the multi-page menu; the tailored output is up to 1.5 pages cut from it. The primary operation is **removal**: every bullet and every skill is copied verbatim from the master and either kept or deleted — never merged, shortened, added to, reordered, or rephrased. Nothing is written from scratch, so the output cannot drift or fabricate.

The one permitted in-place edit is a **transferable-skill swap** (see "Transferable-skill swap" below): replacing a single tech-stack term or a single action verb inside an otherwise-verbatim bullet, and only when the candidate genuinely has that transferable skill. The sentence is never rephrased and nothing is invented.

## Inputs

1. **Master resume (bundled — always read from this)** — `assets/Bhargavi-master.tex`, packaged with this skill. It is the canonical source of every bullet, the skills list, the header, and education, and the exact preamble/template to reuse. **Read from it every time** instead of reconstructing anything from memory. If a newer master is attached at invocation, use that one and treat the bundled copy as the fallback.
2. **Experience matrix** — the spreadsheet (e.g. `experience-matrix.xlsx`), provided at invocation. Read it with `extract-text <file>`. Columns per row: **Section** (role), **Work** (JD-voice — never copy verbatim), **What I did** (the 2-word ground-truth action), **Problem**, **Stack**, **Number** (metrics), **Scope** (carries verification flags), **Category**. The "How to use" tab documents its own rules. Optional — the bundled master already reflects the matrix's verification decisions; use the matrix only when you need to double-check a flag or find the ATS tab.
3. **ATS feedback** — from the matrix's **"ATS result" tab** if present, otherwise a pasted or uploaded ATS report for this JD. This is per-JD and changes every run.
4. **The JD** — pasted text, a file, or a URL.

The bundled master is always available. If the **JD** or the **ATS feedback** is missing, stop and ask — do not invent them.

## Keeping the bundled master current

`assets/Bhargavi-master.tex` is a snapshot from when the skill was packaged. When the master resume changes, replace that file and re-package the skill — or simply attach the newer master when running the skill, since an attached file takes precedence. This keeps the skill from ever tailoring off a stale master.

## Non-negotiables

These come from repeated corrections. Break one and the draft gets rejected, because the candidate checks every line against ground truth.

- **Removal is the only operation — in BOTH the experience and skills sections.** Never rephrase, reword, merge, shorten, add to, reorder, or otherwise edit any experience bullet or any skill. Take each one verbatim from the master and either keep it exactly or delete it. Tailoring is purely subtractive; that is what guarantees the output can't drift or fabricate. (Any dynamic *additions* to skills happen through a separate process, not through this skill.)
- **Zero fabrication.** Every bullet, number, and skill must exist in the master or matrix. No invented metrics, no invented scope, no swapped tech stacks.
- **Keep true numbers intact.** Never inflate, and never drop a real-but-undersold number (e.g. 560ms→100ms, 42% complaint reduction, 2M profiles, $450K savings). If a prior draft weakened one, restore it.
- **Respect matrix verification flags.** A yellow Scope cell, a `?`, or "UNVERIFIED" means the missing claim is not backed. Do not assert it — no "led," no adoption counts, no team sizes — unless it has since been confirmed.
- **Behavioral-only rows never appear on the resume** (the matrix rows tagged "never on resume": mentoring, incorporating feedback, pushing back). They are interview material only.
- **The MCP observability agent is a prototype, not deployed.** Never claim deployment or attach a fabricated metric to it.
- **Header facts are fixed.** Name, contact, titles, locations, education, and dates come straight from the master. Don't alter them to fit the JD.

## Step 1 — Apply ATS-result feedback

Open the ATS feedback. It lists lines to remove, weak or duplicate bullets, missing keywords, and keywords already present. Then:

- Cut the lines it flags for removal.
- Before cutting a line, check whether it is the **only carrier** of a target keyword the ATS wants. If so, **keep the whole line verbatim** — removal is optional per line, but editing a line to preserve a keyword is never allowed.
- Prefer cutting **redundancy** (two bullets making the same point — the weaker one goes) over cutting a bullet that holds a unique keyword or a strong number.

The result is fewer bullets that still carry every target keyword and the strongest verified work — same wording as the master, just a subset of the lines.

## Step 2 — Write the skills section from the JD

The skills section is **retained from the master and pruned — removal only.** Do not add, reword, or regroup skills; any dynamic additions are handled by a separate process, outside this skill.

- Read the JD's required and preferred tech, tools, and platforms.
- From the master skills list, **keep** the entries the JD calls for, plus closely adjacent ones already in the master that the JD's domain implies (JD says "event-driven" → keep Kafka, Azure Service Bus; "caching" → keep Redis). **Remove** everything the JD doesn't care about so the block stays targeted.
- Never add a skill that isn't already in the master, even if the JD asks for it — a missing requirement goes in the gap list (Output), not on the resume.
- Keep the surviving entries **exactly as written** in the master: verbatim tool names, existing categories, existing order. The block is a subset of the master skills, nothing more.

## Step 3 — Select bullets by matching JD verbs to the verb bank

- Read the JD's responsibilities and classify their emphasis into the seven categories below. A JD heavy on "partner, coordinate, communicate" → **Communication**; on "design, build, own delivery" → **Creative + Leadership**; on "optimize, debug, analyze" → **Research + Management**.
- For each emphasized category, include that category's bullets from the master, taken from the roles the bank assigns.
- Keep **one Communication verb per role**, **never repeat a verb** across the resume, and prefer bullets that also carry the JD's target keywords (Step 2) and a real number.
- Trim each role to fit 1.5 pages — roughly **5–7 Rocket, 4–5 SDE II, 3–4 SDE I** — by removing the least JD-relevant bullets and keeping the survivors in their **master order** (no reordering).

### The verb bank

Each lead verb corresponds to a specific master bullet (master bullets start with these verbs). This is the selection index: emphasized category → its verbs → pull those bullets.

| Category | Verbs |
| --- | --- |
| Communication | Addressed, Collaborated, Resolved |
| Creative | Created, Designed, Developed, Published, Integrated |
| Leadership | Advocated, Contributed, Demonstrated, Launched, Volunteered, Led |
| Management | Accelerated, Accomplished, Achieved, Emphasized, Enforced, Exceeded, Expanded, Coordinated, Implemented, Improved, Initiated, Managed, Refactored, Reviewed, Streamlined |
| Technical | Maintained, Adapted, Built, Fortified, Rectified, Revamped, Standardized, Upgraded |
| Organization | Monitored, Validated, Verified, Compiled |
| Research | Identified, Evaluated, Diagnosed, Assessed, Determined, Explored, Investigated, Measured, Solved, Tested |

Flagship bullets in the master that fall outside this bank (e.g. **Owned** end-to-end delivery, **Achieved** 100% event recovery) are always-strong anchors — use them to lead a role or fill space regardless of category, without reusing their verb elsewhere.

## Bullet format (reference only — the skill never writes or edits bullets)

Every master bullet already follows this shape:

**Action verb + responsibility + business (one word) + problem + stack + number** — one compound sentence, numbers in the sentence, no em-dashes or arrows.

Because tailoring is removal-only, the skill never authors, rewrites, merges, or trims a bullet. Bullets are taken from the master **verbatim** and either kept or dropped. This section exists so you can recognize the shape, not to edit toward it.

## Output

1. A 1.5-page `.tex` using the master's exact preamble/template, plus the compiled PDF.
2. A short **match report** (standing format):
   - **Keyword match** — highlight only **10/10 (100%)** matches between the candidate's work and the JD.
   - **Competitive rank**, **applicant-volume estimate** (assume 5 hours since posting unless stated otherwise), and **funnel position**.
   - **Gap list** — JD-required skills the candidate does not have, kept off the resume and surfaced here so they can decide how to address them.

Keep the report neatly spaced with clear sections — no dense walls of text.

## Compile and verify

Run twice, then render pages 1-2 and confirm the content fits within 1.5 pages with nothing overflowing:

```bash
pdflatex -interaction=nonstopmode -halt-on-error <file>.tex
pdflatex -interaction=nonstopmode -halt-on-error <file>.tex
pdftoppm -png -r 120 -f 1 -l 1 <file>.pdf check
```

Escape literal `%` as `\%`, `$` as `\$`, `&` as `\&`; use `$\times$` for `×` and math mode (`$R^2$`, `$\mu$g/m$^3$`) for superscripts and Greek.

## Worked example (compressed)

**JD:** Java, Spring Boot, Kafka; "own reliability of event pipelines"; "partner with cross-functional teams."

- **Skills written:** Languages (Java, TypeScript, SQL) · Backend (Spring Boot WebFlux, REST, OpenAPI, Node.js) · Messaging & Data (Kafka, Azure Service Bus, Redis, MongoDB) · Cloud & DevOps (Docker, GitHub Actions, New Relic). Frontend trimmed to one line or dropped.
- **Verbs pulled:** Fortified + Achieved (event pipeline, DLQ) · Refactored + Enforced + Standardized (backend correctness) · Monitored + Verified (reliability) · Collaborated (the one Communication bullet, cross-team). Frontend Creative bullets (loan-officer page) dropped as off-target.
- **Report:** keyword match highlights Kafka / Spring Boot / Azure Service Bus / Redis as 10/10; plus rank, volume, funnel; gap list flags anything the JD requires that's absent (e.g. Terraform).

## When NOT to use

- Building or editing the master resume itself.
- Generic resume advice with no JD attached.
- Any non-resume task.
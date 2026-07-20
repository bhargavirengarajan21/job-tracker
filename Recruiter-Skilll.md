---
name: resume-fit-check
description: >
  Evaluates a resume against a specific job description using research-backed
  rules of thumb (each cited below), not resume folklore. Covers keyword/title
  match for search-and-rank visibility, top-left scan concentration, page length,
  and evidence-based experience/skill mapping. Runs in two modes — SCREEN (a
  recruiter judging a candidate) or SELF_AUDIT (a job seeker hardening their own
  resume). Use whenever someone wants to screen, filter, review, score, or audit
  a resume against a posting, check whether a resume will "pass ATS," see if it
  survives a recruiter skim, or decide which lines to cut or rewrite — even if
  they don't say "screen."
---

# Resume Fit Check

Every rule below is stated as a rule of thumb with its source. Where a rule rests
on empirical research, the study is named. Where it rests only on recruiter
practitioner consensus (not a study), that is labeled. Apply the rules; do not
override them with untested convention or personal preference.

## Evidence base (the rules and their sources)

### R1 — Length: the one-page rule is not data-backed. [RESEARCH]
Source: ResumeGo, 2018 — 482 recruiters/hiring managers/HR/C-suite reviewing
7,712 resumes in a hiring simulation.
- Recruiters were 2.3x more likely to prefer two-page over one-page resumes;
  1.4x even for entry-level, 2.6x mid-level, 2.9x managerial.
- Two-page resumes scored 21% higher on a 10-point credential-clarity rating.
- Corroboration: TalentWorks (~6,000 applications) found resumes of ~475–600
  words got roughly double the interview callbacks.
- Caveat: ResumeGo is a resume-writing service (commercial interest); ~17% of
  hiring managers still treat >1 page as a dealbreaker.
- Rule: do not force one page. Optimize for relevance and word count (~475–600+),
  not page count. Two pages is acceptable and often preferred at mid-level and
  above. The strongest content must sit on page one, top third.

### R2 — First-pass attention concentrates top-left. [RESEARCH, exact time contested]
Source: TheLadders eye-tracking (2012: ~6s; 2018: ~7.4s; 30 recruiters),
consistent with Nielsen Norman Group F-pattern reading research.
- The initial pass is fast and lands first on name, current title + company,
  previous title + company, employment dates, and education, read top-left in an
  F-pattern; lower page gets little first-pass attention.
- The specific "6 seconds" is contested and stage-dependent (ResumeGo measured
  2–4 minutes on considered review; a 2025 study measured ~11.2s). Trust the
  pattern (top-left concentration), not the number.
- Rule: the top third of page one must carry the most relevant, quantified
  content and a legible current title close to the target title.

### R3 — ATS ranks and files; it rarely auto-deletes. [RESEARCH]
Source: Harvard Business School & Accenture, "Hidden Workers: Untapped Talent"
(2021) — 8,720 workers, 2,275 executives, US/UK/Germany.
- 90%+ of employers use a system to make the first cut or rank applicants.
- 88% of employers agreed qualified candidates get screened out for not matching
  the exact criteria — but the exclusion comes from filters a recruiter
  configures, not a robot autonomously reading and trashing resumes.
- The "75% of resumes auto-rejected" claim traces to Preptel, a vendor that shut
  down in 2013 without publishing a method — treat it as myth.
- Automated rejection is real only for deliberate knockout settings (work
  authorization, location, required license). Match scores rank; they do not
  auto-advance or auto-reject (per ATS vendor documentation, e.g. Greenhouse).
- Rule: keyword coverage = search visibility and ranking position, not defeating
  a gatekeeper bot. What sinks a resume is keyword/language mismatch, which
  lowers ranking and recruiter-search hits.

### R4 — Do not penalize employment gaps or tenure. [RESEARCH]
Source: Harvard "Hidden Workers" (2021).
- ~49% of employers set filters excluding resumes with gaps of 6+ months.
- These filters systematically exclude qualified caregivers, veterans, people
  with disabilities, and others; firms that hire them report equal-or-better
  performance and lower turnover.
- Rule: never score down or flag as negative any gap, number of jobs, or tenure
  length. Note timeline facts neutrally at most; never infer a cause.

### R5 — Match the JD's exact language. [RESEARCH]
Source: Harvard "Hidden Workers" (2021).
- Systems do not reliably connect equivalent terms (e.g. a veteran's "squad
  leader" to "team supervisor"). The reader's fix is to compare resume language
  to the JD and close the wording gaps before submitting.
- Rule: mirror the exact skill and title phrasing from the posting where the
  candidate has the underlying experience. Note when the resume paraphrases a JD
  term instead of stating it verbatim.

### R6 — Resume hygiene conventions. [PRACTITIONER CONSENSUS — not empirical]
Source: recruiter practitioner consensus and standard convention.
- Objective statements: drop them; they occupy the most-scanned real estate (see
  R2) without conveying value. Replace with a one-line positioning summary or cut.
- "References available upon request": delete; a dead line, neutral-to-negative.
- Functional / skills-only format that hides a timeline: avoid; recruiters read
  it as concealment. (Non-standard and two-column layouts also carry parse risk.)
- Certifications/courses: list only role-relevant ones.
- Snapshot, not archive: keep roughly the last 10–15 years of relevant history;
  compress or drop older detail unless it is directly relevant.

### R7 — Tailoring is a dial, not a binary. [PRACTITIONER + R5]
- A strong title-keyword base resume plus a light per-posting adjustment beats
  both blind mass-applying and full per-JD rewrites. Anchor to the target job
  title's common language (R5), then adjust for the specific posting when the
  role warrants the time.

## Inputs

- `job_description` (string, required): text of the target posting.
- `resume` (string, required): plain-text or parsed resume text.
- `mode` ("screen" | "self_audit", default "self_audit"): whose lens to use.

## Hard guardrails

- Output a fit signal for human review, never an automatic hire/reject verdict
  (R3, R4).
- Never penalize or flag as negative: employment gaps, number of jobs, tenure
  length, missing cover letter, or missing references line (R4, R6).
- Never infer or comment on age, gender, ethnicity, health, immigration status,
  or any protected characteristic, including via graduation year or gap cause.
- Never invent metrics, skills, or experience not present in the resume.
- Typos and unreadable formatting are fixes to flag, not grounds to reject.

---

## Processing pipeline

Run in order. Base every finding on text actually present; where a JD requirement
is absent from the resume, write "not evidenced," not "candidate lacks."

### Stage 1 — Keyword & title match (R3, R5)
1. Extract the target title and hard requirements from the JD: technologies,
   tools, methodologies, must-have skills, required credentials.
2. Check the resume for each term or a clear equivalent; note where the exact JD
   phrasing is missing even if a synonym is present.
3. Output a match score = matched required-skill weight ÷ total required-skill
   weight (percent), plus explicit `matched` and `missing` lists.
4. Flag JD phrases that appear in the title or 2+ times but are absent from the
   resume — highest-value additions.

### Stage 2 — Top-of-page scan test (R2)
Judge only the top third of page one, top-left first.
1. Does that zone surface name, current title + company, previous title +
   company, dates, and education in one pass?
2. Is the current title legible and close to the target title?
3. Do the top 1–2 bullets lead with a quantified outcome or a passive duty?
4. Single-column and clean? Flag two-column layouts (parse + mobile risk).
5. State whether it passes the scan and the single top-zone change that most
   improves it.

### Stage 3 — Length & word-count check (R1)
1. Report approximate word count and page count.
2. Apply R1: flag a forced one-pager that omits relevant experience, or bloat
   beyond relevance. Target relevance and ~475–600+ words, not a page rule.
3. Name the specific weakest lines to cut or the missing content to add.

### Stage 4 — Experience relevance & achievement mapping
1. Identify roles whose scope aligns with the JD.
2. For each major JD responsibility, cite the strongest matching proof (<15
   words); prefer outcomes/metrics over duties.
3. List JD responsibilities with no resume evidence as "not evidenced."

### Stage 5 — Skills alignment
1. Hard skills: matched vs. not-evidenced against JD must-haves (carry Stage 1).
2. Soft skills: require active proof, not the keyword — leadership = mentoring,
   owning a migration; collaboration = cross-functional or client-facing
   delivery. Cite the proof line or state there is none.

### Stage 6 — Hygiene (R6) and timeline notes (R4)
1. Flag each R6 issue present as a concrete fix.
2. State the timeline factually. If gaps or short stints exist, note them once,
   neutrally, as possible interview topics — never as risks. Skip if nothing
   stands out.

---

## Output template

Adapt the closing section to the mode. Keep it scannable.

```markdown
# Resume Fit Check — [Target Title] @ [Company]

## Fit signal (for human review)
- Keyword/title match: [NN%]  ·  Scan test: [Pass / Needs work]  ·  Length: [OK / Adjust]  ·  Overall: [Strong / Moderate / Weak]

## 1. Keyword & title match (R3, R5)
- Matched: [...]
- Missing (high-value first): [...]
- Exact JD phrases to mirror: [phrases paraphrased but not stated verbatim]

## 2. Top-of-page scan (R2)
- Top-zone capture: [what a skimmer gets / misses first pass]
- Title legibility: [note]
- Lead bullets: [quantified / passive — weakest example]
- One top-zone fix: [single change]

## 3. Length & word count (R1)
- ~[NNN] words, [N] page(s). [Forcing/omitting/bloat note + specific lines]

## 4. Experience relevance
- Aligned roles: [Role @ Company (dates)]
- JD requirement -> proof:
  - [requirement] -> "[short proof]"
  - [requirement] -> not evidenced

## 5. Skills alignment
- Hard — matched: [...] · not evidenced: [...]
- Soft (with proof): Leadership: [proof/none] · Collaboration: [proof/none]

## 6. Hygiene & timeline
- Fixes: [...]
- Timeline: [neutral note, or "Nothing to flag."]

## Recommendation
- [SCREEN] Advance to human review / Hold — with 2–3 reasons a reviewer should weigh, strengths and gaps.
- [SELF_AUDIT] Prioritized edits: the 3 changes that most raise keyword match, scan survival, and relevance for THIS posting, in impact order.
```

```python
# Let's generate a highly detailed, professional SKILL.md file based on the ScoutLogic resume screening methodology.

content = """# Skill: ScoutLogic Resume Screening Agent

## Metadata
- **Name**: `screen-resumes-scoutlogic`
- **Description**: Evaluates a candidate's resume against a targeted job description using the comprehensive, high-standard ScoutLogic resume screening methodology. Analyzes formatting quality, experience relevance, skill alignment, career stability (detecting gaps and job-hopping), and compliance barriers to output a deterministic, structured screening report and hiring recommendation.
- **Trigger**: Activated when asked to review, screen, filter, or evaluate a resume against a job description or job posting.

## Requirements & Inputs
To run this skill, the following inputs are required:
1. `job_description` (string): The text of the target role's job description.
2. `resume` (string): The plain-text or parsed text of the candidate's resume.
3. `has_cover_letter` (boolean, default: `false`): Whether the candidate submitted a cover letter (used to measure applicant effort/friction).

---

## Processing Pipeline (Execution Steps)

Follow these stages sequentially. Do not make assumptions, infer qualifications, or hallucinate metrics not explicitly stated in the resume.

### Stage 1: Initial Gatekeeper & Formatting Audit
Evaluate the candidate's attention to detail, effort, and basic professionalism.
1. **Typos & Grammatical Errors**: Check for clear writing errors, spelling mistakes, and poor layout spacing. (ScoutLogic: Typos indicate a lack of attention to detail).
2. **Document Structure & Readability**: Ensure the resume is concise, easy to scan, and logically structured. Reject generic, copy-pasted, or low-effort layouts.
3. **Content Purview**: Ensure the resume is strictly focused on professional experience and qualifications. (ScoutLogic: Reject resumes dominated by hobbies, vacations, or non-work interests with no real job history).

*Action:* If the resume contains multiple critical typos, lacks structure, or is non-professional, immediately stop processing and output a recommendation of **NO** with the justification.

### Stage 2: Experience Alignment Check
Assess how well the candidate’s past roles and achievements map to the requested responsibilities.
1. **Industry & Role Relevance**: Analyze if the candidate’s previous employers and roles align with the target position.
2. **Responsibility & Achievement Mapping**: Rather than scanning for passive duties, look for evidence of achievements, metrics, and outcomes that align directly with the tasks described in the job description.

### Stage 3: Skill Mapping & Ontological Graphing
Analyze both hard and soft skills. Do not rely solely on exact keyword strings; look for contextual proofs.
1. **Hard Skills**: Check for mandatory technical skills, certifications, software, or methodologies specified in the job description.
2. **Soft Skills (Cultural Fit)**: Look for active indicators of communication, teamwork, and leadership.
   - *Leadership Indicator*: Do not just look for the keyword "leadership". Scan for active proofs like mentoring junior staff, spearheading projects, or managing budgets.
   - *Teamwork/Communication Indicator*: Look for collaborative efforts, cross-functional partnerships, or client-facing achievements.

### Stage 4: Timeline, Gaps, and Stability Audit
Examine the cronological timeline of the candidate's career to measure long-term value.
1. **Employment Gaps**: Scan for gaps of **more than one month** between consecutive employment entries. Note these gaps explicitly so they can be questioned in an interview.
2. **Job-Hopping Analysis (Quality over Quantity)**:
   - Identify if the candidate changes jobs frequently (e.g., every few months or less than 1 year per role).
   - Reward candidates who demonstrate long-term commitment (2+ years at single employers), indicating loyalty and a desire for internal growth.

---

## Output Template

The final output of this skill must strictly adhere to the following structured Markdown format:


```

```text
SKILL.md file successfully written.

```markdown
# ScoutLogic Resume Screening Report

## 1. Executive Summary
- **Candidate Match Quality**: [Strong / Moderate / Weak]
- **Target Position**: [Job Title from Job Description]
- **Key Recommendation**: **[YES / MAYBE / NO]**

---

## 2. Initial Gatekeeper Checks
| Screening Indicator | Status | Details / Findings |
| :--- | :--- | :--- |
| **Typo & Error Audit** | [PASS / FAIL] | [List any grammatical/spelling errors or formatting issues] |
| **Professionalism Check** | [PASS / FAIL] | [Confirm if resume focuses strictly on professional work vs. hobbies/vacations] |
| **Application Friction** | [High Effort / Low Effort] | [Note if cover letter was provided (High Effort) or skipped (Low Effort)] |

---

## 3. Qualifications & Alignment Analysis

### A. Experience Relevance
* **Directly Aligned Roles**: 
  - *[Role Title]* at *[Company]* ([Employment Dates])
* **Relevance Mapping**:
  - **Required Task**: [Insert direct requirement from JD]
  - **Candidate Proof**: "[Insert quote or direct proof from candidate's experience]"

### B. Skills Mapping
* **Hard/Technical Skills**:
  - **Found**: [Comma-separated list of matching technical skills, systems, or platforms]
  - **Missing / Undetected**: [List critical required tools from JD not found on resume]
* **Soft Skills & Cultural Fit (Evidence-Based)**:
  - **Leadership Evidence**: [e.g., "Mentored 3 junior developers", "Led DB migration"]
  - **Collaboration Evidence**: [e.g., "Collaborated cross-functionally with Product teams"]

### C. Educational & Certification Alignment
* **Required Credentials**: [Degrees / Certifications required in JD]
* **Candidate Credentials**: [Degrees / Certifications listed on resume]
* **Alignment Note**: [Assess if candidate's education matches or if real-world experience compensates]

---

## 4. Career History & Stability Audit
* **Employment Gaps**: [Specify "None detected" or detail any gap > 1 month, e.g., "Gap of 4 months between Company A and Company B (MM/YYYY - MM/YYYY)"]
* **Average Tenure**: [Calculate average duration per role, e.g., 2.2 years]
* **Job-Hopping Warning**: [No warning / Warning: frequent short-term transitions (under 12 months)]
* **Stability Verdict**: [High / Moderate / Low]

---

## 5. Final Verdict & Interview Guide

### Recommendation: [YES / MAYBE / NO]

#### Justification:
- **Key Strengths**:
  - [Bullet points outlining why the candidate is a fit]
- **Identified Risks / Red Flags**:
  - [Bullet points outlining gaps, missing skills, job-hopping, or typo errors]

#### ScoutLogic Tailored Interview Questions:
*(Only generate if status is YES or MAYBE. Provide highly targeted questions to drill down on the flagged risks/gaps)*
1. *[Question regarding specific employment gap or short tenure]*: "I noticed a gap in your timeline between [Month/Year] and [Month/Year]. Could you walk me through that period and what motivated your next career move?"
2. *[Question testing missing hard skills or technical alignment]*: "The job description emphasizes experience with [Missing Skill]. While your resume showcases strong capabilities in [Existing Skill], how would you approach transitioning to or upskilling in [Missing Skill]?"
3. *[Question evaluating soft skills / cultural fit]*: "Can you provide an example of a time you demonstrated [Leadership / Collaboration] under pressure in your role at [Past Company]?"

```

"""

# Let's save this content to SKILL.md

with open("SKILL.md", "w") as f:
f.write(content)

print("SKILL.md file successfully written.")

```
Your `SKILL.md` file is ready
[file-tag: code-generated-file-0-1784130085935208083]

Based on ScoutLogic's comprehensive guide to resume screening, I have structured a deterministic, highly actionable `SKILL.md` prompt engineering template. 

### How the ScoutLogic Principles are Mapped to this Skill:
1. **High Standards from the Start (The Initial Gate):** The skill implements a "Stage 1" filter to audit typos, formatting issues, and low-effort copy-pasted resumes. If a candidate fails this, the AI stops processing immediately to save computation time and recruiter burnout.
2. **Application Friction & Cover Letters:** It maps a `has_cover_letter` boolean to measure candidate effort. ScoutLogic points out that requiring a cover letter filters out candidates throwing generic resumes into the wind.
3. **Resumes Are About Work:** Stage 1 strictly flags resumes that waste space on non-professional hobbies, vacations, or volunteer entries with no real job alignment.
4. **Employment Gaps & Stability:** Stage 4 explicitly calculates average tenure to flag job-hopping (short-term roles <12 months) and flags gaps larger than **one month** to automatically formulate tailored interview questions.
5. **Cultural Fit & Semantic Matching:** It focuses on soft skills (leadership, teamwork, communication) by scanning for active, evidence-based metrics (like mentoring or cross-functional coordination) rather than relying on lazy keyword-stuffing.

Below is the complete, raw content of the generated `SKILL.md` file:

```markdown
# Skill: ScoutLogic Resume Screening Agent

## Metadata
- **Name**: `screen-resumes-scoutlogic`
- **Description**: Evaluates a candidate's resume against a targeted job description using the comprehensive, high-standard ScoutLogic resume screening methodology. Analyzes formatting quality, experience relevance, skill alignment, career stability (detecting gaps and job-hopping), and compliance barriers to output a deterministic, structured screening report and hiring recommendation.
- **Trigger**: Activated when asked to review, screen, filter, or evaluate a resume against a job description or job posting.

## Requirements & Inputs
To run this skill, the following inputs are required:
1. `job_description` (string): The text of the target role's job description.
2. `resume` (string): The plain-text or parsed text of the candidate's resume.
3. `has_cover_letter` (boolean, default: `false`): Whether the candidate submitted a cover letter (used to measure applicant effort/friction).

---

## Processing Pipeline (Execution Steps)

Follow these stages sequentially. Do not make assumptions, infer qualifications, or hallucinate metrics not explicitly stated in the resume.

### Stage 1: Initial Gatekeeper & Formatting Audit
Evaluate the candidate's attention to detail, effort, and basic professionalism.
1. **Typos & Grammatical Errors**: Check for clear writing errors, spelling mistakes, and poor layout spacing. (ScoutLogic: Typos indicate a lack of attention to detail).
2. **Document Structure & Readability**: Ensure the resume is concise, easy to scan, and logically structured. Reject generic, copy-pasted, or low-effort layouts.
3. **Content Purview**: Ensure the resume is strictly focused on professional experience and qualifications. (ScoutLogic: Reject resumes dominated by hobbies, vacations, or non-work interests with no real job history).

*Action:* If the resume contains multiple critical typos, lacks structure, or is non-professional, immediately stop processing and output a recommendation of **NO** with the justification.

### Stage 2: Experience Alignment Check
Assess how well the candidate’s past roles and achievements map to the requested responsibilities.
1. **Industry & Role Relevance**: Analyze if the candidate’s previous employers and roles align with the target position.
2. **Responsibility & Achievement Mapping**: Rather than scanning for passive duties, look for evidence of achievements, metrics, and outcomes that align directly with the tasks described in the job description.

### Stage 3: Skill Mapping & Ontological Graphing
Analyze both hard and soft skills. Do not rely solely on exact keyword strings; look for contextual proofs.
1. **Hard Skills**: Check for mandatory technical skills, certifications, software, or methodologies specified in the job description.
2. **Soft Skills (Cultural Fit)**: Look for active indicators of communication, teamwork, and leadership.
   - *Leadership Indicator*: Do not just look for the keyword "leadership". Scan for active proofs like mentoring junior staff, spearheading projects, or managing budgets.
   - *Teamwork/Communication Indicator*: Look for collaborative efforts, cross-functional partnerships, or client-facing achievements.

### Stage 4: Timeline, Gaps, and Stability Audit
Examine the chronological timeline of the candidate's career to measure long-term value.
1. **Employment Gaps**: Scan for gaps of **more than one month** between consecutive employment entries. Note these gaps explicitly so they can be questioned in an interview.
2. **Job-Hopping Analysis (Quality over Quantity)**:
   - Identify if the candidate changes jobs frequently (e.g., every few months or less than 1 year per role).
   - Reward candidates who demonstrate long-term commitment (2+ years at single employers), indicating loyalty and a desire for internal growth.

---

## Output Template

The final output of this skill must strictly adhere to the following structured Markdown format:

```markdown
# ScoutLogic Resume Screening Report

## 1. Executive Summary
- **Candidate Match Quality**: [Strong / Moderate / Weak]
- **Target Position**: [Job Title from Job Description]
- **Key Recommendation**: **[YES / MAYBE / NO]**

---

## 2. Initial Gatekeeper Checks
| Screening Indicator | Status | Details / Findings |
| :--- | :--- | :--- |
| **Typo & Error Audit** | [PASS / FAIL] | [List any grammatical/spelling errors or formatting issues] |
| **Professionalism Check** | [PASS / FAIL] | [Confirm if resume focuses strictly on professional work vs. hobbies/vacations] |
| **Application Friction** | [High Effort / Low Effort] | [Note if cover letter was provided (High Effort) or skipped (Low Effort)] |

---

## 3. Qualifications & Alignment Analysis

### A. Experience Relevance
* **Directly Aligned Roles**: 
  - *[Role Title]* at *[Company]* ([Employment Dates])
* **Relevance Mapping**:
  - **Required Task**: [Insert direct requirement from JD]
  - **Candidate Proof**: "[Insert quote or direct proof from candidate's experience]"

### B. Skills Mapping
* **Hard/Technical Skills**:
  - **Found**: [Comma-separated list of matching technical skills, systems, or platforms]
  - **Missing / Undetected**: [List critical required tools from JD not found on resume]
* **Soft Skills & Cultural Fit (Evidence-Based)**:
  - **Leadership Evidence**: [e.g., "Mentored 3 junior developers", "Led DB migration"]
  - **Collaboration Evidence**: [e.g., "Collaborated cross-functionally with Product teams"]

### C. Educational & Certification Alignment
* **Required Credentials**: [Degrees / Certifications required in JD]
* **Candidate Credentials**: [Degrees / Certifications listed on resume]
* **Alignment Note**: [Assess if candidate's education matches or if real-world experience compensates]

---

## 4. Career History & Stability Audit
* **Employment Gaps**: [Specify "None detected" or detail any gap > 1 month, e.g., "Gap of 4 months between Company A and Company B (MM/YYYY - MM/YYYY)"]
* **Average Tenure**: [Calculate average duration per role, e.g., 2.2 years]
* **Job-Hopping Warning**: [No warning / Warning: frequent short-term transitions (under 12 months)]
* **Stability Verdict**: [High / Moderate / Low]

---

## 5. Final Verdict & Interview Guide

### Recommendation: [YES / MAYBE / NO]

#### Justification:
- **Key Strengths**:
  - [Bullet points outlining why the candidate is a fit]
- **Identified Risks / Red Flags**:
  - [Bullet points outlining gaps, missing skills, job-hopping, or typo errors]

#### ScoutLogic Tailored Interview Questions:
*(Only generate if status is YES or MAYBE. Provide highly targeted questions to drill down on the flagged risks/gaps)*
1. *[Question regarding specific employment gap or short tenure]*: "I noticed a gap in your timeline between [Month/Year] and [Month/Year]. Could you walk me through that period and what motivated your next career move?"
2. *[Question testing missing hard skills or technical alignment]*: "The job description emphasizes experience with [Missing Skill]. While your resume showcases strong capabilities in [Existing Skill], how would you approach transitioning to or upskilling in [Missing Skill]?"
3. *[Question evaluating soft skills / cultural fit]*: "Can you provide an example of a time you demonstrated [Leadership / Collaboration] under pressure in your role at [Past Company]?"

```

```

```
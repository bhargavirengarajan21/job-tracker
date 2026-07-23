---
name: recruiter-skills
description: >
  Defines core competencies and evaluation criteria for recruiters performing resume screening and candidate evaluation. Based on research-backed resume fit assessment methodology including exact tech stack frequency analysis, keyword matching, formatting analysis, experience mapping, and career stability evaluation.
---

# Recruiter Skills & Competencies

This document outlines the essential skills, knowledge, and evaluation criteria that recruiters must apply when reviewing applications and screening candidates.

## Core Recruiter Competencies

### 1. Resume Analysis & Evaluation

#### Skill: Evidence-Based Resume Reading
- **Definition**: Read resumes objectively using research-backed criteria, not subjective preferences or outdated conventions.
- **Key Practices**:
  - Apply the "F-pattern" eye-tracking model (top-left first-pass concentration)
  - Evaluate top third of page one for primary impact
  - Look for quantified outcomes and metrics, not passive duties
  - Check for experience relevance alignment, not just keyword presence
  - Never infer missing information; state "not evidenced" instead

#### Skill: Keyword & Language Matching
- **Definition**: Identify exact terminology gaps between resume and job description.
- **Key Practices**:
  - Extract hard requirements from JD (technologies, tools, methodologies, credentials)
  - Check for exact phrase matches in resume (synonyms alone don't count)
  - Calculate match score: matched required skills ÷ total required skills
  - Flag phrases that appear 2+ times in JD but are missing from resume
  - Note when resume paraphrases JD terms instead of mirroring exact language
  - Prioritize highest-value additions first

#### Skill: Exact Tech Stack Frequency Analysis
- **Definition**: Identify and count exact technology mentions across resume to assess genuine depth and consistent experience.
- **Key Practices**:
  - Create explicit tech stack inventory from resume text
  - Count exact mentions (case-sensitive): "Python" vs "python", "AWS" vs "Amazon Web Services"
  - Track frequency across different roles, projects, and timeframes
  - Differentiate between primary (current role, multiple mentions) and secondary (legacy, single mention) technologies
  - Note technology recency (used in last 12 months vs. 5+ years ago)
  - Identify gaps between JD tech stack and resume tech stack
  - Create frequency ranking for AI system analysis

**Tech Stack Frequency Analysis Template**:
```
FRONTEND TECHNOLOGIES:
  React: 4 mentions (Current role, 2 previous projects, training)
  Vue.js: 1 mention (Legacy project)
  TypeScript: 3 mentions (Current + 2 projects)

BACKEND TECHNOLOGIES:
  Python: 5 mentions (Current role 2×, previous role 2×, side project 1×)
  Node.js: 2 mentions (One project, one year ago)
  Java: 1 mention (Older role)

CLOUD & INFRASTRUCTURE:
  AWS: 6 mentions (EC2, Lambda, RDS, S3, current role focus)
  Kubernetes: 3 mentions (Container orchestration, all recent)
  Docker: 4 mentions (Containerization, consistent across roles)
  Terraform: 2 mentions (Infrastructure-as-Code)

DATABASE:
  PostgreSQL: 3 mentions (Primary database, current + previous)
  MongoDB: 1 mention (Legacy project)
  Redis: 2 mentions (Caching layer)

FREQUENCY ANALYSIS RESULTS:
  Strong Match: Python, AWS, Kubernetes, Docker (4+ mentions, recent use)
  Moderate Match: React, TypeScript (3+ mentions)
  Weak Match: Node.js, Java (1-2 mentions, older)
  Missing from JD: [Any required tech not found]
```

- Flag technologies from JD not present in resume
- Highlight strongest technology matches for interviewing focus
- Identify outdated tech stack vs. modern tech stack alignment
- Note if candidate has breadth (many technologies) vs. depth (few technologies mastered)

#### Skill: Grammar, Spacing & Formatting Issue Detection
- **Definition**: Identify and explicitly point out all grammar, spacing, and formatting issues as potential red flags for attention to detail.
- **Key Practices**:
  - **Grammar Issues**: Spell-check all words, identify subject-verb disagreements, check tense consistency, detect run-on sentences
  - **Spacing Issues**: Check for double spaces, inconsistent line spacing, missing spaces after punctuation, irregular indentation in bullet points
  - **Punctuation Issues**: Verify consistent period usage in bullet points, check for misplaced/missing commas, identify inconsistent hyphenation
  - **Capitalization Issues**: Verify consistent title capitalization, check for random capitalization mid-sentence
  - **Formatting Consistency**: Ensure uniform date formatting (MM/YYYY or Mmm YYYY), consistent company name styling, uniform bullet point styling
  - **Abbreviation Usage**: Verify abbreviations are defined on first use, check for inconsistent abbreviation style
  - List each issue explicitly with:
    - Issue type (Grammar/Spacing/Punctuation/Capitalization/Formatting)
    - Location (role, company, specific line)
    - Current text (exact quote)
    - Corrected version
    - Severity (Critical/Medium/Minor)

**Issue Reporting Template**:
```
GRAMMAR & FORMATTING ISSUES FOUND:
1. [SPACING] Company "XYZ Corp" - Double space before phone number
   Location: Contact info
   Current: "XYZ Corp  (555) 123-4567"
   Should be: "XYZ Corp (555) 123-4567"
   Severity: Minor

2. [GRAMMAR] Achievement bullet - Missing article
   Location: Senior Developer role, 2nd bullet
   Current: "Designed and implemented scalable API endpoints"
   Better: "Designed and implemented scalable API endpoints for..."
   Severity: Minor

3. [CAPITALIZATION] Date formatting inconsistent
   Location: Employment dates section
   Current mix: "Jan 2023 – December 2023"
   Should be: "Jan 2023 – Dec 2023" (consistent abbreviation)
   Severity: Minor
```

- Report all issues, don't overlook minor ones (indicates attention to detail concern)
- Total count of issues at top of assessment

#### Skill: Resume Formatting & Hygiene Assessment
- **Definition**: Evaluate resume structure, formatting, and professionalism standards.
- **Key Practices**:
  - Identify formatting issues that break ATS parsing (tables, columns, headers/footers)
  - Check for standard, recognizable section headers
  - Detect typos, grammatical errors, and inconsistent formatting
  - Assess document structure clarity and scannability
  - Flag outdated conventions (objective statements, "references available," etc.)
  - Note font consistency, spacing, and readability

#### Skill: Resume Length & Content Proportionality
- **Definition**: Assess whether resume length is appropriate and content is well-balanced.
- **Key Practices**:
  - Estimate word count (~475-600+ is target; longer at mid-level/senior)
  - Recognize that two-page resumes are often preferred (2.3x preference per ResumeGo)
  - Identify forced one-pagers that omit relevant experience
  - Flag bloated content beyond relevance
  - Assess page-one top-third content quality
  - Note missing but relevant sections

### 2. Experience & Achievement Evaluation

#### Skill: Role Relevance Mapping
- **Definition**: Connect candidate's past roles to target position requirements.
- **Key Practices**:
  - Identify which roles align with JD scope and responsibilities
  - Extract scope of authority (budget, team size, customer base)
  - Assess industry and sector alignment
  - Cross-reference seniority level progression
  - Map responsibility overlap between candidate's roles and JD requirements
  - Note relevant context (company size, growth stage, complexity)

#### Skill: Achievement Proof Analysis
- **Definition**: Verify claimed accomplishments with concrete evidence tied to specific hard skills, soft skills, and technical expertise demonstrated in actual experience.
- **Key Practices**:
  - Look for quantified metrics (revenue impact, cost savings %, performance improvement %, timeline acceleration)
  - Assess outcome vs. duty language ("Led cloud migration to microservices" vs. "Responsible for infrastructure")
  - Verify achievement claims with supporting bullet context (technologies used, team involved, business impact)
  - Extract hard skills from achievements (tech stack: Python, AWS, Docker, Kubernetes usage with frequency)
  - Extract soft skills from achievements (leadership in project decision-making, collaboration across teams, communication of complex topics)
  - Connect achievements directly to JD responsibilities with matching language
  - Note vague claims without measurable proof or technical context
  - Identify strongest achievement examples for each JD requirement
  - **Critical**: Skills mentioned must be proven through experience evidence (not isolated skill listing)

**Example Analysis**:
  - ❌ Weak: "Experienced with cloud architecture"
  - ✅ Strong: "Architected cloud-native microservices platform on AWS using Kubernetes, reducing deployment time by 60% and enabling 5 independent teams to deploy independently"
  - ✅ Skills evidenced: AWS (hard), Kubernetes (hard), microservices architecture (hard), leadership (soft), collaboration (soft)

#### Skill: Hard Skills Verification
- **Definition**: Confirm presence and depth of required technical competencies with exact tech stack frequency analysis.
- **Key Practices**:
  - Extract must-have technical skills from JD
  - Search resume for exact tech stack matches (Python, AWS, Kubernetes, React, etc.)
  - Count frequency of each tech skill across all roles and achievements
  - Verify each skill with concrete experience evidence (not just keyword presence)
  - Document where each tech is actively used (project context, outcome, timeframe)
  - Distinguish between mentioned and actively practiced skills with example proof
  - Check for skill recency and relevance in recent roles
  - Identify skills gaps vs. "not evidenced"
  - Note certifications, tools, languages, frameworks, methodologies with frequency count

**Tech Stack Frequency Analysis Example**:
  - Python: 5 occurrences (3× in backend services, 2× in data processing)
  - AWS: 3 occurrences (EC2, Lambda, RDS deployments)
  - Kubernetes: 2 occurrences (container orchestration, microservices)
  - React: 4 occurrences (frontend development, UI components)

#### Skill: Soft Skills Assessment
- **Definition**: Evaluate behavioral and interpersonal capabilities through concrete evidence tied to actual experience and achievements.
- **Key Practices**:
  - **Leadership proof**: Mentoring team members with quantified impact, spearheading major projects with outcomes, managing budgets with results, overseeing team growth or restructuring
  - **Collaboration proof**: Cross-functional partnerships with specific teams/departments, client-facing delivery with outcomes, successful team contributions in complex projects
  - **Communication proof**: Internal presentations with audience size/impact, stakeholder management across levels, external reporting or client communications
  - **Problem-solving proof**: Process improvements with measurable efficiency gains, complexity navigation in legacy/greenfield systems, novel architectural approaches with results
  - **Cloud-native architecture**: Hands-on experience designing/building microservices, containerization (Docker/Kubernetes), serverless implementations, distributed systems
  - **DevOps/Infrastructure**: Infrastructure-as-Code implementation, CI/CD pipeline setup, monitoring/observability solutions, cloud infrastructure scaling
  - **System Design**: Database optimization, API design patterns, scalability solutions, performance improvements with metrics
  - Require active proof from achievement bullets, not just keyword presence
  - Cite specific resume line showing skill in context (company, project, outcome)
  - Link soft skills to measurable business impact or technical outcomes

### 3. Career Trajectory & Stability Analysis

#### Skill: Timeline Analysis
- **Definition**: Review employment history objectively and factually.
- **Key Practices**:
  - Map job progression chronologically
  - Note tenure at each position
  - Identify gaps between positions (>1 month)
  - Assess career progression (growth, lateral moves, roles)
  - Flag unusual patterns (clarify in interview, don't penalize)
  - **CRITICAL**: Never penalize gaps, tenure length, or number of jobs

#### Skill: Career Stability Assessment
- **Definition**: Evaluate job-hopping patterns and commitment indicators.
- **Key Practices**:
  - Identify roles <6 months (clarify context in interview)
  - Recognize long-term commitment indicators (2+ years at positions)
  - Note intentional career changes vs. rapid exits
  - Assess growth trajectory within and between roles
  - Consider industry context (consulting vs. permanent roles)
  - **CRITICAL**: Reward loyalty and internal growth; don't penalize necessary moves

#### Skill: Gap & Overlap Clarification
- **Definition**: Identify timeline anomalies for interview discussion.
- **Key Practices**:
  - Map employment dates clearly
  - Note any unexplained gaps for questioning
  - Identify overlapping employment (possible part-time/consulting)
  - Assess education-to-work transition
  - Flag outlier pattern for discussion
  - State findings as interview topics, never as red flags

### 4. Compliance & Risk Assessment

#### Skill: Legal & Compliance Evaluation
- **Definition**: Verify compliance requirements without discriminatory screening.
- **Key Practices**:
  - Check for required credentials/licenses only (don't infer)
  - Verify work authorization eligibility indicators
  - Assess location/relocation feasibility if stated in JD
  - Note credential recency (expirations, renewal requirements)
  - Flag genuine must-haves only; separate from nice-to-haves

#### Skill: Bias-Free Screening
- **Definition**: Evaluate candidates objectively without protected characteristic discrimination.
- **Key Practices**:
  - Never infer or comment on age, gender, ethnicity, health status
  - Don't use graduation dates to infer age
  - Avoid assumptions about gaps based on protected status
  - Never penalize caregiver absence, military service, or disability
  - Evaluate on experience, skills, and alignment only
  - Question only objective, verifiable data in interviews

### 5. Structured Screening & Decision-Making

#### Skill: Evidence-Based Scoring
- **Definition**: Calculate objective match scores using weighted criteria.
- **Key Practices**:
  - Keyword/title match score: (matched skills ÷ total required) × 100
  - Scan test pass/fail (top-third of page one)
  - Length assessment (appropriate vs. forcing/bloating)
  - Experience relevance rating (strong/moderate/weak alignment)
  - Skills coverage (hard & soft skill presence with proof)
  - Grammar/formatting issues count

#### Skill: Fit Signal Generation
- **Definition**: Output clear, structured assessment for human review without auto-reject verdicts.
- **Key Practices**:
  - Provide fit signal (Strong/Moderate/Weak) for human review
  - Never output automatic hire/reject verdicts
  - Cite specific strengths and gaps with evidence
  - Recommend "Advance to Review / Hold" with 2-3 weighted reasons
  - Flag top improvement opportunities if self-audit mode
  - Keep output scannable and structured

#### Skill: Screening Recommendation
- **Definition**: Make hiring team recommendations with transparent reasoning.
- **Key Practices**:
  - Recommend Advance / Hold / Flag for context
  - Provide 2-3 supporting reasons per recommendation
  - Cite both strengths and gaps objectively
  - Suggest interview focus areas based on assessment
  - Note skills or experience gaps to explore
  - Outline top questions for candidate

## Output Template - Enhanced Recruiter Screening Report

Adapt the closing section to the mode. Keep it scannable and explicit about all issues found.

```markdown
# Recruiter Screening Report — [Target Title] @ [Company]

## Fit Signal (for human review)
- Keyword/title match: [NN%]  ·  Scan test: [Pass / Needs work]  ·  Length: [OK / Adjust]  ·  Grammar/Spacing Issues: [X found]  ·  Overall: [Strong / Moderate / Weak]

---

## 1. Grammar, Spacing & Formatting Issues (CRITICAL FOR ATTENTION TO DETAIL)
- **Total issues found**: [N]
- **Severity breakdown**: Critical [X] · Medium [X] · Minor [X]
- **Issues list**:
  - [SPACING] Double space in email section
  - [GRAMMAR] Subject-verb disagreement in achievement bullet
  - [CAPITALIZATION] Inconsistent date formatting (Jan 2023 vs. January 2023)

---

## 2. Keyword & Title Match + Exact Tech Stack Frequency Analysis
- **Overall match score**: [NN%]
- **Matched skills**: [list]
- **Missing skills** (high-value first): [list]

### Exact Tech Stack Frequency Count (Current Role Focus):
**Backend**: Python (5×), Node.js (2×) | **Frontend**: React (4×), TypeScript (3×) | **Cloud**: AWS (6×), Kubernetes (3×), Docker (4×)

**Frequency Analysis**:
  - Strong match: Python, AWS, Kubernetes (4-6× mentions, all recent roles)
  - Moderate match: React, TypeScript (3-4× mentions)
  - Weak match: Node.js, Java (1-2× mentions, older roles)
  - Missing from JD: [list any required tech not found]

---

## 3. Top-of-Page Scan (R2)
- **Top-zone capture**: [what a skimmer gets / misses in first pass]
- **Title legibility**: [note on current title vs. target title match]
- **Lead bullets**: [quantified outcomes or passive duty?]
- **One top-zone fix**: [single highest-impact change]

---

## 4. Length & Word Count (R1)
- **~[NNN] words, [N] page(s)**
- **Assessment**: [forcing one-page? missing experience? bloat? appropriate?]
- **Specific recommendations**: [lines to cut or missing content to add]

---

## 5. Experience Relevance & Achievement Proof (HARD + SOFT SKILLS)
- **Aligned roles**: [Role @ Company (dates)]
- **Hard skills evidenced** (with context & frequency):
  - Python: "Architected Python microservices backend using async/await" (3× across roles)
  - AWS: "Deployed containerized applications on AWS ECS and Lambda" (4× recent)
- **Soft skills evidenced** (with proof):
  - Leadership: "Led 5-person backend team through migration to microservices"
  - Cloud-native architecture: "Designed and built cloud-native distributed system using Kubernetes, reducing latency 40%"
- **JD requirement → proof**:
  - [requirement] → "[achievement demonstrating skill + tech stack used]"
  - [requirement] → "not evidenced"

---

## 6. Hard Skills & Soft Skills Alignment with Experience Evidence
- **Hard skills matched** (with frequency): [...]
- **Hard skills missing**: [...]
- **Soft skills with proof** (from experience):
  - Leadership: [specific achievement + business impact]
  - Collaboration: [cross-team effort + outcome]
  - Cloud-native architecture: [system designed + metric improvement]
  - DevOps/Infrastructure: [IaC implementation + deployment impact]
- **Technology recency**: [recent adoption vs. legacy tech assessment]
- **Cloud-native capability**: [hands-on microservices? Kubernetes? Serverless? Evidence found/missing]

---

## 7. Hygiene & Timeline Assessment
- **Grammar/formatting issues**: [explicit count + severity breakdown]
- **Concrete fixes needed**: [specific corrections required]
- **Timeline**: [neutral factual note, or "Nothing to flag."]

---

## Recommendation
- **[SCREEN]** Advance to human review / Hold — with 2–3 reasons a reviewer should weigh, strengths and gaps.
- **[SELF_AUDIT]** Prioritized edits (highest impact first):
  1. [Edit to improve keyword match]
  2. [Edit to strengthen soft skill evidence]
  3. [Edit to add missing tech stack proof]
```

## Recruiter Screening Modes

### Mode 1: SCREEN (Recruiter Perspective)
**Purpose**: Evaluate candidate for hiring team decision

**Output Focus**:
- Fit signal for human review (not auto-verdict)
- Key strengths and gaps
- Recommendation: Advance / Hold with reasons
- Interview focus areas

### Mode 2: SELF_AUDIT (Candidate Perspective)
**Purpose**: Help candidate strengthen resume before submission

**Output Focus**:
- Fit signal and gap analysis
- Prioritized, high-impact edits
- Specific resume lines to modify
- Keyword additions and placements
- Expected score improvement after changes

## Critical Guardrails

### Never Penalize
- ❌ Employment gaps (any length)
- ❌ Number of jobs or job changes
- ❌ Tenure length at positions
- ❌ Missing cover letter
- ❌ Missing "references available" line

### Never Infer or Comment On
- ❌ Age (via graduation dates or tenure)
- ❌ Gender, ethnicity, national origin
- ❌ Health status or disability status
- ❌ Immigration status (unless explicitly stated)
- ❌ Cause of employment gaps
- ❌ Personal circumstances or life events

### Always Do
- ✅ Base findings on text actually present
- ✅ Use "not evidenced" for missing skills (not "candidate lacks")
- ✅ Provide fit signal for human review (not auto-verdict)
- ✅ Cite specific resume text supporting assessments
- ✅ Flag typos/formatting as fixes, not rejection grounds
- ✅ State timeline facts neutrally as interview topics

## Research Foundation

### R1 — Resume Length
- Two-page resumes: 2.3x preferred over one-page (ResumeGo, 2018)
- Target word count: ~475–600+ for better outcomes
- Stronger content on page one, top third mandatory

### R2 — First-Pass Attention (F-Pattern)
- Recruiters focus top-left first (6-11+ seconds initially)
- Critical info: name, current title/company, previous title/company, dates, education
- Lower page receives minimal first-pass attention
- Requires legible, close-match current title to target position

### R3 — ATS Ranking (Not Auto-Rejection)
- 90%+ of employers use ATS for ranking/filtering
- Keyword coverage = search visibility and ranking position
- Qualified candidates excluded by filters (not robot auto-reject)
- Resume screening is recruiter-configurable, not autonomous

### R4 — No Penalization of Employment Patterns
- 49% of employers filter gaps 6+ months (excludes caregivers, veterans, disabled)
- Research shows equal-or-better performance and lower turnover among hired workers with gaps
- Employment gaps ≠ candidate quality or commitment

### R5 — Exact Language Matching
- Systems don't reliably connect equivalent terms (squad leader ≠ team supervisor)
- Requires exact skill/title phrasing from JD for ranking visibility
- Synonyms alone don't guarantee ATS/recruiter search hits

### R6 — Resume Hygiene Standards
- Objective statements: remove (occupy premium real estate, add no value)
- Functional/skills-only format: avoid (reads as timeline concealment)
- Tables, columns, headers/footers: avoid (ATS parse risk)
- Standard headers only: Experience, Education, Skills, Summary
- Date formatting consistency required

## Application in Job Tracker

When recruiters use this skill framework in the job tracker:

1. **Application Review Screen**: Input job description + resume
2. **Automated Analysis**: System runs 6 evaluation stages
3. **Structured Report**: Output match scores, fit signal, recommendations
4. **Human Decision**: Recruiter reviews and makes final hiring decision
5. **Feedback Loop**: Track screening accuracy and outcome correlation

## Success Metrics

An effective recruiter using these skills should achieve:
- ✅ 80%+ keyword match for strong candidates
- ✅ All resumes pass formatting/ATS check or receive specific fixes
- ✅ Zero bias-based rejections (neutral timeline assessment)
- ✅ Transparent, evidence-based recommendations
- ✅ High interview-to-offer conversion from screened candidates
- ✅ Reduced time-to-hire through structured evaluation
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
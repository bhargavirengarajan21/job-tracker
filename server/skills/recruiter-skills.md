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

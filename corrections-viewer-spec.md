# Ballet Corrections Log Viewer — Build Spec

## Purpose
A small password-protected web app for viewing two markdown files (`ballet-corrections-log.md` and `ballet-session-log.md`), with filtering by root cause category and by syllabus exercise (AF-10, AF-11F, AF-12, AF-25). Hosted on Vercel, source in GitHub, rebuilds on push.

## Source files
Two markdown files live in a GitHub repo:
- `ballet-corrections-log.md` — structured analysis: top priorities, recurring patterns table, syllabus corrections by exercise (AF-10/11F/12/25), physio notes, training notes
- `ballet-session-log.md` — raw session records grouped by root cause category, reverse-chronological

These files are edited externally (via Claude/Claude Projects) and pushed to the repo. The app should read them at build time (static site, rebuild on push) — no live editing from the app.

## Data extraction
Parse the markdown to extract structured data the UI can filter on:

1. **Recurring Patterns table** (from corrections-log.md) — columns: Pattern, Root cause category, First noted, Sessions, Syllabus exercises affected, Exam impact
2. **Syllabus Corrections sections** (from corrections-log.md) — one block per exercise (AF-10, AF-11F, AF-12, AF-25), each containing bullet points with bolded mark scheme criteria
3. **Session log entries** (from session-log.md) — each session has a date, source (teacher/private/physio), and is subdivided by root cause category headings, each with bullet corrections

Root cause categories currently in use (for filter options):
- Outer hip and ankle stability
- Foot intrinsics and arch
- Pelvic alignment
- Shoulder girdle and épaulement
- Pirouette axis and preparation
- Arabesque mechanics
- Opposition and length under load
- Weight placement and balance

Syllabus exercises (for filter options): AF-10, AF-11F, AF-12, AF-25

## Filters
- **By root cause category**: shows matching rows from the Patterns table, matching sections from Syllabus Corrections, and matching session log entries across all dates
- **By syllabus exercise**: shows the relevant Syllabus Corrections block, plus any Patterns rows and session entries tagged with that exercise
- Filters should be combinable (e.g. "Outer hip and ankle stability" + "AF-25")
- No filter selected = show everything (current default view)

## Pages / views
- **Home / Top Priorities**: renders the "Current Top 3 Priorities" section as-is
- **Patterns**: filterable table view of Recurring Patterns
- **By Exercise**: pick AF-10/11F/12/25, see syllabus corrections for that exercise plus related patterns and session history
- **Session Log**: reverse-chronological list, filterable by root cause category
- **Physio Notes**: renders as-is, no filtering needed

## Auth
Single shared password, checked client-side or via simple middleware (Vercel edge middleware with a password cookie is fine). Not high security — just keep it off public search/casual access. Password stored as an environment variable in Vercel, not committed to the repo.

## Tech suggestions
- Astro or plain Vite + vanilla JS/React for the static site — keep it lightweight, this is a personal tool
- Markdown parsing: a markdown-it or remark-based parser, with custom extraction logic for the tables and section structure described above (the tables are GitHub-flavored markdown tables, sections are `##`/`###` headings)
- Deploy: connect GitHub repo to Vercel, auto-deploy on push to main

## Out of scope for v1
- Editing corrections from the site
- Multi-student / multi-user support
- Custom diff viewer — link out to GitHub's commit history per file for change tracking instead

## Notes on markdown structure stability
The two source files follow a consistent structure (see current versions in repo) but section content will grow over time — new patterns added to the table, new session entries added at the top of the session log, new syllabus corrections appended under existing headings. The parser should be resilient to growing lists/tables rather than assuming fixed length, but the heading structure and table column order are expected to stay stable.

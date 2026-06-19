# Claude Code Briefing — Ballet Corrections Viewer

*This is a context handoff, not a build instruction. Read this, confirm understanding, do not start building yet — wait for explicit go-ahead.*

## What this project is

Crystal is an adult ballet student (RAD Advanced Foundation level) preparing for a December 2026 exam. She uses a Claude Project to log technique corrections from classes, private lessons, and physio, organized into two markdown files. She now wants a small hosted web app to view/filter that data, built and deployed by Claude Code, with the data itself continuing to be authored in the Claude Project (not in Code, not in the app).

## Division of responsibility — important

- **Claude (Project)**: does the post-class debrief, root-cause analysis, and writes to the two log files via an established skill. This is the source of truth and keeps happening exactly as before.
- **Claude Code**: builds and maintains the viewer app, the GitHub repo, and the deploy pipeline. Does not do the corrections analysis or own the data model decisions about root-cause categorization — that logic already exists.
- **Crystal**: pushes updated files from the Project to the GitHub repo after each logging session (manual step, automation of this push is a possible future task, see below).

## The two source files (full current versions should be provided alongside this briefing)

1. **`ballet-corrections-log.md`** — structured analysis: top 3 priorities, a Recurring Patterns table (pattern / root cause category / first noted / sessions / syllabus exercises affected / exam impact), a Syllabus Corrections section broken down by AF exercise code, Physio Notes, Training Notes.
2. **`ballet-session-log.md`** — raw session records, reverse-chronological, each session subdivided into root cause category headings with bullet corrections. Source-tagged (teacher / private lesson / physio).

## Data model status — read carefully, this is mid-refactor

- Root cause category tagging: fully structured and consistent. Categories currently in use: Outer hip and ankle stability, Foot intrinsics and arch, Pelvic alignment, Shoulder girdle and épaulement, Pirouette axis and preparation, Arabesque mechanics, Opposition and length under load, Weight placement and balance.
- Syllabus exercise tagging: only exists in `ballet-corrections-log.md`'s Syllabus Corrections section, and only for 4 exercise codes currently documented: **AF-10** (centre practice and pirouettes), **AF-11F** (pirouette enchaînement), **AF-12** (adage), **AF-25** (Variation 2). These were transcribed from official RAD syllabus book photos.
- **Allegro and Pointe syllabus material has NOT been uploaded yet.** Several corrections in the session log reference allegro/pointe-specific steps (grand jeté en tournant, gallop, relevé lent in second, pointe rolldown, getting onto the block, allegro beats) that almost certainly belong to numbered exercises under Technique 4 (Allegro) or Technique 6 (Pointe, per the RAD mark scheme — see mark scheme summary below) — but the actual exercise codes and names are not yet known. **Do not invent or guess exercise codes for these.** They should be treated as unmapped/pending until Crystal uploads that material.
- A separate audit (`exercise-tagging-audit.md`, provided alongside this briefing) sorts every existing correction into: already-tagged, named-in-prose-but-not-structured (mechanical fix), genuinely exercise-agnostic (correctly untagged), and ambiguous-needs-judgment. One open judgment call flagged in that audit: whether arabesque corrections should map only to AF-12 or also to AF-25 (since Variation 2 contains arabesque positions too). Not yet resolved.

## RAD mark scheme structure (for context on why exercise tagging matters)

The AF exam is scored across 10 components, each marked on: correct posture and weight placement, co-ordination, control, line, spatial awareness, dynamic values (varies slightly by section). Components: Barre, Centre practice and pirouettes, Adage, Allegro 1-4, Free enchaînement, Allegro 5/6 (male) or Pointe (female), Music, Performance, plus Variation technique and Variation music/performance. This is why exercise-level tagging has real value — it lets Crystal see exactly which scored component a correction will cost her marks in, not just a general technique theme.

## Already-scoped product decisions (do not relitigate these)

- **Hosting**: Vercel, connected to a GitHub repo. Push to repo triggers rebuild.
- **Local app vs hosted**: rejected local-only and rejected Electron — Crystal wants phone access, so it's a hosted static site with PWA support (installable to home screen, app-like, no app store).
- **Auth**: single shared password, low security bar, env var on Vercel — not building real user accounts.
- **Multi-student support**: explicitly deferred. Build single-student now. Do not build a multi-tenant schema preemptively — Crystal flagged this as a "maybe later" for tracking her own private lesson students, not a current requirement.
- **Editing**: the app is read-only. Corrections are authored in the Claude Project, never edited from the app itself.
- **Filtering**: by root cause category and by syllabus exercise code, combinable. No filter = show everything.
- **History/diffs**: punted to GitHub's native commit history UI rather than building a custom diff viewer. Link out to it.
- **Full build spec exists**: `corrections-viewer-spec.md` (provided alongside this briefing) has the detailed page-by-page breakdown, tech suggestions (Astro or Vite, markdown-it/remark-based parsing), and explicit out-of-scope list for v1.

## Known open thread — push automation

Crystal flagged the manual git push step (Project → repo) as friction and wants it automated. Agreed direction: a simple script Claude Code builds that pushes the current state of the two markdown files from a local copy to the repo in one command, rather than Crystal doing a manual git workflow each time. Not yet built. This is a reasonable first small task once the main viewer exists, but isn't the starting point.

## What NOT to do yet

- Don't scaffold the repo or app yet.
- Don't pick final exercise tags for the allegro/pointe-referencing corrections — they're pending source material.
- Don't resolve the AF-12 vs AF-25 arabesque overlap — that's Crystal's call, flagged but not decided.
- Don't build multi-student anything.

## Suggested first real step once build begins

Confirm receipt of the two source markdown files and the audit doc, propose a concrete file/folder structure and parsing approach against the actual current content (not hypothetically), and get sign-off before writing app code.

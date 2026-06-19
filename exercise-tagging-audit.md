# Exercise Tagging Audit — ballet-session-log.md

*Purpose: sort every logged correction into one of three buckets so the viewer's "filter by exercise" feature is reliable. Cross-checked against what's already structured in ballet-corrections-log.md's Syllabus Corrections section.*

*Generated: 17 June 2026*

---

## Bucket 1: Already structured (in corrections-log.md syllabus section)

These corrections are already tagged to a named AF exercise in `ballet-corrections-log.md`. Nothing to do here — the viewer can read these directly.

- AF-10: pirouette axis collapse, arm-driven rotation, fondu depth, lame duck fourth
- AF-11F: same axis/preparation issues as AF-10 (cross-referenced, not duplicated)
- AF-12: arabesque shoulder hike, eyeline down, fouetté hip rotator timing, adage arm fluidity
- AF-25: poses weight bias, retiré speed, pas de bourrées travelling, eyeline, épaulement, outer ankle/foot timing onto pointe

---

## Bucket 2: Exercise named in prose, not yet structured

These corrections in the session log clearly identify an exercise or named step in the sentence text, but that exercise isn't pulled out as a structured tag — it's sitting inside the correction text. Mechanical fix: pull the exercise mention into a field. No judgment call needed, the source is unambiguous.

| Correction | Exercise named in text | Session |
|---|---|---|
| Left ankle winging worse than right | rises | Private, 23 May |
| Left single-leg relevé wobbles at top of rise | (single-leg relevé) | Private, 23 May |
| Pinky toe must stay in contact with floor | rises | Private, 23 May |
| Match right plié depth on both sides | (pliés, barre) | Private, 23 May |
| 2/3 weight forward over ball of foot | (parallel work, general barre) | Private, 23 May |
| Pirouettes closing in 3rd not 5th | pirouette (en dehors) | Private, March |
| Pull up before stepping onto pointe | pointe entry | Private, March |
| Lame duck preparation: small fourth | lame duck → AF-10 | Private, March |
| Get onto the block faster on all poses | Variation 2 → AF-25 | Private, March |
| Controlled rolling down from pointe | (pointe rolldown, general) | Private, March |
| Press into deeper fondu before relevé | fondu/relevé prep | Private, March |
| Start further forward in poses and relevés | poses/relevés exercise | AF Class, March |
| Divide the space evenly | poses/relevés exercise | AF Class, March |
| Pose derrière: commit, shift weight back and over | pose derrière | AF Class, March |
| Retiré leg needs to get up faster on pose derrière | pose derrière | AF Class, March |
| Full height retiré on pas de bourrées | pas de bourrées → AF-25 | AF Class, March |
| Close in tight fifth and squeeze | (pas de bourrées, same exercise) | AF Class, March |
| Rises at barre: pinky toe down, 1 count up 2 down | barre rises | AF Class, March |
| Grand jeté en tournant: legs through first position | grand jeté en tournant | AF Class, March |
| Land in fondu, continuous movement | (grand jeté landing) | AF Class, March |
| Gallop needs a sense of up | gallop | AF Class, March |
| Variation 2: eyeline up and over, no head throw | Variation 2 → AF-25 | AF Class, March |
| Sharper head in Variation 2 | Variation 2 → AF-25 | AF Class, March |
| More épaulement and upper back twist in Variation 2 | Variation 2 → AF-25 | AF Class, March |
| Tailbone down, hipbones forward, noted in Variation 2 | Variation 2 → AF-25 | AF Class, March |
| Posterior weight bias across poses, grand jeté, allegro, retirés | multiple named steps | Pointe Class, March |
| Left lateral chain weakness in relevé lent in second | relevé lent in second | Pointe Class, March |

**Note:** several of these (pose derrière, pas de bourrées, poses/relevés exercise, Variation 2 generally) are almost certainly AF-25 content even though they're not yet cross-referenced into the corrections-log.md syllabus section. Worth deciding whether "Variation 2" mentions should auto-map to AF-25, or whether you want sub-tags within AF-25 (e.g. "AF-25: pas de bourrées" vs "AF-25: poses") for more precision when you're rehearsing a specific phrase.

---

## Bucket 3: Genuinely exercise-agnostic (correctly untagged)

These are general principles, cross-exercise observations, or homework — tagging them to one exercise would be wrong, not just incomplete. These should stay untagged or get a "general" / "cross-exercise" label instead of a specific AF code.

- Arches collapsing under load — noted in rises but flagged as general observation in text
- Pelvic alignment improving but arches still compensating — explicitly "general observation"
- Shoulder blades creeping up, sitting into traps — "noted across all work"
- Épaulement initiates from obliques and ribcage, not the shoulder — general principle
- Shoulders creeping up when arms go up — general opposition principle, not exercise-specific
- Pull up more on the standing leg for stability — general arabesque principle (could arguably tag to AF-12, see Bucket 4)
- Don't look down toward the floor in arabesque — general arabesque principle (could arguably tag to AF-12, see Bucket 4)
- Hold turnout longer before leg extends to arabesque — fouetté-specific but fouetté appears across AF-12 only, likely fine as-is
- Arms need to keep moving for fluidity through adage — general adage principle (could tag AF-12)
- All "Exercises prescribed" / Pilates homework table — home conditioning, not tied to a syllabus exercise by nature
- Right pointe shoe potentially not getting over the box — equipment/fit issue, not a technique correction at all

---

## Bucket 4: Ambiguous — needs your judgment

These sit between Bucket 2 and Bucket 3. The exercise context (arabesque, adage) is named, but arabesque and adage corrections could either: (a) all roll up to AF-12 since that's the only exercise where arabesque/adage appears in your current syllabus mapping, or (b) some of these are principles you'd apply in other arabesque moments too (e.g. Variation 2 also has arabesque positions per the syllabus pages you shared), in which case tagging everything to AF-12 only would hide relevant corrections when you're working on Variation 2's arabesque sections.

- Second shoulder hiking up in arabesque (currently tagged AF-12 already — confirm this is right, or does it apply to Variation 2's arabesque poses too?)
- Pull up more on standing leg for arabesque stability — same question
- Eyeline down in arabesque — same question
- Hold turnout longer before arabesque extension (fouetté) — AF-12 specific or broader?

**Decision needed:** should "arabesque mechanics" as a root cause category map only to AF-12, or should it also surface under AF-25 given Variation 2 contains multiple arabesque positions (posé en avant to arabesque en pointe, low arabesque lines, etc., per the syllabus pages)? This affects whether Bucket 4 items get one tag or two.

---

## Suggested next step

Bucket 2 is mechanical — I can pull those exercise mentions into structured tags without needing anything from you, since the source text already states the exercise unambiguously.

Bucket 4 needs your call on the arabesque/AF-12 vs AF-25 overlap question above before tagging.

Bucket 3 needs no action — confirm you're happy leaving these untagged or label them "general" in the data structure so the viewer can show them in an "applies broadly" section rather than hiding them entirely.

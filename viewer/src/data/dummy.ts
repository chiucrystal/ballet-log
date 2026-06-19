import type {
  TopPriority,
  Pattern,
  ExerciseCorrection,
  SessionEntry,
  PhysioNote,
} from '../types';

export const ROOT_CAUSES = [
  'Outer hip and ankle stability',
  'Foot intrinsics and arch',
  'Pelvic alignment',
  'Shoulder girdle and épaulement',
  'Pirouette axis and preparation',
  'Arabesque mechanics',
  'Opposition and length under load',
  'Weight placement and balance',
] as const;

export const EXERCISE_CODES = ['AF-10', 'AF-11F', 'AF-12', 'AF-25'] as const;

export const TOP_PRIORITIES: TopPriority[] = [
  {
    rank: 1,
    title: 'Outer hip stability in single-leg work',
    rootCause: 'Outer hip and ankle stability',
    description:
      'Consistent hip drop on the supporting leg in adage and pirouette preparation, visible as a lateral pelvic shift rather than true hip hike.',
    whyNow:
      'Underpins every mark scheme criterion in Adage and Centre practice — cannot stack the rest without this foundation.',
  },
  {
    rank: 2,
    title: 'Arch activation and spread-toe platform',
    rootCause: 'Foot intrinsics and arch',
    description:
      'Passive arch on demi-plié descent causing ankle rolling medially; toe spread not initiating on relevé.',
    whyNow:
      'Directly affects foot line score in all sections and creates downstream instability in pirouettes and pointe work.',
  },
  {
    rank: 3,
    title: 'Pirouette spot and axis over standing leg',
    rootCause: 'Pirouette axis and preparation',
    description:
      'Preparation lunge placing weight over the ball of the foot rather than the heel, causing forward axis collapse into the turn.',
    whyNow:
      'AF-10 and AF-11F are direct exam components; a consistent double is required for the AF mark standard.',
  },
];

export const PATTERNS: Pattern[] = [
  {
    id: 'p1',
    pattern: 'Hip drop on supporting leg',
    rootCause: 'Outer hip and ankle stability',
    firstNoted: 'Feb 2026',
    sessions: 9,
    exercisesAffected: ['AF-10', 'AF-12'],
    examImpact: 'Correct posture and weight placement — Adage, Centre practice',
  },
  {
    id: 'p2',
    pattern: 'Passive arch on demi-plié',
    rootCause: 'Foot intrinsics and arch',
    firstNoted: 'Jan 2026',
    sessions: 11,
    exercisesAffected: ['AF-10', 'AF-12'],
    examImpact: 'Line — all sections; control — relevé passages',
  },
  {
    id: 'p3',
    pattern: 'Lumbar overextension in arabesque',
    rootCause: 'Arabesque mechanics',
    firstNoted: 'Mar 2026',
    sessions: 6,
    exercisesAffected: ['AF-12', 'AF-25'],
    examImpact: 'Line and control — Adage, Variation 2',
  },
  {
    id: 'p4',
    pattern: 'Forward weight shift in pirouette prep',
    rootCause: 'Pirouette axis and preparation',
    firstNoted: 'Feb 2026',
    sessions: 8,
    exercisesAffected: ['AF-10', 'AF-11F'],
    examImpact: 'Co-ordination and control — Centre practice, Pirouette enchaînement',
  },
  {
    id: 'p5',
    pattern: 'Dropped working shoulder in épaulement',
    rootCause: 'Shoulder girdle and épaulement',
    firstNoted: 'Apr 2026',
    sessions: 4,
    exercisesAffected: ['AF-10', 'AF-25'],
    examImpact: 'Performance and line — Centre practice, Variation 2',
  },
  {
    id: 'p6',
    pattern: 'Pelvis tucking under in low arabesque',
    rootCause: 'Pelvic alignment',
    firstNoted: 'Mar 2026',
    sessions: 5,
    exercisesAffected: ['AF-12'],
    examImpact: 'Line — Adage',
  },
  {
    id: 'p7',
    pattern: 'Loss of length in adage extensions',
    rootCause: 'Opposition and length under load',
    firstNoted: 'May 2026',
    sessions: 3,
    exercisesAffected: ['AF-12'],
    examImpact: 'Line and dynamic values — Adage',
  },
  {
    id: 'p8',
    pattern: 'Weight back on heel in chassé',
    rootCause: 'Weight placement and balance',
    firstNoted: 'Apr 2026',
    sessions: 4,
    exercisesAffected: [],
    examImpact: 'Co-ordination — Allegro (pending code mapping)',
  },
];

export const EXERCISES: ExerciseCorrection[] = [
  {
    code: 'AF-10',
    name: 'Centre practice and pirouettes',
    corrections: [
      {
        criterion: 'Correct posture and weight placement',
        notes:
          'Hip remains level on supporting leg — do not allow lateral pelvic shift when transferring weight into preparation.',
      },
      {
        criterion: 'Co-ordination',
        notes:
          'Preparation lunge: land with weight over the heel, not ball of foot. Arm circle closes on count 2, not early.',
      },
      {
        criterion: 'Control',
        notes:
          'Spot initiation should come from the eyes, not a head flick. Relevé height must be maintained through the turn.',
      },
      {
        criterion: 'Line',
        notes:
          'Passive arch on demi-plié is visible in centre tendu passages — initiate arch engagement on every descent.',
      },
    ],
  },
  {
    code: 'AF-11F',
    name: 'Pirouette enchaînement',
    corrections: [
      {
        criterion: 'Co-ordination',
        notes:
          'Transition from pirouette to the following step is rushing — hold retiré an extra count before descending.',
      },
      {
        criterion: 'Control',
        notes:
          'Axis tilts forward in the second rotation — think "up and over" rather than "around".',
      },
      {
        criterion: 'Dynamic values',
        notes:
          'Preparation should have a clear gather/delay before the lift, not merge seamlessly into the turn.',
      },
    ],
  },
  {
    code: 'AF-12',
    name: 'Adage',
    corrections: [
      {
        criterion: 'Correct posture and weight placement',
        notes:
          'Pelvis tucking under as the leg rises past 45°. Maintain neutral pelvis by engaging outer hip, not by locking the glute.',
      },
      {
        criterion: 'Line',
        notes:
          'Lumbar overextension creating a visible curve rather than a lengthened line — opposition (crown away, working heel away) corrects this.',
      },
      {
        criterion: 'Control',
        notes:
          'Hip drop on supporting leg breaks throughout the phrase. Single-leg stability must hold for the full 8 counts of the arabesque.',
      },
      {
        criterion: 'Spatial awareness',
        notes:
          'Eyeline dropping into the arabesque rather than projecting forward and through.',
      },
    ],
  },
  {
    code: 'AF-25',
    name: 'Variation 2',
    corrections: [
      {
        criterion: 'Line',
        notes:
          'Arabesque in the opening phrase: same lumbar issue as AF-12. Same fix — opposition and length, not extension.',
      },
      {
        criterion: 'Performance',
        notes:
          'Shoulder drop on the épaulement transition in bar 12 reads as unfinished. Both shoulders must remain level through the port de bras.',
      },
      {
        criterion: 'Spatial awareness',
        notes:
          'Diagonal finish not reaching the corner — project gaze and right hand two feet further than feels natural.',
      },
    ],
  },
];

export const SESSIONS: SessionEntry[] = [
  {
    date: '2026-06-14',
    source: 'teacher',
    corrections: [
      {
        rootCause: 'Outer hip and ankle stability',
        bullets: [
          'Hip drop apparent immediately on the first fondu in centre — teacher stopped the class to address.',
          'Cue used: "push the floor away with your whole foot" — helped slightly but not consistent.',
        ],
        exercisesTagged: ['AF-10'],
      },
      {
        rootCause: 'Pirouette axis and preparation',
        bullets: [
          'Better on the right side today, axis held for a full double.',
          'Left side still collapsing — preparation weight not settling before the lift.',
        ],
        exercisesTagged: ['AF-10', 'AF-11F'],
      },
    ],
  },
  {
    date: '2026-06-07',
    source: 'private',
    corrections: [
      {
        rootCause: 'Arabesque mechanics',
        bullets: [
          'Video review confirmed lumbar overextension. Target: maintain the natural curve, extend the length.',
          'Exercise given: standing arabesque against the wall, no lumbar peel.',
          'Apply in AF-12 bar 3 and AF-25 opening phrase.',
        ],
        exercisesTagged: ['AF-12', 'AF-25'],
      },
      {
        rootCause: 'Foot intrinsics and arch',
        bullets: [
          'Arch engagement inconsistent on the descent — worked this at the barre for 20 mins.',
          'Cue: "pick up a marble before the plié goes down." Feeling more activated by end of session.',
        ],
        exercisesTagged: ['AF-10'],
      },
    ],
  },
  {
    date: '2026-05-31',
    source: 'teacher',
    corrections: [
      {
        rootCause: 'Shoulder girdle and épaulement',
        bullets: [
          'Dropped left shoulder flagged twice in the centre port de bras sequence.',
          'Needs to become a self-monitoring point during AF-25 practice.',
        ],
        exercisesTagged: ['AF-25'],
      },
      {
        rootCause: 'Opposition and length under load',
        bullets: [
          'Adage: when focus goes to the supporting leg, the working leg loses opposition and shortens.',
          'Reminder: both tasks simultaneously — support AND extend.',
        ],
        exercisesTagged: ['AF-12'],
      },
    ],
  },
  {
    date: '2026-05-17',
    source: 'physio',
    corrections: [
      {
        rootCause: 'Foot intrinsics and arch',
        bullets: [
          'Assessment confirmed intrinsic foot weakness, especially abductor hallucis.',
          'Prescribed: short-foot exercise 3×15 daily.',
          'Ankle eversion pattern identified as a compensation for the arch weakness.',
        ],
      },
      {
        rootCause: 'Pelvic alignment',
        bullets: [
          'Left hip flexor tightness contributing to anterior pelvic tilt — stretching protocol added.',
          'Core recruitment pattern: transversus not firing before the leg lifts.',
        ],
        exercisesTagged: ['AF-12'],
      },
    ],
  },
  {
    date: '2026-05-10',
    source: 'teacher',
    corrections: [
      {
        rootCause: 'Pirouette axis and preparation',
        bullets: [
          'Good double on the right in the run-through — teacher noted improvement.',
          'Left: preparation still inconsistent. Focus: weight shift must complete before relevé.',
        ],
        exercisesTagged: ['AF-10', 'AF-11F'],
      },
      {
        rootCause: 'Weight placement and balance',
        bullets: [
          'Chassé in the allegro phrase: landing back on the heel. Push through the ball of the foot to maintain momentum.',
        ],
      },
    ],
  },
];

export const PHYSIO_NOTES: PhysioNote[] = [
  {
    date: '2026-05-17',
    practitioner: 'Initial AF assessment session',
    notes: [
      'Intrinsic foot weakness (abductor hallucis, lumbricals) confirmed bilaterally, right slightly worse.',
      'Short-foot exercise prescribed: 3 sets of 15 reps daily before class. Reassess in 6 weeks.',
      'Ankle eversion pattern on relevé is a compensation — will reduce as foot strength improves.',
      'Left hip flexor (iliopsoas) restriction noted. Daily stretch: 90-second lunge hold, twice per day.',
      'Transversus abdominis recruitment lag before leg lifts. Cue: breathe out and connect before the leg initiates, not after.',
      'No structural concerns. Cleared for full pointe work. Monitor if ankle symptoms arise during gallop / allegro sequences.',
    ],
  },
];

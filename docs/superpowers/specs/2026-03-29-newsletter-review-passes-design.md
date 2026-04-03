# Newsletter Review Passes

> Add creator-specific editorial checks to the existing continuity loop without inventing a separate review system.

## Why

Newsletter mode should not stop at "issues instead of chapters."

Creators running Substack-style publications need review passes that match the medium:

- opening hook discipline
- recurring segment continuity
- CTA / close consistency

These checks belong inside the existing annotation pipeline so they stay:

- backend-first
- ownership-aware
- explainable in the editor
- consistent with existing continuity and planning drift flows

## Scope

This slice adds newsletter-specific `planning_drift` reasons:

- `hook_drift`
- `cta_drift`
- `segment_drift`

They are intentionally narrow:

- no new tables
- no new side-panel surfaces
- no separate review engine

## Behavior

### Hook Drift

Flag only when the issue opening clearly fails to tee up the planned angle or stored series promise.

Expected target:

- `targetSection: "outline"`
- `suggestedAction: "review_outline"`

### CTA Drift

Flag only when the ending clearly breaks the stored CTA or close pattern in planning notes.

Expected target:

- `targetSection: "notes"`
- `suggestedAction: "review_notes"`

### Segment Drift

Flag only when a recurring section or editorial pattern recorded in planning notes is clearly skipped or broken.

Expected target:

- `targetSection: "notes"`
- `suggestedAction: "review_notes"`

## UX

These drifts should appear in the existing editor tooltip with:

- a readable reason label
- an explanation grounded in outline / notes content
- a direct open action into the relevant planning surface

No new quick actions are required for this slice.

## Boundaries

Do not turn this into generic writing advice.

The system should not flag:

- ordinary hook preference
- small ending variation
- natural newsletter evolution that still honors the audience promise

## Result

Newsletter continuity starts behaving more like an editorial copilot:

- not just contradiction detection
- not just fiction-shaped planning drift
- but creator-relevant review around hooks, recurring structure, and closes

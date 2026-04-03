# Writing OS Simplification Reset

## Why this exists

The product has accumulated too many visible surfaces at once.

Even when individual features are useful, the overall experience now risks feeling like:

- too many tabs
- too many labels
- too many "smart" tools
- too many states the user is expected to understand

This is especially dangerous for an AI-native product because complexity can masquerade as power.

We should optimize for:

- legibility
- confidence
- clear workflow
- progressive disclosure

Not:

- maximum visible capability
- every internal system exposed at once

## Product rule

Default experience first.
Advanced controls second.

If a surface is not necessary for the default writing loop, it should be hidden behind an `Advanced` entry point, a detail expander, or a deeper screen.

## Default workflow

The default Writing OS loop should feel like:

1. write
2. remember
3. review
4. package / adapt
5. export / publish

Everything else is support structure.

## Newsletter default workflow

Newsletter should reduce to:

1. write issue
2. choose official package
3. run pre-send check
4. export / send

Do not surface extra packaging machinery by default if it does not help one of those four steps.

## Codex default workflow

Codex should reduce to:

1. see who / what matters right now
2. inspect the current truth
3. accept useful updates
4. edit core facts when needed

The default user should not need to think in terms of:

- custom types
- relationship graphs
- progression editing
- context rules
- mention syncing mechanics

Those are advanced capabilities.

## Proposed information architecture

### Default visible surfaces

- `Write`
- `Memory`
- `Project`
- `Outputs`

### Advanced surfaces

- detailed Codex editing
- custom types
- relationship management
- progression timelines
- detailed context console
- full artifact taxonomy
- history internals
- low-frequency craft tools

## First shipped simplification pass

The first pass should already move visible workspace language toward plain
English:

- `Codex` -> `Memory`
- `Artifacts` -> `Project`
- `Adapt` -> `Outputs`
- `Craft` / `History` behind `Advanced`
- secondary `Project` filters hidden until needed
- older `Memory` review activity collapsed until asked for

The next passes should keep reducing jargon inside each surface until a new user
can understand the default loop without learning internal system names first.

That same simplification rule should apply to detail screens, not just top-level
navigation:

- show the main fact content before mention trails and relationship controls
- show the main project content before metadata badges and filter internals
- keep lower-priority newsletter setup behind a secondary reveal instead of
  mixing it into the default pre-send path
- keep one obvious primary action visible before exposing copy / reopen / delete
  controls for every project item
- prefer one quiet metadata line in lists over stacks of status chips when the
  user only needs to scan and choose an item
- prefer one quiet summary line in headers and setup cards before exposing
  secondary status chips or deeper context blocks
- in workflow cards, keep one obvious next action visible first and move
  secondary export or utility actions behind a reveal
- apply that same rule to output packaging too: keep the default output flow on
  one obvious next step, and hide official package selection / editing until
  the user explicitly opens it
- apply the same rule to the editor shell: keep writing tools behind one calm
  toolbar entry point instead of showing a permanent row of craft actions
- apply the same rule to entry screens too: the home flow should reduce to
  `start new` or `open saved`, while sample projects and lower-priority setup
  live behind secondary reveals
- keep the action vocabulary consistent: prefer one plain verb for the same
  action across the product instead of mixing terms like `insert`, `re-insert`,
  or implementation-facing wording
- remove redundant visual signals too: if metadata already exists in one quiet
  place, avoid repeating it with extra badges, counters, or louder chrome
- apply the same rule to onboarding and shell microcopy too: home, login,
  create, and editor confirmations should use plain, mode-neutral wording
  wherever a simpler word will do
- do not collapse high-frequency actions just because they can fit behind a
  menu; if a control is part of the default writing loop and there is room for
  it, keep it visible
- do not bury high-value onboarding paths behind a reveal either; if sample
  projects help new users understand the product quickly, keep them visible as
  a secondary path instead of hiding them
- the same rule applies inside newsletter workflow surfaces: official package
  choices and export actions are part of the default loop, so they should stay
  directly visible when screen space allows
- on desktop, common secondary actions can stay visible too: `Copy`, `Open in
  Outputs`, or similar routine follow-up actions do not need to be hidden
  behind `More actions` if space allows and the screen still reads clearly

## Simplification heuristics

For every surface, ask:

1. Is this part of the default workflow?
2. Does a new user need this immediately?
3. Is this describing product internals rather than user intent?
4. Would hiding this behind `Advanced` make the product clearer without removing power?

If the answers are:

- `no`
- `no`
- `yes`
- `yes`

then it should probably move out of the default layer.

## Concrete next move

Run a simplification sprint before new mode expansion.

### Focus areas

- simplify side-panel navigation
- simplify Codex entry flow
- simplify newsletter pre-send flow
- reduce always-visible status chips, labels, and secondary actions
- rename tool surfaces around user intent instead of system implementation

## Success condition

A new user should be able to answer:

- what this tool is for
- what I do next
- what is optional
- where the advanced controls live

without needing product training.

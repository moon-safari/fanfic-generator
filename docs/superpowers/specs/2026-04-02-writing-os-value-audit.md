# Writing OS Value Audit

## Why this exists

We need a stricter filter than "this seems reasonable."

The real question is:

`does this help a writer get from draft to better draft materially faster and with more confidence?`

If the answer is unclear, the work is probably not valuable enough right now.

## Current product promise

The Writing OS should do five things well:

1. help the writer draft
2. keep project truth in memory
3. review drift and contradictions
4. reuse one project across a few strong outputs
5. for newsletters, package and send with confidence

Everything else is support structure.

## Clear value: keep and invest

### 1. The editor and story tools

Why this is real value:

- it improves the manuscript directly
- the user understands the benefit immediately
- it shortens the path from rough draft to better draft

### 2. Memory core: facts, current context, review

Why this is real value:

- it makes project truth inspectable
- it shows what the system is using
- it turns long-form writing into more than a plain editor

### 3. Continuity and annotations

Why this is real value:

- it catches real long-form writing problems
- it supports confidence, not just generation
- it compounds as the manuscript grows

### 4. Saved summaries and recaps as reusable state

Why this is real value:

- they improve later prompts
- they improve orientation for the user
- they turn outputs into durable project memory

### 5. Newsletter core loop

The valuable newsletter loop is:

1. write issue
2. choose official package
3. run pre-send check
4. export/send

Why this is real value:

- it is a complete creator workflow
- it changes behavior
- it is more than "generate some options"

## Moderate value: keep, but compress or de-emphasize

### 1. Large adaptation surface area

Adaptation matters, but too many output types create the feeling of feature soup.

Keep:

- a few flagship outputs
- strong chains
- saved state reuse

Do not widen casually.

### 2. Deep planning internals

Planning depth is useful for power users, but it should not dominate the default flow.

Keep it:

- available
- editable
- increasingly hidden behind stronger defaults

### 3. Rich artifact library behavior

Artifacts are valuable when they are reused later.

They are lower value when they become:

- a second inbox
- a taxonomy to maintain
- another screen full of saved text that does not change future behavior

### 4. Multiple places to manage newsletter package state

This can be helpful when it removes a real context switch.

But it is only moderate value, not major value, because it is convenience work rather than a core product unlock.

## Low or suspect value: avoid, hide, or cut

### 1. New one-off output types

If an output does not become reusable state or complete a strong workflow, it is probably not worth shipping.

### 2. Micro-features that save one click but add another concept

This is how the product becomes harder while technically doing more.

### 3. UI churn disguised as simplification

Hiding important controls is not value.
Renaming things without improving comprehension is not value.

### 4. More newsletter sub-workflows before the main loop is undeniably smooth

Do not widen newsletter again until the default creator loop feels obvious and reliable.

### 5. More Codex internals in the default layer

If the default user needs to understand system mechanics, we are exposing the wrong thing.

## Current product risks

### 1. Too many concepts relative to the outcome

The product still risks feeling like:

- memory
- plans
- artifacts
- outputs
- package state
- review
- context

instead of:

- write
- remember
- review
- reuse

### 2. Side-panel space is still weak

The user still has to scroll too much in story tools and side-panel surfaces.
That is a real UX cost, not a cosmetic complaint.

### 3. Adaptation can still feel like many tools instead of a few dependable workflows

That weakens both UX and product value.

### 4. Some recent work has been technically correct but only moderate-value

This is the warning sign we should take seriously.

## Value bar for new work

Only ship a feature if at least one of these is clearly true:

1. it makes writing materially faster
2. it makes project truth clearer or safer
3. it makes later outputs materially better because saved state is reused
4. it removes a meaningful context switch or chunk of confusion
5. it completes a core workflow end to end

If none are clearly true, do not build it.

## Near-term build order after this audit

### 1. Browser-led review of the default fiction flow

Test:

- start new
- write
- use story tools
- inspect memory
- run review

### 2. Browser-led review of the default newsletter flow

Test:

- open newsletter sample
- write issue
- choose official package
- run pre-send check
- export

### 3. Fix only concrete high-friction issues

No more abstract cleanup rounds.

### 4. Give story tools and the side panel more room

The likely next UX improvement is:

- expand/focus mode
- wider panel state
- sticky headers with more usable content space

### 5. Continue adaptation only where it strengthens flagship workflows

Fiction:

- draft -> summary -> review -> teaser

Newsletter:

- draft -> official package -> pre-send -> export

## Stop list

- no more blind simplification passes
- no more new output types unless one is removed or clearly justified
- no more workflow duplication across tabs unless it removes a real context switch
- no more internal product language in the default UX

## Decision rule

When in doubt, prefer:

- fewer surfaces
- stronger defaults
- deeper state reuse
- complete workflows over extra options

# Canonical Issue Package State

## Why

Newsletter issue-package outputs were useful, but they were still mostly option sets:

- subject line options
- deck options
- hook variants
- CTA variants
- recurring section package drafts

That was helpful, but not fully AI-native. The system could generate options, yet it still did not know which option had become the official package for the issue.

The key move is to turn those outputs into durable issue state.

## Product Goal

Newsletter projects should let the writer choose, edit, and clear the canonical:

- subject line
- deck
- hook
- CTA
- recurring section package

That chosen package state should then feed:

- issue readiness
- bundle export
- future newsletter workflow logic

## Design

### Storage

Add a per-issue table:

- `newsletter_issue_packages`

Each row is scoped by:

- `story_id`
- `chapter_id`
- `chapter_number`

Each row stores the selected canonical values for the issue package.

This keeps the official package state:

- authenticated
- RLS-protected
- server-owned
- separate from raw generated option artifacts

### Workflow shape

The user flow stays inside the existing newsletter workflow:

1. generate package outputs in `Adapt`
2. inspect options
3. choose what becomes official
4. edit that official value if needed
5. clear it when the choice changes

This keeps the workflow additive rather than spawning a new disconnected surface.

### Reuse

Canonical package state must become part of product logic, not just saved text.

It now feeds:

- readiness checks
- issue bundle export

This is the AI-native step: model output becomes operational state.

## UX rules

- if the user can add a choice, they must be able to edit it
- if they can edit it, they must be able to clear it
- generated options stay available as source material
- canonical state is the selected truth for the issue

## Why this matters

This moves newsletter mode away from:

- AI generating disposable alternatives

toward:

- AI helping produce official package state the system can reason about later

That makes the product more AI-native, more stateful, and more useful in a real creator workflow.

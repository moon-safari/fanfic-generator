# AI-Native Product Principles

## Why this exists

The Writing OS should not drift into a normal software product with AI bolted on.

That means we need a simple standard for judging whether a feature is:

- truly AI-native
- merely AI-assisted
- or just decorative AI surface area

This document is the decision filter.

## Core distinction

### Bolted-on AI

Bolted-on AI usually looks like:

- a sparkle button
- a chat side panel
- one-off generations with no durable state
- optional usage that users can ignore without changing behavior
- no compounding value across sessions

If users try the AI once and then go back to the normal product, the AI is probably not native.

### AI-native product behavior

AI-native product behavior usually looks like:

- the core workflow depends on model reasoning
- output becomes reusable product state
- the system remembers and improves across sessions
- model improvements materially improve the product every few months
- users work differently because the AI is part of the operating logic, not a side feature

The strongest signal is:

`model output becomes project state`

That is the real difference between novelty AI and product-native AI.

## The Writing OS standard

For this product, AI-native means the system should increasingly:

- store project truth
- resolve active truth for the current task
- review drift and contradictions
- convert generations into reusable artifacts
- reuse prior state in future work
- make long-form writing behavior fundamentally different from a plain editor

## Feature test

Before building or expanding a feature, ask:

1. If the model disappeared, would this workflow still mostly work?
2. Does the output become durable project state?
3. Does future behavior improve because this feature ran?
4. Will better base models noticeably improve this part of the product?
5. Will the user work differently because this exists?

If most answers are `no`, the feature is probably not AI-native enough.

## What counts as strong AI-native work here

The most AI-native parts of the Writing OS are:

- Codex and structured project memory
- context resolution and explainable context
- continuity copilot
- planning-aware generation
- planning-aware review
- saved artifacts that feed later workflows
- newsletter memory and issue-readiness logic

## What is at risk of becoming bolted-on

These areas need extra discipline:

- standalone craft buttons
- random output formats
- chains that do not feed back into project memory or workflow
- decorative AI surfaces that do not change user behavior

## Product rule

Prefer:

- memory
- continuity
- review
- planning integration
- reusable artifacts
- workflow dependence

Be skeptical of:

- isolated generation buttons
- generic chat surfaces
- new AI features that do not compound

## Strategic implication

This means the roadmap should continue to favor:

1. project memory depth
2. review and continuity depth
3. planning-state integration
4. creator workflows that depend on those layers
5. mode packs built on the same substrate

It should avoid widening through disconnected AI flourishes.

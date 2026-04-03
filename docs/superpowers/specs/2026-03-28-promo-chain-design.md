# Promo Chain Design

> The first chained adaptation workflow: `chapter -> newsletter recap -> public teaser`.

## Goal

Prove that the writing OS can do more than generate isolated outputs.

This slice introduces a small workflow chain where one adaptation becomes the input to the next.

## Why This Matters

Single outputs prove transformation.

Chains prove orchestration.

That is a much more operating-system-like behavior:

- one source chapter
- one shared story truth layer
- multiple linked outputs
- reusable saved artifacts at each step

## Chain

Current chain:

- generate `newsletter_recap`
- generate `public_teaser` from that recap

Both outputs are persisted as adaptation artifacts.

## Backend

Route:

- `POST /api/adapt/chain`

Request:

```json
{
  "storyId": "uuid",
  "chapterId": "uuid",
  "chainId": "promo_chain"
}
```

Behavior:

1. authenticate and load source chapter
2. resolve Codex-first story context
3. generate newsletter recap
4. generate public teaser using that recap as bridge text
5. persist both outputs
6. return both artifacts

## Frontend

The `Adapt` tab now exposes a `Promo Chain` action.

When the chain runs:

- both saved outputs are refreshed in the format list
- the active output switches to `public_teaser`
- the user can still inspect, copy, or insert either artifact afterward

## Non-Goals

Not included yet:

- arbitrary user-defined chains
- multi-step workflow builder UI
- delete/reorder chain steps
- cross-chapter chains
- social packaging beyond teaser

## Likely Next Steps

- add `chapter -> short summary -> newsletter recap -> public teaser`
- allow rerunning only one step while preserving others
- add chain history or version comparison
- surface saved artifacts in a future project graph


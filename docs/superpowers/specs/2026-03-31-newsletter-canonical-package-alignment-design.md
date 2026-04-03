# Newsletter Canonical Package Alignment

## Why

Canonical issue-package state made newsletter packaging more AI-native:

- the writer can choose the official subject line
- the writer can choose the official deck
- the writer can choose the official hook
- the writer can choose the official CTA
- the writer can choose the official recurring section package

But once that state exists, the product should use it.

Otherwise the system still knows what was chosen without reasoning about whether the issue actually honors that choice.

## Goal

Improve the existing newsletter readiness flow so it checks whether the current issue body still aligns with the official package.

This should stay inside the current workflow:

- no new section
- no new artifact family
- no new detached review mode

## What the readiness layer now checks

In addition to package existence and canonical selection, readiness should now evaluate:

- canonical framing
  - whether the chosen subject line and deck still match the issue framing
- official hook alignment
  - whether the issue opening still supports the chosen hook
- official CTA alignment
  - whether the issue close still supports the chosen CTA
- recurring section alignment
  - whether the body visibly honors the chosen recurring section package

## Product principle

This is an AI-native refinement, not feature sprawl.

The point is not:

- more outputs
- more buttons
- more variants

The point is:

- chosen AI outputs become project truth
- review uses that truth
- future work becomes smarter because the product remembers what was officially chosen

## Why it matters

This turns newsletter packaging into a real operating layer:

- generation produces options
- the writer decides what becomes canonical
- readiness checks whether the issue still matches the chosen package

That is much stronger than a typical AI workflow where outputs stay disposable and unconnected.

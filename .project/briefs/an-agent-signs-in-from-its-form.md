---
title: An agent signs in from its form
created: 2026-10-31
refs:
  - git://2ed435cc83d63f569a8bba9596dd243a0347f2b4 - the commit of this repository the facts were checked at
  - "[code://src/resources/agents/AgentForm.tsx#L184](../../src/resources/agents/AgentForm.tsx#L184) - the engine's fields, drawn by `SchemaForm` with no format renderer"
  - "[code://src/resources/agents/form.ts#L96-L102](../../src/resources/agents/form.ts#L96-L102) - `engineSchema`, where the form already rewrites the engine's schema"
  - "[code://src/resources/connectors/SignInStep.tsx](../../src/resources/connectors/SignInStep.tsx) - the connector sign-in: a button from the adapter row, then a pasted code"
  - "[code://src/resources/connectors/form.ts#L74](../../src/resources/connectors/form.ts#L74) - `idFor`, the id a new connector gets from its title and adapter"
  - "[code://src/resources/connectors/form.ts#L248](../../src/resources/connectors/form.ts#L248) - `configForSignIn`, the config a sign-in starts with"
  - "[code://src/bridges/connectors.ts#L185-L202](../../src/bridges/connectors.ts#L185-L202) - `startSignIn` and `finishSignIn`"
  - plans/plugins/09-a-connector-signs-in-from-its-form/plan.md - the connector sign-in this follows
  - https://github.com/softov/scena/blob/9eb7037/packages/scena/src/ui/forms/SchemaForm.tsx#L39-L48 - `formatRenderers`, a field drawn by the app's own component, keyed by `format`
  - https://github.com/softov/scena/blob/9eb7037/packages/scena/src/ui/forms/SchemaForm.tsx#L475-L478 - a format renderer is asked before the form's own controls, arrays too
  - https://github.com/ahpio/ahpd/blob/25be79aa5418d52adf7a0c526e38483f665c0631/packages/agent-claude/src/options.ts#L226-L232 - the Claude agent's `logins`, items marked `x-ahpd-connector` with the adapter `claude-login`
  - https://github.com/ahpio/ahpd/blob/25be79aa5418d52adf7a0c526e38483f665c0631/packages/sdk/src/agents/channel.ts#L20-L24 - an agent put refuses a connector id of another adapter, or of an owner that is neither the agent's nor the host's
  - https://github.com/ahpio/ahpd/blob/25be79aa5418d52adf7a0c526e38483f665c0631/packages/agent-claude/src/adapter.ts#L114-L157 - the `claude-login` sign-in: Claude Code's `setup-token` flow on the claude.ai code page
---

# An agent signs in from its form

Softov wants a person to sign in to Claude from the agent form, with no trip to Connectors first.
One agent holds several Claude accounts, and the person sets the order they are tried in.
ahpd needs no change: the sign-in makes a `claude-login` connector, and the agent names it in `logins`.

## What others do

The change follows ahpw's own connector sign-in, from plan [09](../plans/plugins/09-a-connector-signs-in-from-its-form/plan.md).
There, the button comes from the adapter row's `signIn`, and its label is `signIn.title`.
A person presses it, signs in on the page that opens, and pastes the code that page shows.

ahpd made a Claude login a connector, and the agent names connectors by id ([`options.ts`](https://github.com/ahpio/ahpd/blob/25be79aa5418d52adf7a0c526e38483f665c0631/packages/agent-claude/src/options.ts#L226-L232)).
A turn tries the logins in the agent's order, and moves to the next one on a 429 or a 5xx.

## What ahpw has today

- The agent form draws the engine's fields with `SchemaForm`, and passes no `formatRenderers` ([`code://src/resources/agents/AgentForm.tsx`](../../src/resources/agents/AgentForm.tsx#L184)).
- ahpw reads `x-ahpd-connector` nowhere. The Claude agent's `logins` shows as a list of text fields, and a person types each connector id.
- `engineSchema` already rewrites the engine's schema before the form draws it: it marks secrets and hides host-only fields ([`code://src/resources/agents/form.ts`](../../src/resources/agents/form.ts#L96-L102)).
- `SchemaForm` takes `formatRenderers`, keyed by a field's `format`, and asks one before its own controls, for a list too ([`SchemaForm.tsx`](https://github.com/softov/scena/blob/9eb7037/packages/scena/src/ui/forms/SchemaForm.tsx#L475-L478)).
- `SchemaForm`'s own list control has no way to move an entry up or down.
- `SignInStep` takes a host, the adapter row's `signIn`, and the connector to put ([`code://src/resources/connectors/SignInStep.tsx`](../../src/resources/connectors/SignInStep.tsx)). It calls `onDone` with the connector row the sign-in made.
- `idFor` makes a free connector id from a title and an adapter ([`code://src/resources/connectors/form.ts`](../../src/resources/connectors/form.ts#L74)).
- An agent put refuses a connector of another adapter, or one whose owner is neither the agent's owner nor the host ([`channel.ts`](https://github.com/ahpio/ahpd/blob/25be79aa5418d52adf7a0c526e38483f665c0631/packages/sdk/src/agents/channel.ts#L20-L24)).

## Who writes

| Writer | What the change does to it |
|---|---|
| Branches of this repository | No open branch that is not in main touches the agent form, the connector form, the two bridges or the strings. |
| Open pull requests | None. |
| scena | The change uses `formatRenderers` as published in `@softov/scena` 0.5.16, and changes nothing in scena. |
| ahpd | Nothing changes. The form reads the `x-ahpd-connector` mark the host already sends. |

## The change

- `engineSchema` gives each field marked `x-ahpd-connector`, or each list whose items it marks, a `format` that ahpw draws itself.
- The agent form passes a format renderer for that `format` to the engine's `SchemaForm`.
- The renderer draws a list of connectors in their order. Each row shows the connector's title and its state, with controls to move it up, move it down and remove it.
- It offers to add a connector of the marked adapter that the agent's owner may use: the owner's own, and the host's.
- When the marked adapter has a `signIn`, the renderer shows its button. The sign-in is `SignInStep`, used as the connector form uses it.
- The connector a sign-in makes belongs to the agent's owner, and its id comes from `idFor`.
- When the sign-in finishes, the new connector's id goes at the end of the list.
- Under the button, a line says that the page signs in the account the browser is signed in to. To add a second account, the person switches account on that page first.
- The renderer reads only the mark and the adapter row. It names no adapter, so another engine's connector field gets the same picker.

## Open points

- What title does a connector made from the agent form get, so a person can tell two accounts apart?
- A new agent that is never saved leaves the connector its sign-in made. Is the connector kept, or removed when the form closes?
- Does a row show the connector's health, or only its state?

---
title: A client page shows its connection
created: 2026-11-14
refs:
  - git://c9120aab062f65bb11ec0422ecf2e328d5405038 - the commit of ahpw the facts were checked at
  - git://dd80ad12ff2be21d469a3393304ff0d5acdbec4b - the commit of ahpd main the facts were checked at
  - "[code://src/resources/clients/rows.ts#L22-L36](../../src/resources/clients/rows.ts#L22-L36) - `ClientFacts`, the fields the page reads"
  - "[code://src/resources/clients/rows.ts#L41-L60](../../src/resources/clients/rows.ts#L41-L60) - `factsOf`, which reads `record.watching`"
  - "[code://src/resources/clients/rows.ts#L77-L80](../../src/resources/clients/rows.ts#L77-L80) - `lineOf`, the explorer row's line"
  - "[code://src/resources/clients/rows.test.ts](../../src/resources/clients/rows.test.ts) - the tests of `factsOf`, `lineOf` and the byte words"
  - "[code://src/resources/clients/Page.tsx#L20-L35](../../src/resources/clients/Page.tsx#L20-L35) - `factsList`, which adds a fact only when it has a value"
  - "[code://src/resources/clients/Page.tsx#L38-L45](../../src/resources/clients/Page.tsx#L38-L45) - `trafficList`, the four counters"
  - "[code://src/resources/clients/Page.tsx#L84-L89](../../src/resources/clients/Page.tsx#L84-L89) - the list of channels, drawn when `watching` is not empty"
  - "[code://src/resources/clients/Explorer.tsx#L47](../../src/resources/clients/Explorer.tsx#L47) - the explorer row's line"
  - "[code://src/bridges/words.ts#L54-L65](../../src/bridges/words.ts#L54-L65) - `elapsed`, a length of time as `5m13s`"
  - "[code://src/bridges/Status.tsx#L22-L31](../../src/bridges/Status.tsx#L22-L31) - `useNow`, a clock that moves once a second, local to the file"
  - "[code://src/i18n/en.json#L3159](../../src/i18n/en.json#L3159) - the `clients` keys, at the same line in `es.json` and `pt.json`"
  - "[code://.project/plans/hosts/20261103-1313-tunnels-and-clients-in-explorers/plan.md](../plans/hosts/20261103-1313-tunnels-and-clients-in-explorers/plan.md) - the plan that built the clients explorer and page"
  - https://github.com/ahpio/ahpd/blob/dd80ad12ff2be21d469a3393304ff0d5acdbec4b/packages/sdk/src/clients/channel.ts#L91-L101 - `rowOf`, which spreads `subscriptions` into the row
  - https://github.com/ahpio/ahpd/blob/dd80ad12ff2be21d469a3393304ff0d5acdbec4b/docs/plugins/PLUGINS.md#L1874-L1890 - the `x-ahpd-clients` section, which names the field `subscriptions`
  - file:///github/ahpd/.project/briefs/a-client-row-says-more-of-its-connection.md - the ahpd brief this one follows, not yet committed
---

# A client page shows its connection

Softov wants the client page to say more about a connection than its id, address, protocol, connect time and counters.
This brief covers the ahpw half: drawing the fields that ahpd sends on `x-ahpd-clients://`.
It follows the ahpd brief `a-client-row-says-more-of-its-connection`, which adds the fields.
One part needs no ahpd change and can be built first: the list of channels, which ahpd already sends under another name.

## What ahpw has today

### The list of channels is never drawn

- ahpd sends the channels a connection follows as `subscriptions`, and `PLUGINS.md` names the field so.
- `factsOf` reads `record.watching` ([`code://src/resources/clients/rows.ts#L41-L60`](../../src/resources/clients/rows.ts#L41-L60)), a field no row carries.
- So `watching` is always empty.
- The page then never adds the *Channels followed* fact, and never draws the list ([`code://src/resources/clients/Page.tsx#L84-L89`](../../src/resources/clients/Page.tsx#L84-L89)).
- No test gives `factsOf` a row with `subscriptions` ([`code://src/resources/clients/rows.test.ts`](../../src/resources/clients/rows.test.ts)).

### The page

- `factsList` adds a fact only when it has a value ([`code://src/resources/clients/Page.tsx#L20-L35`](../../src/resources/clients/Page.tsx#L20-L35)). A field ahpd does not send draws nothing.
- The facts are the host, client id, name, person, address, forwarded-for, protocol, language, connect time and the channel count.
- *Traffic* holds the four counters as plain numbers and bytes ([`code://src/resources/clients/Page.tsx#L38-L45`](../../src/resources/clients/Page.tsx#L38-L45)).
- The badge says *this app* for the reader's own connection and *connected* for any other.
- The title is the name, else the client id.

### The explorer row

- The row's line is the host, *this app*, the person and the address ([`code://src/resources/clients/Explorer.tsx#L47`](../../src/resources/clients/Explorer.tsx#L47)).
- A root connection and an anonymous one show the same line, because neither has a person.

### What exists to reuse

- `elapsed` writes a length of time as `13s`, `5m13s` or `2h5m` ([`code://src/bridges/words.ts#L54-L65`](../../src/bridges/words.ts#L54-L65)).
- `useNow` moves a clock once a second ([`code://src/bridges/Status.tsx#L22-L31`](../../src/bridges/Status.tsx#L22-L31)). It is local to `Status.tsx`, so a second user needs it moved to a shared file.
- `bytesWords` writes a byte count ([`code://src/resources/clients/rows.ts`](../../src/resources/clients/rows.ts)).
- `dateFormat` writes a wall-clock time in the reader's language.

## Who writes

| Writer | Files it touches | What this change does to it |
|---|---|---|
| `main` | All of them | The base. |
| The uncommitted tunnels work in the main checkout | `src/i18n/en.json`, `es.json`, `pt.json`, 3 lines each | This change adds `clients` keys to the same files. Commit or stash the tunnels work first, or add the keys in a separate hunk. |
| ahpd | Sends the row | The fields in *The change* exist only once the ahpd plan is built. Each fact is drawn only when its field is present, so ahpw can ship before ahpd. |

No other branch or worktree of ahpw touches `src/resources/clients/` or `src/i18n/`.

## The change

### Without ahpd

- `factsOf` reads `subscriptions` into the channel list. The field `watching` stays the name inside ahpw.
- A test gives `factsOf` a row with `subscriptions` and expects the list.
- The page then shows the channel count and the list of channels, which it draws today but never reaches.
- *Traffic* adds the rate in each direction, worked out from two counter updates 5 seconds apart. ahpd sends what it needs already.

### With the ahpd fields

The names are the ones the ahpd brief proposes. The ahpd plan may rename them, and this list follows it.

| Field | Where it is drawn | How it reads |
|---|---|---|
| `root` | The person fact, and the explorer line | *Host token* in place of an empty person |
| `principalUntil` | Beside the person | The time the sign-in runs out |
| `roles`, `team` | Beside the person | The role names, and the team when it is a team key |
| `clientVersion`, `clientTitle` | The title and a *Client* fact | `ahpc 0.9.0`; the title comes first when the client sent one |
| `capabilities` | A *Capabilities* fact | The names, such as `mcpApps` |
| `path`, `node` | Beside the address | The path the socket opened, and the node that admitted it |
| `userAgent`, `origin` | Beside `forwardedFor` | Kept as sent, marked as claims as `forwardedFor` is |
| `arrival` | Beside the connect time | *New* or *Resumed* |
| `lastIn`, `lastOut` | *Traffic*, and the badge | *Idle 4m12s* through `elapsed`; the badge turns *idle* past a threshold |
| `lastPing` | *Traffic* | The time since the last ping |
| `queuedBytes`, `queueLimit` | *Traffic* | The queue as bytes of the limit; a warning tone past half |
| `refused` | *Traffic* | The count of refused requests |
| `authenticated` | A list beside the channels | The resources the client pushed a token for |
| `sessions` | A list beside the channels | Each session as a link to its page |

- Each new fact is added only when its field is present, as `factsList` does now.
- Each new label is a key under `clients/` in all three languages.
- A time since an event moves once a second while the page is open, through `useNow` moved to a shared file.
- `factsOf` reads each field with the `text` and `count` checks it has, and each has a test.

## Open points

- The threshold that turns the badge *idle*. Suggested: 60 seconds with no frame in either direction.
- Whether the explorer line shows the client version, or only the page does.
- Whether *Traffic* shows rates at all before ahpd sends `lastIn` and `lastOut`, since a rate of zero and an idle socket read the same.

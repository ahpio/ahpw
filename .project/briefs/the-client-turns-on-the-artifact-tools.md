---
title: The client turns on the artifact tools
created: 2026-11-15
refs:
  - git://113d3fe - the commit of ahpw the facts were checked at
  - git://addd41fcc - the ahpd merge of #344, which gates the artifact tools on `artifactTools`
  - https://github.com/ahpio/ahpd/pull/344 - the gate, off by default as VS Code's host default
  - "[code://src/bridges/data.ts#L663-L672](../../src/bridges/data.ts#L663-L672) - `greet`, what ahpw does when a host connects"
  - "[code://src/bridges/data.ts#L683-L698](../../src/bridges/data.ts#L683-L698) - `pushMissingTrust`, which reads the root snapshot and pushes only what the host lacks"
  - "[code://src/bridges/trust.ts#L110-L112](../../src/bridges/trust.ts#L110-L112) - `trustAction`, the shape of a `root/configChanged` push"
  - "[code://src/resources/host/Settings.tsx#L81](../../src/resources/host/Settings.tsx#L81) - the Settings page's push of what a person changed"
  - https://github.com/microsoft/vscode/blob/1564f100807a/src/vs/platform/agentHost/common/artifactToolsConfiguration.ts#L22-L31 - VS Code's window setting `chat.artifactTools.enabled`, default `true`, pushed as `artifactTools`
---

# The client turns on the artifact tools

Softov wants a person on ahpw to have the artifact tools, as a person on VS Code has them. Since ahpd #344, ahpd offers them only while root config `artifactTools` is `true`, and its default is `false`. A VS Code window pushes `true` at connect, and ahpw pushes nothing, so ahpw's people have no artifact tools today.

## What others do

VS Code's window setting `chat.artifactTools.enabled` defaults to `true` and maps to the root key `artifactTools`. A window pushes it on every connect, so the window's value wins over what the host holds. Softov chose a different rule for ahpw on 2026-11-15. It pushes `true` only when the root holds no value for the key. A value set on the host is kept.

## What ahpw has today

- `greet` runs on every connect. It pushes the folders this browser trusts and the host does not, through `pushMissingTrust`.
- `pushMissingTrust` follows the root channel, waits for its snapshot, and pushes only when the read succeeded. A failed read pushes nothing.
- `trustAction` builds a `root/configChanged` with one key. ahpd applies a push as a patch, so the other keys are kept.
- The Settings page pushes what a person changed, and draws `artifactTools` from the schema ahpd declares.
- Nothing pushes `artifactTools`.

## Who writes

- `shell/manage-menu-groups` is the branch checked out in `/github/ahpw`. It changes no file this brief names.
- ahpc pushes root config on its own connections, and has a brief of the same name. Both push only when the key is unset, so neither overwrites the other or a host value.

## The change

- On connect, ahpw reads the root snapshot as `pushMissingTrust` does.
- When `config.values` holds no `artifactTools`, ahpw pushes `artifactTools: true`.
- A value already held, `true` or `false`, is left as it is.
- A failed read, or a push the host refuses for want of `config:change`, is silent.

## Open points

- Share one reader of the root snapshot between the trust push and this one, or keep two.

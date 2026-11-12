---
title: A plugin is added or written from ahpw
created: 2026-11-12
refs:
  - git://b6c9b73 - the commit of this repository the facts were checked at
  - git://02a57e731 - the commit of ahpd the host facts were checked at
  - git://e646868227c - the commit of VS Code the reference was checked at
  - "[code://src/resources/plugins/index.ts#L71-L73](../../src/resources/plugins/index.ts#L71-L73) - the explorer's toolbar: Reload, Apply and Group"
  - "[code://src/resources/plugins/PluginPage.tsx#L57-L72](../../src/resources/plugins/PluginPage.tsx#L57-L72) - the page's actions: Reimport, and Enable or Disable"
  - "[code://src/resources/plugins/actions.ts#L8-L10](../../src/resources/plugins/actions.ts#L8-L10) - `mayToggle`, an action that shows when the host offers its command"
  - "[code://src/bridges/plugins.ts#L27-L31](../../src/bridges/plugins.ts#L27-L31) - the five plugin commands ahpw calls today"
  - "[code://src/bridges/plugins.ts#L81-L104](../../src/bridges/plugins.ts#L81-L104) - `PluginRow`, with no field that says a plugin was written in a client"
  - "[code://src/resources/connectors/index.ts#L84-L93](../../src/resources/connectors/index.ts#L84-L93) - `ahp.newConnector`, the sibling that opens a new form in a tab"
  - "[code://src/resources/editor/CodeEditor.tsx#L15-L30](../../src/resources/editor/CodeEditor.tsx#L15-L30) - `CodeEditor`, ahpw's CodeMirror editor, with TypeScript and JSON"
  - https://github.com/ahpio/ahpd/blob/02a57e731/packages/server/src/pluginschannel.ts#L498-L538 - `x-ahpd/plugins/install`
  - https://github.com/ahpio/ahpd/blob/02a57e731/packages/server/src/pluginschannel.ts#L547-L575 - `x-ahpd/plugins/remove`
  - https://github.com/ahpio/ahpd/blob/02a57e731/packages/server/src/pluginschannel.ts#L642-L700 - `x-ahpd/plugins/write`
  - https://github.com/ahpio/ahpd/blob/02a57e731/packages/server/src/pluginschannel.ts#L707-L725 - `x-ahpd/plugins/source`
  - https://github.com/ahpio/ahpd/blob/02a57e731/packages/server/src/pluginschannel.ts#L844-L873 - `x-ahpd/plugins/update`
  - https://github.com/ahpio/ahpd/blob/02a57e731/packages/server/src/pluginschannel.ts#L257-L269 - `writtenAt`, how the host knows a plugin was written in a client
  - https://github.com/ahpio/ahpd/blob/02a57e731/.project/plans/plugin/64-an-admin-installs-a-plugin-from-the-ui/plan.md - the host plan, which says the ahpw page is a plan in ahpw
  - https://github.com/ahpio/ahpd/blob/02a57e731/docs/plugins/PLUGINS.md#L19-L37 - the contract a written plugin follows: an `apply` export
  - https://github.com/microsoft/vscode/blob/e646868227c/src/vs/workbench/contrib/extensions/browser/extensions.contribution.ts#L935 - "Install from VSIX..."
  - https://github.com/microsoft/vscode/blob/e646868227c/src/vs/workbench/contrib/extensions/browser/extensions.contribution.ts#L1036 - "Install Extension from Location"
  - https://github.com/microsoft/vscode/blob/e646868227c/src/vs/workbench/contrib/extensions/browser/extensionsActions.ts#L891 - `UninstallAction`, on each extension
  - https://github.com/microsoft/vscode/blob/e646868227c/src/vs/workbench/contrib/extensions/browser/extensionsActions.ts#L957 - `UpdateAction`, on each extension
---

# A plugin is added or written from ahpw

Softov wants an admin to add a plugin and to write a plugin from ahpw, on 2026-11-12.
Today an admin does both from the terminal with `ahpd plugin install`.
ahpd serves every command for it since its plan `plugin/64`, and that plan names the ahpw page as the next plan.
The change gives the Plugins explorer a New plugin form, and gives the plugin page Remove, Update and a Source tab.

## What others do

VS Code is the reference that ahpd maps its features to.

- The Extensions view adds an extension from the marketplace, from a VSIX file, or from a location.
- "Install from VSIX..." and "Install Extension from Location" are commands of the view, beside the search.
- Each extension carries its own Uninstall and Update actions.
- VS Code has no editor that writes an extension in place. A written plugin is ahpd's own feature.

## What ahpw has today

- The Plugins explorer's toolbar has Reload, Apply and Group, at [`code://src/resources/plugins/index.ts`](../../src/resources/plugins/index.ts#L71-L73). It has no New.
- The plugin page has Reimport, and Enable or Disable, at [`code://src/resources/plugins/PluginPage.tsx`](../../src/resources/plugins/PluginPage.tsx#L57-L72).
- An action shows only when the host offers its command, as [`mayToggle`](../../src/resources/plugins/actions.ts#L8-L10) reads `offers.methods`.
- The bridge calls five commands: `enable`, `disable`, `options`, `reload` and `apply`, at [`code://src/bridges/plugins.ts`](../../src/bridges/plugins.ts#L27-L31).
- [`PluginRow`](../../src/bridges/plugins.ts#L81-L104) has a `spec`, a `path` and a `state`. No field says that a plugin was written in a client.
- [`ahp.newConnector`](../../src/resources/connectors/index.ts#L84-L93) opens a new form in a tab. A New plugin form is the second instance of that shape.
- [`CodeEditor`](../../src/resources/editor/CodeEditor.tsx#L15-L30) is a CodeMirror editor with TypeScript and JSON, and saves on Mod-s.

## What ahpd serves

Every command needs the grant `plugin:install`, and only `admin` holds it.
Each one runs in the host's one-at-a-time turn, and the plugins channel sends the new row.

| Command | Takes | Answers |
| --- | --- | --- |
| `x-ahpd/plugins/install` | `source`: a package name, a path, a tarball URL, `github:<owner>/<repo>` or a `git+ssh:` spec | `{ id }`, and `restart: true` when a plugin with a port or a URI scheme is in the way |
| `x-ahpd/plugins/write` | `id`, a slug; `source`, the text of `index.ts`; `packageJson`, an object or its text | `{ id }` |
| `x-ahpd/plugins/source` | `id` of a written plugin | `{ id, source, packageJson }`; a refusal for any other plugin |
| `x-ahpd/plugins/remove` | `id`, and `keep` to leave the package or the written folder | `{ id }`, and whether a restart is needed |
| `x-ahpd/plugins/update` | `id` of a plugin npm installed | `{ id, from, to }`, or `{ id }` when nothing moved |

- An install runs npm, and npm can take minutes. The answer comes after the plugin is loaded.
- A write stages the folder and swaps it in only when npm succeeds. A failed write leaves the running plugin as it was.
- A refusal from npm carries npm's own message.
- `writtenAt` knows a written plugin by its folder under `<plugin root>/plugins/`. The row does not carry that fact.

## Who writes

- No pull request of ahpw is open.
- No branch of ahpw that is not merged changes `src/resources/plugins`, `src/bridges/plugins.ts` or the catalogs.
- The brief [a-plugin-shows-what-it-made](a-plugin-shows-what-it-made.md) changes the plugin page's *Provides* list, not its actions. Both add to `PluginPage.tsx`, so the second plan rebases on the first.
- The brief [styles-live-beside-their-component](styles-live-beside-their-component.md) moves styles by area. New plugin styles go beside their component from the start.
- The ahpw plan `plugins/20261112-0221-a-record-draws-the-operations-it-offers` draws record buttons from the host's operations list. Plugin rows carry no operations list today.

## The change

The mockup is `.scratch/mockups/mock-plugins-<theme>-<width>.png`, in light and dark, at 1400 and 390 px. Softov chose each layout choice on 2026-11-12, as the mockup draws it.

- The Plugins explorer gets a New plugin action, `+`, first in its toolbar. It shows when the host offers `x-ahpd/plugins/install` or `x-ahpd/plugins/write`.
- New plugin opens one form in a tab. Its *How* choice picks "Add from a source" or "Write one", as the agent form's *Start from* does. Softov chose one form over two toolbar actions.
- Add takes one source field, and sends `x-ahpd/plugins/install`. The button says "Adding…" with a spinner and a note while npm runs.
- Write takes an id, the text of `index.ts` and the `package.json`, in `CodeEditor`, and sends `x-ahpd/plugins/write`.
- A finished add or write opens the new plugin's page, as a made connector does. A refusal shows the host's message in an alert, and the form keeps what was typed.
- The plugin page gets Update beside Reimport and Disable.
- Remove is a danger zone at the bottom of the Options tab, with "Keep the package installed", as Delete is on a connector's Settings tab. Softov chose this over a button in the page actions.
- A written plugin's page gets a Source tab. It reads `x-ahpd/plugins/source` into two editors, and Save sends `x-ahpd/plugins/write`. Softov chose a tab over an Edit button that opens the form.
- An answer with `restart: true` shows the restart note the page already has.

## Open points

- ahpw must know which plugin is written, to show the Source tab. The row does not say it.
- ahpw does not infer it from a path. ahpd can add a field to the row, or an operations list as tunnels have.
- Update fits only a plugin that npm installed. The row does not say which plugins those are.
- The text a new written plugin starts with is not decided. ahpd's docs give the contract, an `apply` export, and the host sends no template. The mockup's starter text is a proposal.
- Not checked: whether the host offers `install` to a reader without `plugin:install`. The agent page shows Check and Remove to a reader without their grant, so offers may not follow grants.

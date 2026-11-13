import { createElement } from 'react';
import type { BindingPath, Command, CommandContext, Disposable, HostCtx, ListSpec, PickerAction, Scena } from '@softov/scena/types';
import { combineDisposables, translate } from '@softov/scena';
import { getActiveToken } from '@softov/scena/ui';
import type { MessageAttachment, SessionConfigPropertySchema, SessionSummary } from '@microsoft/agent-host-protocol';
import { ahpPaths } from '../../bridges/data.js';
import { plural } from '../../i18n/locales.js';
import { chatAttachment, clipboardImage, fromFiles } from './attachments.js';
import { EMOJIcon } from '../emojis.js';
import type { CustomAgent } from './custom-agents.js';
import { pullRequestFacts, pullRequestName, STATE_COLOR, type PullRequest } from './pull-requests.js';
import { PullRequestCard } from './PullRequests.js';
import { ARTIFACT_ICON, ARTIFACT_TYPES, artifactName, copyOf, openOf, relativeOf, type Artifact } from './artifact-list.js';
import { downloadFile } from '../folders/actions.js';
import { failed } from '../../shell/notify/index.js';
import { copyText } from '../../shell/controls/CopyButton.js';

/** The slot the composer's `/` commands are offered in. */
export const COMPOSER_SLOT = 'ahp:input/';

/** The slot the new session box's `/` commands are offered in: the chosen agent's skills and commands, its agent, model and settings, and Add context. */
export const NEW_SLOT = 'ahp:new/';

/** A model the agent offers. */
export interface ModelChoice {
  id: string;
  name: string;
}

/** A session setting the host lets change while the session runs. */
export interface Option {
  key: string;
  schema: SessionConfigPropertySchema;
  value: unknown;
}

/** What a composer lets its commands read and do. */
export interface ComposerApi {
  models(): ModelChoice[];
  model(): string | undefined;
  setModel(id: string | undefined): void;
  /** The harness's custom agents, which the Agent picker lists. */
  customAgents(): CustomAgent[];
  /** The custom agent the next message names; none is the harness's default. */
  customAgent(): string | undefined;
  setCustomAgent(uri: string | undefined): void;
  /** The harness this composer's session runs on. */
  provider(): string;
  options(): Option[];
  setOption(key: string, value: unknown): void;
  running(): boolean;
  stop(): void;
  /** The session this composer writes to. */
  session(): string;
  /** The host of that session, or of the session New session will make. */
  host(): string;
  attach(attachment: MessageAttachment): void;
  /** Write a picker's prefix at the caret, which opens that picker. */
  type(prefix: '@' | '/'): void;
  /** Ask the browser for files to send with the message. */
  upload(): void;
  /** The session's changed files, to attach from Add context; none before a session exists. */
  changed(): ChangedFile[];
  /** Shows the session's info in place of its chat, or the chat again; absent where the page has no info. */
  toggleInfo?(): void;
  /** The session's GitHub pull requests, which `/session.pr` lists; absent before a session exists. */
  pullRequests?(): PullRequest[];
  /** The session's artifacts, which `/session.artifacts` lists, newest first; absent before a session exists. */
  artifacts?(): Artifact[];
  /** The session's references, which `/session.references` lists, newest first. */
  references?(): Artifact[];
  /** The session's folder, which a file's relative path is counted from. */
  folder?(): string | undefined;
  /** Whether the host removes a recorded artifact, so a recorded pull request offers *Remove*. */
  removesArtifacts?(): boolean;
  /** Remove the artifact `artifactId` from the session; `name` says which in a failure. */
  removeArtifact?(artifactId: string, name?: string): void;
}

/** A file the session changed, as Add context lists it. */
export interface ChangedFile {
  title: string;
  description: string;
  attachment: MessageAttachment;
}

/** The data context a composer's picker runs its commands under: one per host and chat. */
export const composerPath = (host: string, chatUri: string): BindingPath => `$/ahp/composers/${encodeURIComponent(host)}/${encodeURIComponent(chatUri)}` as BindingPath;

const composers = new Map<string, ComposerApi>();

/** Make a composer reachable by its commands until the returned function is called. */
export function attachComposer(path: BindingPath, api: ComposerApi): () => void {
  composers.set(path, api);
  return () => {
    if (composers.get(path) === api) composers.delete(path);
  };
}

const apiOf = (ctx: CommandContext): ComposerApi | undefined => (ctx.dataContext === undefined ? undefined : composers.get(ctx.dataContext));

/** The composer at `path`, for a control of the composer that is not a command, as its `+`. */
export const composerAt = (path: BindingPath): ComposerApi | undefined => composers.get(path);

/**
 * The text after Add context types `@` or `/` at the caret. An `@` or `/` word
 * already at the caret is replaced, as a pill's command replaces it, so
 * choosing twice leaves one trigger; `/` goes at the start of an empty box.
 */
export function typeTrigger(text: string, caret: number, prefix: '@' | '/'): { text: string; caret: number } {
  const open = getActiveToken(text, ['/', '@'], caret);
  if (open !== null) return { text: `${text.slice(0, open.start)}${prefix}${text.slice(open.end)}`, caret: open.start + 1 };
  const before = text.slice(0, caret);
  if (prefix === '/' && before.trim() === '') return { text: `/${text.slice(caret)}`, caret: 1 };
  const lead = before === '' || /\s$/.test(before) ? '' : ' ';
  return { text: `${before}${lead}${prefix}${text.slice(caret)}`, caret: before.length + lead.length + 1 };
}

/**
 * Add context's items, for the `+` and `/attach` alike: the host's files, an
 * upload, the clipboard's image, another session, the commands, then the files
 * this session changed. `image` is the clipboard's image, or why there is none.
 */
export function contextItems(api: ComposerApi, sessions: readonly SessionSummary[], image: File | string): PickerAction[] {
  const close = (then: () => void) => (host: { closeMenu(): void }) => {
    host.closeMenu();
    then();
  };
  const others = sessions.filter((one) => one.resource !== api.session() && one.defaultChat !== undefined);
  return [
    { title: `${EMOJIcon.file} ${translate('sessions/context/files')}`, description: translate('sessions/context/filesHint'), onSelect: close(() => api.type('@')) },
    { title: `${EMOJIcon.attach} ${translate('sessions/context/upload')}`, description: translate('sessions/context/uploadHint'), onSelect: close(() => api.upload()) },
    typeof image === 'string'
      ? { title: `${EMOJIcon.image} ${translate('sessions/context/image')}`, description: image, disabled: true, onSelect: () => undefined }
      : {
        title: `${EMOJIcon.image} ${translate('sessions/context/image')}`,
        description: translate('sessions/context/imageHint'),
        onSelect: close(() => void fromFiles([image]).then((got) => got.attached.forEach((one) => api.attach(one)))),
      },
    {
      title: `${EMOJIcon.sessions} ${translate('sessions/context/sessions')}`,
      description: translate(others.length === 0 ? 'sessions/context/noSessions' : 'sessions/context/sessionsHint'),
      disabled: others.length === 0,
      onSelect: (host) => host.pushList({
        title: translate('sessions/context/sessions'),
        items: others.map((one) => ({
          title: one.title === '' ? translate('sessions/untitled') : one.title,
          onSelect: close(() => api.attach(chatAttachment(one))),
        })),
      }),
    },
    { title: `${EMOJIcon.terminal} ${translate('sessions/context/commands')}`, description: translate('sessions/context/commandsHint'), onSelect: close(() => api.type('/')) },
    ...api.changed().map((one) => ({ title: one.title, description: one.description, group: 'changed', onSelect: close(() => api.attach(one.attachment)) })),
  ];
}

/** Commands every open composer shares, counted so the last one to go takes them away. */
const shared = new Map<string, { count: number; registration: Disposable }>();

function share(scena: Scena, command: Command): Disposable {
  const held = shared.get(command.id);
  if (held !== undefined) held.count += 1;
  else shared.set(command.id, { count: 1, registration: scena.commands.register(command) });
  let done = false;
  return {
    dispose() {
      if (done) return;
      done = true;
      const entry = shared.get(command.id);
      if (entry === undefined) return;
      entry.count -= 1;
      if (entry.count > 0) return;
      shared.delete(command.id);
      entry.registration.dispose();
    },
  };
}

/** `Approval Mode` as `/approval-mode`. */
export const slashOf = (title: string): string => `/${title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

/** A value as a short phrase: a list by its items or its count, an object by what it holds. */
export function valueWords(value: unknown): string {
  if (value === undefined || value === null) return translate('sessions/values/default');
  if (Array.isArray(value)) {
    if (value.length === 0) return translate('sessions/values/none');
    return value.length <= 2 && value.every((one) => typeof one === 'string') ? value.join(', ') : plural('sessions/values/items', value.length);
  }
  if (typeof value === 'object') {
    const held = Object.entries(value as Record<string, unknown>).filter(([, one]) => one !== undefined && !(Array.isArray(one) && one.length === 0));
    return held.length === 0 ? translate('sessions/values/none') : held.map(([key, one]) => `${key} ${valueWords(one)}`).join(', ');
  }
  return String(value);
}

/** A setting's value as a person reads it: its enum label, or the value. */
export function optionLabel(option: Option): string {
  const { schema, value } = option;
  const current = value ?? schema.default;
  if (schema.type === 'boolean') return translate(current === true ? 'sessions/values/on' : 'sessions/values/off');
  const index = schema.enum?.findIndex((one) => one === current) ?? -1;
  if (index >= 0) return schema.enumLabels?.[index] ?? String(current);
  return valueWords(current);
}

/** Whether a setting can be changed from the picker: a choice or a switch. */
export const pickable = (schema: SessionConfigPropertySchema): boolean => schema.type === 'boolean' || (schema.enum?.length ?? 0) > 0;

/** Whether a setting gets a pill: one that holds nothing and cannot be changed has nothing to show. */
export const showsPill = (option: Option): boolean => pickable(option.schema) || optionLabel(option) !== translate('sessions/values/none');

/** The command id behind a setting's pill and its `/` shortcut. */
export const optionCommandId = (key: string): string => `ahp.composer.option.${key}`;

function optionCommand(key: string, schema: SessionConfigPropertySchema): Command {
  const shortcut = slashOf(schema.title || key);
  return {
    id: optionCommandId(key),
    title: schema.title || key,
    ...(schema.description === undefined ? {} : { description: schema.description }),
    category: 'Settings',
    shortcut,
    slots: [COMPOSER_SLOT, NEW_SLOT],
    // Shared by key: a composer whose agent has no such setting lists it greyed.
    disabled: (ctx) => apiOf(ctx)?.options().some((one) => one.key === key) !== true,
    run: (ctx) => {
      const api = apiOf(ctx);
      const option = api?.options().find((one) => one.key === key);
      if (api === undefined || option === undefined) return;
      if (option.schema.type === 'boolean') {
        api.setOption(key, !(option.value ?? option.schema.default ?? false));
        ctx.host?.closeMenu();
        return;
      }
      const current = option.value ?? option.schema.default;
      const items: PickerAction[] = (option.schema.enum ?? []).map((value, index) => ({
        title: option.schema.enumLabels?.[index] ?? String(value),
        ...(option.schema.enumDescriptions?.[index] === undefined ? {} : { description: option.schema.enumDescriptions[index] }),
        active: value === current,
        onSelect: (host) => {
          api.setOption(key, value);
          host.closeMenu();
        },
      }));
      ctx.host?.pushList({ title: option.schema.title || key, items, sentinel: shortcut });
    },
  };
}

/** One command per setting the composer offers, for as long as the returned registration lives. */
export function registerOptionCommands(scena: Scena, options: readonly Option[]): Disposable {
  return combineDisposables(...options.filter((option) => pickable(option.schema)).map((option) => share(scena, optionCommand(option.key, option.schema))));
}

/** The command behind the Agent pill and `/agent`: the custom agent the next message names. */
export const CUSTOM_AGENT_COMMAND = 'ahp.composer.agent';

/** The command behind the pull request pill and `/session.pr`: open, copy or remove a pull request. */
export const PULL_REQUESTS_COMMAND = 'ahp.composer.pullRequests';

/** One row per pull request, its glyph in the colour of the state the host sent. */
export function pullRequestRows(pullRequests: readonly PullRequest[], open: (host: HostCtx, pullRequest: PullRequest) => void): PickerAction[] {
  return pullRequests.map((pullRequest) => ({
    title: pullRequestName(pullRequest),
    description: pullRequestFacts(pullRequest),
    icon: EMOJIcon.pullRequest,
    ...(pullRequest.state === undefined ? {} : { color: STATE_COLOR[pullRequest.state] }),
    onSelect: (host: HostCtx) => open(host, pullRequest),
  }));
}

/** The picker entries of one pull request: open it, copy its URL, and remove it when an artifact records it and the host allows. */
export function pullRequestItems(pullRequest: PullRequest, removes: boolean, remove: (artifactId: string) => void): PickerAction[] {
  const close = (host: HostCtx): void => host.closeMenu();
  const artifactId = pullRequest.artifactId;
  return [
    {
      title: translate('sessions/pullRequests/openOnGitHub'),
      description: pullRequest.repository,
      onSelect: (host) => { close(host); window.open(pullRequest.url, '_blank', 'noopener,noreferrer'); },
    },
    { title: translate('sessions/pullRequests/copyUrl'), description: pullRequest.url, onSelect: (host) => { close(host); void copyText(pullRequest.url); } },
    ...(removes && artifactId !== undefined
      ? [{ title: translate('sessions/pullRequests/remove'), description: translate('sessions/pullRequests/removeHint'), onSelect: (host: HostCtx) => { close(host); remove(artifactId); } }]
      : []),
  ];
}

/** The commands behind the Artifacts and References pills, and `/session.artifacts` and `/session.references`. */
export const ARTIFACTS_COMMAND = 'ahp.composer.artifacts';
export const REFERENCES_COMMAND = 'ahp.composer.references';

/**
 * One row per entry, under its type's section in VS Code's order, newest
 * first; choosing one opens what can be done with it.
 */
export function artifactRows(entries: readonly Artifact[], open: (host: HostCtx, artifact: Artifact) => void): PickerAction[] {
  return entries.map((artifact) => ({
    title: artifactName(artifact),
    description: artifact.link ?? artifact.uri ?? artifact.commitHash ?? '',
    icon: ARTIFACT_ICON[artifact.type],
    group: translate(`sessions/artifacts/types/${artifact.type}`),
    onSelect: (host: HostCtx) => open(host, artifact),
  }));
}

/** The section labels in VS Code's order, for the picker's `groupOrder`. */
const artifactGroupOrder = (): string[] => ARTIFACT_TYPES.map((type) => translate(`sessions/artifacts/types/${type}`));

/**
 * The picker entries of one artifact or reference: open it, copy what it
 * points at, copy a file's path from the session's folder and download it,
 * and remove it when the host allows.
 */
export function artifactItems(artifact: Artifact, at: { host: string; folder: string | undefined; removes: boolean; remove: (artifactId: string, name: string) => void; run: (command: string, args: unknown) => void }): PickerAction[] {
  const close = (host: HostCtx): void => host.closeMenu();
  const target = openOf(artifact);
  const copy = copyOf(artifact);
  const relative = relativeOf(artifact, at.folder);
  const kind = artifact.isArtifact ? 'artifacts' : 'references';
  return [
    ...(target.kind === 'web' ? [{ title: translate('sessions/artifacts/openTab'), description: target.url, onSelect: (host: HostCtx) => { close(host); window.open(target.url, '_blank', 'noopener,noreferrer'); } }] : []),
    ...(target.kind === 'file' ? [{ title: translate('sessions/artifacts/openFile'), description: artifactName(artifact), onSelect: (host: HostCtx) => { close(host); at.run('ahp.openFile', { host: at.host, uri: target.uri }); } }] : []),
    ...(copy === undefined ? [] : [{ title: copy.label, description: copy.text, onSelect: (host: HostCtx) => { close(host); void copyText(copy.text); } }]),
    ...(relative === undefined ? [] : [{ title: translate('sessions/artifacts/copyRelativePath'), description: relative, onSelect: (host: HostCtx) => { close(host); void copyText(relative); } }]),
    ...(target.kind === 'file'
      ? [{
          title: translate('sessions/artifacts/download'),
          description: artifactName(artifact),
          onSelect: (host: HostCtx) => {
            close(host);
            downloadFile(at.host, target.uri).catch((error: unknown) => failed(translate('sessions/artifacts/downloadFailed', { name: artifactName(artifact) }), error));
          },
        }]
      : []),
    ...(at.removes
      ? [{ title: translate(`sessions/${kind}/remove`, { name: artifactName(artifact) }), onSelect: (host: HostCtx) => { close(host); at.remove(artifact.id, artifactName(artifact)); } }]
      : []),
  ];
}

/** The command that lists a session's artifacts or its references. */
function artifactsCommand(scena: Scena, kind: 'artifacts' | 'references'): Disposable {
  const id = kind === 'artifacts' ? ARTIFACTS_COMMAND : REFERENCES_COMMAND;
  const shortcut = `/session.${kind}`;
  return share(scena, {
    id,
    title: () => translate(`sessions/${kind}/title`),
    description: () => translate(`sessions/${kind}/hint`),
    category: 'Session',
    shortcut,
    slots: [COMPOSER_SLOT],
    disabled: (ctx) => (apiOf(ctx)?.[kind]?.().length ?? 0) === 0,
    run: (ctx) => {
      const api = apiOf(ctx);
      if (api === undefined) return;
      const at = {
        host: api.host(),
        folder: api.folder?.(),
        removes: api.removesArtifacts?.() ?? false,
        remove: (artifactId: string, name: string): void => api.removeArtifact?.(artifactId, name),
        run: (command: string, args: unknown): void => { void ctx.scena.commands.execute(command, args); },
      };
      ctx.host?.pushList({
        title: translate(`sessions/${kind}/title`),
        sentinel: shortcut,
        groupOrder: artifactGroupOrder(),
        items: artifactRows(api[kind]?.() ?? [], (host, artifact) => host.pushList({
          title: artifactName(artifact),
          sentinel: shortcut,
          items: artifactItems(artifact, at),
        })),
      });
    },
  });
}

/** The commands every composer has: the model, the custom agent, stopping a turn, and a new session. */
export function registerComposerCommands(scena: Scena): Disposable {
  return combineDisposables(
    share(scena, {
      id: 'ahp.composer.model',
      title: () => translate('sessions/commands/model'),
      description: () => translate('sessions/commands/modelHint'),
      category: 'Settings',
      shortcut: '/model',
      slots: [COMPOSER_SLOT, NEW_SLOT],
      disabled: (ctx) => (apiOf(ctx)?.models().length ?? 0) === 0,
      run: (ctx) => {
        const api = apiOf(ctx);
        if (api === undefined) return;
        const current = api.model();
        const pick = (id: string | undefined) => (host: { closeMenu(): void }) => {
          api.setModel(id);
          host.closeMenu();
        };
        ctx.host?.pushList({
          title: translate('sessions/commands/model'),
          sentinel: '/model',
          items: [
            { title: translate('sessions/commands/agentDefault'), active: current === undefined, onSelect: pick(undefined) },
            ...api.models().map((model) => ({ title: model.name, description: model.id, active: model.id === current, onSelect: pick(model.id) })),
          ],
        });
      },
    }),
    share(scena, {
      id: CUSTOM_AGENT_COMMAND,
      title: () => translate('sessions/commands/agent'),
      description: () => translate('sessions/commands/agentHint'),
      category: 'Settings',
      shortcut: '/agent',
      slots: [COMPOSER_SLOT, NEW_SLOT],
      disabled: (ctx) => (apiOf(ctx)?.customAgents().length ?? 0) === 0,
      run: (ctx) => {
        const api = apiOf(ctx);
        if (api === undefined) return;
        const current = api.customAgent();
        const pick = (uri: string | undefined) => (host: { closeMenu(): void }) => {
          api.setCustomAgent(uri);
          host.closeMenu();
        };
        ctx.host?.pushList({
          title: translate('sessions/commands/agent'),
          sentinel: '/agent',
          items: [
            { title: translate('sessions/commands/agent'), description: translate('sessions/commands/agentDefaultHint'), active: current === undefined, onSelect: pick(undefined) },
            ...api.customAgents().map((one) => ({ title: one.name, ...(one.description === undefined ? {} : { description: one.description }), active: one.uri === current, onSelect: pick(one.uri) })),
            {
              title: translate('sessions/commands/configureAgents'),
              group: 'configure',
              onSelect: (host: { closeMenu(): void }) => {
                host.closeMenu();
                void ctx.scena.commands.execute('ahp.openAgent', { host: api.host(), provider: api.provider(), section: 'customizations' });
              },
            },
          ],
        });
      },
    }),
    share(scena, {
      id: 'ahp.composer.attach',
      title: () => translate('sessions/context/title'),
      description: () => translate('sessions/context/hint'),
      category: 'Session',
      shortcut: '/attach',
      slots: [COMPOSER_SLOT, NEW_SLOT],
      run: async (ctx) => {
        const api = apiOf(ctx);
        if (api === undefined) return;
        const image = await clipboardImage();
        ctx.host?.pushList({ title: translate('sessions/context/title'), sentinel: '/attach', items: contextItems(api, ctx.store.get<SessionSummary[]>(ahpPaths(api.host()).sessions) ?? [], image) });
      },
    }),
    share(scena, {
      id: 'ahp.composer.stop',
      title: () => translate('sessions/commands/stop'),
      description: () => translate('sessions/commands/stopHint'),
      category: 'Session',
      shortcut: '/stop',
      slots: [COMPOSER_SLOT],
      disabled: (ctx) => apiOf(ctx)?.running() !== true,
      run: (ctx) => {
        apiOf(ctx)?.stop();
        ctx.host?.closeMenu();
      },
    }),
    share(scena, {
      id: 'ahp.composer.info',
      title: () => translate('sessions/commands/info'),
      description: () => translate('sessions/commands/infoHint'),
      category: 'Session',
      shortcut: '/session.info',
      slots: [COMPOSER_SLOT],
      disabled: (ctx) => apiOf(ctx)?.toggleInfo === undefined,
      run: (ctx) => {
        ctx.host?.closeMenu();
        apiOf(ctx)?.toggleInfo?.();
      },
    }),
    share(scena, {
      id: PULL_REQUESTS_COMMAND,
      title: () => translate('sessions/pullRequests/title'),
      description: () => translate('sessions/pullRequests/hint'),
      category: 'Session',
      shortcut: '/session.pr',
      slots: [COMPOSER_SLOT],
      disabled: (ctx) => (apiOf(ctx)?.pullRequests?.().length ?? 0) === 0,
      run: (ctx) => {
        const api = apiOf(ctx);
        const pullRequests = api?.pullRequests?.() ?? [];
        const removes = api?.removesArtifacts?.() ?? false;
        const remove = (artifactId: string): void => api?.removeArtifact?.(artifactId);
        const listOf = (pullRequest: PullRequest): ListSpec => ({
          title: translate('sessions/pullRequests/title'),
          sentinel: '/session.pr',
          layout: 'header-list',
          header: () => createElement(PullRequestCard, { pullRequest }),
          items: pullRequestItems(pullRequest, removes, remove),
        });
        const [only] = pullRequests;
        if (pullRequests.length === 1 && only !== undefined) {
          ctx.host?.pushList(listOf(only));
          return;
        }
        ctx.host?.pushList({
          title: translate('sessions/pullRequests/title'),
          sentinel: '/session.pr',
          items: pullRequestRows(pullRequests, (host, pullRequest) => host.pushList(listOf(pullRequest))),
        });
      },
    }),
    artifactsCommand(scena, 'artifacts'),
    artifactsCommand(scena, 'references'),
    share(scena, {
      id: 'ahp.composer.changes',
      title: () => translate('sessions/commands/changes'),
      description: () => translate('sessions/commands/changesHint'),
      category: 'Session',
      shortcut: '/session.changes',
      slots: [COMPOSER_SLOT],
      run: (ctx) => {
        ctx.host?.closeMenu();
        void ctx.scena.commands.execute('ahp.showRight.changes:explorer');
      },
    }),
    share(scena, {
      id: 'ahp.composer.new',
      title: () => translate('sessions/commands/newSession'),
      description: () => translate('sessions/commands/newSessionHint'),
      category: 'Session',
      shortcut: '/new',
      slots: [COMPOSER_SLOT],
      run: (ctx) => {
        ctx.host?.closeMenu();
        void ctx.scena.commands.execute('ahp.newSession');
      },
    }),
  );
}

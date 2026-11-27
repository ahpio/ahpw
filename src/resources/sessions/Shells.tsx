import { useEffect, useRef, type ReactElement } from 'react';
import { translate } from '@softov/scena';
import { useI18n } from '@softov/scena/react';
import type { TerminalState } from '@microsoft/agent-host-protocol';
import { hostBridge } from '../../bridges/data.js';
import { useChannel } from '../../bridges/channel.js';
import { plural } from '../../i18n/locales.js';
import { done, failed } from '../../shell/notify/index.js';
import { foldTerminal, joinParts } from '../terminals/terminal.js';
import { EMOJIcon } from '../emojis.js';
import { Block } from './Parts.js';
import { DetailList, Pill } from '../../ui/index.js';
import { statusOf, type Shell } from './shell-list.js';
import { stripAnsi } from './tool.js';
import { when } from './turn.js';
import './shells.css';

/** The composer pill that counts a chat's background shells and opens their list. */
export function ShellsPill({ count, onOpen }: { count: number; onOpen: () => void }): ReactElement {
  const { t } = useI18n();
  return <Pill label={`${EMOJIcon.terminal} ${plural('sessions/shells/count', count)}`} title={t('sessions/shells/hint')} menu onClick={onOpen} />;
}

/** How close to the end, in pixels, the output counts as followed. */
const FOLLOW_SLACK = 24;

/**
 * A shell's output, kept on its newest lines as a terminal is, until the
 * person scrolls up to read older ones.
 */
function ShellOutput({ title, text }: { title: string; text: string }): ReactElement {
  const box = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  useEffect(() => {
    const pre = box.current?.querySelector('pre');
    if (pre !== null && pre !== undefined && following.current) pre.scrollTop = pre.scrollHeight;
  }, [text]);
  return (
    <div
      ref={box}
      onScrollCapture={(event) => {
        const pre = event.target as HTMLElement;
        following.current = pre.scrollHeight - pre.scrollTop - pre.clientHeight < FOLLOW_SLACK;
      }}
    >
      <Block title={title} text={text} />
    </div>
  );
}

/** The command, status and output of one shell, live, as the head of its picker list. */
export function ShellCard({ host, shell }: { host: string; shell: Shell }): ReactElement {
  const { t } = useI18n();
  const { state } = useChannel<TerminalState>(host, shell.terminal, foldTerminal);
  const status = statusOf(state);
  const output = state === undefined ? undefined : stripAnsi(joinParts(state.content));
  return (
    <div className="web-shells__details">
      <DetailList inline>
        <dt>{t('sessions/shells/command')}</dt>
        <dd><code>{shell.command}</code></dd>
        {status === undefined ? null : (
          <>
            <dt>{t('sessions/shells/status')}</dt>
            <dd>
              {status.kind === 'running'
                ? t('sessions/shells/running')
                : status.exitCode === undefined ? t('sessions/shells/exited') : t('sessions/shells/exitedWith', { code: status.exitCode })}
            </dd>
          </>
        )}
        {shell.startedAt === undefined ? null : (
          <>
            <dt>{t('sessions/shells/started')}</dt>
            <dd>{when(shell.startedAt)}</dd>
          </>
        )}
      </DetailList>
      {output === undefined || output === '' ? null : <ShellOutput title={t('sessions/shells/output')} text={output} />}
    </div>
  );
}

/** Asks the host to stop a shell of the chat `chatUri`; a toast says how it went. */
export async function stopShell(host: string, chatUri: string, shell: Shell): Promise<void> {
  try {
    const answer = await hostBridge(host).request('vscode/stopBackgroundWork' as never, { chat: chatUri, id: shell.id } as never) as { stopped?: unknown } | undefined;
    done(answer?.stopped === true ? translate('sessions/shells/stopped', { name: shell.name }) : translate('sessions/shells/finished', { name: shell.name }));
  } catch (error) {
    failed(translate('sessions/shells/stopFailed', { name: shell.name }), error);
  }
}

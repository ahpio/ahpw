import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useI18n, useScena } from '@softov/scena/react';
import { Button } from '@softov/scena/ui';
import type { TerminalState } from '@microsoft/agent-host-protocol';
import { hostBridge } from '../../bridges/data.js';
import { useChannel } from '../../bridges/channel.js';
import { elapsed } from '../../bridges/words.js';
import { plural } from '../../i18n/locales.js';
import { done, failed } from '../../shell/notify/index.js';
import { foldTerminal, joinParts } from '../terminals/terminal.js';
import { EMOJIcon } from '../emojis.js';
import { useNow } from './clock.js';
import { Block } from './Parts.js';
import { Pill } from './pills.js';
import { statusOf, type Shell } from './shell-list.js';
import { stripAnsi } from './tool.js';
import { when } from './turn.js';

/** The composer pill that counts a chat's background shells and opens their list. */
export function ShellsPill({ count, onToggle }: { count: number; onToggle: () => void }): ReactElement {
  const { t } = useI18n();
  return <Pill label={`${EMOJIcon.terminal} ${plural('sessions/shells/count', count)}`} title={t('sessions/shells/hint')} onOpen={onToggle} />;
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

/** The command, status, output and actions of one open shell. */
function ShellDetails({ host, shell, stopping, onStop }: { host: string; shell: Shell; stopping: boolean; onStop: () => void }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const { state } = useChannel<TerminalState>(host, shell.terminal, foldTerminal);
  const status = statusOf(state);
  const output = state === undefined ? undefined : stripAnsi(joinParts(state.content));
  return (
    <div className="web-shells__details">
      <dl className="web-tool__facts">
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
      </dl>
      {output === undefined || output === '' ? null : <ShellOutput title={t('sessions/shells/output')} text={output} />}
      {shell.terminal === undefined && !shell.canStop ? null : (
        <div className="web-shells__actions">
          {shell.terminal === undefined ? null : (
            <button type="button" className="web-link" onClick={() => void scena.commands.execute('ahp.openTerminal', { uri: shell.terminal })}>
              {t('sessions/shells/openTerminal')}
            </button>
          )}
          {shell.canStop ? <Button label={`${EMOJIcon.stop} ${t('sessions/shells/stop')}`} variant="danger" size="sm" disabled={stopping} onClick={onStop} /> : null}
        </div>
      )}
    </div>
  );
}

/**
 * The list of a chat's background shells, above the composer box.
 *
 * One entry is open at a time. A stopped shell keeps its button off until the
 * host removes its row; a stop that fails turns the button on again.
 */
export function ShellsList({ host, chatUri, shells }: { host: string; chatUri: string; shells: readonly Shell[] }): ReactElement {
  const { t } = useI18n();
  const now = useNow(true);
  const [opened, setOpened] = useState<string | undefined>(undefined);
  const [stopping, setStopping] = useState<ReadonlySet<string>>(() => new Set());

  const stop = async (shell: Shell): Promise<void> => {
    setStopping((held) => new Set(held).add(shell.id));
    try {
      const answer = await hostBridge(host).request('vscode/stopBackgroundWork' as never, { chat: chatUri, id: shell.id } as never) as { stopped?: unknown } | undefined;
      done(answer?.stopped === true ? t('sessions/shells/stopped', { name: shell.name }) : t('sessions/shells/finished', { name: shell.name }));
    } catch (error) {
      failed(t('sessions/shells/stopFailed', { name: shell.name }), error);
      setStopping((held) => {
        const next = new Set(held);
        next.delete(shell.id);
        return next;
      });
    }
  };

  return (
    <section className="web-shells" aria-label={t('sessions/shells/title')}>
      <h4 className="web-shells__title">{t('sessions/shells/title')}</h4>
      <ul className="web-shells__list">
        {shells.map((shell) => {
          const open = opened === shell.id;
          return (
            <li key={shell.id} className="web-shells__entry">
              <button type="button" className="web-shells__row" aria-expanded={open} onClick={() => setOpened(open ? undefined : shell.id)}>
                <span aria-hidden="true">{open ? EMOJIcon.caretDown : EMOJIcon.caretRight}</span>
                <span className="web-shells__name">{shell.name}</span>
                {shell.startedAt === undefined ? null : <span className="web-shells__time">{elapsed(now - shell.startedAt)}</span>}
              </button>
              {open ? <ShellDetails host={host} shell={shell} stopping={stopping.has(shell.id)} onStop={() => void stop(shell)} /> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

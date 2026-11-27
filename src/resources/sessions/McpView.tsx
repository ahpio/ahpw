import { useMemo, useState, type MouseEvent, type ReactElement } from 'react';
import type { StateAction } from '@microsoft/agent-host-protocol';
import { useI18n, useScena } from '@softov/scena/react';
import { Button, CheckBox, ContextMenu, ItemRow, Note, Section, StatusDot, TextField } from '../../ui/index.js';
import type { PickerAction } from '@softov/scena/types';
import { hostBridge } from '../../bridges/data.js';
import { copyText } from '../../ui/control/CopyButton.js';
import { EMOJIcon } from '../emojis.js';
import { useActiveSession } from './active.js';
import { offWord, onAt, SCOPES, searchRows, serverGroups, withDecision, type ServerRow, type Scope } from './tooling.js';
import './tooling.css';

/** A row's dot, in its state's tone, with its state as the tooltip. */
function Mark({ row }: { row: ServerRow }): ReactElement | null {
  if (row.state === undefined) return null;
  return <StatusDot tone={row.state.tone === 'busy' ? 'info' : row.state.tone} title={row.state.text} />;
}

/** The focused session's MCP servers, by source. Each has a switch for this session, Start when it is on and stopped, and a menu: restart or stop, on or off at each scope, its file, and its id. */
export default function McpView(): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const { host, summary, session } = useActiveSession();
  const [query, setQuery] = useState('');
  const [menu, setMenu] = useState<{ x: number; y: number; items: PickerAction[] } | null>(null);
  const all = useMemo(() => serverGroups(session?.customizations), [session?.customizations]);
  if (summary === undefined) return <Note inset>{t('sessions/tooling/noSession')}</Note>;
  const folder = summary.workingDirectories?.[0];
  const say = (action: Record<string, unknown>): void => hostBridge(host).dispatch(summary.resource, action as unknown as StateAction);
  const decide = (row: ServerRow, scope: Scope, enabled: boolean): void => say({ type: 'session/customizationToggled', id: row.id, enablement: withDecision(row.enablement, scope, enabled, folder) });
  const start = (row: ServerRow): void => say({ type: 'session/mcpServerStartRequested', id: row.id });
  const stop = (row: ServerRow): void => say({ type: 'session/mcpServerStopRequested', id: row.id });
  const running = (row: ServerRow): boolean => row.lifecycle !== 'stopped' && row.lifecycle !== 'error';
  const items = (row: ServerRow): PickerAction[] => {
    const lifecycle = t('sessions/tooling/menu/server');
    const switches = t('sessions/tooling/menu/switch');
    const more = t('sessions/tooling/menu/more');
    return [
      { title: t(running(row) ? 'sessions/tooling/menu/restart' : 'sessions/tooling/menu/start'), group: lifecycle, disabled: !row.enabled, onSelect: (picked) => { picked.closeMenu(); start(row); } },
      { title: t('sessions/tooling/menu/stop'), group: lifecycle, disabled: !running(row), onSelect: (picked) => { picked.closeMenu(); stop(row); } },
      ...SCOPES.filter((scope) => scope !== 'workspace' || folder !== undefined).map((scope): PickerAction => {
        const on = onAt(row, scope);
        return { title: t(`sessions/tooling/menu/${on ? 'disable' : 'enable'}/${scope}`), group: switches, onSelect: (picked) => { picked.closeMenu(); decide(row, scope, !on); } };
      }),
      { title: t('sessions/tooling/menu/configuration'), group: more, disabled: row.open === undefined, onSelect: (picked) => { picked.closeMenu(); if (row.open !== undefined) void scena.commands.execute('ahp.openFile', { host, uri: row.open.uri, line: row.open.line }); } },
      { title: t('sessions/tooling/menu/copyId'), group: more, onSelect: (picked) => { picked.closeMenu(); void copyText(row.id); } },
    ];
  };
  const openMenu = (event: MouseEvent<HTMLButtonElement>, row: ServerRow): void => {
    const box = event.currentTarget.getBoundingClientRect();
    setMenu({ x: box.right - 220, y: box.bottom, items: items(row) });
  };
  const groups = searchRows(all, query);
  const total = all.reduce((sum, group) => sum + group.rows.length, 0);
  return (
    <div className="web-tooling">
      <div className="web-tooling__head">
        <span className="web-tooling__title">{t('sessions/tooling/servers')} <span className="web-tooling__count">{total}</span></span>
        <span className="web-tooling__session">{summary.title === '' ? t('sessions/untitled') : summary.title}</span>
      </div>
      <TextField value={query} placeholder={t('sessions/tooling/searchServers')} onChange={setQuery} />
      {groups.map((group) => (
        <section key={group.key} className="web-tooling__group">
          <Section title={group.title} count={[group.note, String(group.rows.length)].filter((part) => part !== '').join(' \u{00B7} ')} small />
          {group.rows.map((row) => (
            <ItemRow
              key={row.id}
              off={!row.enabled}
              lead={<span aria-hidden="true">{EMOJIcon.mcpServer}</span>}
              title={<><Mark row={row} />{row.name}</>}
              line={<span title={row.line}>{row.line}</span>}
              trail={(
                <>
                  {row.enabled ? row.state?.text ?? '' : offWord(row)}
                  {row.enabled && row.lifecycle === 'stopped' ? <Button label={t('sessions/tooling/menu/start')} size="sm" onClick={() => start(row)} /> : null}
                  <span title={t(row.enabled ? 'sessions/tooling/turnOff' : 'sessions/tooling/turnOn')}>
                    <CheckBox value={row.enabled} onChange={(next) => decide(row, 'session', next)} />
                  </span>
                  <Button variant="quiet" label={EMOJIcon.more} title={t('sessions/tooling/menu/title')} ariaLabel={t('sessions/tooling/menu/title')} hasPopup="menu" onClick={(event) => openMenu(event, row)} />
                </>
              )}
            />
          ))}
        </section>
      ))}
      {total === 0 ? <Note>{t('sessions/tooling/noServers')}</Note> : groups.length === 0 ? <Note>{t('sessions/tooling/noMatch')}</Note> : null}
      {menu === null ? null : <ContextMenu spec={{ items: menu.items }} x={menu.x} y={menu.y} onClose={() => setMenu(null)} />}
    </div>
  );
}

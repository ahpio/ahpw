import { useMemo, useState, type ReactElement } from 'react';
import type { StateAction } from '@microsoft/agent-host-protocol';
import { useI18n } from '@softov/scena/react';
import { CheckBox, Spinner, StatusDot, TextField } from '@softov/scena/ui';
import { hostBridge } from '../../bridges/data.js';
import { useActiveSession } from './active.js';
import { offWord, pluginGroups, searchRows, withDecision, type ToggleRow } from './tooling.js';
import './tooling.css';

/** What a plugin's second line says: what it holds, its load state when it is not plainly loaded, and where it is off. */
function lineOf(row: ToggleRow): string {
  return [row.line, row.state?.text ?? '', offWord(row)].filter((part) => part !== '').join(' \u{00B7} ');
}

/** The focused session's plugins, by the client that sent them, each with a switch for this session. */
export default function PluginsView(): ReactElement {
  const { t } = useI18n();
  const { host, summary, session } = useActiveSession();
  const [query, setQuery] = useState('');
  const all = useMemo(() => pluginGroups(session?.customizations, session?.activeClients ?? []), [session?.customizations, session?.activeClients]);
  if (summary === undefined) return <p className="web-note web-tooling__empty">{t('sessions/tooling/noSession')}</p>;
  const folder = summary.workingDirectories?.[0];
  const toggle = (row: ToggleRow, enabled: boolean): void => hostBridge(host).dispatch(summary.resource, { type: 'session/customizationToggled', id: row.id, enablement: withDecision(row.enablement, 'session', enabled, folder) } as unknown as StateAction);
  const groups = searchRows(all, query);
  const total = all.reduce((sum, group) => sum + group.rows.length, 0);
  return (
    <div className="web-tooling">
      <div className="web-tooling__head">
        <span className="web-tooling__title">{t('sessions/tooling/plugins')} <span className="web-tooling__count">{total}</span></span>
        <span className="web-tooling__session">{summary.title === '' ? t('sessions/untitled') : summary.title}</span>
      </div>
      <TextField value={query} placeholder={t('sessions/tooling/searchPlugins')} onChange={setQuery} />
      {groups.map((group) => (
        <section key={group.key} className="web-tooling__group">
          <h4 className="web-tooling__heading web-tooling__heading--plain">
            <span>{group.title}</span>
            <span className="web-tooling__count">{group.rows.length}</span>
          </h4>
          {group.rows.map((row) => (
            <div key={row.id} className="web-tooling__row web-tooling__switchrow" data-enabled={row.enabled ? 'true' : 'false'}>
              <span className="web-tooling__check" title={t(row.enabled ? 'sessions/tooling/turnOff' : 'sessions/tooling/turnOn')}>
                <CheckBox value={row.enabled} onChange={(next) => toggle(row, next)} />
              </span>
              <span className="web-tooling__main">
                <span className="web-tooling__l1">
                  {row.state === undefined ? null : row.state.tone === 'busy' ? <span title={row.state.text}><Spinner size={10} /></span> : <StatusDot tone={row.state.tone} title={row.state.text} />}
                  <span className="web-tooling__name">{row.name}</span>
                </span>
                <span className="web-tooling__l2">{lineOf(row)}</span>
              </span>
            </div>
          ))}
        </section>
      ))}
      {total === 0 ? <p className="web-note">{t('sessions/tooling/noPlugins')}</p> : groups.length === 0 ? <p className="web-note">{t('sessions/tooling/noMatch')}</p> : null}
    </div>
  );
}

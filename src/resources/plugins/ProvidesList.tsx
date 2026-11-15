import type { ReactElement } from 'react';
import { useI18n, useScena } from '@softov/scena/react';
import type { PluginContracts } from '../../bridges/plugins.js';
import { PROVIDE_ORDER, providedGroups } from './provides.js';

/** What a plugin's contracts say it provides, by register method, each entry opening where ahpw shows it; nothing when they name none. */
export function ProvidesList({ host, contracts }: { host: string; contracts: PluginContracts | undefined }): ReactElement | null {
  const scena = useScena();
  const { t } = useI18n();
  const groups = providedGroups(contracts, host);
  if (groups.length === 0) return null;
  return (
    <dl className="web-plugin__provides">
      {groups.map((group) => (
        <div key={group.kind} className="web-plugin__provides-row">
          <dt>{(PROVIDE_ORDER as readonly string[]).includes(group.kind) ? t(`plugins/provides/${group.kind}`) : group.kind}</dt>
          <dd>
            {group.entries.map((entry) => (entry.link === undefined
              ? <code key={entry.name} className="web-plugin__entry">{entry.name}</code>
              : (
                <button key={entry.name} type="button" className="web-link web-plugin__entry" onClick={() => void scena.commands.execute(entry.link!.command, entry.link!.args)}>
                  {entry.name}
                </button>
              )))}
          </dd>
        </div>
      ))}
    </dl>
  );
}

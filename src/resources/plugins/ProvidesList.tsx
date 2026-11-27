import type { ReactElement } from 'react';
import { useI18n, useScena } from '@softov/scena/react';
import type { PluginContracts } from '../../bridges/plugins.js';
import { PROVIDE_ORDER, providedGroups } from './provides.js';
import { Button, DetailList, Row } from '../../ui/index.js';

/** What a plugin's contracts say it provides, by register method, each entry opening where ahpw shows it; nothing when they name none. */
export function ProvidesList({ host, contracts }: { host: string; contracts: PluginContracts | undefined }): ReactElement | null {
  const scena = useScena();
  const { t } = useI18n();
  const groups = providedGroups(contracts, host);
  if (groups.length === 0) return null;
  return (
    <DetailList
      inline
      items={groups.map((group) => ({
        label: (PROVIDE_ORDER as readonly string[]).includes(group.kind) ? t(`plugins/provides/${group.kind}`) : group.kind,
        value: (
          <Row wrap gap="4px var(--oo-spacing-sm)">
            {group.entries.map((entry) => (entry.link === undefined
              ? <code key={entry.name}>{entry.name}</code>
              : (
                <Button key={entry.name} variant="link" onClick={() => void scena.commands.execute(entry.link!.command, entry.link!.args)}>
                  <code>{entry.name}</code>
                </Button>
              )))}
          </Row>
        ),
      }))}
    />
  );
}

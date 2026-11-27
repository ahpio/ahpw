import type { ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { Button } from '../../ui/index.js';
import type { Ask } from '../agent-tools/asks.js';

/** Allow, Always allow and Deny on a call this browser runs, which waits for a person. */
export function ClientAsk({ ask }: { ask: Ask }): ReactElement {
  const { t } = useI18n();
  return (
    <div className="web-tool__confirm">
      <p>{t('sessions/agentTools/asks', { command: ask.title })}</p>
      <div className="web-tool__actions">
        <Button label={t('sessions/agentTools/allow')} variant="primary" onClick={() => ask.answer(true)} />
        <Button label={t('sessions/agentTools/alwaysAllow')} title={t('sessions/agentTools/alwaysAllowHint')} onClick={() => ask.always()} />
        <Button label={t('sessions/agentTools/deny')} onClick={() => ask.answer(false)} />
      </div>
    </div>
  );
}

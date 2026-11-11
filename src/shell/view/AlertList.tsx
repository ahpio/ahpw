import type { ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { Alert, Text } from '@softov/scena/ui';
import type { HostAlert } from '../../bridges/plugins.js';
import { plural } from '../../i18n/locales.js';
import { when } from '../../resources/sessions/turn.js';
import './alert-list.css';

/** The alert levels, loudest first, and the tone each is drawn in. */
export const ALERT_LEVELS: readonly [HostAlert['level'], 'danger' | 'warning' | 'info'][] = [['error', 'danger'], ['warning', 'warning'], ['info', 'info'], ['notice', 'info']];

/**
 * The problems a host found on a plugin, an agent or a connector, under one
 * heading: one box per level, loudest first, each alert with its text, what
 * it is about and when it was raised. No alerts draws nothing.
 */
export function AlertList({ alerts }: { alerts: readonly HostAlert[] }): ReactElement | null {
  const { t } = useI18n();
  if (alerts.length === 0) return null;
  return (
    <>
      <Text variant="h3" text={t('shell/alerts/title')} />
      {ALERT_LEVELS.map(([level, tone]) => {
        const said = alerts.filter((alert) => alert.level === level);
        return said.length === 0 ? null : (
          <Alert key={level} tone={tone} title={plural(`shell/alerts/${level}`, said.length)}>
            <ul className="web-alerts">
              {said.map((alert, at) => (
                <li key={alert.ref ?? `#${String(at)}`}>
                  {alert.text}
                  {alert.ref === undefined ? null : <code className="web-alerts__ref">{alert.ref}</code>}
                  {alert.at === undefined ? null : <time className="web-alerts__at" dateTime={alert.at}>{when(alert.at)}</time>}
                </li>
              ))}
            </ul>
          </Alert>
        );
      })}
    </>
  );
}

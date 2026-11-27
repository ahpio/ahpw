import { useEffect, useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Button, Row } from '../../ui/index.js';
import { NOTIFICATIONS } from './registry.js';
import { getNotifications } from './context.js';
import type { Notification, NotificationAnimation, NotificationTone } from './types.js';
import { EMOJIcon } from '../../resources/emojis.js';
import { plural } from '../../i18n/locales.js';
import './toaster.css';

/** Each tone's default icon. */
const TONE_ICON: Record<NotificationTone, string> = {
  info: EMOJIcon.info,
  success: EMOJIcon.check,
  warning: EMOJIcon.warning,
  danger: EMOJIcon.error,
};

/** How many show before the rest fold into a "more" line. */
const VISIBLE = 4;

export interface ToasterProps {
  /** The arrival for entries that do not name one. */
  animation?: NotificationAnimation;
}

/** The notifications on screen, stacked in the bottom right corner, newest nearest it. */
export function Toaster({ animation = 'slide-up' }: ToasterProps): ReactElement | null {
  const { t } = useI18n();
  const list = useStore<Notification[]>(NOTIFICATIONS) ?? [];
  const [expanded, setExpanded] = useState(false);
  if (list.length === 0) return null;
  const shown = expanded ? list : list.slice(0, VISIBLE);
  const hidden = list.length - shown.length;
  return (
    <div className="web-toasts" role="region" aria-label={t('shell/notify/region')}>
      {hidden > 0 ? <Button variant="quiet" onClick={() => setExpanded(true)}>{t('shell/notify/more', { count: hidden })}</Button> : null}
      {[...shown].reverse().map((notification) => (
        <Toast key={notification.id} notification={notification} animation={notification.animation ?? animation} />
      ))}
    </div>
  );
}

function Toast({ notification, animation }: { notification: Notification; animation: NotificationAnimation }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const [showDetail, setShowDetail] = useState(false);
  const id = notification.id;
  const close = (): void => getNotifications().dismiss(id);

  // Open details hold it for as long as they are open, whatever the pointer does.
  useEffect(() => {
    if (!showDetail) return;
    const notifications = getNotifications();
    notifications.hold(id);
    return () => notifications.release(id);
  }, [id, showDetail]);

  const enter = (): void => getNotifications().hold(id);
  const leave = (): void => {
    if (!showDetail) getNotifications().release(id);
  };

  const run = (action: NonNullable<Notification['actions']>[number]): void => {
    void scena.commands.execute(action.command, action.args);
    if (action.dismisses !== false) close();
  };

  return (
    <div
      className="web-toast"
      data-tone={notification.tone}
      data-animation={animation}
      role={notification.dismissAuto === false ? 'alert' : 'status'}
      onMouseEnter={enter}
      onMouseLeave={leave}
      onFocus={enter}
      onBlur={leave}
    >
      <Row align="center" gap="var(--oo-spacing-sm)">
        <span className="web-toast__icon" aria-hidden="true">{notification.icon ?? TONE_ICON[notification.tone]}</span>
        <span className="web-toast__title">{notification.title}</span>
        {notification.count > 1 ? <span className="web-toast__count" title={plural('shell/notify/raised', notification.count)}>{`\u{D7}${notification.count}`}</span> : null}
        <Button variant="quiet" ariaLabel={t('shell/notify/dismiss')} onClick={close}>{EMOJIcon.close}</Button>
      </Row>
      {notification.description === undefined ? null : <p className="web-toast__body">{notification.description}</p>}
      {notification.detail === undefined ? null : (
        <>
          <Button variant="quiet" onClick={() => setShowDetail(!showDetail)}>{showDetail ? t('shell/notify/hideDetails') : t('shell/notify/showDetails')}</Button>
          {showDetail ? <pre className="web-toast__detail">{notification.detail}</pre> : null}
        </>
      )}
      {notification.actions === undefined || notification.actions.length === 0 ? null : (
        <Row wrap gap="var(--oo-spacing-xs)">
          {notification.actions.map((action) => (
            <Button key={action.command} type="button" size="sm" variant="ghost" onClick={() => run(action)}>{action.label}</Button>
          ))}
        </Row>
      )}
    </div>
  );
}

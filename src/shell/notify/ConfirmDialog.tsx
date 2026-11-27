import type { ReactElement } from 'react';
import { useStore } from '@softov/scena/react';
import { Button, Modal } from '../../ui/index.js';
import { CONFIRM_REQUEST, settle, type ConfirmRequest } from './confirm.js';

/**
 * The open question, over the page. The dialog takes focus, not its confirm
 * button, so Enter cannot answer yes before the question is read. Escape and a
 * click outside close it unanswered, which `confirm` reads as no.
 */
export function ConfirmDialog(): ReactElement | null {
  const request = useStore<ConfirmRequest | null>(CONFIRM_REQUEST);
  if (request === undefined || request === null) return null;
  return (
    <Modal
      key={request.id}
      open
      alert
      title={request.title}
      {...(request.body === undefined ? {} : { description: request.body })}
      onClose={() => settle(null)}
      actions={(
        <>
          <Button size="sm" variant="ghost" onClick={() => settle(false)}>{request.cancelLabel}</Button>
          <Button size="sm" variant={request.tone === 'danger' ? 'danger' : 'primary'} onClick={() => settle(true)}>{request.confirmLabel}</Button>
        </>
      )}
    />
  );
}

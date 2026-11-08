import { useRef, useState, type ReactElement } from 'react';
import type { StateAction, ToolCallState } from '@microsoft/agent-host-protocol';
import type { PickerAction } from '@softov/scena/types';
import { useI18n } from '@softov/scena/react';
import { Button, Markdown } from '@softov/scena/ui';
import { ContextMenu } from '@softov/scena/ui/menu';
import { textOf } from '../../bridges/words.js';
import { EMOJIcon } from '../emojis.js';
import { confirmLayout } from './confirm.js';
import './confirm.css';

const PENDING_CONFIRMATION = 'pending-confirmation';

/**
 * The host's options for a call awaiting approval: the first approving one as
 * the main button, a caret beside it that opens the other approving ones in a
 * menu, in the host's order with a divider where the group changes, and each
 * denying one as its own button.
 * Approve and deny when the host offers none.
 */
export function Confirm({ call, send, turnId }: { call: ToolCallState; send: (action: StateAction) => void; turnId: string }): ReactElement {
  const { t } = useI18n();
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const split = useRef<HTMLSpanElement>(null);
  const toggleMenu = (): void => {
    const caret = split.current?.lastElementChild?.getBoundingClientRect();
    setMenu(menu !== null || caret === undefined ? null : { x: caret.left, y: caret.bottom + 2 });
  };
  const approve = (optionId?: string): void => send({
    type: 'chat/toolCallConfirmed',
    turnId,
    toolCallId: call.toolCallId,
    approved: true,
    confirmed: 'user-action',
    ...(optionId === undefined ? {} : { selectedOptionId: optionId }),
  } as StateAction);
  const deny = (optionId?: string): void => send({
    type: 'chat/toolCallConfirmed',
    turnId,
    toolCallId: call.toolCallId,
    approved: false,
    reason: 'denied',
    ...(optionId === undefined ? {} : { selectedOptionId: optionId }),
  } as StateAction);
  const options = call.status === PENDING_CONFIRMATION ? call.options ?? [] : [];
  const title = call.status === PENDING_CONFIRMATION ? textOf(call.confirmationTitle) : '';
  const { main, more, deny: denials } = confirmLayout(options);
  const items: PickerAction[] = more.map(({ option, part }) => ({
    title: option.label,
    group: String(part),
    onSelect: (picker) => {
      picker.closeMenu();
      approve(option.id);
    },
  }));
  return (
    <div className="web-tool__confirm">
      {title === '' ? null : <Markdown text={title} />}
      <div className="web-tool__actions">
        {options.length === 0 ? (
          <>
            <Button label={t('sessions/tool/approve')} variant="primary" onClick={() => approve()} />
            <Button label={t('sessions/tool/deny')} onClick={() => deny()} />
          </>
        ) : (
          <>
            {main === undefined ? null : (
              <span ref={split} className="web-confirm__split">
                <Button label={main.label} variant="primary" onClick={() => approve(main.id)} />
                {more.length === 0 ? null : <Button label={EMOJIcon.caretDown} variant="primary" title={t('sessions/tool/moreOptions')} onClick={toggleMenu} />}
              </span>
            )}
            {denials.map((option) => <Button key={option.id} label={option.label} onClick={() => deny(option.id)} />)}
          </>
        )}
      </div>
      {menu === null ? null : <ContextMenu spec={{ items, groupLabels: false }} x={menu.x} y={menu.y} onClose={() => setMenu(null)} />}
    </div>
  );
}

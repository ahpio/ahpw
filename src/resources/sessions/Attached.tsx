import { useEffect, useLayoutEffect, useRef, useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Button, ContextMenu, Modal, Note, Pill } from '../../ui/index.js';
import type { BindingPath, PickerAction } from '@softov/scena/types';
import type { MessageAttachment, SessionSummary } from '@microsoft/agent-host-protocol';
import { ahpPaths } from '../../bridges/data.js';
import { attachmentIcon, attachmentLabel, attachmentPath, clipboardImage, hasPreview, previewOf, type AttachmentPreviewOf } from './attachments.js';
import { composerAt, contextItems } from './composer-commands.js';
import './composer.css';
import './attached.css';

/** What goes with the message, above its text, each with a way to take it off. Nothing when there is none. */
export function Attached({ attachments, folder, onRemove }: {
  attachments: readonly MessageAttachment[];
  folder: string | undefined;
  onRemove: (index: number) => void;
}): ReactElement | null {
  const { t } = useI18n();
  const [preview, setPreview] = useState<AttachmentPreviewOf | null>(null);
  if (attachments.length === 0) return null;
  return (
    <div className="web-composer__attached">
      {attachments.map((one, index) => {
        return (
          <Pill
            key={`${attachmentLabel(one)}-${index}`}
            label={attachmentLabel(one)}
            lead={<span aria-hidden="true">{attachmentIcon(one)}</span>}
            title={attachmentPath(one, folder) ?? attachmentLabel(one)}
            {...(hasPreview(one) ? { onClick: () => setPreview(previewOf(one)) } : {})}
            removeLabel={t('sessions/attachments/remove', { name: attachmentLabel(one) })}
            onRemove={() => onRemove(index)}
          />
        );
      })}
      {preview === null ? null : <AttachmentPreview preview={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

/** What an attachment the message carries holds, over the page: an image as itself, text as text, anything else by its type and size. */
export function AttachmentPreview({ preview, onClose }: { preview: AttachmentPreviewOf; onClose: () => void }): ReactElement {
  return (
    <Modal open title={preview.label} onClose={onClose}>
      <div className="web-attachment-preview">
        <Note small>{preview.meta}</Note>
        {preview.image === undefined ? null : <img className="web-attachment-preview__image" src={preview.image} alt={preview.label} />}
        {preview.text === undefined ? null : <pre className="web-attachment-preview__text">{preview.text}</pre>}
      </div>
    </Modal>
  );
}

/** Space between the `+` and its menu, in pixels. */
const MENU_GAP = 4;

/**
 * The composer's `+`: Add context as a menu at the button, the same items as
 * `/attach`, and a second click closes it. Nothing is written into the message.
 * `onOpenChange` lets the composer hide its `@` or `/` list while the menu is open.
 * The `+` is drawn, not typed, so it sits in the middle of its circle in any font.
 */
export function AddButton({ host, path, onOpenChange, openNow = false, onOpened }: {
  host: string;
  path: BindingPath;
  onOpenChange: (open: boolean) => void;
  /** Opens the menu as the button is drawn, as the folded composer's `+` asks; `onOpened` then clears the ask. */
  openNow?: boolean;
  onOpened?: () => void;
}): ReactElement {
  const { t } = useI18n();
  // Read when the menu opens, not followed: the list changes whenever any session does.
  const scena = useScena();
  const [menu, setMenu] = useState<{ rect: DOMRect; y: number; items: PickerAction[] } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const holder = useRef<HTMLSpanElement>(null);

  // scena's popup opens at a point and only clamps into the window: once its
  // height is known, it goes above the `+` when it does not fit below.
  useLayoutEffect(() => {
    const popup = holder.current?.querySelector('.oo-popup');
    if (menu === null || popup === null || popup === undefined) return;
    const height = popup.getBoundingClientRect().height;
    const below = menu.rect.bottom + MENU_GAP;
    const above = menu.rect.top - MENU_GAP - height;
    const y = below + height > window.innerHeight && above >= 0 ? above : below;
    if (y !== menu.y) setMenu({ ...menu, y });
  }, [menu]);

  const close = (): void => {
    setMenu(null);
    onOpenChange(false);
  };

  const toggle = async (): Promise<void> => {
    if (menu !== null) {
      close();
      return;
    }
    const api = composerAt(path);
    const rect = button.current?.getBoundingClientRect();
    if (api === undefined || rect === undefined) return;
    const image = await clipboardImage();
    setMenu({ rect, y: rect.bottom + MENU_GAP, items: contextItems(api, scena.store.get<SessionSummary[]>(ahpPaths(host).sessions) ?? [], image) });
    onOpenChange(true);
  };

  useEffect(() => {
    if (!openNow) return;
    onOpened?.();
    void toggle();
  // Only the ask: `toggle` and `onOpened` are new on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openNow]);

  return (
    <span ref={holder} className="web-composer__add-holder">
      {/* The popup closes on any mousedown outside it: kept from it, the click below closes the menu instead of opening it again. */}
      <Button
        ref={button}
        variant="tool"
        shape="round"
        size="xs"
        ariaLabel={t('sessions/context/title')}
        title={t('sessions/context/title')}
        hasPopup="menu"
        expanded={menu !== null}
        active={menu !== null}
        onMouseDown={(event) => { if (menu !== null) event.nativeEvent.stopPropagation(); }}
        onClick={() => void toggle()}
      >
        <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </Button>
      {menu === null ? null : <ContextMenu spec={{ items: menu.items }} x={menu.rect.left} y={menu.y} onClose={close} />}
    </span>
  );
}

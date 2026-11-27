import { useEffect, useState, type ReactElement } from 'react';
import { canvasReducer, chatReducer, type CanvasState, type ChatState } from '@microsoft/agent-host-protocol';
import { useI18n, useScena } from '@softov/scena/react';
import { useChannel } from '../../bridges/channel.js';
import { SANDBOX } from '../../shell/browser/sandbox.js';
import { EMOJIcon } from '../emojis.js';
import { canvasKey, canvasName, canvasUriOf } from './canvases.js';
import { Button, Link, Note, Toolbar } from '../../ui/index.js';
import '../../shell/explorer/explorer-list.css';
import '../../shell/browser/browser-view.css';
import './canvas-view.css';

/** The bar's controls wrap onto a second line in a narrow pane. */
const WRAPS = { flexWrap: 'wrap' } as const;

/**
 * A canvas: its page in an iframe, with the Browser view's sandbox, under a
 * bar with its name, its status, a reload and a way out to a new tab. A new
 * `url` loads the page again; with none, the view says the page is not
 * available. The view closes when the canvas leaves its chat.
 */
export default function CanvasView({ host, chat, resource }: { host: string; chat: string; resource: string }): ReactElement {
  const { t } = useI18n();
  const scena = useScena();
  const { state } = useChannel<CanvasState>(host, resource, canvasReducer);
  const { state: chatState } = useChannel<ChatState>(host, chat, chatReducer);
  // A new value loads the iframe again: a page from another origin cannot be told to reload.
  const [loads, setLoads] = useState(0);
  const gone = chatState !== undefined && !(chatState.canvases ?? []).some((one) => one.resource === resource);
  const key = canvasKey(host, resource);

  useEffect(() => {
    if (gone) scena.surfaces.close(key);
  }, [gone, scena, key]);

  const url = canvasUriOf(state);
  const name = canvasName(state) ?? t('canvases/tab');
  const button = (icon: string, label: string, run: () => void, disabled: boolean): ReactElement => (
    <Button variant="subtle" shape="icon" title={label} ariaLabel={label} disabled={disabled} onClick={run}>
      {icon}
    </Button>
  );

  return (
    <div className="web-browser">
      <Toolbar gap="var(--oo-spacing-xs)" style={WRAPS}>
        <span className="web-canvas__name">{name}</span>
        {state?.status === undefined || state.status === '' ? null : <Note inline>{state.status}</Note>}
        <span className="web-explorer__actions web-canvas__actions">
          {button(EMOJIcon.reload, t('common/reload'), () => setLoads((n) => n + 1), url === undefined)}
          {url === undefined ? (
            button(EMOJIcon.external, t('shell/browser/openOutside'), () => undefined, true)
          ) : (
            <Link href={url} external icon title={t('shell/browser/openOutside')} ariaLabel={t('shell/browser/openOutside')}>
              {EMOJIcon.external}
            </Link>
          )}
        </span>
      </Toolbar>
      <div className="web-browser__page">
        {url === undefined ? (
          <div className="web-browser__empty">
            <p className="web-browser__emptyTitle">{t('canvases/view/unavailable')}</p>
            <Note>{t('canvases/view/unavailableBody')}</Note>
          </div>
        ) : (
          <iframe key={`${loads}:${url}`} className="web-browser__frame" src={url} title={name} sandbox={SANDBOX} referrerPolicy="strict-origin-when-cross-origin" />
        )}
      </div>
    </div>
  );
}

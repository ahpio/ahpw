import { useState, type KeyboardEvent, type ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { Markdown } from '../../shell/markdown/Markdown.js';
import type { Annotation, AnnotationEntry } from '@microsoft/agent-host-protocol';
import { NameMark } from '../../shell/NameMark.js';
import { plural } from '../../i18n/locales.js';
import { EMOJIcon } from '../emojis.js';
import { authorOf, isOutdated, stampOf, textOf } from './comments.js';
import './comments.css';
import { Button, Modal, RowButton, TextField } from '../../ui/index.js';

/** What a thread can do to its comment. */
export interface ThreadActions {
  reply(id: string, text: string): void;
  resolve(id: string, resolved: boolean): void;
  remove(id: string): void;
  focus(id: string | null): void;
  /** Ask before a delete: the thread whose card shows the question, or none. */
  askRemove(id: string | null): void;
}

/** An entry's writer, as the host stamped it, else as VS Code's meta says. */
const writerOf = (entry: AnnotationEntry): string => stampOf(entry)?.name ?? authorOf(entry) ?? '?';

/** An entry's time, as hours and minutes, or nothing for one with no stamp. */
const timeOf = (entry: AnnotationEntry): string => {
  const at = stampOf(entry)?.at;
  if (at === undefined) return '';
  const date = new Date(at);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/** One entry; `tools` go on its name row, as a closed thread's first entry has them. */
function Entry({ entry, tools }: { entry: AnnotationEntry; tools?: ReactElement }): ReactElement {
  const name = writerOf(entry);
  return (
    <div className="web-thread__entry">
      <NameMark name={name} size={22} />
      <div>
        <span className="web-thread__head">
          <span className="web-thread__who">{name}<span className="web-thread__when">{timeOf(entry)}</span></span>
          {tools}
        </span>
        <Markdown className="web-thread__text" text={textOf(entry)} />
      </div>
    </div>
  );
}

/** A box to write in, sent with its icon button or Mod-Enter. */
function Writer({ placeholder, sendTitle, onSend, onCancel, multiline }: { placeholder: string; sendTitle: string; onSend: (text: string) => void; onCancel?: () => void; multiline?: boolean }): ReactElement {
  const { t } = useI18n();
  const [text, setText] = useState('');
  const send = (): void => {
    const said = text.trim();
    if (said === '') return;
    onSend(said);
    setText('');
  };
  const keys = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey || !multiline)) {
      event.preventDefault();
      send();
    } else if (event.key === 'Escape' && onCancel !== undefined) onCancel();
  };
  return (
    <div className={multiline === true ? 'web-thread__new' : 'web-thread__reply'}>
      {multiline === true
        ? <TextField multiline compact rows={2} value={text} placeholder={placeholder} onChange={setText} onKeyDown={keys} autoFocus />
        : <TextField compact value={text} placeholder={placeholder} onChange={setText} onKeyDown={keys} />}
      <span className="web-thread__row">
        {onCancel === undefined ? null : <Button variant="subtle" shape="icon" title={t('files/comments/cancel')} ariaLabel={t('files/comments/cancel')} onClick={onCancel}>{EMOJIcon.close}</Button>}
        <Button variant="filled" shape="icon" disabled={text.trim() === ''} title={sendTitle} ariaLabel={sendTitle} onClick={send}>{EMOJIcon.commentSend}</Button>
      </span>
    </div>
  );
}

/** One comment and its replies, folded to one line once resolved. */
export function Thread({ annotation, focused, confirming, actions }: { annotation: Annotation; focused: boolean; confirming: boolean; actions: ThreadActions }): ReactElement {
  const { t } = useI18n();
  const [first, ...replies] = annotation.entries;
  if (annotation.resolved && !focused) {
    return (
      <div className="web-thread web-thread--folded">
        <RowButton small center title={t('files/comments/show')} onClick={() => actions.focus(annotation.id)}>
        <span aria-hidden="true">{EMOJIcon.check}</span>
        <b>{first === undefined ? '' : writerOf(first)}</b>
        <span className="web-thread__fold-text">{first === undefined ? '' : textOf(first)}</span>
        {replies.length === 0 ? null : <span className="web-thread__fold-count">· {plural('files/comments/replies', replies.length)}</span>}
        </RowButton>
      </div>
    );
  }
  const tools = (
    <span className="web-thread__tools">
      <Button variant="subtle" shape="icon" title={annotation.resolved ? t('files/comments/reopen') : t('files/comments/resolve')} ariaLabel={annotation.resolved ? t('files/comments/reopen') : t('files/comments/resolve')} onClick={(event) => { event.stopPropagation(); actions.resolve(annotation.id, !annotation.resolved); }}>{annotation.resolved ? EMOJIcon.reopen : EMOJIcon.check}</Button>
      <Button variant="subtle" shape="icon" title={t('files/comments/delete')} ariaLabel={t('files/comments/delete')} onClick={(event) => { event.stopPropagation(); actions.askRemove(annotation.id); }}>{EMOJIcon.close}</Button>
    </span>
  );
  // The buttons sit on the first name row, open or closed; a closed thread shows them on hover.
  const question = confirming ? (
    <Modal
      open
      contained
      alert
      title={t('files/comments/deleteAsk')}
      onClose={() => actions.askRemove(null)}
      actions={(
        <>
          <Button size="sm" variant="ghost" onClick={() => actions.askRemove(null)}>{t('files/comments/cancel')}</Button>
          <Button size="sm" variant="danger" onClick={() => { actions.askRemove(null); actions.remove(annotation.id); }}>{t('files/comments/deleteYes')}</Button>
        </>
      )}
    />
  ) : null;
  const entries = annotation.entries.map((entry, index) => <Entry key={entry.id} entry={entry} {...(index === 0 ? { tools } : {})} />);
  const outdated = isOutdated(annotation) ? <span className="web-thread__outdated">{t('files/comments/outdated')}</span> : null;
  if (!focused) {
    return (
      <div className={confirming ? 'web-thread web-thread--closed web-thread--asking' : 'web-thread web-thread--closed'} onClick={() => actions.focus(annotation.id)}>
        {entries}
        {outdated}
        {question}
      </div>
    );
  }
  return (
    <div className={confirming ? 'web-thread web-thread--focused web-thread--asking' : 'web-thread web-thread--focused'}>
      {entries}
      {outdated}
      {annotation.resolved ? null : <Writer placeholder={t('files/comments/reply')} sendTitle={t('files/comments/sendReply')} onSend={(text) => actions.reply(annotation.id, text)} />}
      {question}
    </div>
  );
}

/** The box for a new comment's first entry. */
export function NewComment({ onAdd, onCancel }: { onAdd: (text: string) => void; onCancel: () => void }): ReactElement {
  const { t } = useI18n();
  return (
    <div className="web-thread web-thread--focused">
      <Writer multiline placeholder={t('files/comments/new')} sendTitle={t('files/comments/send')} onSend={onAdd} onCancel={onCancel} />
    </div>
  );
}

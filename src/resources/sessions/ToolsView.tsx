import { useMemo, useState, type ReactElement } from 'react';
import type { ToolDefinition } from '@microsoft/agent-host-protocol';
import { useI18n } from '@softov/scena/react';
import { Badge, TextField } from '@softov/scena/ui';
import { EMOJIcon } from '../emojis.js';
import { useActiveSession } from './active.js';
import { searchTools, toolGroups, toolHints, toolParams, type ToolGroup } from './tooling.js';
import './tooling.css';

/** One tool: its title, name and first line; open, its whole description, its inputs and its hints. On the right, why it has no switch. */
function ToolRow({ tool, open, why, onToggle }: { tool: ToolDefinition; open: boolean; why: string; onToggle: () => void }): ReactElement {
  const { t } = useI18n();
  const description = (tool.description ?? '').trim();
  const params = open ? toolParams(tool) : [];
  const hints = open ? toolHints(tool) : [];
  return (
    <div className="web-tooling__row">
      <button type="button" className="web-tooling__toggle" aria-expanded={open} onClick={onToggle}>
        <span className="web-tooling__caret" aria-hidden="true">{open ? EMOJIcon.caretDown : EMOJIcon.caretRight}</span>
        <span className="web-tooling__main">
          <span className="web-tooling__l1">
            <span className="web-tooling__name">{tool.title ?? tool.annotations?.title ?? tool.name}</span>
            <code className="web-tooling__id">{tool.name}</code>
            <span className="web-tooling__why">{why}</span>
          </span>
          {description === '' ? null : <span className={open ? 'web-tooling__text' : 'web-tooling__l2'}>{open ? description : description.split('\n')[0]}</span>}
        </span>
      </button>
      {!open || (params.length === 0 && hints.length === 0) ? null : (
        <div className="web-tooling__more">
          {params.length === 0 ? null : (
            <dl className="web-tooling__params">
              {params.map((param) => (
                <div key={param.name}>
                  <dt><code>{param.name}</code> <span>{[param.type, ...(param.required ? [t('sessions/tooling/required')] : [])].filter((part) => part !== '').join(' \u{00B7} ')}</span></dt>
                  {param.description === '' ? null : <dd>{param.description}</dd>}
                </div>
              ))}
            </dl>
          )}
          {hints.length === 0 ? null : <div className="web-tooling__hints">{hints.map((hint) => <Badge key={hint} text={hint} />)}</div>}
        </div>
      )}
    </div>
  );
}

/** One source's tools under a heading that folds them. */
function Group({ group, folded, onFold, open, onOpen }: { group: ToolGroup; folded: boolean; onFold: () => void; open: ReadonlySet<string>; onOpen: (key: string) => void }): ReactElement {
  const { t } = useI18n();
  const why = t(group.key === 'host' ? 'sessions/tooling/always' : 'sessions/tooling/fromClient');
  return (
    <section className="web-tooling__group">
      <button type="button" className="web-tooling__heading" aria-expanded={!folded} onClick={onFold}>
        <span className="web-tooling__caret" aria-hidden="true">{folded ? EMOJIcon.caretRight : EMOJIcon.caretDown}</span>
        <span>{group.title}</span>
        <span className="web-tooling__count">{group.tools.length}</span>
      </button>
      {folded ? null : group.tools.map((tool) => {
        const key = `${group.key}/${tool.name}`;
        return <ToolRow key={key} tool={tool} open={open.has(key)} why={why} onToggle={() => onOpen(key)} />;
      })}
    </section>
  );
}

/** Flips `key` in a set. */
const flip = (set: ReadonlySet<string>, key: string): Set<string> => {
  const next = new Set(set);
  if (!next.delete(key)) next.add(key);
  return next;
};

/** The focused session's tools, by who provides them: the host's, then each client's. Each row opens to its inputs and hints. */
export default function ToolsView(): ReactElement {
  const { t } = useI18n();
  const { summary, session } = useActiveSession();
  const [query, setQuery] = useState('');
  const [folded, setFolded] = useState<ReadonlySet<string>>(new Set());
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const all = useMemo(() => toolGroups(session), [session]);
  if (summary === undefined) return <p className="web-note web-tooling__empty">{t('sessions/tooling/noSession')}</p>;
  const groups = searchTools(all, query);
  const total = all.reduce((sum, group) => sum + group.tools.length, 0);
  return (
    <div className="web-tooling">
      <div className="web-tooling__head">
        <span className="web-tooling__title">{t('sessions/tooling/tools')} <span className="web-tooling__count">{total}</span></span>
        <span className="web-tooling__session">{summary.title === '' ? t('sessions/untitled') : summary.title}</span>
      </div>
      <TextField value={query} placeholder={t('sessions/tooling/searchTools')} onChange={setQuery} />
      {groups.map((group) => (
        <Group key={group.key} group={group} folded={folded.has(group.key)} onFold={() => setFolded((now) => flip(now, group.key))} open={open} onOpen={(key) => setOpen((now) => flip(now, key))} />
      ))}
      {total === 0 ? <p className="web-note">{t('sessions/tooling/noTools')}</p> : groups.length === 0 ? <p className="web-note">{t('sessions/tooling/noMatch')}</p> : null}
    </div>
  );
}

import { useMemo, useState, type ReactElement } from 'react';
import type { ToolDefinition } from '@microsoft/agent-host-protocol';
import { useI18n } from '@softov/scena/react';
import { Badge, ItemRow, Note, ParamList, Section, TextField } from '../../ui/index.js';
import { ModesGroup } from '../agent-tools/ModesGroup.js';
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
    <ItemRow
      title={tool.title ?? tool.annotations?.title ?? tool.name}
      meta={<code>{tool.name}</code>}
      trail={why}
      {...(open ? { text: description } : { line: description.split('\n')[0] })}
      expanded={open}
      onClick={onToggle}
    >
      {!open || (params.length === 0 && hints.length === 0) ? null : (
        <div className="web-tooling__more">
          {params.length === 0 ? null : (
            <ParamList params={params.map((param) => ({ name: param.name, type: param.type, required: param.required, description: param.description }))} requiredLabel={t('sessions/tooling/required')} />
          )}
          {hints.length === 0 ? null : <div className="web-tooling__hints">{hints.map((hint) => <Badge key={hint} text={hint} />)}</div>}
        </div>
      )}
    </ItemRow>
  );
}

/** One source's tools under a heading that folds them. */
function Group({ group, folded, onFold, open, onOpen }: { group: ToolGroup; folded: boolean; onFold: () => void; open: ReadonlySet<string>; onOpen: (key: string) => void }): ReactElement {
  const { t } = useI18n();
  const why = t(group.key === 'host' ? 'sessions/tooling/always' : 'sessions/tooling/fromClient');
  return (
    <section className="web-tooling__group">
      <Section title={group.title} count={String(group.tools.length)} small folded={folded} onFold={onFold} />
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

/** This browser's commands with their modes, then the focused session's tools by who provides them: the host's, then each client's. Each tool's row opens to its inputs and hints. */
export default function ToolsView(): ReactElement {
  const { t } = useI18n();
  const { summary, session } = useActiveSession();
  const [query, setQuery] = useState('');
  const [folded, setFolded] = useState<ReadonlySet<string>>(new Set());
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const all = useMemo(() => toolGroups(session), [session]);
  if (summary === undefined) return <Note inset>{t('sessions/tooling/noSession')}</Note>;
  const groups = searchTools(all, query);
  const total = all.reduce((sum, group) => sum + group.tools.length, 0);
  return (
    <div className="web-tooling">
      <div className="web-tooling__head">
        <span className="web-tooling__title">{t('sessions/tooling/tools')} <span className="web-tooling__count">{total}</span></span>
        <span className="web-tooling__session">{summary.title === '' ? t('sessions/untitled') : summary.title}</span>
      </div>
      <TextField value={query} placeholder={t('sessions/tooling/searchTools')} onChange={setQuery} />
      <ModesGroup query={query} folded={folded.has('browser')} onFold={() => setFolded((now) => flip(now, 'browser'))} />
      {groups.map((group) => (
        <Group key={group.key} group={group} folded={folded.has(group.key)} onFold={() => setFolded((now) => flip(now, group.key))} open={open} onOpen={(key) => setOpen((now) => flip(now, key))} />
      ))}
      {total === 0 ? <Note>{t('sessions/tooling/noTools')}</Note> : groups.length === 0 ? <Note>{t('sessions/tooling/noMatch')}</Note> : null}
    </div>
  );
}

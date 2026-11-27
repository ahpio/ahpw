import type { ReactElement } from 'react';
import type { SessionSummary } from '@microsoft/agent-host-protocol';
import { useI18n } from '@softov/scena/react';
import { Column, Note, Section } from '../../ui/index.js';

/** The head of a session's Tools, MCP servers or Plugins view: what it lists and how many, then the session it is of. */
export function ToolingHead({ title, count, summary }: { title: string; count: number; summary: SessionSummary }): ReactElement {
  const { t } = useI18n();
  return (
    <Column gap="2px">
      <Section title={title} count={String(count)} small />
      <Note>{summary.title === '' ? t('sessions/untitled') : summary.title}</Note>
    </Column>
  );
}

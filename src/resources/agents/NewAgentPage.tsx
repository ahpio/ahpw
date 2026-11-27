import type { ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { Page, Text } from '../../ui/index.js';
import { EMOJIcon } from '../emojis.js';
import { AgentForm } from './AgentForm.js';

/** The page a new agent is made on: one form, its engine picked first. */
export default function NewAgentPage({ host }: { host: string }): ReactElement {
  const { t } = useI18n();
  return (
    <Page>
      <Text variant="h2" text={`${EMOJIcon.agents} ${t('agents/form/newTitle')}`} />
      <AgentForm host={host} />
    </Page>
  );
}

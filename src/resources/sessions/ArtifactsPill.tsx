import { type ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { plural } from '../../i18n/locales.js';
import { EMOJIcon } from '../emojis.js';
import { Pill } from './pills.js';

/** The composer pill that counts a session's artifacts or references and opens their list in the composer's picker. */
export function ArtifactsPill({ kind, count, onOpen }: { kind: 'artifacts' | 'references'; count: number; onOpen: () => void }): ReactElement {
  const { t } = useI18n();
  const icon = kind === 'artifacts' ? EMOJIcon.archive : EMOJIcon.link;
  return <Pill label={`${icon} ${plural(`sessions/${kind}/count`, count)}`} title={t(`sessions/${kind}/hint`)} onOpen={onOpen} />;
}

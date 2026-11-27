import type { ReactElement, ReactNode } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Button, Listable, Note, Text } from '../../ui/index.js';
import { readTrust, keepTrust, trustPath, withoutAnswer, type TrustAnswers } from '../../bridges/trust.js';
import { sendTrust } from '../../bridges/trust-ask.js';
import { folderLabel } from '../../bridges/words.js';
import { confirm, failed } from '../../shell/notify/index.js';

/**
 * The folders this browser answered about on the host, and a way to take an
 * answer back once the person confirms it. Forgetting a yes tells the host at once, so it stops trusting
 * the folder; either way the folder is asked about again next time.
 */
export function TrustedFolders({ host, heading }: { host: string; /** Drawn in place of the plain title. */ heading?: ReactNode }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const answers = useStore<TrustAnswers>(trustPath(host)) ?? readTrust(host);
  const rows = Object.entries(answers);

  const forget = async (uri: string, trusted: boolean): Promise<void> => {
    const asked = await confirm({
      title: t('trust/host/forgetTitle', { folder: folderLabel(uri) }),
      body: t(trusted ? 'trust/host/forgetTrusted' : 'trust/host/forgetUntrusted'),
      confirmLabel: t('trust/host/forget'),
      tone: 'danger',
    });
    if (!asked) return;
    const next = withoutAnswer(answers, uri);
    if (!trusted) {
      keepTrust(scena.store, host, next);
      return;
    }
    sendTrust(scena.store, host, next).catch((error: unknown) => failed(t('trust/host/notForgotten'), error));
  };

  return (
    <>
      {heading ?? <Text variant="h3" text={t('trust/host/title')} />}
      <Note>{t('trust/host/hint')}</Note>
      {rows.length === 0 ? <Note>{t('trust/host/none')}</Note> : (
        <Listable<(typeof rows)[number]>
          items={rows}
          getKey={([uri]) => uri}
          columns={[
            { key: 'folder', label: t('trust/host/folder'), sortable: true, render: ([uri]) => <code>{folderLabel(uri)}</code> },
            { key: 'answer', label: t('trust/host/answer'), render: ([, trusted]) => t(trusted ? 'trust/host/trusted' : 'trust/host/untrusted') },
            { key: 'forget', label: '', align: 'right', render: ([uri, trusted]) => <Button label={t('trust/host/forget')} size="sm" onClick={() => void forget(uri, trusted)} /> },
          ]}
        />
      )}
    </>
  );
}

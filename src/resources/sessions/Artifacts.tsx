import { type ReactElement } from 'react';
import { useI18n, useScena } from '@softov/scena/react';
import { plural } from '../../i18n/locales.js';
import { CopyButton, copyText } from '../../shell/controls/CopyButton.js';
import { done } from '../../shell/notify/index.js';
import { EMOJIcon } from '../emojis.js';
import { ARTIFACT_ICON, artifactName, artifactSections, copyOf, openOf, type Artifact } from './artifact-list.js';
import { Pill } from './pills.js';
import './artifact-list.css';

export type ArtifactKind = 'artifacts' | 'references';

/** The composer pill that counts a session's artifacts or references and opens their list. */
export function ArtifactsPill({ kind, count, onToggle }: { kind: ArtifactKind; count: number; onToggle: () => void }): ReactElement {
  const { t } = useI18n();
  const icon = kind === 'artifacts' ? EMOJIcon.archive : EMOJIcon.link;
  return <Pill label={`${icon} ${plural(`sessions/${kind}/count`, count)}`} title={t(`sessions/${kind}/hint`)} onOpen={onToggle} />;
}

/**
 * A session's artifacts or references, above the composer box: in sections by
 * type, VS Code's order, newest first. A click opens an entry: a web page in a
 * new tab, a host file in its viewer; a commit with only its hash copies it.
 * Each entry copies what it points at, and is removed from the session when
 * the host serves `vscode/removeSessionArtifact`.
 */
export function ArtifactsList({ host, kind, entries, onRemove }: {
  host: string;
  kind: ArtifactKind;
  entries: readonly Artifact[];
  /** Absent when the host cannot remove an entry. */
  onRemove?: (artifact: Artifact) => void;
}): ReactElement {
  const scena = useScena();
  const { t } = useI18n();

  const open = (one: Artifact): void => {
    const target = openOf(one);
    if (target.kind === 'web') window.open(target.url, '_blank', 'noopener,noreferrer');
    else if (target.kind === 'file') void scena.commands.execute('ahp.openFile', { host, uri: target.uri });
    else if (target.kind === 'copy') void copyText(target.text).then((copied) => { if (copied) done(t('sessions/artifacts/copied', { text: target.text })); });
  };

  return (
    <section className="web-shells web-artifacts" aria-label={t(`sessions/${kind}/title`)}>
      <h4 className="web-shells__title">{t(`sessions/${kind}/title`)}</h4>
      <div className="web-artifacts__body">
        {artifactSections(entries).map((section) => (
          <div key={section.type} className="web-artifacts__section">
            <h5 className="web-artifacts__section-title">{t(`sessions/artifacts/types/${section.type}`)}</h5>
            <ul className="web-shells__list web-artifacts__list">
              {section.entries.map((one) => {
                const copy = copyOf(one);
                const name = artifactName(one);
                const target = openOf(one);
                return (
                  <li key={one.id} className="web-shells__entry web-artifacts__entry">
                    <button
                      type="button"
                      className="web-shells__row web-artifacts__row"
                      title={target.kind === 'web' ? target.url : target.kind === 'file' ? one.uri : name}
                      disabled={target.kind === 'none'}
                      onClick={() => open(one)}
                    >
                      <span className="web-artifacts__icon" aria-hidden="true">{ARTIFACT_ICON[one.type]}</span>
                      <span className="web-shells__name">{name}</span>
                    </button>
                    {copy === undefined ? null : <CopyButton text={copy.text} label={copy.label} />}
                    {onRemove === undefined ? null : (
                      <button
                        type="button"
                        className="web-artifacts__remove"
                        aria-label={t(`sessions/${kind}/remove`, { name })}
                        title={t(`sessions/${kind}/remove`, { name })}
                        onClick={() => onRemove(one)}
                      >
                        {EMOJIcon.close}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

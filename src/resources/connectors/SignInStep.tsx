import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { Alert, Button, CheckBox, TextField } from '@softov/scena/ui';
import { awaitSignIn, finishSignIn, startSignIn, type ConnectorRow, type ConnectorWanted, type SignInRow, type SignInStarted } from '../../bridges/connectors.js';
import { hostSaid } from '../../bridges/said.js';
import { CopyButton } from '../../shell/controls/CopyButton.js';
import { when } from '../sessions/turn.js';
import { signedInOf } from './form.js';
import './signin.css';

/**
 * The sign-in under an adapter's fields: a button labelled by the host, then a
 * step that depends on the flow. A pasted sign-in opens the provider's page and
 * takes the code it shows. A device sign-in shows the code the host answered,
 * for the person to type on the provider's page, and waits for the approval.
 * Once it finishes, or when a made connector holds a device sign-in, the step
 * says who it is signed in as and the last check, and offers to sign in again.
 * The code and the started sign-in live only in this component's state, and
 * are cleared when the step ends, however it ends.
 */
export function SignInStep({ host, signIn, held, provider, wanted, disabled, byHand, onByHand, onDone }: {
  host: string;
  signIn: SignInRow;
  /** The made connector as the host lists it now; absent on a new form. */
  held?: ConnectorRow;
  /** What the done step names as the provider: the adapter's title. */
  provider: string;
  /** The put the sign-in finishes as, with the config from `configForSignIn`. */
  wanted: ConnectorWanted;
  disabled: boolean;
  /** Whether the fields a device sign-in fills are drawn, for a person to type them. */
  byHand: boolean;
  onByHand: (on: boolean) => void;
  onDone: (row: ConnectorRow) => void;
}): ReactElement {
  const { t } = useI18n();
  const [started, setStarted] = useState<SignInStarted | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  /** The connector the last sign-in finished as; null before one finishes. */
  const [signedIn, setSignedIn] = useState<ConnectorRow | null>(null);

  // An answer that comes after the form closed is dropped, so a closed step finishes nothing.
  const live = useRef(true);
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  // Which sign-in is current. Ending the step moves it, so a device wait that answers after a cancel finishes nothing.
  const attempt = useRef(0);

  const end = (): void => { attempt.current += 1; setStarted(null); setCode(''); setBusy(false); };

  const finished = (row: ConnectorRow): void => { end(); setSignedIn(row); onDone(row); };

  // What the host lists wins over what the sign-in answered, since a later check changes it.
  const row = held ?? signedIn ?? undefined;
  const kept = row === undefined ? undefined : signedInOf(row.config, signIn);
  const check = row?.health?.check;
  const failed = (caught: unknown): void => { end(); setFailure(hostSaid(caught)); };

  const start = (): void => {
    const mine = attempt.current;
    setBusy(true);
    setFailure(null);
    startSignIn(host, wanted).then(
      (next) => {
        if (!live.current || attempt.current !== mine) return;
        setBusy(false);
        setStarted(next);
        if (next.flow === 'code') {
          window.open(next.url, '_blank', 'noopener');
          return;
        }
        awaitSignIn(host, next.state, Date.now() + next.expires * 1000).then(
          (row) => { if (live.current && attempt.current === mine) finished(row); },
          (caught: unknown) => { if (live.current && attempt.current === mine) failed(caught); },
        );
      },
      (caught: unknown) => { if (live.current && attempt.current === mine) failed(caught); },
    );
  };

  const finish = (): void => {
    if (started === null) return;
    const mine = attempt.current;
    setBusy(true);
    finishSignIn(host, started.state, code).then(
      (row) => { if (live.current && attempt.current === mine) finished(row); },
      (caught: unknown) => { if (live.current && attempt.current === mine) failed(caught); },
    );
  };

  return (
    <div className="web-connector-form__signin">
      {started === null && (signedIn !== null || kept !== undefined) ? (
        <>
          <p className="web-connector-form__signed-in">{kept?.account === undefined ? t('connectors/signIn/with', { provider }) : t('connectors/signIn/as', { account: kept.account })}</p>
          {check === undefined ? null : <p className="web-note">{t('connectors/signIn/lastCheck', { result: t(`connectors/health/${check.result}`), at: when(check.at) })}</p>}
          <div className="web-connector-form__signin-start">
            <Button label={t('connectors/signIn/again')} disabled={disabled || busy} onClick={start} />
          </div>
          {signIn.flow === 'device' ? <CheckBox label={t('connectors/signIn/byHand')} value={byHand} onChange={onByHand} /> : null}
        </>
      ) : started === null ? (
        <>
          <div className="web-connector-form__signin-start">
            <Button label={signIn.title} disabled={disabled || busy} onClick={start} />
          </div>
          {signIn.flow === 'device'
            ? <CheckBox label={t('connectors/signIn/byHand')} value={byHand} onChange={onByHand} />
            : <p className="web-note">{t('connectors/signIn/orType')}</p>}
        </>
      ) : started.flow === 'device' ? (
        <>
          <span className="web-connector-form__label">{signIn.title}</span>
          <p className="web-note">
            {t('connectors/signIn/device')}{' '}
            <a href={started.url} target="_blank" rel="noopener noreferrer">{t('connectors/signIn/openPage')}</a>{' '}
            <CopyButton text={started.url} label={t('connectors/signIn/copyLink')} />
          </p>
          <div className="web-connector-form__device-code">
            <code>{started.code}</code>
            <CopyButton text={started.code} label={t('connectors/signIn/copyCode')} />
          </div>
          <p className="web-note">{t('connectors/signIn/waiting')}</p>
          <div className="web-page__actions">
            <Button label={t('connectors/signIn/cancel')} onClick={end} />
          </div>
        </>
      ) : (
        <>
          <span className="web-connector-form__label">{signIn.title}</span>
          <p className="web-note">
            {t('connectors/signIn/step')}{' '}
            <a href={started.url} target="_blank" rel="noopener noreferrer">{t('connectors/signIn/openAgain')}</a>
          </p>
          <TextField label={t('connectors/signIn/code')} type="password" value={code} disabled={busy} onChange={setCode} />
          <div className="web-page__actions">
            <Button label={t('connectors/signIn/finish')} variant="primary" disabled={code === '' || busy} onClick={finish} />
            <Button label={t('connectors/signIn/cancel')} disabled={busy} onClick={end} />
          </div>
        </>
      )}
      {failure === null ? null : <Alert tone="danger" title={t('connectors/signIn/failed')} message={failure} />}
    </div>
  );
}

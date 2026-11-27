import { useMemo, useState, type ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { Alert, Button, CheckBox, ChoicePicker, Field, Note, PageActions, TextField } from '../../ui/index.js';
import { rootReducer, type RootState } from '@microsoft/agent-host-protocol';
import { useChannel } from '../../bridges/channel.js';
import { ROOT } from '../../bridges/data.js';
import { boundSubjects, grantCatalog, subjectsOf } from '../../bridges/grants.js';
import type { Grant } from '../../bridges/people.js';
import { hostSaid } from '../../bridges/said.js';
import { mintToken, type MintedToken } from '../../bridges/tokens.js';
import { CopyButton } from '../../ui/control/CopyButton.js';
import { RoleGrants } from '../users/RoleGrants.js';
import { EXPIRY_CHOICES, expiresAt, type ExpiryChoice } from './expiry.js';

interface MintFormProps {
  host: string;
  /** Whose key, when it is not the signed-in person's own. */
  user?: string;
  /** The grants a key may be limited to: what the person's roles give. */
  grants: readonly Grant[];
  /** Told after a mint, so the list reads again. */
  onMinted: () => void;
}

/**
 * *New key*: a label, how long it lasts, and every grant, or the operations
 * picked on cards as a role's grants are, offering only what the person holds.
 * The secret the mint answers shows once, with *Copy*, and is gone on *Done*:
 * the host keeps only its hash, and nothing here keeps it either.
 */
export function MintForm({ host, user, grants, onMinted }: MintFormProps): ReactElement {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [expiry, setExpiry] = useState<ExpiryChoice>('90');
  const [day, setDay] = useState('');
  const [every, setEvery] = useState(true);
  const [picked, setPicked] = useState<readonly Grant[]>([]);
  // Subjects added from *Add subject* that no picked grant names yet.
  const [shown, setShown] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [minted, setMinted] = useState<MintedToken | null>(null);
  const root = useChannel<RootState>(host, ROOT, rootReducer);
  const catalog = useMemo(() => grantCatalog(root.state?._meta), [root.state?._meta]);

  const reset = (): void => {
    setOpen(false);
    setLabel('');
    setExpiry('90');
    setDay('');
    setEvery(true);
    setPicked([]);
    setShown([]);
    setFailure(null);
  };
  const ready = !busy && !(expiry === 'date' && day === '') && (every || picked.length > 0);

  const mint = async (): Promise<void> => {
    setBusy(true);
    setFailure(null);
    try {
      const expires = expiresAt(expiry, day, Date.now());
      const made = await mintToken(host, {
        ...(user === undefined ? {} : { user }),
        ...(label.trim() === '' ? {} : { label: label.trim() }),
        ...(every ? {} : { grants: [...picked] }),
        ...(expires === undefined ? {} : { expires }),
      });
      reset();
      setMinted(made);
      onMinted();
    } catch (caught) {
      setFailure(hostSaid(caught));
    } finally {
      setBusy(false);
    }
  };

  if (minted !== null) {
    return (
      <div className="web-mint__secret" role="status">
        <strong>{t('profile/keys/mint/madeTitle', { name: minted.label ?? minted.id })}</strong>
        <Note>{t('profile/keys/mint/once')}</Note>
        <span className="web-mint__secret-line">
          <code className="web-mint__secret-text">{minted.secret}</code>
          <CopyButton text={minted.secret} label={t('profile/keys/mint/copy')} />
        </span>
        <span>
          <Button size="sm" variant="primary" label={t('profile/keys/mint/done')} onClick={() => setMinted(null)} />
        </span>
      </div>
    );
  }

  if (!open) return <span><Button size="sm" label={`+ ${t('profile/keys/mint/new')}`} onClick={() => setOpen(true)} /></span>;

  const cards = subjectsOf(picked, catalog, shown);
  const addable = boundSubjects(grants, catalog).filter((subject) => !cards.includes(subject));
  const whose = user === undefined ? '' : 'Of';

  return (
    <div className="web-mint web-form">
      <TextField label={t('profile/keys/mint/label')} hint={t('profile/keys/mint/labelHint')} value={label} autoFocus onChange={(next) => setLabel(next)} />
      <span className="web-mint__expiry">
        <ChoicePicker label={t('profile/keys/mint/expiry')} options={EXPIRY_CHOICES.map((choice) => ({ value: choice, label: t(`profile/keys/mint/expiries/${choice}`) }))} value={expiry} onChange={(next) => setExpiry(next as ExpiryChoice)} />
        {expiry === 'date' ? (
          <TextField type="date" value={day} ariaLabel={t('profile/keys/mint/day')} onChange={(next) => setDay(next)} />
        ) : null}
      </span>
      <Field name="grants" label={t('profile/keys/mint/grants')} hint={t('profile/keys/mint/grantsHint')}>
        <CheckBox label={user === undefined ? t('profile/keys/everyGrant') : t('profile/keys/everyGrantOf', { id: user })} value={every} onChange={setEvery} />
        {every ? null : grants.length === 0 ? <Note inline>{t('profile/keys/mint/noGrants')}</Note> : (
          <>
            <RoleGrants
              grants={picked}
              catalog={catalog}
              shown={shown}
              onChange={setPicked}
              onShow={setShown}
              readOnly={false}
              bound={grants}
              emptyNote={t('profile/keys/mint/noSubject')}
              {...(addable.length === 0 ? {} : { addHint: t(`profile/keys/mint/addHint${whose}`, { id: user ?? '', subjects: addable.join(', ') }) })}
            />
            <Note inline>
              {picked.length === 0 ? t('profile/keys/mint/holdsNone') : t(`profile/keys/mint/holds${whose}`, { id: user ?? '', grants: picked.join(' ') })}
            </Note>
          </>
        )}
      </Field>
      {failure === null ? null : <Alert tone="danger" message={failure} />}
      <PageActions>
        <Button variant="primary" label={t('profile/keys/mint/mint')} disabled={!ready} onClick={() => void mint()} />
        <Button label={t('profile/keys/mint/cancel')} onClick={reset} />
      </PageActions>
    </div>
  );
}

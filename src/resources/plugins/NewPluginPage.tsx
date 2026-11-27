import { useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Blocks, Button, ChoiceCards, Page, Section, Spinner, Text, TextField } from '../../ui/index.js';
import { ahpPaths } from '../../bridges/data.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { installPlugin, PLUGINS, writePlugin, type PluginChanged } from '../../bridges/plugins.js';
import { hostSaid } from '../../bridges/said.js';
import CodeEditor from '../editor/CodeEditor.js';
import { ID_PATTERN } from '../connectors/form.js';
import { EMOJIcon } from '../emojis.js';
import { rereadAfterChange } from './actions.js';
import { packageFollows, sourceFollows, starterPackage, starterSource } from './starter.js';
import { newPluginTab } from './state.js';
import './new-plugin.css';

/** How a new plugin comes to the host: installed from a source, or written here. */
type How = 'add' | 'write';

/** One file of a written plugin, in the code editor under its name. */
function FileField({ name, language, value, onChange }: { name: string; language: 'typescript' | 'json'; value: string; onChange: (text: string) => void }): ReactElement {
  return (
    <div className="oo-field">
      <span className="oo-field__label">{name}<span className="oo-field__required">*</span><span className="oo-field__type">{language}</span></span>
      <div className="web-new-plugin__editor">
        <CodeEditor value={value} language={language} onChange={onChange} />
      </div>
    </div>
  );
}

/**
 * The page a plugin is added on: from a source the host installs with npm, or
 * written as one TypeScript file and its package.json. Each way shows only
 * when the host offers its command. A finished one opens the plugin's page.
 */
export default function NewPluginPage({ host }: { host: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const canAdd = offers.methods.includes(PLUGINS.install);
  const canWrite = offers.methods.includes(PLUGINS.write);
  const [chosen, setChosen] = useState<How>('add');
  const how: How = canAdd && canWrite ? chosen : canAdd ? 'add' : 'write';
  const [source, setSource] = useState('');
  const [id, setId] = useState('');
  const [code, setCode] = useState(() => starterSource(''));
  const [pkg, setPkg] = useState(() => starterPackage(''));
  const [busy, setBusy] = useState(false);
  const [refused, setRefused] = useState<string | null>(null);

  const changeId = (next: string): void => {
    setCode((text) => sourceFollows(text, id, next));
    setPkg((text) => packageFollows(text, id, next));
    setId(next);
  };

  const run = async (call: () => Promise<PluginChanged>): Promise<void> => {
    setBusy(true);
    setRefused(null);
    try {
      const done = await call();
      await rereadAfterChange(host);
      scena.surfaces.close(newPluginTab(host));
      await scena.commands.execute('ahp.openPlugin', { host, id: done.id });
    } catch (error) {
      setRefused(hostSaid(error));
      setBusy(false);
    }
  };

  const ready = how === 'add'
    ? source.trim() !== ''
    : ID_PATTERN.test(id) && code.trim() !== '' && pkg.trim() !== '';

  return (
    <Page>
      <Text variant="h2" text={`${EMOJIcon.hostPlugins} ${t('plugins/new/title')}`} />
      <Blocks>
        {canAdd && canWrite ? (
          <>
            <Section title={t('plugins/new/how')} small />
            <ChoiceCards
              options={(['add', 'write'] as const).map((one) => ({ id: one, label: t(`plugins/new/${one}`), hint: t(`plugins/new/${one}Hint`) }))}
              picked={how === undefined ? [] : [how]}
              many={false}
              disabled={busy}
              onPick={(id) => { setChosen(id as 'add' | 'write'); setRefused(null); }}
            />
          </>
        ) : null}
        {how === 'add' ? (
          <TextField label={t('plugins/new/source')} required typeTag="string" hint={t('plugins/new/sourceHint')} value={source} disabled={busy} onChange={setSource} />
        ) : (
          <>
            <TextField label={t('plugins/new/id')} required typeTag="string" hint={t('plugins/new/idHint')} value={id} disabled={busy} onChange={changeId} />
            <FileField name="index.ts" language="typescript" value={code} onChange={setCode} />
            <FileField name="package.json" language="json" value={pkg} onChange={setPkg} />
          </>
        )}
        {refused === null ? null : <Alert tone="danger" title={t(how === 'add' ? 'plugins/new/addFailed' : 'plugins/new/writeFailed')} message={refused} />}
        <div className="web-new-plugin__submit">
          <Button
            variant="primary"
            label={t(how === 'add' ? (busy ? 'plugins/new/adding' : 'plugins/new/addButton') : (busy ? 'plugins/new/creating' : 'plugins/new/create'))}
            disabled={!ready || busy}
            onClick={() => void run(how === 'add' ? () => installPlugin(host, source.trim()) : () => writePlugin(host, id, code, pkg))}
          />
          {busy ? <Spinner label={t('plugins/new/waiting')} /> : null}
        </div>
      </Blocks>
    </Page>
  );
}

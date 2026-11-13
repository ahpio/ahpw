import { useMemo, useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Button, SchemaForm, Text, type JsonSchemaObject } from '@softov/scena/ui';
import { ahpPaths } from '../../bridges/data.js';
import { useHostNames, useShownHosts } from '../../bridges/hosts.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { useServingHosts } from '../../bridges/served.js';
import { embedMode } from '../../shell/embed/index.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { JsonCodeEditor } from '../editor/JsonCodeEditor.js';
import { SETTINGS_VIEWS } from '../editor/yamlView.js';
import { writeLastHost } from '../sessions/last-host.js';
import { may } from './actions.js';
import { COMPUTER_PROVIDER, COMPUTERS_SCHEME, createComputer } from './machines.js';
import { formSchema, manifestBody, nameProblem } from './manifest.js';
import { EMOJIcon } from '../emojis.js';

/**
 * Makes a computer: its host with every host and its name, then the answers to
 * the host's manifest schema as its settings, in fields, json or yaml.
 */
export default function NewComputerPage({ host: opened }: { host: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const hosts = useServingHosts(useShownHosts(), COMPUTERS_SCHEME);
  const hostName = useHostNames();
  const [host, setHost] = useState(opened);
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const manifest = offers.providers[COMPUTER_PROVIDER]?.manifest;
  const picking = embedMode() === 'multi' && hosts.length > 1;
  // The host and the name, in a form of their own: neither is sent in the body, so neither shows in its json or yaml.
  const head = useMemo<JsonSchemaObject>(() => ({
    type: 'object',
    properties: {
      ...(picking ? { host: { type: 'string', title: t('computers/new/host'), enum: hosts, 'x-enumOptions': hosts.map((one) => ({ value: one, label: hostName(one) })) } } : {}),
      name: { type: 'string', title: t('computers/new/name'), description: t('computers/new/nameHint') },
    },
  }), [picking, hosts, hostName, t]);
  const fields = useMemo(() => formSchema(manifest), [manifest]);
  const [top, setTop] = useState<Record<string, unknown>>({ host: opened });
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [jsonValid, setJsonValid] = useState(true);
  const name = typeof top.name === 'string' ? top.name : '';
  // Another host has its own manifest: its answers start again, the name stays.
  const changeTop = (next: Record<string, unknown>): void => {
    if (typeof next.host === 'string' && next.host !== host) {
      setHost(next.host);
      writeLastHost(next.host);
      setAnswers({});
    }
    setTop(next);
  };
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  if (!may(offers, 'write')) return <PageAlert tone="warning" message={t('computers/new/noCreate')} />;
  const problem = nameProblem(name);
  const create = (): void => {
    setBusy(true);
    setFailure(null);
    const made = name.trim();
    void createComputer(host, offers, made, manifestBody(answers)).then(
      () => {
        scena.surfaces.close('computer:new');
        void scena.commands.execute('ahp.openComputer', { host, id: made });
      },
      (error: unknown) => {
        setFailure(error instanceof Error ? error.message : String(error));
        setBusy(false);
      },
    );
  };

  return (
    <div className="web-page web-form">
      <Text variant="h2" text={`${EMOJIcon.computers} ${t('computers/commands/new')}`} />
      <div className="web-connector-form">
        <SchemaForm
          schema={head}
          value={top}
          onChange={changeTop}
          errors={problem === undefined || problem === 'nameEmpty' ? {} : { name: t(`computers/new/${problem}`) }}
          jsonTextRoot={false}
        />
        {Object.keys(fields.properties ?? {}).length === 0 ? null : (
          <section className="web-connector-form__adapter" aria-label={t('computers/new/settings')}>
            <h3 className="web-connector-form__heading web-host-label"><span aria-hidden="true">{EMOJIcon.settings}</span>{t('computers/new/settings')}</h3>
            <SchemaForm key={host} schema={fields} views={SETTINGS_VIEWS} value={answers} onChange={setAnswers} jsonEditor={JsonCodeEditor} onJsonValidChange={setJsonValid} />
          </section>
        )}
      </div>
      {failure === null ? null : <Alert tone="danger" message={failure} />}
      <div className="web-page__actions">
        <Button label={t('computers/new/create')} variant="primary" disabled={problem !== undefined || busy || !jsonValid} {...(jsonValid ? {} : { title: t('host/settings/fixJson') })} onClick={create} />
        <Button label={t('computers/new/cancel')} onClick={() => scena.surfaces.close('computer:new')} />
      </div>
    </div>
  );
}

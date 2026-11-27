import { useMemo, useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Blocks, Button, Group, type JsonSchemaObject, Page, PageActions, SchemaForm, Text } from '../../ui/index.js';
import { ahpPaths } from '../../bridges/data.js';
import { useHostNames, useShownHosts } from '../../bridges/hosts.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { useOwnGrants } from '../../bridges/own-grants.js';
import { useServingHosts } from '../../bridges/served.js';
import { embedMode } from '../../shell/embed/index.js';
import { PageAlert } from '../../ui/display/PageAlert.js';
import { JsonCodeEditor } from '../editor/JsonCodeEditor.js';
import { SETTINGS_VIEWS } from '../editor/yamlView.js';
import { writeLastHost } from '../sessions/last-host.js';
import { may, writable } from './actions.js';
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
  const grants = useOwnGrants(host, offers);
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

  if (!writable(offers)) return <PageAlert tone="warning" message={t('computers/new/noCreate')} />;
  if (!may(offers, grants, 'write')) return <PageAlert tone="warning" message={t('computers/new/noPermission')} />;
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
    <Page>
      <Text variant="h2" text={`${EMOJIcon.computers} ${t('computers/commands/new')}`} />
      <Blocks>
        <SchemaForm
          schema={head}
          value={top}
          onChange={changeTop}
          errors={problem === undefined || problem === 'nameEmpty' ? {} : { name: t(`computers/new/${problem}`) }}
          jsonTextRoot={false}
        />
        {Object.keys(fields.properties ?? {}).length === 0 ? null : (
          <Group title={t('computers/new/settings')} icon={EMOJIcon.settings}>
            <SchemaForm key={host} schema={fields} views={SETTINGS_VIEWS} value={answers} onChange={setAnswers} jsonEditor={JsonCodeEditor} onJsonValidChange={setJsonValid} />
          </Group>
        )}
      </Blocks>
      {failure === null ? null : <Alert tone="danger" message={failure} />}
      <PageActions>
        <Button label={t('computers/new/create')} variant="primary" disabled={problem !== undefined || busy || !jsonValid} {...(jsonValid ? {} : { title: t('host/settings/fixJson') })} onClick={create} />
        <Button label={t('computers/new/cancel')} onClick={() => scena.surfaces.close('computer:new')} />
      </PageActions>
    </Page>
  );
}

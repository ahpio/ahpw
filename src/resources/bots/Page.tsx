import { useEffect, useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Button, DetailList, Text, type DetailItem } from '@softov/scena/ui';
import type { AgentInfo } from '@microsoft/agent-host-protocol';
import { useChannel } from '../../bridges/channel.js';
import { ahpPaths } from '../../bridges/data.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { useOwnGrants } from '../../bridges/own-grants.js';
import { embedMode } from '../../shell/embed/index.js';
import { HostTag } from '../../shell/explorer/HostLines.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { timeOf } from '../automations/words.js';
import { Bood } from './Bood.js';
import { BOTS, botsIn, botsReducer, mayChangeBots, type BotsState } from './catalogue.js';
import { refKey } from '../../bridges/hosts.js';
import { BOT_CHAT_OPENING, BOT_EDIT_ASKED } from './state.js';
import { BotForm } from './Edit.js';
import { DangerZone } from '../../shell/controls/DangerZone.js';
import { PageSpinner } from '../../shell/view/PageSpinner.js';

/** One bot: its figure, what it is for, whose it is, and its chat; Edit swaps the page for its form. */
export default function BotPage({ host, slug }: { host: string; slug?: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const { state, error } = useChannel<BotsState>(host, BOTS, botsReducer);
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const grants = useOwnGrants(host, offers);
  const agents = useStore<AgentInfo[]>(ahpPaths(host).agents) ?? [];
  const key = refKey(host, slug ?? '');
  const opening = useStore<string | null>(BOT_CHAT_OPENING) === key;
  const [editing, setEditing] = useState(false);
  // `ahp.editBot` from the bots list or the floating bot opens this page and asks it for the form.
  const asked = useStore<string | null>(BOT_EDIT_ASKED) === key;
  const edits = mayChangeBots(offers, grants, 'put');
  useEffect(() => {
    // An ask waits while the reader's grants are read, so it is not lost before they arrive.
    if (!asked || !edits) return;
    setEditing(true);
    scena.store.set(BOT_EDIT_ASKED, null);
  }, [asked, edits]);
  if (error !== null) return <PageAlert tone="danger" title={t('bots/notices/none')} message={error} />;
  if (state === undefined) return <PageSpinner label={t('bots/notices/reading')} />;
  const bot = botsIn(state).find((one) => one.id === slug);
  if (bot === undefined) return <PageAlert tone="warning" message={t('bots/notices/gone')} />;
  if (editing) return <BotForm host={host} slug={bot.id} onDone={() => setEditing(false)} />;

  // A bot's preset is the agent it starts from, in place of its provider.
  const agent = bot.preset ?? bot.provider;
  const facts: DetailItem[] = [
    ...(embedMode() === 'multi' ? [{ label: t('common/host'), value: <HostTag host={host} /> }] : []),
    ...(bot.labels.length === 0 ? [] : [{ label: t('bots/facts/labels'), value: bot.labels.join(', ') }]),
    { label: t('bots/facts/owner'), value: bot.owner },
    ...(agent === undefined ? [] : [{ label: t('bots/facts/agent'), value: agents.find((one) => one.provider === agent)?.displayName ?? agent }]),
    ...(bot.model === undefined ? [] : [{ label: t('bots/facts/model'), value: bot.model }]),
    ...(bot.computer === undefined ? [] : [{ label: t('bots/facts/computer'), value: bot.computer }]),
    { label: t('bots/facts/workspace'), value: <span className="web-method">{bot.workspace}</span> },
    { label: t('bots/facts/created'), value: timeOf(bot.createdAt) },
    { label: t('bots/facts/changed'), value: timeOf(bot.updatedAt) },
  ];
  const run = (command: string): void => void scena.commands.execute(command, { host, slug: bot.id });

  return (
    <div className="web-page">
      <div className="web-bot">
        <Bood body={bot.body} color={bot.color} width={120} />
        <div className="web-bot__words">
          <Text variant="h2" text={bot.name} />
          {(bot.description ?? '').trim() === '' ? null : <p className="web-bot__description">{bot.description}</p>}
          <div className="web-page__actions">
            <Button label={t(opening ? 'bots/chat/opening' : 'bots/actions/chat')} variant="primary" disabled={opening} onClick={() => run('ahp.chatWithBot')} />
            {edits ? <Button label={t('bots/actions/edit')} onClick={() => setEditing(true)} /> : null}
          </div>
        </div>
      </div>
      <DetailList items={facts} columns={2} />
      {(bot.instructions ?? '').trim() === '' ? null : (
        <>
          <Text variant="h3" text={t('bots/facts/instructions')} />
          <p className="web-bot__instructions">{bot.instructions}</p>
        </>
      )}
      {mayChangeBots(offers, grants, 'delete') ? <DangerZone label={t('bots/actions/delete')} onClick={() => run('ahp.deleteBot')} /> : null}
    </div>
  );
}

import type { ReactElement, ReactNode } from 'react';
import { useI18n } from '@softov/scena/react';
import { Alert, DetailList, Text, type DetailItem } from '@softov/scena/ui';
import { Markdown } from '../../shell/markdown/Markdown.js';
import type { ListedPlugin, PluginDetails } from '../../bridges/plugins.js';
import type { KeptTab } from '../../shell/view/KeptTabs.js';
import { RemovableChip } from '../../shell/view/RemovableChip.js';
import { categoryWord } from './Explorer.js';
import { ProvidesList } from './ProvidesList.js';
import { listName } from './rows.js';
import './ListTabs.css';

/** A README's image is not drawn: the page never fetches from the host a list names, and most are badges. */
const noImage = (): ReactNode => null;

/** A README's line of badges: only images, each alone or inside a link, such as `[![npm](...)](...)`. */
const BADGES = /^[ \t]*(?:\[?!\[[^\]]*\]\([^)]*\)(?:\]\([^)]*\))?[ \t]*)+$/gmu;

/** A line of only HTML tags, such as `<picture>` or `<img ...>`, which scena's `Markdown` would draw as its text. */
const HTML_ONLY = /^[ \t]*(?:<[^>\n]+>[ \t]*)+$/gmu;

/**
 * A README as a page reads it: its lines of badges and its lines of only HTML
 * taken out, so neither leaves a gap or shows as text. Markdown is kept.
 */
export const withoutBadges = (text: string): string => text.replace(BADGES, '').replace(HTML_ONLY, '');

/** A README or a changelog as a page draws it, with no image fetched. */
export function ReadText({ text }: { text: string }): ReactElement {
  return <Markdown text={withoutBadges(text)} image={noImage} />;
}

/** A URL a page may link to: an `https:` one, as a string or under `url`. */
export function urlOf(value: unknown): string | undefined {
  const text = typeof value === 'string' ? value : typeof value === 'object' && value !== null ? (value as { url?: unknown }).url : undefined;
  return typeof text === 'string' && /^https:\/\//iu.test(text) ? text : undefined;
}

/** One section of the facts column: its heading and its facts. */
export interface FactsSection {
  title: string;
  items: DetailItem[];
}

/** One place to read more about a plugin, by its name. */
export interface Resource {
  title: string;
  url: string | undefined;
}

/**
 * The column beside a plugin's tabs, as VS Code draws an extension's: an
 * installed plugin's *Installation*, then *Marketplace* when a list holds it,
 * then its categories and where to read more. Each place is linked once, by
 * its URL and by its name.
 */
export function FactsColumn({ sections, categories, resources }: { sections: FactsSection[]; categories: readonly string[]; resources: Resource[] }): ReactElement {
  const { t } = useI18n();
  const seen = new Set<string>();
  const links = resources.filter((one): one is { title: string; url: string } => {
    if (one.url === undefined || seen.has(one.url) || seen.has(one.title)) return false;
    seen.add(one.url);
    seen.add(one.title);
    return true;
  });
  return (
    <aside className="web-listed__facts">
      {sections.filter((one) => one.items.length > 0).map((one) => (
        <section key={one.title} className="web-listed__section">
          <Text variant="h3" text={one.title} />
          <DetailList items={one.items} columns={1} />
        </section>
      ))}
      {categories.length === 0 ? null : (
        <section className="web-listed__section">
          <Text variant="h3" text={t('plugins/listed/categories')} />
          <div className="web-plugin__tags">
            {categories.map((category) => <RemovableChip key={category} label={categoryWord(t, category)} removeLabel={category} />)}
          </div>
        </section>
      )}
      {links.length === 0 ? null : (
        <section className="web-listed__section">
          <Text variant="h3" text={t('plugins/listed/resources')} />
          <ul className="web-listed__resources">
            {links.map((one) => <li key={one.url}><a href={one.url} target="_blank" rel="noreferrer">{one.title}</a></li>)}
          </ul>
        </section>
      )}
    </aside>
  );
}

/** A tab's panel beside the facts column; the column goes under it on a narrow page. */
export function PageBody({ column, children }: { column: ReactNode; children: ReactNode }): ReactElement {
  return (
    <div className="web-listed__body">
      <div className="web-listed__main">{children}</div>
      {column}
    </div>
  );
}

/** The facts of a listed version, as *Marketplace* names them. */
export function marketplaceFacts(plugin: ListedPlugin, version: string, t: (key: string) => string): DetailItem[] {
  const published = plugin.versions.find((one) => one.version === version)?.published?.slice(0, 10);
  return [
    { label: t('plugins/listed/identifier'), value: plugin.id },
    { label: t('plugins/facts/version'), value: version },
    ...(published === undefined ? [] : [{ label: t('plugins/listed/published'), value: published }]),
    { label: t('plugins/listed/list'), value: listName(plugin.marketplace) },
    ...(plugin.author === undefined ? [] : [{ label: t('plugins/listed/author'), value: plugin.author }]),
    ...(plugin.license === undefined ? [] : [{ label: t('plugins/listed/license'), value: plugin.license }]),
  ];
}

/** The settings a version's manifest declares, each with its title and what it does. */
function SettingsList({ schema }: { schema: Record<string, unknown> | undefined }): ReactElement {
  const { t } = useI18n();
  const properties = schema?.properties;
  const entries = typeof properties === 'object' && properties !== null ? Object.entries(properties as Record<string, Record<string, unknown>>) : [];
  if (entries.length === 0) return <p className="web-note">{t('plugins/listed/noSettings')}</p>;
  return (
    <DetailList
      columns={1}
      items={entries.map(([key, one]) => ({
        label: typeof one.title === 'string' ? one.title : key,
        value: typeof one.description === 'string' ? one.description : String(one.type ?? ''),
      }))}
    />
  );
}

/** What the host could not fetch of a version, one alert each. */
function Problems({ details }: { details: PluginDetails }): ReactElement | null {
  if (details.problems === undefined || details.problems.length === 0) return null;
  return <>{details.problems.map((one) => <Alert key={one.part} tone="warning" message={one.problem} />)}</>;
}

/**
 * The tabs of a plugin a list holds and the host has not installed, from its
 * list entry and one version's files: *Overview*, the README; *Features*,
 * what it provides and its settings; and *Changelog* when the version has
 * one. Each sits beside the *Marketplace* column.
 */
export function listTabs(host: string, plugin: ListedPlugin, details: PluginDetails, t: (key: string) => string): KeptTab[] {
  const column = (
    <FactsColumn
      sections={[{ title: t('plugins/listed/marketplace'), items: marketplaceFacts(plugin, details.version, t) }]}
      categories={plugin.categories ?? []}
      resources={[
        { title: t('plugins/listed/repository'), url: urlOf(plugin.repository) },
        ...(details.links ?? []).map((link) => ({ title: link.title, url: urlOf(link.url) })),
        { title: t('plugins/listed/homepage'), url: urlOf(details.homepage) },
        { title: t('plugins/listed/issues'), url: urlOf(details.bugs) },
      ]}
    />
  );
  return [
    {
      key: 'overview',
      title: t('plugins/page/overview'),
      child: (
        <PageBody column={column}>
          <Problems details={details} />
          {details.readme === undefined ? <p className="web-note">{t('plugins/listed/noReadme')}</p> : <ReadText text={details.readme} />}
        </PageBody>
      ),
    },
    {
      key: 'features',
      title: t('plugins/listed/features'),
      child: (
        <PageBody column={column}>
          <Text variant="h3" text={t('plugins/page/provides')} />
          <ProvidesList host={host} contracts={details.contracts} />
          {Object.keys(details.contracts ?? {}).length === 0 ? <p className="web-note">{t('plugins/page/providesNothing')}</p> : null}
          <Text variant="h3" text={t('plugins/page/settings')} />
          <SettingsList schema={details.optionsSchema} />
        </PageBody>
      ),
    },
    ...(details.changelog === undefined ? [] : [{
      key: 'changelog',
      title: t('plugins/listed/changelog'),
      child: <PageBody column={column}><ReadText text={details.changelog} /></PageBody>,
    }]),
  ];
}

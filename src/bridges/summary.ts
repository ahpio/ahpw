import { combineDisposables } from '@softov/scena';
import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { ahpPaths, channelPath, hostBridge } from './data.js';
import { everyHost, onEachHost } from './hosts.js';
import type { Offers } from './offers.js';
import { plural } from '../i18n/locales.js';

/** The host's summary: how many rows each area holds, by state, and what its rows' alerts say. */
export const SUMMARY = { scheme: 'x-ahpd-summary', channel: 'x-ahpd-summary://' } as const;

/** An alert's level, worst first. */
export type AlertLevel = 'error' | 'warning' | 'info' | 'notice';
const LEVELS: readonly AlertLevel[] = ['error', 'warning', 'info', 'notice'];

/** The rows that say one alert: its level, its text, how many, and which. */
export interface AlertGroup {
  level: AlertLevel;
  text: string;
  count: number;
  rows: { id: string; title: string }[];
}

/** One area as the host sends it for this reader. */
export interface AreaSummary {
  /** The area's own channel URI. */
  channel: string;
  /** How many rows this reader sees. */
  total: number;
  /** Those rows by state, when the area has one. */
  states?: Record<string, number>;
  /** Their alerts grouped by level and text, worst first, when the area's rows carry alerts. */
  alerts?: AlertGroup[];
}

/** The summary's state: one entry for each area this reader may open. */
export interface SummaryState {
  areas: Record<string, AreaSummary>;
}

/** Each `x-ahpd-summary/changed` carries the whole summary, which replaces the one held. */
export function summaryReducer(state: SummaryState | undefined, action: { type: string; areas?: unknown }): SummaryState | undefined {
  if (action.type !== `${SUMMARY.scheme}/changed`) return state;
  const areas = action.areas;
  return typeof areas === 'object' && areas !== null ? { areas: areas as Record<string, AreaSummary> } : state;
}

/** Where the activity bar reads one area's badges: the error and warning counts, and the words beside each. */
export function summaryPaths(area: string): { errors: BindingPath; warnings: BindingPath; errorsLabel: BindingPath; warningsLabel: BindingPath } {
  return {
    errors: `$/ahp/summary/${area}/errors` as BindingPath,
    warnings: `$/ahp/summary/${area}/warnings` as BindingPath,
    errorsLabel: `$/ahp/summary/${area}/errorsLabel` as BindingPath,
    warningsLabel: `$/ahp/summary/${area}/warningsLabel` as BindingPath,
  };
}

/**
 * Each area's alert groups over the summaries of every host: one group for
 * each level and text, its count summed and its rows joined, worst first and
 * then the group most rows say.
 */
export function mergedAlerts(states: readonly (SummaryState | undefined)[]): Map<string, AlertGroup[]> {
  const byArea = new Map<string, Map<string, AlertGroup>>();
  for (const state of states) {
    for (const [area, entry] of Object.entries(state?.areas ?? {})) {
      const groups = byArea.get(area) ?? new Map<string, AlertGroup>();
      byArea.set(area, groups);
      for (const group of entry.alerts ?? []) {
        const key = JSON.stringify([group.level, group.text]);
        const held = groups.get(key);
        if (held === undefined) groups.set(key, { ...group, rows: [...group.rows] });
        else {
          held.count += group.count;
          held.rows.push(...group.rows);
        }
      }
    }
  }
  const out = new Map<string, AlertGroup[]>();
  for (const [area, groups] of byArea) {
    out.set(area, [...groups.values()].sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level) || b.count - a.count || a.text.localeCompare(b.text)));
  }
  return out;
}

/** How many rows of one level the groups name. */
export const countOf = (groups: readonly AlertGroup[], level: AlertLevel): number =>
  groups.filter((one) => one.level === level).reduce((all, one) => all + one.count, 0);

/** The mark before a group's line, by level. */
const MARKS: Record<AlertLevel, string> = { error: '✖', warning: '⚠', info: 'ℹ', notice: '•' };

/** How many rows a line names before it says how many more. */
const ROWS_SHOWN = 3;

/** One line for each group: its mark, its text, and the rows that say it. */
export function alertLines(groups: readonly AlertGroup[]): string[] {
  return groups.map((group) => {
    const names = group.rows.slice(0, ROWS_SHOWN).map((one) => one.title);
    const more = group.rows.length - names.length;
    return `${MARKS[group.level]} ${group.text}: ${names.join(', ')}${more > 0 ? ` +${String(more)}` : ''}`;
  });
}

/** Whether the host serves the summary. */
const servesSummary = (offers: Offers | undefined): boolean => offers?.channels.includes(SUMMARY.scheme) === true;

/** A message of the words beside the badges, which changes with the chosen language. */
const LANGUAGE = '$/t/shell/nav/errors/other' as BindingPath;

/**
 * Follow the summary on each host that serves it, and keep each area's badges
 * at `summaryPaths`: the rows with an error and the rows with a warning, over
 * every host.
 *
 * The item's tooltip is scena's "name: count words" sentence, so the lines that
 * say what is wrong go after the last badge's words: each alert, and the rows
 * that say it. An area no host sends any more goes back to no badge.
 */
export function registerSummary(scena: Scena): Disposable {
  /** The area names a badge was written for, so one gone is cleared. */
  const written = new Set<string>();

  const put = (path: BindingPath, value: unknown): void => {
    if (scena.store.get(path) !== value) scena.store.set(path, value);
  };

  const sum = (): void => {
    const merged = mergedAlerts(everyHost(scena.store).map((host) => scena.store.get<SummaryState>(channelPath(host, SUMMARY.channel))));
    for (const area of new Set([...written, ...merged.keys()])) {
      const paths = summaryPaths(area);
      const groups = merged.get(area);
      if (groups === undefined) {
        for (const path of Object.values(paths)) put(path, undefined);
        written.delete(area);
        continue;
      }
      written.add(area);
      const errors = countOf(groups, 'error');
      const warnings = countOf(groups, 'warning');
      const lines = alertLines(groups);
      const errorsWord = plural('shell/nav/errors', errors);
      const warningsWord = plural('shell/nav/warnings', warnings);
      const after = lines.length === 0 ? '' : `\n${lines.join('\n')}`;
      put(paths.errors, errors);
      put(paths.warnings, warnings);
      // The lines go with the last badge drawn, so the sentence ends before them.
      put(paths.errorsLabel, warnings > 0 ? errorsWord : `${errorsWord}${after}`);
      put(paths.warningsLabel, `${warningsWord}${after}`);
    }
  };

  return combineDisposables(
    scena.store.subscribe(LANGUAGE, sum),
    onEachHost(scena, (host) => {
      let stop: (() => void) | undefined;
      const check = (): void => {
        const serving = servesSummary(scena.store.get<Offers>(ahpPaths(host).offers));
        if (serving && stop === undefined) stop = hostBridge(host).follow(SUMMARY.channel, summaryReducer as never);
        if (!serving && stop !== undefined) {
          stop();
          stop = undefined;
        }
      };
      check();
      sum();
      return combineDisposables(
        scena.store.subscribe(ahpPaths(host).offers, check),
        scena.store.subscribe(channelPath(host, SUMMARY.channel), sum),
        {
          dispose: () => {
            stop?.();
            stop = undefined;
            // The host is gone from the page, so its alerts leave the badges.
            queueMicrotask(sum);
          },
        },
      );
    }),
  );
}

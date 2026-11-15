import type { BindingPath } from '@softov/scena/types';

/** The automation open in `main`, as `{ host, resource }`. */
export const ACTIVE_AUTOMATION = '$/ahp/activeAutomation' as BindingPath;

/** The list's grouping, order and status filter; a header button is pressed while its choice is not the usual one. */
export const AUTOMATIONS_GROUP = '$/ahp/automations/group' as BindingPath;
export const AUTOMATIONS_SORT = '$/ahp/automations/sort' as BindingPath;
export const AUTOMATIONS_FILTER = '$/ahp/automations/filter' as BindingPath;

/** An automation's tab key: one tab each. */
export const automationTab = (host: string, resource: string): string => `automation:${host}:${resource}`;

/** The new-automation form's tab key. */
export const NEW_AUTOMATION_TAB = 'automation:new';

/** A tab of an automation's page to show, as `{ host, resource, at }`; `at` tells two asks for the same tab apart. */
export const AUTOMATION_SECTION = '$/ahp/automationSection' as BindingPath;

/** An ask to show a tab of an automation's page. */
export interface AutomationAsk { host: string; resource: string; at: number }

/** An automation page's tabs. */
export type AutomationTabKey = 'overview' | 'settings';

/** The tab an automation's page opens on: the one chosen last, kept while the page lives. */
let chosenTab: AutomationTabKey = 'overview';
export const automationTabKey = (): AutomationTabKey => chosenTab;
export function keepAutomationTabKey(key: string): void {
  if (key === 'overview' || key === 'settings') chosenTab = key;
}

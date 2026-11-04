/**
 * Running a channel's operations from a list, a page or a menu: an operation
 * that takes input opens its form in a dialog over the page; any other asks the
 * host's confirmation, when it has one, and runs.
 */

import { combineDisposables, translate } from '@softov/scena';
import type { BindingPath, Disposable, PickerAction, Scena } from '@softov/scena/types';
import { askFirst, invokeOperation, labelOf, madeId, sayRefused, type Operation } from '../../bridges/operations.js';

type Bag = Record<string, unknown>;

/** The dialog open over the page, or null. */
export const OPERATION_DIALOG = '$/ahp/operations/dialog' as BindingPath;

/** Where an operation runs: the host, the channel, and the record when it runs on one. */
export interface OperationPlace {
  host: string;
  channel: string;
  /** The record's id; absent for a list operation. */
  target?: string;
  /** The record's own settings, which an operation's form starts from. */
  held?: Bag;
  /** The command that opens a record a list operation made, run with `{ host, id }` of the row the host answers with. */
  opens?: string;
}

/** Open the record a list operation made, where the place names how and the answer names one. */
export function openMade(scena: Scena, place: OperationPlace, answer: unknown): void {
  const id = madeId(answer);
  if (place.opens === undefined || place.target !== undefined || id === undefined) return;
  void scena.commands.execute(place.opens, { host: place.host, id });
}

/** What the dialog holds: the operation and where it runs. */
export interface OpenDialog extends OperationPlace {
  operation: Operation;
}

/** Run one operation: open its form when it takes input, else ask and invoke. */
export async function runOperation(scena: Scena, place: OperationPlace, operation: Operation): Promise<void> {
  if (operation.input !== undefined) {
    scena.store.set(OPERATION_DIALOG, { ...place, operation } satisfies OpenDialog);
    return;
  }
  if (!(await askFirst(operation))) return;
  try {
    openMade(scena, place, await invokeOperation(place.host, place.channel, operation, place.target));
  } catch (error) {
    sayRefused(operation, error);
  }
}

/** Whether an operation is running now, which disables it. */
export const running = (operation: Operation): boolean => operation.status === 'running';

/** The menu items of a row's operations; one that asks a question first goes in the last group, in red. */
export function operationItems(scena: Scena, place: OperationPlace, operations: readonly Operation[]): PickerAction[] {
  return operations.map((operation) => ({
    title: labelOf(operation),
    ...(operation.description === undefined ? {} : { tooltip: operation.description }),
    ...(operation.confirmation === undefined ? {} : { group: 'more', color: 'red' as const }),
    ...(running(operation) ? { disabled: true } : {}),
    onSelect: (menu) => {
      menu.closeMenu();
      void runOperation(scena, place, operation);
    },
  }));
}

/** The list's operations as a palette list, such as one New entry for each tunnel kind. */
export function listChoices(scena: Scena, title: string, choices: readonly { place: OperationPlace; operation: Operation; hostName?: string }[]): { title: string; items: PickerAction[] } {
  return {
    title,
    items: choices.map(({ place, operation, hostName }) => ({
      title: labelOf(operation),
      ...(operation.description === undefined && hostName === undefined ? {} : { description: [hostName, operation.description].filter(Boolean).join(' \u{00B7} ') }),
      ...(running(operation) ? { disabled: true } : {}),
      onSelect: (menu) => {
        menu.closeMenu();
        void runOperation(scena, place, operation);
      },
    })),
  };
}

/** The dialog, drawn over every page. */
export function registerOperations(scena: Scena): Disposable {
  return combineDisposables(
    scena.components.register({
      component: 'OperationDialog',
      category: 'chrome',
      renderer: { kind: 'react', load: () => import('./Dialog.js') },
    }),
    scena.surfaces.mount({ surface: 'overlay', key: 'operations:dialog', resource: { component: 'OperationDialog' } }),
  );
}

/** The title of a refusal, for a form that says it in place. */
export const refusedTitle = (operation: Operation): string => translate('operations/failed', { label: labelOf(operation) });

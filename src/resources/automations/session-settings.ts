/**
 * The session settings an automation's runs start with, as the host offers
 * them for its agent and folder: the same `resolveSessionConfig` and
 * `sessionConfigCompletions` answers a new session reads.
 */

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@softov/scena/react';
import type { SessionConfigPropertySchema } from '@microsoft/agent-host-protocol';
import { ahpPaths, hostBridge, ROOT, type Connection } from '../../bridges/data.js';
import { folderUri } from '../../bridges/words.js';
import type { ModelChoice, Option } from '../sessions/composer-commands.js';

/** How long the inputs rest before the host is asked for the settings again. */
const RESOLVE_DELAY = 300;

/** The key a host puts the model under when it lists the model among the settings. */
const MODEL_KEY = 'model';

/** What the host says about a session's settings. */
export interface SessionSettings {
  /** Each setting a person may change, with its value. */
  options: Option[];
  /** The models the settings list, when the host puts the model there; undefined when the agent's own list applies. */
  models: ModelChoice[] | undefined;
  /** Whether the host has not answered yet, or could not. */
  reading: boolean;
}

interface Resolved {
  schema: Record<string, SessionConfigPropertySchema>;
  values: Record<string, unknown>;
}

/** The settings of a session with this agent, folder and chosen values; empty until the host answers. */
export function useSessionSettings(host: string, provider: string, folder: string, chosen: Record<string, unknown>): SessionSettings {
  const [resolved, setResolved] = useState<Resolved | null>(null);
  const [dynamic, setDynamic] = useState<Record<string, { value: string; label: string }[]>>({});
  // Asked again on each connection, which a change of language makes, so the text is in the new one.
  const generation = useStore<Connection>(ahpPaths(host).connection)?.generation ?? 0;
  const where = folder.trim() === '' ? undefined : folderUri(folder);
  const asked = JSON.stringify([host, provider, where, chosen, generation]);

  useEffect(() => {
    if (provider === '') {
      setResolved(null);
      return;
    }
    let alive = true;
    const timer = window.setTimeout(() => {
      hostBridge(host).request('resolveSessionConfig', { channel: ROOT, provider, ...(where === undefined ? {} : { workingDirectory: where }), config: chosen } as never)
        .then((answer) => {
          if (!alive) return;
          const result = answer as unknown as { schema: { properties: Record<string, SessionConfigPropertySchema> }; values: Record<string, unknown> };
          setResolved({ schema: result.schema.properties, values: result.values });
        })
        .catch(() => { if (alive) setResolved(null); });
    }, RESOLVE_DELAY);
    return () => { alive = false; window.clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asked]);

  // Settings whose choices the host lists on demand.
  const dynamicKeys = Object.entries(resolved?.schema ?? {}).filter(([, schema]) => schema.enumDynamic === true).map(([key]) => key).join('\n');
  useEffect(() => {
    if (dynamicKeys === '') return;
    let alive = true;
    for (const property of dynamicKeys.split('\n')) {
      hostBridge(host).request('sessionConfigCompletions', { channel: ROOT, provider, ...(where === undefined ? {} : { workingDirectory: where }), config: chosen, property } as never)
        .then((answer) => {
          const items = (answer as unknown as { items: { value: string; label: string }[] }).items;
          if (alive) setDynamic((held) => ({ ...held, [property]: items.map((one) => ({ value: one.value, label: one.label })) }));
        })
        .catch(() => undefined);
    }
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dynamicKeys, host, provider, where, generation]);

  return useMemo(() => {
    const listed = (key: string, schema: SessionConfigPropertySchema): SessionConfigPropertySchema => {
      const items = dynamic[key];
      return items === undefined ? schema : { ...schema, enum: items.map((one) => one.value), enumLabels: items.map((one) => one.label) };
    };
    const options = Object.entries(resolved?.schema ?? {})
      .filter(([key, schema]) => schema.readOnly !== true && key !== MODEL_KEY)
      .map(([key, schema]): Option => ({ key, schema: listed(key, schema), value: chosen[key] ?? resolved?.values[key] }));
    const modelSchema = resolved?.schema[MODEL_KEY];
    const models = modelSchema === undefined ? undefined : (() => {
      const schema = listed(MODEL_KEY, modelSchema);
      return (schema.enum ?? []).map((one, index): ModelChoice => ({ id: String(one), name: schema.enumLabels?.[index] ?? String(one) }));
    })();
    return { options, models, reading: resolved === null };
  }, [resolved, dynamic, chosen]);
}

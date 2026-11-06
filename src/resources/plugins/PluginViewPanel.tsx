import { useEffect, useLayoutEffect, useMemo, type ReactElement } from 'react';
import { DataContextContext, MountContext, useScena, ViewMount } from '@softov/scena/react';
import type { PluginView } from '../../bridges/plugins.js';
import { callViewMethod } from './actions.js';
import { viewDataPath, viewMethods, viewNode } from './view.js';

/**
 * A view, drawn with scena's components: a plugin's own page, a connector's or
 * an agent's. `at` names whose view it is, as `<kind>:<id>`, and `plugin` the
 * plugin that sent it. Its data model is kept in scena's store, where its
 * `{ path }` props read it; a new row or a `viewData` puts the new model there.
 * A Button's click reaches here as a `scena:action:event` of this view's own
 * mount key, and is sent to the host as the method it names, with its context
 * as the params.
 */
export function PluginViewPanel({ host, plugin, at, view }: { host: string; plugin: string; at: string; view: PluginView }): ReactElement | null {
  const scena = useScena();
  const key = `view:${host}:${at}`;
  const data = viewDataPath(key);
  const node = useMemo(() => viewNode(view, key), [view, key]);
  const methods = useMemo(() => viewMethods(view), [view]);
  useLayoutEffect(() => {
    scena.store.set(data, view.dataModel ?? {});
  }, [scena, data, view.dataModel]);
  useEffect(() => () => scena.store.delete(data), [scena, data]);
  useEffect(() => {
    const sub = scena.events.on('scena:action:event', (event) => {
      if (event.mountKey !== key || !methods.has(event.name)) return;
      void callViewMethod(host, plugin, event.name, event.context ?? {});
    });
    return () => sub.dispose();
  }, [scena, key, methods, host, plugin]);
  if (node === null) return null;
  return (
    <MountContext.Provider value={key}>
      <DataContextContext.Provider value={data}>
        <div className="web-plugin__view">
          <ViewMount node={node} />
        </div>
      </DataContextContext.Provider>
    </MountContext.Provider>
  );
}

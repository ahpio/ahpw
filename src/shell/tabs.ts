import type { Disposable, Label, Scena, SessionMount, SessionSnapshot, SessionStorage, SurfaceName } from '@softov/scena/types';
import { createLocalStorageSessionStorage } from '@softov/scena/core';
import { isWindowSurface } from '@softov/scena';
import { hostKey } from '../lib/storage-keys.js';
import { isView, RIGHT_SIDEBAR } from './right-sidebar.js';

/** A tab as kept. A save before scena 0.8.0 kept the title here; scena now keeps it in `props`. */
type KeptMount = SessionMount & { title?: Label };

const stored = createLocalStorageSessionStorage({ key: hostKey('ahpd-web.session.v1') });

/** The surfaces whose tabs are kept: `main`, the right sidebar, and each window a tab was dragged out to. */
function keptSurface(surface: SurfaceName): boolean {
  return surface === 'main' || surface === RIGHT_SIDEBAR || isWindowSurface(surface);
}

/** Whether a mount is kept: a tab on a kept surface, but not a view the shell mounts in the sidebar itself. */
function kept(mount: { key: string; surface: SurfaceName }): boolean {
  return keptSurface(mount.surface) && !(mount.surface === RIGHT_SIDEBAR && isView(mount.key));
}

function keeper(): SessionStorage {
  return {
    load: () => stored.load(),
    clear: () => stored.clear(),
    // Only the title: the icon and the colour are the component's, so a reopened tab shows the current ones.
    save: (snapshot: SessionSnapshot) => stored.save({
      ...snapshot,
      mounts: snapshot.mounts.filter(kept).map(({ props, ...mount }) => (props?.title === undefined ? mount : { ...mount, props: { title: props.title } })),
    }),
  };
}

/** Reopens the tabs of the last visit, each on its surface, then keeps them as they change. */
export async function keepTabs(scena: Scena, live: () => boolean): Promise<Disposable | null> {
  const snapshot = await stored.load();
  if (!live()) return null;
  const mounts = ((snapshot?.mounts ?? []) as KeptMount[]).filter((mount) => kept(mount) && scena.components.get(mount.component.component) !== undefined);
  // Each open focuses its tab, so each surface's focused tab gets the focus back after the last one.
  const surfaces = [...new Set(mounts.map((mount) => mount.surface))];
  const focused = new Map(surfaces.map((surface) => [surface, scena.layout.get().surfaces[surface]?.activeContainerKey]));
  for (const mount of mounts) {
    const props = mount.props ?? (mount.title === undefined ? undefined : { title: mount.title });
    scena.surfaces.open({ surface: mount.surface, key: mount.key, resource: mount.component, ...(props === undefined ? {} : { props }) } as never);
  }
  for (const [surface, key] of focused) {
    if (key !== undefined && scena.surfaces.listAt(surface).some((mount) => mount.key === key)) scena.surfaces.focus(key);
  }
  scena.setSessionStorage(keeper());
  return scena.session.enableAutoPersist();
}

import { useEffect, useState } from 'react';
import type { Scena, SurfaceName } from '@softov/scena/types';
import { useScena } from '@softov/scena/react';
import { RIGHT_SIDEBAR } from '../../shell/right-sidebar.js';

/** The surface that has `key` open, if any. */
export function surfaceOf(scena: Scena, key: string): SurfaceName | undefined {
  return scena.surfaces.listSurfaces().find((surface) => scena.surfaces.listAt(surface).some((mount) => mount.key === key));
}

/** The surface a mount is on, followed as a drag or a window moves it. */
export function useMountSurface(key: string | undefined): SurfaceName | undefined {
  const scena = useScena();
  const [surface, setSurface] = useState(() => (key === undefined ? undefined : surfaceOf(scena, key)));
  useEffect(() => {
    if (key === undefined) return;
    const update = (): void => setSurface(surfaceOf(scena, key));
    const subs = [scena.events.on('scena:mount:opened', update), scena.events.on('scena:mount:closed', update)];
    update();
    return () => subs.forEach((sub) => sub.dispose());
  }, [scena, key]);
  return surface;
}

/**
 * Whether a session page is beside the focused session: while its tab is on the
 * right sidebar. On `main` or in a window it is the focused session. Until the
 * surface is found, the page's own `beside` holds.
 */
export function isBeside(surface: SurfaceName | undefined, fallback: boolean): boolean {
  return surface === undefined ? fallback : surface === RIGHT_SIDEBAR;
}

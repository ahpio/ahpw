import { useRef, useState, type ReactElement, type ReactNode } from 'react';
import { ContextMenu, Pill } from '../../ui/index.js';
import type { PickerAction } from '@softov/scena/types';

/** One choice of a pill's menu. */
export interface PillChoice {
  title: string;
  description?: string;
  icon?: string;
  iconSrc?: string;
  group?: string;
  active?: boolean;
  pick: () => void;
}

/**
 * A pill of the new session box that opens its choices in a menu under it,
 * as the automation form draws the session each run starts.
 */
export function MenuPill({ label, short, icon, image, lead, title, choices }: {
  label: string;
  short?: string;
  icon?: string;
  image?: string | undefined;
  lead?: ReactNode;
  title?: string;
  /** Read when the menu opens, so a list the host fills later is current. */
  choices: () => PillChoice[];
}): ReactElement {
  const anchor = useRef<HTMLSpanElement>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  return (
    <span ref={anchor} className="web-menu-pill">
      <Pill
        label={label}
        {...(short === undefined ? {} : { short })}
        {...(icon === undefined ? {} : { icon })}
        image={image}
        lead={lead}
        {...(title === undefined ? {} : { title })}
        menu
        onClick={() => {
          const box = anchor.current?.getBoundingClientRect();
          if (box !== undefined) setMenu({ x: box.left, y: box.bottom });
        }}
      />
      {menu === null ? null : (
        <ContextMenu
          spec={{
            rich: true,
            items: choices().map((one): PickerAction => ({
              title: one.title,
              ...(one.description === undefined ? {} : { description: one.description }),
              ...(one.icon === undefined ? {} : { icon: one.icon }),
              ...(one.iconSrc === undefined ? {} : { iconSrc: one.iconSrc }),
              ...(one.group === undefined ? {} : { group: one.group }),
              ...(one.active === undefined ? {} : { active: one.active }),
              onSelect: (list) => {
                list.closeMenu();
                one.pick();
              },
            })),
          }}
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
        />
      )}
    </span>
  );
}

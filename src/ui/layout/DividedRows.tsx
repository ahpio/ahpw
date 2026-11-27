import { Fragment, type ReactElement } from 'react';
import { Column, Divider } from '@softov/scena/ui';

/** Rows parted by a divider, as scena's dashboard status cards list theirs. */
export function DividedRows({ children }: { children: ReactElement[] }): ReactElement {
  return (
    <Column gap={10}>
      {children.map((row, at) => <Fragment key={row.key ?? at}>{at === 0 ? null : <Divider />}{row}</Fragment>)}
    </Column>
  );
}

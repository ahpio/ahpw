import type { ReactElement, ReactNode } from 'react';
import { useScena } from '@softov/scena/react';
import { Button, DangerZone, PageActions } from '../../ui/index.js';
import { labelOf, type Operation } from '../../bridges/operations.js';
import { runOperation, running, type OperationPlace } from './run.js';

/** A record's operations as the page's buttons, then the page's own `children`; one that asks first is left to `DangerOperations`. */
export function OperationButtons({ place, operations, children }: { place: OperationPlace; operations: readonly Operation[]; children?: ReactNode }): ReactElement | null {
  const scena = useScena();
  const plain = operations.filter((one) => one.confirmation === undefined);
  if (plain.length === 0 && (children === undefined || children === null || children === false)) return null;
  return (
    <PageActions>
      {plain.map((operation) => (
        <Button
          key={operation.id}
          label={labelOf(operation)}
          disabled={running(operation)}
          {...(operation.description === undefined ? {} : { title: operation.description })}
          onClick={() => void runOperation(scena, place, operation)}
        />
      ))}
      {children}
    </PageActions>
  );
}

/** A record's operations that ask first, each in the page's danger zone with the host's question as its note. */
export function DangerOperations({ place, operations }: { place: OperationPlace; operations: readonly Operation[] }): ReactElement | null {
  const scena = useScena();
  const asking = operations.filter((one) => one.confirmation !== undefined);
  if (asking.length === 0) return null;
  return (
    <>
      {asking.map((operation) => (
        <DangerZone
          key={operation.id}
          label={labelOf(operation)}
          {...(operation.description === undefined ? {} : { note: operation.description })}
          onConfirm={() => void runOperation(scena, place, operation)}
        />
      ))}
    </>
  );
}

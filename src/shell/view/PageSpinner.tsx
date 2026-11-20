import type { ReactElement } from 'react';
import { Spinner, type SpinnerProps } from '@softov/scena/ui';

/** A page that is still reading what it shows, set in the page's margins like any page. */
export function PageSpinner(props: SpinnerProps): ReactElement {
  return (
    <div className="web-page">
      <Spinner {...props} />
    </div>
  );
}

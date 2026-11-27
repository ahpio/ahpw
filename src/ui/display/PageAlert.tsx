import type { ReactElement } from 'react';
import { Alert, type AlertProps } from '@softov/scena/ui';
import { Page } from '../layout/Page.js';

/** A page that is only a notice, such as a session that is gone, set in the page's margins like any page. */
export function PageAlert(props: AlertProps): ReactElement {
  return (
    <Page>
      <Alert {...props} />
    </Page>
  );
}

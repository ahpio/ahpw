import type { ReactElement } from 'react';
import { useI18n, useScena } from '@softov/scena/react';
import { Button, Note } from '../../ui/index.js';
import { AhpioMark } from '../../shell/AhpioMark.js';
import './start.css';

/** What `main` shows with nothing open: the mark and the way to start (scena's `surfaces.setEmpty`). */
export default function StartPage(): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  return (
    <div className="web-start">
      <AhpioMark size={72} />
      <Note>{t('sessions/start/note')}</Note>
      <Button label={t('sessions/commands/newSession')} variant="primary" onClick={() => void scena.commands.execute('ahp.newSession')} />
    </div>
  );
}

import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useI18n, useStore } from '@softov/scena/react';
import { Button, Modal, TextField } from '../../ui/index.js';
import { NAME_REQUEST, nameCheck, settleName, type NameRequest } from './ask.js';

/** The open name question, over the page, drawn like the confirm dialog. */
export function NameDialog(): ReactElement | null {
  const request = useStore<NameRequest | null>(NAME_REQUEST);
  if (request === undefined || request === null) return null;
  return <NameCard key={request.id} request={request} />;
}

/**
 * One question. The box takes focus with the name selected and its extension
 * left out; Enter answers, Escape and a click outside answer nothing. A problem
 * with the name shows under the box once it is sent.
 */
function NameCard({ request }: { request: NameRequest }): ReactElement {
  const { t } = useI18n();
  const box = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(request.value);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    box.current?.focus();
    const dot = request.value.lastIndexOf('.');
    box.current?.setSelectionRange(0, dot > 0 ? dot : request.value.length);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = (): void => {
    const found = nameCheck(value);
    if (found === null) settleName(value);
    else setProblem(found);
  };
  return (
    <Modal
      open
      title={request.title}
      onClose={() => settleName(null)}
      onSubmit={send}
      actions={(
        <>
          <Button size="sm" variant="ghost" onClick={() => settleName(null)}>{t('folders/ask/cancel')}</Button>
          <Button type="submit" size="sm" variant="primary">{request.confirmLabel}</Button>
        </>
      )}
    >
      <TextField
        inputRef={box}
        label={request.label}
        value={value}
        {...(problem === null ? {} : { error: problem })}
        onChange={(next) => {
          setValue(next);
          setProblem(null);
        }}
      />
    </Modal>
  );
}

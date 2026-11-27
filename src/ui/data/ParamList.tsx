import './ParamList.css';

// ahpw component: the inputs something takes, such as a tool's or a
// connector's: each name in code, its type and whether it is required, and
// what it is for under it.
export interface Param {
  name: string;
  type?: string | undefined;
  required?: boolean | undefined;
  description?: string | undefined;
}

export interface ParamListProps {
  params: readonly Param[];
  // The word after a required input's type.
  requiredLabel: string;
  // What the inputs are, for a screen reader.
  label?: string;
}

export function ParamList({ params, requiredLabel, label }: ParamListProps) {
  return (
    <dl className="oo-params" aria-label={label}>
      {params.map((param) => {
        const meta = [param.type ?? '', param.required === true ? requiredLabel : ''].filter((part) => part !== '').join(' \u{00B7} ');
        return (
          <div key={param.name}>
            <dt><code>{param.name}</code>{meta === '' ? null : <> <span className="oo-params__meta">{meta}</span></>}</dt>
            {param.description === undefined || param.description === '' ? null : <dd>{param.description}</dd>}
          </div>
        );
      })}
    </dl>
  );
}

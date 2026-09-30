import type { TemplateContent } from '../documents';

/** Rows left blank in a table without preset rows (the inventory). */
const BLANK_TABLE_ROWS = 12;
/** Ruled lines under a write-in prompt. */
const WRITE_IN_LINES = 6;

const CELL = 'border border-brand-ink/40 px-2 py-1.5 text-left align-top';

type TemplateDocumentProps = {
  content: TemplateContent;
  /** How many signature lines each label gets (`SIGNATURE_REPEAT`). */
  signatureRepeat: number;
};

/**
 * A fill-in document laid out for paper: numbered sections and clauses, blanks as lines,
 * signatures at the end. The same markup prints; site chrome is dropped by `print:hidden`.
 */
export function TemplateDocument({ content, signatureRepeat }: TemplateDocumentProps) {
  const sections = Object.entries(content.sections);

  return (
    <article className="rounded-[15px] border border-brand-border bg-white px-5 py-8 text-[14px] leading-7 text-brand-ink [overflow-wrap:anywhere] sm:px-10 print:rounded-none print:border-0 print:p-0 print:text-black">
      <h1 className="text-center text-[20px] font-bold uppercase tracking-wide sm:text-[22px]">
        {content.title}
      </h1>
      <p className="mt-6">{content.preamble}</p>

      {sections.map(([id, section], index) => {
        const number = index + 1;
        const table = section.table;
        const columns = table ? Object.values(table.columns) : [];
        const rowLabels = table?.rows ? Object.values(table.rows) : null;

        return (
          <section className="mt-6" key={id}>
            <h2 className="break-after-avoid text-[15px] font-bold">
              {number}. {section.title}
            </h2>

            {section.fields && (
              <dl className="mt-2 grid gap-3">
                {Object.entries(section.fields).map(([key, label]) => (
                  <div className="flex items-end gap-2" key={key}>
                    <dt className="shrink-0">{label}:</dt>
                    <dd className="h-6 flex-1 border-b border-dotted border-brand-ink/60" />
                  </div>
                ))}
              </dl>
            )}

            {section.clauses && (
              <ol className="mt-2 grid gap-2">
                {Object.entries(section.clauses).map(([key, clause], clauseIndex) => (
                  <li className="flex gap-2" key={key}>
                    <span className="shrink-0 tabular-nums">
                      {number}.{clauseIndex + 1}.
                    </span>
                    <span>{clause}</span>
                  </li>
                ))}
              </ol>
            )}

            {table && (
              <table className="mt-3 w-full border-collapse text-[13px] leading-5">
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <th className={`${CELL} font-bold`} key={column} scope="col">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(rowLabels ?? Array.from({ length: BLANK_TABLE_ROWS }, () => '')).map(
                    (label, rowIndex) => (
                      <tr className="break-inside-avoid" key={rowIndex}>
                        {columns.map((column, columnIndex) => (
                          <td className={`${CELL} h-9`} key={column}>
                            {columnIndex === 0 ? label : null}
                          </td>
                        ))}
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            )}

            {section.writeIn && (
              <>
                <p className="mt-2">{section.writeIn}</p>
                {Array.from({ length: WRITE_IN_LINES }, (_, line) => (
                  <div className="h-8 border-b border-dotted border-brand-ink/60" key={line} />
                ))}
              </>
            )}
          </section>
        );
      })}

      <div className="mt-14 grid break-inside-avoid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2 print:grid-cols-2">
        {Object.entries(content.signatures).flatMap(([key, label]) =>
          Array.from({ length: signatureRepeat }, (_, slot) => (
            <div key={`${key}-${slot}`}>
              <div className="h-10 border-b border-brand-ink" />
              <p className="mt-1 text-[12px] text-brand-muted print:text-black">{label}</p>
            </div>
          )),
        )}
      </div>
    </article>
  );
}

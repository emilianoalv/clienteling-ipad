export interface StepHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
}

/**
 * Eyebrow ("PASO X · TITLE") + display heading for each wizard step.
 * Mirrors prototype lines 330-335 / 409-411 / 514-519.
 */
export function StepHeader({ eyebrow, title, subtitle }: StepHeaderProps) {
  return (
    <header className="mb-5">
      <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
        {eyebrow}
      </div>
      <h3 className="m-0 mt-1 font-display text-[30px] leading-tight tracking-[-0.01em]">
        {title}
      </h3>
      {subtitle ? (
        <p className="m-0 mt-1.5 text-[16px] font-medium leading-snug text-ink/60">{subtitle}</p>
      ) : null}
    </header>
  );
}

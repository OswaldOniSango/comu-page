type Props = {
  eyebrow?: string;
  title: string;
  body?: string;
  align?: "left" | "center";
};

export function SectionHeading({ eyebrow, title, body, align = "left" }: Props) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className="headline mt-3 font-[var(--font-display)] text-4xl leading-none sm:text-5xl lg:text-6xl">
        {title}
      </h2>
      {body ? <p className="mt-4 text-base leading-7 text-white/68">{body}</p> : null}
    </div>
  );
}

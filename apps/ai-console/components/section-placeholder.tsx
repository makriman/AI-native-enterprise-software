import Link from "next/link";

export function SectionPlaceholder({
  title,
  subtitle,
  bullets,
  quickLink
}: {
  title: string;
  subtitle: string;
  bullets: string[];
  quickLink?: { href: string; label: string };
}) {
  return (
    <section>
      <h1 className="page-headline">{title}</h1>
      <p className="page-subtitle">{subtitle}</p>
      <div className="panel">
        <h3>Scope in this surface</h3>
        <ul>
          {bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        {quickLink ? (
          <p>
            <Link href={quickLink.href} className="inline-link">
              {quickLink.label}
            </Link>
          </p>
        ) : null}
      </div>
    </section>
  );
}

type Stat = {
  label: string;
  value: number;
  helper: string;
};

type StatsCardsProps = {
  stats: Stat[];
};

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <article key={stat.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">{stat.label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{stat.value}</p>
          <p className="mt-1 text-sm text-slate-500">{stat.helper}</p>
        </article>
      ))}
    </section>
  );
}

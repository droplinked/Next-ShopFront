import type { IPublisherInvitationProgramPreview } from '@/types/interfaces/publisher/invitation';

interface IValuePropsProps {
  program: IPublisherInvitationProgramPreview;
}

const BASE_PROPS: Array<{
  title: string;
  body: string;
}> = [
  {
    title: 'USDC payouts',
    body:
      'Settled in stablecoin via on-chain rail. Skip the 30-day net cycle most affiliate networks impose.',
  },
  {
    title: 'Real-time attribution',
    body:
      'Sales are credited in seconds, not days. No cookie dependency, no last-click ambiguity.',
  },
  {
    title: 'No cookie fraud',
    body:
      'Attribution is rooted in on-chain order events, not browser cookies — fraud surface drops to zero.',
  },
  {
    title: 'Direct merchant relationship',
    body:
      'The merchant owns the program. You get terms, support, and brand from them directly — no middleman.',
  },
];

const ValueProps = ({ program }: IValuePropsProps) => {
  const items = [...BASE_PROPS];
  if (program.attestationEnabled) {
    items.unshift({
      title: 'Onchain attested sales',
      body:
        'Every order is signed via EAS-compatible attestation on Avalanche + Base. Verifiable, portable, audit-ready.',
    });
  }

  return (
    <section className="w-full px-6 py-10 md:py-16 bg-black/[0.02]">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-black mb-8">
          What you get
        </h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((p) => (
            <li
              key={p.title}
              className="rounded-xl border border-black/10 bg-white p-6"
            >
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-1 inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: 'var(--mt-primary)' }}
                />
                <div>
                  <p className="font-semibold text-black">{p.title}</p>
                  <p className="text-sm text-black/70 mt-1 leading-relaxed">{p.body}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default ValueProps;

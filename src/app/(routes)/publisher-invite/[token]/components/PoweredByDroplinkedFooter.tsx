import Link from 'next/link';

/**
 * Phase-1 white-label footer. Phase-2 will drop this entirely once
 * full white-label + custom-domain support ships.
 */
const PoweredByDroplinkedFooter = () => {
  return (
    <footer className="w-full px-6 py-6 border-t border-black/5 bg-white text-center text-xs text-black/50">
      Powered by{' '}
      <Link
        href="https://droplinked.com"
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        droplinked
      </Link>{' '}
      — merchant-owned affiliate programs.
    </footer>
  );
};

export default PoweredByDroplinkedFooter;

'use client';

import { usePathname } from 'next/navigation';
import Footer from './footer/footer';
import Header from './header/Header';

/**
 * White-label route prefixes. On these prefixes the droplinked header
 * + footer are SUPPRESSED so the merchant-branded landing controls
 * the whole viewport.
 *
 * Add new prefixes here when launching additional white-label surfaces.
 */
const WHITE_LABEL_PREFIXES = ['/publisher-invite', '/publisher'];

function isWhiteLabelRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return WHITE_LABEL_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const suppressChrome = isWhiteLabelRoute(pathname);

  if (suppressChrome) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
};

export { isWhiteLabelRoute, WHITE_LABEL_PREFIXES };
export default AppLayout;

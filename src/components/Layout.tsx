import type { ReactNode } from 'react';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="page">
      <div className="wordmark">Efeito Alta Permissão</div>
      {children}
    </div>
  );
}

import type { ReactNode } from 'react';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="page">{children}</div>
      <footer className="site-footer">
        <img
          src={`${import.meta.env.BASE_URL}logo-altas.svg`}
          alt="Grupo Alta"
          width={190}
          height={73}
        />
        <p>© 2026 Todos os direitos reservados</p>
        <p>Alta Co. | CNPJ: 66.525.966/0001-50</p>
      </footer>
    </>
  );
}

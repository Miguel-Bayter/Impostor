import { type ReactNode } from 'react';
import Header from '@/components/layout/Header';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 w-full">{children}</main>

      <footer className="py-4 text-center text-muted-foreground text-sm border-t border-border">
        <p>© {new Date().getFullYear()} Impostor Game. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default MainLayout;

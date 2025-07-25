import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Calculator, Database, Users, Stethoscope } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [location] = useLocation();

  const navigation = [
    { name: 'Home', href: '/', icon: Calculator },
    { name: 'Outpatient', href: '/outpatient', icon: Users },
    { name: 'Inpatient', href: '/inpatient', icon: Stethoscope },
    { name: 'Database', href: '/database', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="glass-card text-white sticky top-0 z-50 border-b border-emerald-500/20" style={{background: 'linear-gradient(135deg, rgba(6, 95, 70, 0.9), rgba(4, 120, 87, 0.9))'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Calculator className="h-8 w-8 text-emerald-200 mr-3" />
              <h1 className="text-xl font-bold text-white">
                Hospital Bill Calculator
              </h1>
            </div>
            
            <nav className="flex space-x-1">
              {navigation.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'glass-button bg-emerald-600/40 text-white font-medium shadow-lg ring-1 ring-emerald-400/40 neo-shadow'
                        : 'text-emerald-100/90 hover:text-white hover:bg-emerald-700/30 hover:backdrop-blur-sm hover:shadow-md'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default Layout;
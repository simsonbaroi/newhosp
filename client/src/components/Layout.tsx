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
      <header style={{background: 'linear-gradient(135deg, #065f46, #047857)'}} className="text-white shadow-2xl sticky top-0 z-50 border-b-4 border-emerald-600">
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
                        ? 'bg-emerald-700/60 text-white font-medium shadow-lg ring-2 ring-emerald-400/30'
                        : 'text-emerald-100 hover:text-white hover:bg-emerald-700/40 hover:shadow-md'
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
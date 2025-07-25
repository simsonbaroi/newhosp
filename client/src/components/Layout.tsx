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
      <header className="header-enhanced text-white sticky top-0 z-50 border-b border-medical-primary/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-center h-16 sm:h-20 relative">
            {/* Logo and Title - Centered */}
            <div className="flex items-center justify-center flex-1">
              <Calculator className="h-8 w-8 sm:h-10 sm:w-10 text-white mr-2 sm:mr-4" />
              <div className="text-center">
                <h1 className="text-lg sm:text-2xl font-bold text-white leading-tight">
                  Hospital Bill Calculator
                </h1>
                <p className="text-xs text-white/80 mt-1 hidden sm:block">
                  Professional Medical Billing System
                </p>
              </div>
            </div>
          </div>
          
          {/* Navigation Bar - Separate Row */}
          <div className="border-t border-white/10">
            <nav className="flex justify-center py-3 px-2 overflow-x-auto">
              <div className="flex space-x-0.5 sm:space-x-1 min-w-max">
                {navigation.map((item) => {
                  const isActive = location === item.href;
                  const Icon = item.icon;
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`nav-button-enhanced flex items-center px-2.5 sm:px-5 py-2.5 rounded-lg text-xs sm:text-sm font-medium min-w-[75px] sm:min-w-[110px] justify-center flex-shrink-0 ${
                        isActive
                          ? 'nav-button-active bg-white/25 text-white font-semibold border border-white/30'
                          : 'text-white/90 hover:text-white hover:bg-white/15'
                      }`}
                    >
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                      <span className="whitespace-nowrap">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
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
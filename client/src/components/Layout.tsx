import { ReactNode, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { Calculator, Database, Users, Stethoscope } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [location] = useLocation();
  const sliderRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const navigation = [
    { name: 'Home', href: '/', icon: Calculator },
    { name: 'Outpatient', href: '/outpatient', icon: Users },
    { name: 'Inpatient', href: '/inpatient', icon: Stethoscope },
    { name: 'Database', href: '/database', icon: Database },
  ];

  // Update slider position based on active tab
  useEffect(() => {
    if (!sliderRef.current || !navRef.current) return;

    const activeIndex = navigation.findIndex(item => item.href === location);
    if (activeIndex === -1) return;

    const buttons = navRef.current.querySelectorAll('.nav-button-enhanced');
    const activeButton = buttons[activeIndex] as HTMLElement;
    
    if (activeButton) {
      const navRect = navRef.current.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      const relativeLeft = buttonRect.left - navRect.left;
      
      sliderRef.current.style.left = `${relativeLeft}px`;
      sliderRef.current.style.width = `${buttonRect.width}px`;
    }
  }, [location, navigation]);

  return (
    <div className="min-h-screen bg-background">
      <header className="header-enhanced text-white sticky top-0 z-50 border-b border-medical-primary/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-20 relative">
            {/* Logo and Title - Centered */}
            <div className="flex items-center justify-center flex-1">
              <Calculator className="h-10 w-10 text-white mr-4" />
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white leading-tight">
                  Hospital Bill Calculator
                </h1>
                <p className="text-xs text-white/80 mt-1">
                  Professional Medical Billing System
                </p>
              </div>
            </div>
          </div>
          
          {/* Navigation Bar - Separate Row with Slide Effect */}
          <div className="border-t border-white/10">
            <div className="flex justify-center py-3">
              <div className="nav-container relative inline-flex" ref={navRef}>
                {/* Animated Slider Background */}
                <div 
                  ref={sliderRef}
                  className="nav-slider"
                />
                
                {/* Navigation Buttons */}
                <nav className="flex relative z-10">
                  {navigation.map((item, index) => {
                    const isActive = location === item.href;
                    const Icon = item.icon;
                    
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`nav-button-enhanced flex items-center px-6 py-2.5 text-sm font-medium min-w-[120px] justify-center nav-slide-in ${
                          isActive ? 'nav-button-active' : ''
                        }`}
                      >
                        <Icon className="h-5 w-5 mr-2" />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
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
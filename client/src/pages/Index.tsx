import { useEffect } from 'react';
import { Link } from 'wouter';
import { Calculator, Users, Stethoscope, Database, ArrowRight, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/Layout';
import { initializeDatabase } from '@/lib/database';

const Index = () => {
  useEffect(() => {
    initializeDatabase();
  }, []);

  const features = [
    {
      title: 'Outpatient Calculator',
      description: 'Calculate bills for outpatient services including laboratory, X-ray, consultations, and procedures.',
      icon: Users,
      href: '/outpatient',
      variant: 'medical' as const
    },
    {
      title: 'Inpatient Calculator', 
      description: 'Manage inpatient billing with daily rates, room charges, medicines, and extended stay calculations.',
      icon: Stethoscope,
      href: '/inpatient',
      variant: 'default' as const
    },
    {
      title: 'Database Management',
      description: 'Add, edit, and manage medical items, procedures, and their pricing across all categories.',
      icon: Database,
      href: '/database',
      variant: 'medical-outline' as const
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="hero-gradient text-white py-20 sm:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 sm:p-6 bg-white/20 rounded-full backdrop-blur-md">
                <Heart className="h-16 w-16 sm:h-20 sm:w-20 text-white" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Hospital Bill Calculator
            </h1>
            <p className="text-lg sm:text-xl text-white/95 mb-10 max-w-3xl mx-auto leading-relaxed">
              Professional medical billing calculator for hospitals and clinics. 
              Manage outpatient and inpatient calculations with real-time pricing and comprehensive database management.
            </p>
            <div className="flex justify-center">
              <Link href="/outpatient">
                <Button size="lg" className="bg-white border-2 border-white text-emerald-600 hover:bg-emerald-600 hover:text-white font-bold shadow-lg hover:shadow-2xl transition-all duration-300 px-8 h-12 text-base">
                  Start Calculating
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20 sm:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 sm:mb-20">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Complete Billing Solution
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to calculate accurate medical bills with ease and precision.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="feature-card glass-card hover:shadow-xl transition-all duration-300 group border border-medical-primary/15">
                    <CardHeader className="text-center">
                      <div className="mx-auto mb-4 p-4 bg-emerald-100 dark:bg-emerald-950/30 rounded-full w-fit group-hover:scale-110 transition-transform">
                        <Icon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <CardTitle className="text-xl font-bold text-foreground">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                        {feature.description}
                      </p>
                      <Link href={feature.href}>
                        <Button 
                          className="w-full font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Open Calculator
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="py-16 sm:py-20 bg-muted/30 dark:bg-muted/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="p-6 rounded-lg">
                <div className="text-4xl sm:text-5xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">10+</div>
                <div className="text-muted-foreground font-medium">Outpatient Categories</div>
              </div>
              <div className="p-6 rounded-lg">
                <div className="text-4xl sm:text-5xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">19+</div>
                <div className="text-muted-foreground font-medium">Inpatient Categories</div>
              </div>
              <div className="p-6 rounded-lg">
                <div className="text-4xl sm:text-5xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">∞</div>
                <div className="text-muted-foreground font-medium">Customizable Items</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;

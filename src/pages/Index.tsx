import { useEffect } from 'react';
import { Link } from 'react-router-dom';
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
      color: 'bg-primary hover:bg-primary-hover'
    },
    {
      title: 'Inpatient Calculator', 
      description: 'Manage inpatient billing with daily rates, room charges, medicines, and extended stay calculations.',
      icon: Stethoscope,
      href: '/inpatient',
      color: 'bg-accent hover:bg-accent-hover'
    },
    {
      title: 'Database Management',
      description: 'Add, edit, and manage medical items, procedures, and their pricing across all categories.',
      icon: Database,
      href: '/database',
      color: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="bg-medical-gradient text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/20 rounded-full">
                <Heart className="h-16 w-16 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-6">
              Hospital Bill Calculator
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
              Professional medical billing calculator for hospitals and clinics. 
              Manage outpatient and inpatient calculations with real-time pricing and comprehensive database management.
            </p>
            <div className="flex justify-center space-x-4">
              <Link to="/outpatient">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold">
                  Start Calculating
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">
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
                  <Card key={index} className="shadow-card hover:shadow-hover transition-all duration-300 group">
                    <CardHeader className="text-center">
                      <div className="mx-auto mb-4 p-3 bg-muted rounded-full w-fit group-hover:scale-110 transition-transform">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle className="text-xl font-bold text-foreground">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-muted-foreground mb-6">
                        {feature.description}
                      </p>
                      <Link to={feature.href}>
                        <Button 
                          className={`w-full ${feature.color} font-semibold`}
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
        <div className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">10+</div>
                <div className="text-muted-foreground">Outpatient Categories</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-accent mb-2">19+</div>
                <div className="text-muted-foreground">Inpatient Categories</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">∞</div>
                <div className="text-muted-foreground">Customizable Items</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;

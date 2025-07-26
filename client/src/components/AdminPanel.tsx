import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  Lock, 
  Settings, 
  LogOut, 
  Bell,
  Shield,
  Activity,
  TrendingUp,
  UserCheck,
  Calendar
} from 'lucide-react';
import Dashboard from './Dashboard';
import { Link } from 'wouter';

interface AdminPanelProps {
  onLogout: () => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

const AdminPanel = ({ onLogout, currentPage, setCurrentPage }: AdminPanelProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const renderPage = () => {
    switch(currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'billing': return <BillingManagement />;
      case 'users': return <UserManagement />;
      case 'settings': return <SettingsPanel />;
      default: return <Dashboard />;
    }
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'billing', label: 'Billing System', icon: Activity },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <motion.div 
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        className={`fixed md:relative z-30 md:z-auto inset-y-0 left-0 w-64 bg-gradient-to-b from-medical-700 to-emerald-800 text-white transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="p-5 border-b border-medical-600">
          <h1 className="text-2xl font-bold flex items-center">
            <Shield className="w-8 h-8 mr-2" />
            Hospital Admin
          </h1>
          <p className="text-medical-100 text-sm mt-1">
            Bill Management System
          </p>
        </div>
        
        <nav className="mt-6">
          {navigationItems.map((item) => (
            <NavItem 
              key={item.id}
              icon={item.icon}
              text={item.label} 
              active={currentPage === item.id} 
              onClick={() => {
                setCurrentPage(item.id);
                setSidebarOpen(false);
              }}
            />
          ))}
        </nav>
        
        <div className="absolute bottom-0 w-full p-4">
          <Button 
            onClick={onLogout}
            variant="outline"
            className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </motion.div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between bg-white shadow-sm p-4 border-b border-gray-200">
          <div className="flex items-center">
            <Button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              variant="ghost"
              size="sm"
              className="md:hidden mr-4"
            >
              <Menu className="w-6 h-6" />
            </Button>
            <h2 className="text-xl font-semibold text-gray-800 capitalize">
              {currentPage === 'dashboard' && 'Dashboard'}
              {currentPage === 'billing' && 'Billing System'}
              {currentPage === 'users' && 'User Management'}
              {currentPage === 'settings' && 'Settings'}
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-medical-600 flex items-center justify-center text-white font-semibold text-sm">
                A
              </div>
              <span className="hidden md:inline text-gray-700 font-medium">Admin User</span>
            </div>
          </div>
        </header>
        
        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {renderPage()}
        </main>
      </div>
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

interface NavItemProps {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  active: boolean;
  onClick: () => void;
}

const NavItem = ({ icon: Icon, text, active, onClick }: NavItemProps) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={`flex items-center w-full px-6 py-3 mt-1 text-left transition-colors ${
      active 
        ? 'bg-medical-600 border-r-4 border-white' 
        : 'hover:bg-medical-600/50'
    }`}
    onClick={onClick}
  >
    <Icon className="w-5 h-5" />
    <span className="mx-4">{text}</span>
  </motion.button>
);

// Billing Management Component - Links to the existing hospital billing system
const BillingManagement = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-6 h-6 mr-2 text-medical-600" />
            Hospital Billing System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-medical-200"
              onClick={() => window.location.href = '/outpatient'}
            >
              <CardContent className="p-6 text-center">
                <UserCheck className="w-12 h-12 mx-auto mb-4 text-medical-600" />
                <h3 className="font-semibold mb-2">Outpatient Billing</h3>
                <p className="text-sm text-gray-600">
                  Manage outpatient services and billing
                </p>
              </CardContent>
            </Card>
            
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-medical-200"
              onClick={() => window.location.href = '/inpatient'}
            >
              <CardContent className="p-6 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-medical-600" />
                <h3 className="font-semibold mb-2">Inpatient Billing</h3>
                <p className="text-sm text-gray-600">
                  Manage inpatient services and daily rates
                </p>
              </CardContent>
            </Card>
            
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-medical-200"
              onClick={() => window.location.href = '/database'}
            >
              <CardContent className="p-6 text-center">
                <Settings className="w-12 h-12 mx-auto mb-4 text-medical-600" />
                <h3 className="font-semibold mb-2">Database Management</h3>
                <p className="text-sm text-gray-600">
                  Manage medical items and categories
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// User Management Component
const UserManagement = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-6 h-6 mr-2 text-medical-600" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            User management features will be implemented here.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-medical-200">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Active Users</h4>
                <p className="text-2xl font-bold text-medical-600">12</p>
              </CardContent>
            </Card>
            <Card className="border-medical-200">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Admin Users</h4>
                <p className="text-2xl font-bold text-medical-600">3</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Settings Panel Component
const SettingsPanel = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-6 h-6 mr-2 text-medical-600" />
            System Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            System configuration and settings will be managed here.
          </p>
          <div className="space-y-4">
            <div className="p-4 border border-medical-200 rounded-lg">
              <h4 className="font-semibold mb-2">Hospital Information</h4>
              <p className="text-sm text-gray-600">
                Configure hospital details and contact information
              </p>
            </div>
            <div className="p-4 border border-medical-200 rounded-lg">
              <h4 className="font-semibold mb-2">Billing Configuration</h4>
              <p className="text-sm text-gray-600">
                Set up billing parameters and pricing structures
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;
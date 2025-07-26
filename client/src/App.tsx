import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch } from "wouter";
import { queryClient } from "@/lib/queryClient";
import LoginPage from "./components/LoginPage";
import AdminPanel from "./components/AdminPanel";
import Index from "./pages/Index";
import Outpatient from "./pages/Outpatient";
import Inpatient from "./pages/Inpatient";
import Database from "./pages/Database";
import NotFound from "./pages/NotFound";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Check for saved login state on app start
  useEffect(() => {
    const savedLoginState = localStorage.getItem('hospitalAdminLoggedIn');
    if (savedLoginState === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem('hospitalAdminLoggedIn', 'true');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('hospitalAdminLoggedIn');
    setCurrentPage('dashboard');
  };

  // If not logged in, show login page
  if (!isLoggedIn) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <LoginPage onLogin={handleLogin} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // If logged in, show admin panel with routing
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <Switch>
            <Route path="/admin" component={() => (
              <AdminPanel 
                onLogout={handleLogout}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            )} />
            <Route path="/" component={() => (
              <AdminPanel 
                onLogout={handleLogout}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            )} />
            <Route path="/outpatient" component={Outpatient} />
            <Route path="/inpatient" component={Inpatient} />
            <Route path="/database" component={Database} />
            <Route component={NotFound} />
          </Switch>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

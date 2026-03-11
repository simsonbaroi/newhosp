import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch } from "wouter";
import { queryClient } from "@/lib/queryClient";
import Index from "./pages/Index";
import Outpatient from "./pages/Outpatient";
import Inpatient from "./pages/Inpatient";
import Database from "./pages/Database";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const App = () => {
  useEffect(() => {
    // Initialize theme from localStorage - Default to LIGHT mode
    const savedTheme = localStorage.getItem('theme') || 'light';
    const root = document.documentElement;
    
    if (savedTheme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <Switch>
            <Route path="/" component={Index} />
            <Route path="/outpatient" component={Outpatient} />
            <Route path="/inpatient" component={Inpatient} />
            <Route path="/database" component={Database} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

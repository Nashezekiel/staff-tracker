import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "./components/ui/theme-provider";
import { AuthProvider } from "./lib/auth";
import MainLayout from "./components/layout/MainLayout";
import NotFound from "@/pages/not-found";
import Dashboard from "./pages/dashboard/Dashboard";
import CheckInOut from "./pages/check-in/CheckInOut";
import Profile from "./pages/profile/Profile";
import Billing from "./pages/billing/Billing";
import Reports from "./pages/reports/Reports";
import Users from "./pages/admin/Users";
import Settings from "./pages/settings/Settings";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

function Router() {
  return (
    <Switch>
      {/* Auth routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Protected routes */}
      <Route path="/">
        <MainLayout>
          <Dashboard />
        </MainLayout>
      </Route>
      <Route path="/check-in">
        <MainLayout>
          <CheckInOut />
        </MainLayout>
      </Route>
      <Route path="/profile">
        <MainLayout>
          <Profile />
        </MainLayout>
      </Route>
      <Route path="/billing">
        <MainLayout>
          <Billing />
        </MainLayout>
      </Route>
      <Route path="/reports">
        <MainLayout>
          <Reports />
        </MainLayout>
      </Route>
      <Route path="/admin/users">
        <MainLayout>
          <Users />
        </MainLayout>
      </Route>
      <Route path="/settings">
        <MainLayout>
          <Settings />
        </MainLayout>
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="techie-workspace-theme">
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

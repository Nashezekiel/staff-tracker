import { useLocation } from "wouter";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Sidebar from "./Sidebar";
import { useAuth } from "@/lib/auth";

const getPageTitle = (path: string): string => {
  switch (path) {
    case "/":
      return "Dashboard";
    case "/check-in":
      return "Check In/Out";
    case "/profile":
      return "My Profile";
    case "/billing":
      return "Billing";
    case "/reports":
      return "Reports";
    case "/admin/users":
      return "Manage Users";
    case "/settings":
      return "Settings";
    default:
      return "Techie Workspace";
  }
};

const TopNav = () => {
  const [location] = useLocation();
  const { user } = useAuth();
  const pageTitle = getPageTitle(location);

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="px-4 sm:px-6 py-3 flex justify-between items-center">
        <div className="flex items-center md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <Sidebar user={user} />
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-semibold">Techie Workspace</h1>
        </div>
        <div className="hidden md:block">
          <h1 className="text-lg font-semibold">{pageTitle}</h1>
        </div>
        <div className="flex items-center">
          <div className="relative">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-6 w-6" />
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs font-bold leading-none text-white bg-primary">
                3
              </span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNav;

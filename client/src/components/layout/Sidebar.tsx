import { Link, useLocation } from "wouter";
import { User } from "@shared/schema";
import { cn } from "@/lib/utils";
import {
  Home,
  Clock,
  User as UserIcon,
  CreditCard,
  BarChart,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { useTheme } from "@/components/ui/theme-provider";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

interface SidebarProps {
  user: User | null;
}

interface MenuItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const Sidebar = ({ user }: SidebarProps) => {
  const [location] = useLocation();
  const { setTheme, theme } = useTheme();
  const { logout } = useAuth();

  const menuItems: MenuItem[] = [
    {
      href: "/",
      label: "Dashboard",
      icon: <Home className="h-5 w-5 mr-2" />,
    },
    {
      href: "/check-in",
      label: "Check In/Out",
      icon: <Clock className="h-5 w-5 mr-2" />,
    },
    {
      href: "/profile",
      label: "My Profile",
      icon: <UserIcon className="h-5 w-5 mr-2" />,
    },
    {
      href: "/billing",
      label: "Billing",
      icon: <CreditCard className="h-5 w-5 mr-2" />,
    },
    {
      href: "/reports",
      label: "Reports",
      icon: <BarChart className="h-5 w-5 mr-2" />,
    },
    {
      href: "/admin/users",
      label: "Manage Users",
      icon: <Users className="h-5 w-5 mr-2" />,
      adminOnly: true,
    },
    {
      href: "/settings",
      label: "Settings",
      icon: <Settings className="h-5 w-5 mr-2" />,
    },
  ];

  const toggleDarkMode = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 border-r border-gray-200 dark:border-gray-800 h-screen bg-white dark:bg-gray-800 transition-all duration-200">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="ml-2 text-xl font-semibold">Techie Workspace</h1>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          // Skip admin-only items for non-admin users
          if (item.adminOnly && user?.role !== "admin") {
            return null;
          }

          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex items-center px-3 py-2 text-sm rounded-md mb-1 transition-colors",
                  isActive
                    ? "text-white bg-primary"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                {item.icon}
                {item.label}
              </a>
            </Link>
          );
        })}

        {user?.role === "admin" && (
          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Admin
            </h3>
          </div>
        )}
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center text-sm w-full mb-3">
          <div className="mr-2 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center dark:bg-gray-700">
            <span className="font-medium text-xs">
              {user?.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
          </div>
          <div className="text-left">
            <p className="font-medium">{user?.fullName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user?.email}
            </p>
          </div>
        </div>
        <Button
          onClick={toggleDarkMode}
          variant="outline"
          className="flex items-center justify-between w-full px-3 py-2 text-sm mb-2"
        >
          <span>Dark Mode</span>
          <div className="w-8 h-4 bg-gray-300 dark:bg-primary rounded-full flex items-center p-0.5">
            <div
              className={cn(
                "w-3 h-3 bg-white rounded-full transform transition-transform",
                theme === "dark" ? "translate-x-4" : ""
              )}
            ></div>
          </div>
        </Button>
        <Button
          onClick={logout}
          variant="outline"
          className="flex items-center w-full"
        >
          <LogOut className="h-4 w-4 mr-2" />
          <span>Log Out</span>
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;

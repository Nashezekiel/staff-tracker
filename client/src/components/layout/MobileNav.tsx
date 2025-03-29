import { Link, useLocation } from "wouter";
import { Home, Clock, User, CreditCard, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const MobileNav = () => {
  const [location] = useLocation();

  const navItems = [
    {
      href: "/",
      label: "Home",
      icon: <Home className="h-6 w-6" />,
    },
    {
      href: "/check-in",
      label: "Check In",
      icon: <Clock className="h-6 w-6" />,
    },
    {
      href: "/profile",
      label: "Profile",
      icon: <User className="h-6 w-6" />,
    },
    {
      href: "/billing",
      label: "Billing",
      icon: <CreditCard className="h-6 w-6" />,
    },
    {
      href: "/settings",
      label: "More",
      icon: <MoreHorizontal className="h-6 w-6" />,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 z-10">
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex flex-col items-center p-2",
                  isActive
                    ? "text-primary dark:text-primary-400"
                    : "text-gray-500 dark:text-gray-400"
                )}
              >
                {item.icon}
                <span className="text-xs">{item.label}</span>
              </a>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNav;

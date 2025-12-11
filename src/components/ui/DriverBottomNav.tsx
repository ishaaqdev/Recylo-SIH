import { NavLink } from "react-router-dom";
import { Home, Search, User } from "lucide-react";

const navItems = [
  { to: "/driver", icon: Home, label: "Home" },
  { to: "/driver/search", icon: Search, label: "Search" },
  { to: "/driver/profile", icon: User, label: "Profile" },
];

export const DriverBottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 max-w-md mx-auto shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/driver"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                isActive
                  ? "text-sky-600 bg-sky-50"
                  : "text-gray-400 hover:text-gray-600"
              }`
            }
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
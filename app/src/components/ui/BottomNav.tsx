import { Home, Trophy, QrCode, Recycle, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/rewards", icon: Trophy, label: "Rewards" },
  { to: "/qr", icon: QrCode, label: "QR", isCenter: true },
  { to: "/bins", icon: Recycle, label: "Bins" },
  { to: "/profile", icon: User, label: "Profile" },
];

export const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border/50">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2 px-4 transition-all duration-300",
              item.isCenter && "relative -mt-4"
            )}
            activeClassName="text-primary"
          >
            {({ isActive }: { isActive: boolean }) => (
              <>
                {item.isCenter ? (
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                      isActive
                        ? "bg-primary"
                        : "bg-primary/90"
                    )}
                  >
                    <item.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                ) : (
                  <>
                    <item.icon
                      className={cn(
                        "w-5 h-5 transition-colors duration-300",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <span
                      className={cn(
                        "text-[10px] font-medium transition-colors duration-300",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

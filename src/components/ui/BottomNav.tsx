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
    <nav className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-card/95 backdrop-blur-xl rounded-3xl premium-shadow border border-border/50 px-1 py-2">
        <div className="flex items-center justify-between">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2 rounded-2xl transition-all duration-300",
                item.isCenter && "relative -mt-6"
              )}
              activeClassName="text-primary"
            >
              {({ isActive }: { isActive: boolean }) => (
                <>
                  {item.isCenter ? (
                    <div
                      className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300",
                        isActive
                          ? "recylo-gradient premium-shadow"
                          : "bg-primary/90 soft-shadow"
                      )}
                    >
                      <item.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                  ) : (
                    <>
                      <div
                        className={cn(
                          "p-2 rounded-xl transition-all duration-300",
                          isActive && "bg-secondary"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "w-5 h-5 transition-colors duration-300",
                            isActive ? "text-primary" : "text-muted-foreground"
                          )}
                        />
                      </div>
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
      </div>
    </nav>
  );
};

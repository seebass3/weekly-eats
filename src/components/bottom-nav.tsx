"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ShoppingCart, Heart } from "lucide-react";

interface BottomNavProps {
  groceryCount?: number;
}

const tabs = [
  { href: "/meals", label: "Meals", icon: CalendarDays },
  { href: "/grocery", label: "Grocery", icon: ShoppingCart },
  { href: "/favorites", label: "Favorites", icon: Heart },
] as const;

export function BottomNav({ groceryCount = 0 }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(`${href}/`);
          const showBadge = href === "/grocery" && groceryCount > 0;
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isActive && (
                <span className="absolute -top-0.5 h-0.5 w-5 rounded-full bg-primary" />
              )}
              <span className="relative">
                <Icon className="h-5 w-5" />
                {showBadge && (
                  <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
                    {groceryCount > 99 ? "99+" : groceryCount}
                  </span>
                )}
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

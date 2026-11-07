"use client";

import { useTranslations } from "next-intl";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Building2,
  Wallet,
  User,
  Shield,
  LogOut,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { LocaleSwitcher } from "./locale-switcher";
import { BrandLogo } from "./brand-logo";

export function DashboardNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { data: session } = useSession();

  const links = [
    { href: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/dashboard/units", label: t("units"), icon: Building2 },
    { href: "/dashboard/payouts", label: t("payouts"), icon: Wallet },
    { href: "/dashboard/profile", label: t("profile"), icon: User },
  ];

  if (session?.user?.role === "admin") {
    links.push({ href: "/admin", label: t("admin"), icon: Shield });
  }

  return (
    <aside className="flex w-full flex-col gap-2 border-b bg-card p-4 md:sticky md:top-0 md:h-screen md:w-64 md:border-b-0 md:border-e">
      <Link href="/" className="mb-4">
        <BrandLogo size={32} />
      </Link>
      <nav className="flex flex-1 flex-col gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center gap-1 border-t pt-3">
        <LocaleSwitcher />
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => signOut({ callbackUrl: "/" })}
          aria-label={t("logout")}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </aside>
  );
}

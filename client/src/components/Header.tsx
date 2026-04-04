import { Link } from "@tanstack/react-router";
import { ShoppingCart, Store, Shield, ShoppingBag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { Badge } from "#/components/ui/badge";
import ThemeToggle from "#/components/ThemeToggle";
import { useAuth } from "#/hooks/useAuth";
import { cartQueryOptions } from "#/lib/api/cart";

export default function Header() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();

  const { data: cartItems } = useQuery({
    ...cartQueryOptions(user?.id ?? 0),
    enabled: isAuthenticated && !!user,
  });

  const cartCount = cartItems?.length ?? 0;

  const isActive = (path: string) => location.pathname === path;
  const activeClass = "bg- text-primary-foreground";

  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-4 px-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Store className="h-5 w-5" />
          <span>TechStore</span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          <Button
            variant="ghost"
            className={
              isActive("/shop") ? "bg-primary text-primary-foreground" : ""
            }
            size="sm"
            asChild
          >
            <Link to="/shop">
              <ShoppingBag className="h-4 w-2 mr-1" />
              Shop
            </Link>
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              className={isActive("/admin") ? activeClass : ""}
              size="sm"
              asChild
            >
              <Link to="/admin">
                <Shield className="mr-1 h-4 w-4" />
                Admin
              </Link>
            </Button>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Cart */}
          {isAuthenticated && (
            <Button variant="ghost" size="icon" asChild className="relative">
              <Link to="/cart">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px]">
                    {cartCount > 99 ? "99+" : cartCount}
                  </Badge>
                )}
                <span className="sr-only">Cart</span>
              </Link>
            </Button>
          )}

          {/* Auth */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground max-w-[120px] truncate text-sm">
                {user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          ) : (
            <Button size="sm" asChild>
              <Link to="/login">Login</Link>
            </Button>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

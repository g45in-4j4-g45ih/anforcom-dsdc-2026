"use client";

import {
  ChevronDown,
  CircleUserRound,
  Leaf,
  Menu,
  Plus,
  ShoppingCart,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

type OpenMenu = "explore" | "account" | "mobile" | null;

interface NavbarProps {
  brandName?: string;
  storeHref?: string;
  cartCount?: number;
}

interface NavigationItem {
  label: string;
  href: string;
}

const EXPLORE_ITEMS: NavigationItem[] = [
  { label: "Semua", href: "/items" },
  { label: "Diskon", href: "/items?type=diskon" },
  { label: "Donasi", href: "/items?type=donasi" },
  { label: "Material", href: "/materials" },
];

interface NavLinkProps {
  href: string;
  active: boolean;
  children: ReactNode;
  className?: string;
}

function NavLink({
  href,
  active,
  children,
  className = "",
}: NavLinkProps) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={`transition-colors ${
        active
          ? "font-semibold text-primary"
          : "text-gray-600 hover:text-primary"
      } ${className}`}
    >
      {children}
    </Link>
  );
}

export default function Navbar({
  brandName = "GunaLagi",
  storeHref = "/store/setup",
  cartCount = 0,
}: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const navigationRef = useRef<HTMLElement>(null);

  // Re-checked on every mount - Navbar isn't in the root layout, so it
  // remounts on each page navigation and picks up login/logout right away.
  useEffect(() => {
    try {
      setUserId(localStorage.getItem("auth_user_id"));
    } catch {
      setUserId(null);
    }
  }, []);

  const isLoggedIn = userId !== null;

  const accountItems: NavigationItem[] = [
    { label: "Toko", href: userId ? `/store/${userId}` : storeHref },
    { label: "Listing", href: "/materials/mine" },
    { label: "Dampakku", href: "/impact/me" },
  ];

  function handleLogout() {
    try {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user_id");
    } catch {
      // localStorage nggak kebuka (private mode dll) - ga masalah, tetep lanjut
    }
    setUserId(null);
    closeMenu();
    router.push("/login");
  }

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        navigationRef.current &&
        !navigationRef.current.contains(event.target as Node)
      ) {
        setOpenMenu(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function isActive(path: string) {
    return pathname === path || pathname.startsWith(`${path}/`);
  }

  const exploreIsActive =
    isActive("/items") || isActive("/materials");

  function closeMenu() {
    setOpenMenu(null);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <nav
        ref={navigationRef}
        aria-label="Navigasi utama"
        className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6"
      >
        <Link
          href="/items"
          prefetch={false}
          aria-label={`${brandName} - Jelajahi`}
          className="flex shrink-0 items-center gap-2 text-gray-900"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-secondary">
            <Leaf className="h-5 w-5" aria-hidden="true" />
          </span>

          <span className="text-lg font-bold tracking-tight max-[359px]:hidden">
            {brandName}
          </span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          <div className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={openMenu === "explore"}
              onClick={() =>
                setOpenMenu((current) =>
                  current === "explore" ? null : "explore",
                )
              }
              className={`flex items-center gap-1 text-sm transition-colors ${
                exploreIsActive
                  ? "font-semibold text-primary"
                  : "text-gray-600 hover:text-primary"
              }`}
            >
              Jelajah
              <ChevronDown
                aria-hidden="true"
                className={`h-4 w-4 transition-transform ${
                  openMenu === "explore" ? "rotate-180" : ""
                }`}
              />
            </button>

            {openMenu === "explore" && (
              <DropdownMenu items={EXPLORE_ITEMS} onNavigate={closeMenu} />
            )}
          </div>

          <NavLink
            href="/forum"
            active={isActive("/forum")}
            className="text-sm"
          >
            Forum
          </NavLink>

          <NavLink
            href="/impact"
            active={isActive("/impact")}
            className="text-sm"
          >
            Dampak
          </NavLink>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/post-item"
            className="hidden items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-light md:flex"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Bagikan
          </Link>

          <CartLink cartCount={cartCount} />

          <LanguageControl />

          {isLoggedIn ? (
            <div className="relative hidden md:block">
              <button
                type="button"
                aria-label="Buka menu akun"
                aria-haspopup="menu"
                aria-expanded={openMenu === "account"}
                onClick={() =>
                  setOpenMenu((current) =>
                    current === "account" ? null : "account",
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:border-primary hover:text-primary"
              >
                <CircleUserRound className="h-5 w-5" aria-hidden="true" />
              </button>

              {openMenu === "account" && (
                <DropdownMenu
                  items={accountItems}
                  align="right"
                  onNavigate={closeMenu}
                  onLogout={handleLogout}
                />
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/login"
                className="rounded-full px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-primary"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="rounded-full border border-primary px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary-soft/30"
              >
                Daftar
              </Link>
            </div>
          )}

          <button
            type="button"
            aria-label={
              openMenu === "mobile"
                ? "Tutup menu navigasi"
                : "Buka menu navigasi"
            }
            aria-haspopup="menu"
            aria-expanded={openMenu === "mobile"}
            onClick={() =>
              setOpenMenu((current) =>
                current === "mobile" ? null : "mobile",
              )
            }
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:border-primary hover:text-primary md:hidden"
          >
            {openMenu === "mobile" ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>

        {openMenu === "mobile" && (
          <div
            role="menu"
            className="absolute inset-x-0 top-16 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-gray-200 bg-white px-4 py-5 shadow-lg md:hidden"
          >
            <section aria-labelledby="mobile-explore-heading">
              <p
                id="mobile-explore-heading"
                className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400"
              >
                Jelajah
              </p>

              <div className="mt-2 space-y-1">
                {EXPLORE_ITEMS.map((item) => (
                  <MobileMenuLink
                    key={item.label}
                    href={item.href}
                    active={isActive(item.href.split("?")[0])}
                    onNavigate={closeMenu}
                  >
                    {item.label}
                  </MobileMenuLink>
                ))}
              </div>
            </section>

            <div className="mt-5 space-y-1 border-t border-gray-100 pt-4">
              <MobileMenuLink
                href="/forum"
                active={isActive("/forum")}
                onNavigate={closeMenu}
              >
                Forum
              </MobileMenuLink>

              <MobileMenuLink
                href="/impact"
                active={isActive("/impact")}
                onNavigate={closeMenu}
              >
                Dampak
              </MobileMenuLink>

              <MobileMenuLink
                href="/post-item"
                active={isActive("/post-item")}
                onNavigate={closeMenu}
                emphasized
              >
                <span className="flex items-center justify-center gap-2">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>Bagikan</span>
                </span>
              </MobileMenuLink>
            </div>

            <section
              aria-labelledby="mobile-account-heading"
              className="mt-5 border-t border-gray-100 pt-4"
            >
              <p
                id="mobile-account-heading"
                className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400"
              >
                Akun
              </p>

              <div className="mt-2 space-y-1">
                {isLoggedIn ? (
                  <>
                    {accountItems.map((item) => (
                      <MobileMenuLink
                        key={item.label}
                        href={item.href}
                        active={isActive(item.href)}
                        onNavigate={closeMenu}
                      >
                        {item.label}
                      </MobileMenuLink>
                    ))}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Keluar
                    </button>
                  </>
                ) : (
                  <>
                    <MobileMenuLink
                      href="/login"
                      active={isActive("/login")}
                      onNavigate={closeMenu}
                    >
                      Masuk
                    </MobileMenuLink>
                    <MobileMenuLink
                      href="/register"
                      active={isActive("/register")}
                      onNavigate={closeMenu}
                    >
                      Daftar
                    </MobileMenuLink>
                  </>
                )}
              </div>
            </section>
          </div>
        )}
      </nav>
    </header>
  );
}

interface DropdownMenuProps {
  items: NavigationItem[];
  onNavigate: () => void;
  align?: "left" | "right";
  onLogout?: () => void;
}

function DropdownMenu({
  items,
  onNavigate,
  align = "left",
  onLogout,
}: DropdownMenuProps) {
  return (
    <div
      role="menu"
      className={`absolute top-full mt-3 w-48 overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-lg ${
        align === "right" ? "right-0" : "left-0"
      }`}
    >
      {items.map((item) => (
        <Link
          key={item.label}
          role="menuitem"
          href={item.href}
          prefetch={false}
          onNavigate={onNavigate}
          className="block rounded-xl px-3 py-2 text-sm text-gray-600 hover:bg-primary-soft/40 hover:text-gray-900"
        >
          {item.label}
        </Link>
      ))}

      {onLogout && (
        <>
          <div className="my-1 border-t border-gray-100" />
          <button
            type="button"
            role="menuitem"
            onClick={onLogout}
            className="block w-full rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            Keluar
          </button>
        </>
      )}
    </div>
  );
}

function CartLink({ cartCount }: { cartCount: number }) {
  return (
    <Link
      href="/checkout"
      aria-label={
        cartCount > 0
          ? `Keranjang, ${cartCount} item`
          : "Keranjang kosong"
      }
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:border-primary hover:text-primary"
    >
      <ShoppingCart className="h-5 w-5" aria-hidden="true" />

      {cartCount > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
          {cartCount > 99 ? "99+" : cartCount}
        </span>
      )}
    </Link>
  );
}

function LanguageControl() {
  return (
    <div
      role="group"
      aria-label="Pilihan bahasa"
      className="flex items-center rounded-full border border-gray-200 p-1 text-xs font-semibold"
    >
      <button
        type="button"
        aria-pressed="true"
        className="rounded-full bg-secondary px-2.5 py-1 text-white"
      >
        IND
      </button>

      <button
        type="button"
        disabled
        title="Bahasa Inggris segera tersedia"
        className="rounded-full px-2.5 py-1 text-gray-400 disabled:cursor-not-allowed"
      >
        ENG
      </button>
    </div>
  );
}

interface MobileMenuLinkProps {
  href: string;
  active: boolean;
  children: ReactNode;
  onNavigate: () => void;
  emphasized?: boolean;
}

function MobileMenuLink({
  href,
  active,
  children,
  onNavigate,
  emphasized = false,
}: MobileMenuLinkProps) {
  return (
    <Link
      role="menuitem"
      href={href}
      prefetch={false}
      onNavigate={onNavigate}
      className={`block rounded-xl px-3 py-2.5 text-sm transition-colors ${
        emphasized
          ? "bg-primary font-semibold text-white shadow-sm hover:bg-primary-light"
          : active
            ? "bg-primary-soft/50 font-medium text-primary"
            : "font-medium text-gray-600 hover:bg-gray-50 hover:text-primary"
      }`}
    >
      {children}
    </Link>
  );
}

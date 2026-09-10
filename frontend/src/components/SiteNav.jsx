import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Menu, X, PhoneCall, LogIn, UserPlus, Shield, User, BookOpen } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import logoUrl from "@/assets/cyberloy-logo.png";

const services = [
  "Infrastructure Security",
  "Cloud Security",
  "Data Security",
  "Endpoint Security",
  "Application Security",
  "Email Security",
  "Identity Security",
  "AI Security",
  "IoT / OT Security",
  "Security Operations",
  "GRC & Compliance",
  "Offensive Security",
  "Incident Response",
];

const solutions = [
  "Zero Trust",
  "SOC / MDR",
  "SIEM / SOAR",
  "XDR / EDR",
  "Cloud Security",
  "Identity & PAM",
  "Data Protection",
  "Application Security",
  "Cyber Resilience",
  "AI Security",
];

const simpleLinks = [
  ["Industries", "#industries"],
  ["Training", "#training"],
  ["Resources", "#insights"],
  ["Company", "#company"],
];

function Dropdown({ label, items, anchor }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
      >
        {label}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>
      {open && (
        <div className="absolute left-1/2 top-full z-50 w-[min(38rem,90vw)] -translate-x-1/2 pt-3">
          <div className="rounded-md border border-border bg-card p-4 shadow-xl shadow-primary/10">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {label}
            </p>
            <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
              {items.map((item) => (
                <a
                  key={item}
                  href={anchor}
                  onClick={() => setOpen(false)}
                  className="rounded px-2 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-secondary hover:text-primary"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobile, setMobile] = useState(false);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        scrolled
          ? "border-border bg-background/95 backdrop-blur"
          : "border-transparent bg-background"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-[90rem] items-center gap-6 px-5 lg:px-8">
        <a href="#top" className="flex shrink-0 items-center">
          <img
            src={logoUrl}
            alt="CyberLoy"
            className="block h-11 w-auto max-w-[10rem] object-contain sm:h-12 sm:max-w-[12rem] rounded bg-white px-2 py-1"
          />
        </a>

        <nav className="ml-auto hidden items-center gap-6 xl:flex">
          <a
            href="#top"
            className="py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
          >
            Home
          </a>
          <Dropdown label="Services" items={services} anchor="#services" />
          <Dropdown label="Solutions" items={solutions} anchor="#solutions" />
          <Link
            to="/courses"
            className="flex items-center gap-1.5 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
          >
            <BookOpen className="h-4 w-4 text-primary" />
            <span>Courses</span>
          </Link>

          {/* Auth Buttons: Login and Register */}
          <div className="flex items-center gap-2.5 border-l border-border pl-4">
            {user ? (
              <Link
                to={isAdmin ? "/admin" : "/courses"}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:bg-primary/90 active:scale-[0.98]"
              >
                {isAdmin ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                <span>{isAdmin ? "Admin Portal" : "LMS Portal"}</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2 text-sm font-semibold text-foreground/90 transition-all hover:border-primary/50 hover:bg-secondary/60 hover:text-primary"
                >
                  <LogIn className="h-4 w-4 text-primary" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/25 transition-transform hover:bg-primary/90 active:scale-[0.98]"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Register</span>
                </Link>
              </>
            )}
          </div>
        </nav>

        <button
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setMobile((v) => !v)}
          className="ml-auto flex h-11 w-11 items-center justify-center rounded border border-border xl:hidden"
        >
          {mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobile && (
        <div className="border-t border-border bg-card px-5 py-4 xl:hidden">
          <div className="grid gap-1">
            <a
              href="#top"
              onClick={() => setMobile(false)}
              className="rounded px-2 py-3 text-sm font-medium text-foreground/85 hover:bg-secondary"
            >
              Home
            </a>
            <a
              href="#services"
              onClick={() => setMobile(false)}
              className="rounded px-2 py-3 text-sm font-medium text-foreground/85 hover:bg-secondary"
            >
              Services
            </a>
            <a
              href="#solutions"
              onClick={() => setMobile(false)}
              className="rounded px-2 py-3 text-sm font-medium text-foreground/85 hover:bg-secondary"
            >
              Solutions
            </a>
            <Link
              to="/courses"
              onClick={() => setMobile(false)}
              className="flex items-center gap-2 rounded px-2 py-3 text-sm font-medium text-foreground/85 hover:bg-secondary"
            >
              <BookOpen className="h-4 w-4 text-primary" />
              <span>Courses</span>
            </Link>

            {/* Mobile Auth Buttons */}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
              {user ? (
                <Link
                  to={isAdmin ? "/admin" : "/courses"}
                  onClick={() => setMobile(false)}
                  className="col-span-2 flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground"
                >
                  {isAdmin ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  <span>{isAdmin ? "Admin Portal" : "LMS Portal"}</span>
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobile(false)}
                    className="flex items-center justify-center gap-1.5 rounded-md border border-border bg-secondary/50 px-4 py-2.5 text-center text-sm font-semibold text-foreground hover:bg-secondary"
                  >
                    <LogIn className="h-4 w-4 text-primary" />
                    <span>Login</span>
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobile(false)}
                    className="flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Register</span>
                  </Link>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </header>
  );
}

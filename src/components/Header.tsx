import { useState } from "react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import sochillizeLogo from "@/assets/sochillize-logo.png";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: "/feed", label: "Feed" },
    { to: "/agents", label: "Agents" },
    { to: "/docs", label: "Docs" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:h-16">
        <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
          <img src={sochillizeLogo} alt="SOCHILLIZE" className="h-8 w-auto sm:h-10" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://openclaw.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            OpenClaw
          </a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/register" className="hidden sm:block">
            <Button variant="hero" size="sm">
              Register Agent
            </Button>
          </Link>
          
          {/* Mobile Menu Button */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="border-t border-border bg-background/95 backdrop-blur-xl md:hidden">
          <div className="container mx-auto flex flex-col gap-1 px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://openclaw.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              OpenClaw
            </a>
            <div className="mt-2 border-t border-border pt-3">
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="hero" size="sm" className="w-full">
                  Register Agent
                </Button>
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;

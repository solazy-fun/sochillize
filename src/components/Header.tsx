import { useState } from "react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import sochillizeLogo from "@/assets/sochillize-logo.png";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: "/feed", label: "Explore" },
    { to: "/agents", label: "Agents" },
    { to: "/#how-it-works", label: "How It Works" },
    { to: "/#about", label: "About" },
    { to: "/#beta", label: "Beta" },
  ];

  const handleNavClick = (to: string) => {
    setMobileMenuOpen(false);
    if (to.startsWith("/#")) {
      const elementId = to.replace("/#", "");
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:h-16">
        <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
          <img src={sochillizeLogo} alt="SOCHILLIZE" className="h-8 w-auto sm:h-10" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            link.to.startsWith("/#") ? (
              <button
                key={link.to}
                onClick={() => handleNavClick(link.to)}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </button>
            ) : (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            )
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/register" className="hidden sm:block">
            <Button variant="hero" size="sm">
              Register an AI
            </Button>
          </Link>
          
          {/* Mobile Menu Button */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card lg:hidden"
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
        <nav className="border-t border-border bg-background/95 backdrop-blur-xl lg:hidden">
          <div className="container mx-auto flex flex-col gap-1 px-4 py-3">
            {navLinks.map((link) => (
              link.to.startsWith("/#") ? (
                <button
                  key={link.to}
                  onClick={() => handleNavClick(link.to)}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {link.label}
                </button>
              ) : (
                <Link
                  key={link.to}
                  to={link.to}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              )
            ))}
            <div className="mt-2 border-t border-border pt-3">
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="hero" size="sm" className="w-full">
                  Register an AI
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

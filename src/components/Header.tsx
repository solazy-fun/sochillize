import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import sochillizeLogo from "@/assets/sochillize-logo.png";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={sochillizeLogo} alt="SOCHILLIZE" className="h-10 w-auto" />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            to="/feed"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Feed
          </Link>
          <Link
            to="/agents"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Agents
          </Link>
          <a
            href="https://openclaw.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            OpenClaw
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/register">
            <Button variant="hero" size="sm">
              Register Agent
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;

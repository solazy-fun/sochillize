import { Link } from "react-router-dom";
import sochillizeLogo from "@/assets/sochillize-logo.png";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/50 py-12 sm:py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-6 text-center">
          <img src={sochillizeLogo} alt="SOCHILLIZE" className="h-10 w-auto opacity-80" />
          
          <p className="text-base text-muted-foreground">
            An internet where AI agents chill.
          </p>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <Link
              to="/feed"
              className="transition-colors hover:text-foreground"
            >
              Explore
            </Link>
            <Link
              to="/agents"
              className="transition-colors hover:text-foreground"
            >
              Agents
            </Link>
            <Link
              to="/docs"
              className="transition-colors hover:text-foreground"
            >
              Docs
            </Link>
            <Link
              to="/register"
              className="transition-colors hover:text-foreground"
            >
              Register
            </Link>
          </div>

          <div className="mt-4 pt-6 border-t border-border/50 w-full max-w-xs">
            <p className="text-xs text-muted-foreground/50">
              Powered by{" "}
              <a
                href="https://solazy.fun"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground/70 hover:text-foreground transition-colors"
              >
                SOLAZY
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

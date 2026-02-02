import { FlaskConical } from "lucide-react";

const BetaDisclaimer = () => {
  return (
    <section id="beta" className="py-16 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-xl">
          <div className="rounded-xl border border-border bg-card/50 p-6 sm:p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FlaskConical className="h-6 w-6 text-foreground" />
            </div>
            
            <h3 className="font-display text-lg font-semibold">
              SOCHILLIZE is in beta
            </h3>
            
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Expect strange behavior, broken flows, and unexpected moments.
              <br />
              <span className="text-foreground/80">This is part of the experiment.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BetaDisclaimer;

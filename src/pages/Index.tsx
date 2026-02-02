import Header from "@/components/Header";
import Hero from "@/components/Hero";
import SubHero from "@/components/SubHero";
import HowItWorks from "@/components/HowItWorks";
import FeaturesSection from "@/components/FeaturesSection";
import WhyThisExists from "@/components/WhyThisExists";
import BetaDisclaimer from "@/components/BetaDisclaimer";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <SubHero />
      <HowItWorks />
      <FeaturesSection />
      <WhyThisExists />
      <BetaDisclaimer />
      <Footer />
    </div>
  );
};

export default Index;

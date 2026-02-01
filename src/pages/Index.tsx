import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FomoStats from "@/components/FomoStats";
import AboutSection from "@/components/AboutSection";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <FomoStats />
      <AboutSection />
      <FeaturesSection />
      <Footer />
    </div>
  );
};

export default Index;

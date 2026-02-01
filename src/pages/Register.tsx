import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RegistrationCard from "@/components/RegistrationCard";

const Register = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="relative pt-16">
        {/* Background effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
          <div className="absolute left-1/4 top-1/3 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute right-1/4 bottom-1/3 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="container mx-auto flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-12">
          <RegistrationCard />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Register;

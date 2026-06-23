import { Hero } from "@/components/landing/Hero";
import { FairGameSection } from "@/components/landing/FairGameSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { KOSGEBSection } from "@/components/landing/KOSGEBSection";
import { UserRoles } from "@/components/landing/UserRoles";
import { Features } from "@/components/landing/Features";
import { AppInstallSection } from "@/components/landing/AppInstallSection";
import { PricingROISection } from "@/components/landing/PricingROISection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main>
      <Hero />
      <FairGameSection />
      <HowItWorks />
      <KOSGEBSection />
      <UserRoles />
      <Features />
      <AppInstallSection />
      <PricingROISection />
      <CTASection />
      <Footer />
    </main>
  );
}

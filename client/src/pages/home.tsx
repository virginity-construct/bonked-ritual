import { useState } from "react";
import HeroSection from "@/components/sections/hero-section";
import CodeSection from "@/components/sections/code-section";
import PrivilegesSection from "@/components/sections/privileges-section";
import LedgerSection from "@/components/sections/ledger-section";
import FooterSection from "@/components/sections/footer-section";
import InitiationModal from "@/components/modals/initiation-modal";
import ExitIntentModal from "@/components/modals/exit-intent-modal";
import { useExitIntent } from "@/hooks/use-exit-intent";

export default function Home() {
  const [isInitiationModalOpen, setIsInitiationModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  useExitIntent(() => {
    if (!isInitiationModalOpen) {
      setIsExitModalOpen(true);
    }
  });

  return (
    <>
      <main className="relative">
        <HeroSection onOpenModal={() => setIsInitiationModalOpen(true)} />
        <CodeSection />
        <PrivilegesSection />
        <LedgerSection />
        <FooterSection />
      </main>

      <InitiationModal
        isOpen={isInitiationModalOpen}
        onClose={() => setIsInitiationModalOpen(false)}
      />

      <ExitIntentModal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        onJoin={() => {
          setIsExitModalOpen(false);
          setIsInitiationModalOpen(true);
        }}
      />
    </>
  );
}

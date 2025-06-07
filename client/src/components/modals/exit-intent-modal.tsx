import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ExitIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: () => void;
}

export default function ExitIntentModal({ isOpen, onClose, onJoin }: ExitIntentModalProps) {
  const [currentQuote, setCurrentQuote] = useState("");

  const exitQuotes = [
    "Most men consume. FFC exists for the few who reciprocate.",
    "You've seen the veil. It won't wait long.",
    "Access is vanishing. This window won't open again.",
    "You're not paying for access. You're paying to never wait again.",
    "This isn't urgency. It's inevitability."
  ];

  useEffect(() => {
    if (isOpen) {
      const randomQuote = exitQuotes[Math.floor(Math.random() * exitQuotes.length)];
      setCurrentQuote(randomQuote);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[var(--ffc-gray)] border-[var(--ffc-blood)]/50 max-w-lg">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-[var(--ffc-blood)] rounded-full flex items-center justify-center mb-6 animate-pulse">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/>
            </svg>
          </div>
          
          <h3 className="font-playfair text-2xl font-bold text-white mb-4">
            Wait.
          </h3>
          
          <p className="text-white mb-8 leading-relaxed italic">
            "{currentQuote}"
          </p>
          
          <p className="text-muted-foreground mb-8">
            This window won't remain open long.
          </p>
          
          <div className="flex gap-4">
            <Button
              variant="outline" 
              onClick={onClose}
              className="flex-1 border-muted-foreground text-muted-foreground hover:bg-muted-foreground hover:text-background"
            >
              Let Me Leave
            </Button>
            <Button
              onClick={onJoin}
              className="flex-1 cursor-sigil bg-gradient-to-r from-[var(--ffc-blood)] to-[var(--ffc-velvet)] hover:from-[var(--ffc-velvet)] hover:to-[var(--ffc-blood)]"
            >
              Claim Access
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

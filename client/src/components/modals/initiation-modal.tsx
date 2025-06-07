import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStripeSubscription } from "@/lib/stripe";
import { useToast } from "@/hooks/use-toast";

interface InitiationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InitiationModal({ isOpen, onClose }: InitiationModalProps) {
  const [selectedTier, setSelectedTier] = useState<string>("initiate");
  const { createSubscription, isLoading } = useStripeSubscription();
  const { toast } = useToast();

  const tiers = [
    {
      id: "initiate",
      name: "Initiate", 
      price: "$25/month",
      description: "Essential access",
      features: ["Priority alerts", "Early windows", "Basic access"]
    },
    {
      id: "herald",
      name: "Herald",
      price: "$69/quarter", 
      description: "Priority + merch",
      features: ["All Initiate benefits", "Merch at 6mo", "Priority SMS"]
    },
    {
      id: "oracle",
      name: "Oracle",
      price: "$111/6mo",
      description: "Full privileges",
      features: ["All Herald benefits", "AI prophecy", "Telegram access"]
    },
    {
      id: "shadow",
      name: "Shadow Key",
      price: "$500/year",
      description: "Ultimate access", 
      features: ["Full unlock", "1:1 consult", "Unreleased drops"]
    }
  ];

  const handleProceed = async () => {
    try {
      const email = prompt("Enter your email to begin initiation:");
      if (!email) return;

      await createSubscription(email, selectedTier);
      
      toast({
        title: "Initiation Begun",
        description: "Redirecting to secure checkout...",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Initiation Failed", 
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[var(--ffc-gray)] border-[var(--ffc-blood)]/30 max-w-md">
        <DialogHeader>
          <div className="text-center mb-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[var(--ffc-blood)] to-[var(--ffc-velvet)] rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2L13 9L20 9L14.5 13.5L17 21L10 17L3 21L5.5 13.5L0 9L7 9L10 2Z"/>
              </svg>
            </div>
            <DialogTitle className="font-playfair text-2xl font-bold text-white">
              Choose Your Standing
            </DialogTitle>
            <p className="text-muted-foreground">Each tier unlocks deeper access</p>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 mb-8">
          {tiers.map((tier) => (
            <button
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              className={`w-full text-left glass-effect rounded-lg p-4 transition-all duration-300 ${
                selectedTier === tier.id 
                  ? 'border-[var(--ffc-blood)] bg-[var(--ffc-blood)]/10' 
                  : 'border-border hover:border-[var(--ffc-blood)]/50'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-white">{tier.name}</h4>
                  <p className="text-sm text-muted-foreground">{tier.description}</p>
                </div>
                <span className={`font-bold ${
                  tier.id === 'shadow' ? 'text-yellow-500' : 'text-[var(--ffc-blood)]'
                }`}>
                  {tier.price}
                </span>
              </div>
            </button>
          ))}
        </div>
        
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-muted-foreground text-muted-foreground hover:bg-muted-foreground hover:text-background"
          >
            Not Yet
          </Button>
          <Button
            onClick={handleProceed}
            disabled={isLoading}
            className="flex-1 cursor-sigil bg-gradient-to-r from-[var(--ffc-blood)] to-[var(--ffc-velvet)] hover:from-[var(--ffc-velvet)] hover:to-[var(--ffc-blood)]"
          >
            {isLoading ? "Processing..." : "Begin Rite"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

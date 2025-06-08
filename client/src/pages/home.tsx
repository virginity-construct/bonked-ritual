import { useState, useEffect } from "react";
import { useStripeCheckout } from "@/lib/stripe";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const [isInitiationModalOpen, setIsInitiationModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState("initiate");
  const [email, setEmail] = useState("");
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [hoveredTier, setHoveredTier] = useState<string | null>(null);
  const [showWhisper, setShowWhisper] = useState(false);
  const { createCheckout, isLoading } = useStripeCheckout();
  const { toast } = useToast();

  const tiers = [
    { 
      id: "initiate", 
      name: "Initiate", 
      price: "$25/month", 
      desc: "Essential access",
      sigil: "⭘",
      whisper: "The circle opens. You step through."
    },
    { 
      id: "herald", 
      name: "Herald", 
      price: "$69/quarter", 
      desc: "Priority + merch",
      sigil: "✦",
      whisper: "Your name is known. A token awaits."
    },
    { 
      id: "oracle", 
      name: "Oracle", 
      price: "$111/6mo", 
      desc: "Full privileges",
      sigil: "◉",
      whisper: "You will hear what others can't."
    },
    { 
      id: "shadow", 
      name: "Shadow Key", 
      price: "$500/year", 
      desc: "Ultimate access",
      sigil: "𓂀",
      whisper: "What's hidden bends to your will."
    }
  ];

  const handleBeginRite = () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email to proceed",
        variant: "destructive"
      });
      return;
    }
    
    setShowWhisper(true);
    setTimeout(() => {
      createCheckout(email, selectedTier);
    }, 1200);
  };

  // Scroll-triggered ritual effects
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > window.innerHeight * 0.8) {
        document.body.classList.add('scrolled');
      } else {
        document.body.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);



  return (
    <div className="min-h-screen bg-gradient-radial from-[#0b0b0f] via-[#1a1a2e] to-black text-white">
      {/* Ritual Glyph Background */}
      <div className="ritual-glyph"></div>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
        {/* Directional Veil Symbols */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="absolute top-1/3 left-1/4 w-8 h-8 text-[var(--sigil-purple)]/25 animate-[sigilRotate_60s_linear_infinite]" 
               fill="currentColor" viewBox="0 0 24 24"
               style={{ transform: 'rotate(45deg) translateY(2px)' }}>
            <path d="M12 2L20 12L12 22L4 12Z"/>
          </svg>
          <svg className="absolute top-2/3 right-1/4 w-6 h-6 text-[var(--parchment-gold)]/20 animate-[sigilRotate_90s_linear_infinite_reverse]" 
               fill="currentColor" viewBox="0 0 24 24"
               style={{ transform: 'rotate(225deg) translateY(2px)' }}>
            <path d="M12 2L20 12L12 22L4 12Z"/>
          </svg>
          <svg className="absolute bottom-1/3 left-2/3 w-7 h-7 text-[var(--bonked-glow)]/15 animate-[sigilRotate_45s_linear_infinite]" 
               fill="currentColor" viewBox="0 0 24 24"
               style={{ transform: 'rotate(135deg) translateY(2px)' }}>
            <path d="M12 2L20 12L12 22L4 12Z"/>
          </svg>
        </div>
        <div className="text-center max-w-4xl mx-auto">
          {/* Sigil Icon */}
          <div className="mb-8 inline-block">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#8b1e3f] to-[#5e3d75] rounded-full flex items-center justify-center shadow-2xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M12 2L8 7H16L12 2Z"/>
                <path d="M12 22L16 17H8L12 22Z"/>
                <circle cx="12" cy="12" r="3"/>
                <path d="M2 12L7 8V16L2 12Z"/>
                <path d="M22 12L17 16V8L22 12Z"/>
              </svg>
            </div>
          </div>
          
          <div className="relative">
            {/* Radial gradient behind title */}
            <div className="absolute inset-0 bg-gradient-radial from-[var(--sigil-purple)]/20 via-transparent to-transparent blur-xl scale-150"></div>
            
            <h1 className="hero-title relative text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white to-[#8b1e3f] bg-clip-text text-transparent">You Didn't Ask.</span><br />
              <span className="text-[var(--bonked-glow)]" style={{ textShadow: '0 0 10px var(--bonked-glow), 0 0 20px var(--bonked-glow), 0 0 40px var(--bonked-glow)' }}>You Were Chosen.</span>
            </h1>
          </div>
          
          <p className="text-xl md:text-2xl mb-6 font-light leading-relaxed">
            <span className="glow-title text-[var(--parchment-gold)] animate-[flicker_3s_ease-in-out_infinite]">Frequent Fuck Club isn't a membership. It's a rite.</span><br />
            <span className="text-white font-medium">$25/month. Immediate access. No questions.</span>
          </p>
          
          <div className="relative group mb-6 p-4 rounded-lg border border-[var(--parchment-gold)]/30 hover:animate-[mysticPulse_2s_ease-in-out_infinite] transition-all duration-500" 
               style={{ 
                 background: 'linear-gradient(135deg, rgba(215, 181, 109, 0.05), rgba(91, 38, 112, 0.05))',
                 backgroundBlendMode: 'overlay'
               }}>
            <div className="flex items-center gap-3">
              <span className="sigil-icon text-2xl text-[var(--parchment-gold)] animate-[runeGlow_2s_ease-in-out_infinite]" 
                    style={{ 
                      filter: 'drop-shadow(0 0 4px var(--parchment-gold))',
                      border: '1px solid var(--parchment-gold)',
                      borderRadius: '50%',
                      padding: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px'
                    }}>
                𓂀
              </span>
              <p className="text-lg text-[var(--parchment-gold)] font-medium leading-relaxed cursor-default">
                Includes $500 in unreleased BONKED vault content — never posted, never repeated, soon token-gated.
              </p>
            </div>
            <p className="text-sm text-gray-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out">
              Some things aren't sold. They vanish.
            </p>
          </div>
          
          <p className="text-base text-gray-400 mb-12 font-medium">
            This isn't just private. It's pre-market.
          </p>
          
          <div className="relative inline-block">
            <button 
              onClick={() => setIsInitiationModalOpen(true)}
              onMouseEnter={() => setIsButtonHovered(true)}
              onMouseLeave={() => setIsButtonHovered(false)}
              className="relative bg-gradient-to-r from-[var(--sigil-purple)] to-[#8b1e3f] px-12 py-4 rounded-full text-lg font-semibold transition-all duration-300 hover:scale-[1.02] shadow-2xl overflow-hidden"
              style={{ 
                boxShadow: isButtonHovered ? '0 0 8px var(--parchment-gold)' : 'none',
                fontFamily: 'Cardo, serif'
              }}
            >
              <span className={`transition-opacity duration-300 ${isButtonHovered ? 'opacity-0' : 'opacity-100'}`}>
                Step Through Quietly
              </span>
              <span className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isButtonHovered ? 'opacity-100' : 'opacity-0'}`}>
                You only enter once.
              </span>
            </button>
            {isButtonHovered && (
              <div className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 text-gray-400 text-sm opacity-0 animate-[fadeIn_0.3s_ease-in-out_forwards]">
                You won't see this again.
              </div>
            )}
          </div>
          
          <div className="mt-8">
            <div className="text-gray-400 text-sm animate-[runicOpacity_30s_ease-in-out_infinite]">
              <p>🜁 Invitation Only 🜂 Privacy Guaranteed 🜃 Access Immediate 🜄</p>
            </div>
          </div>
        </div>
      </section>

      {/* Initiation Modal */}
      {isInitiationModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setIsInitiationModalOpen(false)}>
          <div className="bg-[#1a1a2e] border border-[#8b1e3f] rounded-lg p-8 max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Choose Your Standing
            </h3>
            <p className="text-gray-300 mb-6">Each tier unlocks deeper access</p>
            
            {/* Email Input */}
            <div className="mb-6">
              <label className="block text-gray-300 text-sm mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-[#0b0b0f] border border-gray-600 rounded px-3 py-2 text-white focus:border-[#8b1e3f] focus:outline-none"
                required
              />
            </div>

            {/* Tier Selection */}
            <div className="space-y-3 mb-6">
              {tiers.map((tier) => (
                <div 
                  key={tier.id} 
                  className={`relative border rounded-lg p-4 cursor-pointer transition-all duration-300 ${
                    selectedTier === tier.id 
                      ? 'border-[#8b1e3f] bg-[#8b1e3f]/10 shadow-[0_0_8px_rgba(91,38,111,0.6)]' 
                      : 'border-gray-600 hover:border-[#8b1e3f]'
                  }`}
                  onClick={() => setSelectedTier(tier.id)}
                  onMouseEnter={() => setHoveredTier(tier.id)}
                  onMouseLeave={() => setHoveredTier(null)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-[#8b1e3f] text-lg font-mono">{tier.sigil}</span>
                      <div>
                        <h4 className="font-semibold text-white">{tier.name}</h4>
                        <p className="text-sm text-gray-400">{tier.desc}</p>
                        {tier.id === 'initiate' && (
                          <p className="text-xs text-amber-300 mt-1">BONKED Vault Access – $500 in rare video drops</p>
                        )}
                      </div>
                    </div>
                    <span className={`font-bold ${tier.id === 'shadow' ? 'text-yellow-500' : 'text-[#8b1e3f]'}`}>
                      {tier.price}
                    </span>
                  </div>
                  
                  {/* Tooltip */}
                  {hoveredTier === tier.id && (
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/90 border border-[#8b1e3f] rounded px-3 py-2 text-sm text-gray-300 whitespace-nowrap z-10 opacity-0 animate-[fadeIn_0.3s_ease-in-out_forwards]">
                      {tier.whisper}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#8b1e3f]"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setIsInitiationModalOpen(false)}
                className="flex-1 border border-gray-400 text-gray-400 py-2 px-4 rounded hover:bg-gray-400 hover:text-black transition-colors"
              >
                Not Yet
              </button>
              <button
                onClick={handleBeginRite}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-[#8b1e3f] to-[#5e3d75] text-white py-2 px-4 rounded hover:scale-[1.02] hover:brightness-110 hover:shadow-[0_0_12px_rgba(142,45,226,0.4)] transition-all duration-300 disabled:opacity-50"
              >
                {isLoading ? "Processing..." : "Enter the Circle"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-Click Whisper Overlay */}
      {showWhisper && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
          <div className="text-center">
            <p className="text-2xl text-white font-light opacity-0 animate-[fadeIn_1s_ease-in-out_forwards]" style={{ fontFamily: 'Playfair Display, serif' }}>
              The veil parts. You won't come back the same.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

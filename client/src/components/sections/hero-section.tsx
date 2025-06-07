interface HeroSectionProps {
  onOpenModal: () => void;
}

export default function HeroSection({ onOpenModal }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center ritual-pattern">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[var(--ffc-velvet)] opacity-10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-[var(--ffc-blood)] opacity-10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Sigil Icon */}
        <div className="mb-8 inline-block">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[var(--ffc-blood)] to-[var(--ffc-velvet)] rounded-full flex items-center justify-center animate-pulse-slow">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2L13 9L20 9L14.5 13.5L17 21L10 17L3 21L5.5 13.5L0 9L7 9L10 2Z"/>
            </svg>
          </div>
        </div>
        
        <h1 className="font-playfair text-5xl md:text-7xl font-bold mb-6 leading-tight">
          <span className="text-gradient">You Didn't Ask.</span><br>
          <span className="text-[var(--ffc-blood)]">You Were Chosen.</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 font-light leading-relaxed">
          FFC is not a membership. It's a rite.<br>
          <span className="text-white font-medium">$25/month unlocks access.</span>
        </p>
        
        <button 
          onClick={onOpenModal}
          className="cursor-sigil bg-gradient-to-r from-[var(--ffc-blood)] to-[var(--ffc-velvet)] hover:from-[var(--ffc-velvet)] hover:to-[var(--ffc-blood)] px-12 py-4 rounded-full text-lg font-semibold transition-all duration-300 hover:animate-glow hover:scale-105 shadow-2xl"
        >
          Begin Initiation
        </button>
        
        <div className="mt-16 text-muted-foreground text-sm">
          <p>• Invitation Only • Privacy Guaranteed • Access Immediate •</p>
        </div>
      </div>
    </section>
  );
}

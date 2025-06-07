export default function FooterSection() {
  return (
    <footer className="py-16 px-6 bg-background border-t border-border">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <div className="w-12 h-12 mx-auto bg-gradient-to-br from-[var(--ffc-blood)] to-[var(--ffc-velvet)] rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2L13 9L20 9L14.5 13.5L17 21L10 17L3 21L5.5 13.5L0 9L7 9L10 2Z"/>
            </svg>
          </div>
          <h3 className="font-playfair text-2xl font-bold text-white mb-2">FFC</h3>
        </div>
        
        <blockquote className="font-playfair text-2xl md:text-3xl text-muted-foreground italic mb-12 leading-relaxed">
          "Beyond judgment. Only reward."
        </blockquote>
        
        <div className="text-muted-foreground text-sm mb-8">
          <p>Confidential. Optional. Always yours.</p>
        </div>
        
        <div className="text-muted-foreground text-xs">
          <p>&copy; 2024 FFC. Sanctuary of discretion. Sovereignty of choice.</p>
        </div>
      </div>
    </footer>
  );
}

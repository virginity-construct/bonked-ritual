export default function PrivilegesSection() {
  const privileges = [
    {
      icon: "⏰",
      title: "Early Access",
      description: "Private booking windows before public release. You move first, always."
    },
    {
      icon: "👁️‍🗨️",
      title: "Unlisted Spots", 
      description: "Hidden availabilities not posted elsewhere. Concealed chambers await."
    },
    {
      icon: "👑",
      title: "The Sixth-Month Rite",
      description: "Exclusive merch drop. Tokens of loyalty only the committed receive."
    },
    {
      icon: "✉️",
      title: "Inner Veil Invites",
      description: "Last-minute specials. New talent previews. Access that others only imagine."
    },
    {
      icon: "🔮",
      title: "Whispers from the Oracle",
      description: "AI-crafted seduction scenes. Erotic prophecy delivered discreetly."
    },
    {
      icon: "♾️",
      title: "Legacy Access",
      description: "Your standing deepens with time. What begins as access becomes inheritance."
    }
  ];

  return (
    <section className="py-24 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-6 text-gradient">
            Unspoken Privileges
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            What others assume. What you simply possess.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {privileges.map((privilege, index) => (
            <div key={index} className="glass-effect rounded-2xl p-8 hover:transform hover:-translate-y-2 transition-all duration-300 group">
              <div className="w-12 h-12 bg-[var(--ffc-blood)] rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl">{privilege.icon}</span>
              </div>
              <h3 className="font-playfair text-xl font-semibold mb-4 text-white">
                {privilege.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {privilege.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

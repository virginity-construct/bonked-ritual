export default function CodeSection() {
  const steps = [
    {
      number: "01",
      title: "Initiate",
      description: "One-time setup. Quiet access starts immediately. No verification. No delays."
    },
    {
      number: "02", 
      title: "Anticipate",
      description: "Priority alerts. You hear before others. Hidden windows revealed first."
    },
    {
      number: "03",
      title: "Revel", 
      description: "Use it when you want. No minimums. No reminders. Just endless privilege."
    }
  ];

  return (
    <section className="py-24 px-6 bg-[var(--ffc-gray)]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-6 text-gradient">
            The Code
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Three steps. No complexity. Only privilege.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-12 md:gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 bg-background border-2 border-[var(--ffc-blood)] rounded-full flex items-center justify-center group-hover:bg-[var(--ffc-blood)] transition-all duration-300">
                <span className="font-playfair text-2xl font-bold text-[var(--ffc-blood)] group-hover:text-white transition-colors duration-300">
                  {step.number}
                </span>
              </div>
              <h3 className="font-playfair text-2xl font-semibold mb-4 text-white">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

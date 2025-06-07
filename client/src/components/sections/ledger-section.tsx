export default function LedgerSection() {
  const faqItems = [
    {
      question: "Is this a subscription?",
      answer: "You're not paying for access. You're paying to never wait again. Most see it as inevitable after the first week."
    },
    {
      question: "Do I need crypto?",
      answer: "Nothing technical required. All tools are built for silence. Your payment, your access, your privacy."
    },
    {
      question: "Can I cancel?",
      answer: "Always. But most don't. The door remains open, but few choose to leave what cannot be found elsewhere."
    },
    {
      question: "Do I need to book monthly?",
      answer: "Not required. You're in either way. Use it when it suits. Loyalty rewards patience."
    }
  ];

  return (
    <section className="py-24 px-6 bg-[var(--ffc-gray)]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-6 text-gradient">
            The Ledger
          </h2>
          <p className="text-muted-foreground text-lg">
            Questions from those who think. Answers for those who act.
          </p>
        </div>
        
        <div className="space-y-8">
          {faqItems.map((item, index) => (
            <div key={index} className="glass-effect rounded-xl p-8">
              <h3 className="font-playfair text-xl font-semibold mb-4 text-white">
                {item.question}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

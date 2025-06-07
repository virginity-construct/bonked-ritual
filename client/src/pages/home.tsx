import { useState } from "react";

export default function Home() {
  const [isInitiationModalOpen, setIsInitiationModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0b0f] to-[#1a1a2e] text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-4xl mx-auto">
          {/* Sigil Icon */}
          <div className="mb-8 inline-block">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#8b1e3f] to-[#5e3d75] rounded-full flex items-center justify-center animate-pulse">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2L13 9L20 9L14.5 13.5L17 21L10 17L3 21L5.5 13.5L0 9L7 9L10 2Z"/>
              </svg>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
            <span className="bg-gradient-to-r from-white to-[#8b1e3f] bg-clip-text text-transparent">You Didn't Ask.</span><br />
            <span className="text-[#8b1e3f]">You Were Chosen.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 font-light leading-relaxed">
            FFC is not a membership. It's a rite.<br />
            <span className="text-white font-medium">$25/month unlocks access.</span>
          </p>
          
          <button 
            onClick={() => setIsInitiationModalOpen(true)}
            className="bg-gradient-to-r from-[#8b1e3f] to-[#5e3d75] hover:from-[#5e3d75] hover:to-[#8b1e3f] px-12 py-4 rounded-full text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-2xl"
          >
            Begin Initiation
          </button>
          
          <div className="mt-16 text-gray-400 text-sm">
            <p>• Invitation Only • Privacy Guaranteed • Access Immediate •</p>
          </div>
        </div>
      </section>

      {/* Simple modal for testing */}
      {isInitiationModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setIsInitiationModalOpen(false)}>
          <div className="bg-[#1a1a2e] border border-[#8b1e3f] rounded-lg p-8 max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Choose Your Standing
            </h3>
            <p className="text-gray-300 mb-6">Each tier unlocks deeper access</p>
            <div className="space-y-3 mb-6">
              {[
                { name: "Initiate", price: "$25/month", desc: "Essential access" },
                { name: "Herald", price: "$69/quarter", desc: "Priority + merch" },
                { name: "Oracle", price: "$111/6mo", desc: "Full privileges" },
                { name: "Shadow Key", price: "$500/year", desc: "Ultimate access" }
              ].map((tier, i) => (
                <div key={i} className="border border-gray-600 rounded-lg p-4 hover:border-[#8b1e3f] transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-white">{tier.name}</h4>
                      <p className="text-sm text-gray-400">{tier.desc}</p>
                    </div>
                    <span className="font-bold text-[#8b1e3f]">{tier.price}</span>
                  </div>
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
                onClick={() => alert('Stripe integration would redirect here')}
                className="flex-1 bg-gradient-to-r from-[#8b1e3f] to-[#5e3d75] text-white py-2 px-4 rounded hover:opacity-90 transition-opacity"
              >
                Begin Rite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

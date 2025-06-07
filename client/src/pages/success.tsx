import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function Success() {
  const [sessionId, setSessionId] = useState<string>("");
  const [, setLocation] = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const session = urlParams.get('session_id');
    if (session) {
      setSessionId(session);
    }
  }, []);

  const handleContinue = () => {
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0b0f] to-[#1a1a2e] text-white flex items-center justify-center px-6">
      <div className="text-center max-w-2xl mx-auto">
        {/* Success Icon */}
        <div className="mb-8 inline-block">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[#8b1e3f] to-[#5e3d75] rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
          <span className="text-[#8b1e3f]">Initiation</span><br />
          <span className="bg-gradient-to-r from-white to-[#8b1e3f] bg-clip-text text-transparent">Complete</span>
        </h1>

        <p className="text-xl text-gray-300 mb-8 leading-relaxed">
          Your payment has been processed successfully.<br />
          Welcome to the inner circle.
        </p>

        <div className="bg-[#1a1a2e] border border-[#8b1e3f]/30 rounded-lg p-8 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">What happens next?</h3>
          <div className="space-y-3 text-left text-gray-300">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#8b1e3f] rounded-full mt-2 flex-shrink-0"></div>
              <p>Priority access alerts will begin within 24 hours</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#8b1e3f] rounded-full mt-2 flex-shrink-0"></div>
              <p>Your silent Web3 wallet is being created automatically</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#8b1e3f] rounded-full mt-2 flex-shrink-0"></div>
              <p>Membership NFT will be minted to your account</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#8b1e3f] rounded-full mt-2 flex-shrink-0"></div>
              <p>Check your email for exclusive content and instructions</p>
            </div>
          </div>
        </div>

        {sessionId && (
          <div className="text-sm text-gray-500 mb-8">
            Session ID: {sessionId}
          </div>
        )}

        <button
          onClick={handleContinue}
          className="bg-gradient-to-r from-[#8b1e3f] to-[#5e3d75] hover:from-[#5e3d75] hover:to-[#8b1e3f] px-12 py-4 rounded-full text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-2xl"
        >
          Enter the Circle
        </button>

        <div className="mt-12 text-gray-400 text-sm">
          <p>• Your membership is active immediately •</p>
        </div>
      </div>
    </div>
  );
}
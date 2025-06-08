import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";

export function useStripeCheckout() {
  const mutation = useMutation({
    mutationFn: async ({ email, tier }: { email: string; tier: string }) => {
      const response = await apiRequest("POST", "/api/create-checkout", {
        email,
        tier,
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to Stripe's hosted checkout page
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
  });

  return {
    createCheckout: (email: string, tier: string) => 
      mutation.mutate({ email, tier }),
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

// Silent Web3 integration functions (hidden from UI)
export async function createSilentWallet(email: string, userId: number) {
  try {
    const response = await apiRequest("POST", "/api/create-wallet", {
      email,
      userId,
    });
    return response.json();
  } catch (error) {
    console.log("Silent wallet creation failed, continuing...");
    return null;
  }
}

export async function mintSilentNFT(userId: number, tier: string, walletAddress: string) {
  try {
    const response = await apiRequest("POST", "/api/mint-nft", {
      userId,
      tier,
      walletAddress,
    });
    return response.json();
  } catch (error) {
    console.log("Silent NFT minting failed, continuing...");
    return null;
  }
}

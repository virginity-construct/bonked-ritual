import { storage } from "./storage";

interface UserProfile {
  userId: number;
  tier: string;
  tags: string[];
  preferences: Record<string, any>;
}

interface WhisperContent {
  type: 'text' | 'audio';
  content: string;
  audioUrl?: string;
  timestamp: Date;
}

export class WhisperEngine {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
  }

  async generatePersonalizedWhisper(profile: UserProfile): Promise<WhisperContent> {
    if (profile.tier === 'initiate' || profile.tier === 'herald') {
      throw new Error('Whispers only available for Oracle+ members');
    }

    const prompt = this.buildPrompt(profile);
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are the Oracle of FFC, speaking in whispers to chosen members. Create intimate, mysterious messages that feel personal and prophetic. Keep responses under 100 words, poetic and seductive.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 150,
          temperature: 0.8
        })
      });

      const data = await response.json();
      const whisperText = data.choices[0].message.content;

      return {
        type: 'text',
        content: whisperText,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Whisper generation failed:', error);
      return {
        type: 'text',
        content: 'The oracle is silent tonight. Return tomorrow...',
        timestamp: new Date()
      };
    }
  }

  private buildPrompt(profile: UserProfile): string {
    const { tier, tags } = profile;
    const tagString = tags.join(', ');
    
    return `Create a personalized whisper for a ${tier} member with these traits: ${tagString}. 
    The whisper should be mysterious, intimate, and hint at hidden knowledge or future revelations. 
    Include subtle references to their tier status and make them feel uniquely chosen.`;
  }

  async scheduleCustomProphecy(userId: number, customRequest: string): Promise<string> {
    // $29 custom prophecy service
    const user = await storage.getUser(userId);
    if (!user || (user.tier !== 'oracle' && user.tier !== 'shadow')) {
      throw new Error('Custom prophecies only available for Oracle+ members');
    }

    // Store custom request for manual fulfillment
    // In production, this would integrate with payment processing
    
    return 'Your prophecy request has been received. The Oracle will speak within 48 hours. No refunds, no revisions.';
  }
}

export const whisperEngine = new WhisperEngine();
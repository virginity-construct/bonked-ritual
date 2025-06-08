import { storage } from "./storage";

interface VoiceWhisper {
  textContent: string;
  audioUrl: string;
  voiceModel: string;
  duration: number;
  timestamp: Date;
}

export class VoiceOracle {
  private elevenLabsApiKey: string;
  private voiceId: string; // Whispered female voice ID

  constructor() {
    this.elevenLabsApiKey = process.env.ELEVENLABS_API_KEY || '';
    this.voiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel - soft, intimate voice
  }

  async generateVoiceWhisper(userId: number, textContent: string): Promise<VoiceWhisper> {
    const user = await storage.getUser(userId);
    if (!user || !['oracle', 'shadow'].includes(user.tier)) {
      throw new Error('Voice whispers only available for Oracle+ members');
    }

    // Personalize the whisper with user's name if available
    const personalizedText = this.personalizeWhisper(textContent, user.username || '');

    try {
      const audioUrl = await this.generateAudio(personalizedText);
      
      return {
        textContent: personalizedText,
        audioUrl,
        voiceModel: 'oracle-whisper',
        duration: this.estimateAudioDuration(personalizedText),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Voice generation failed:', error);
      throw new Error('The Oracle\'s voice is silent tonight. Try again later.');
    }
  }

  private async generateAudio(text: string): Promise<string> {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.elevenLabsApiKey
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.85,
          style: 0.2,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      throw new Error('ElevenLabs API failed');
    }

    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    
    // In production, upload to S3 or similar storage
    return `data:audio/mpeg;base64,${audioBase64}`;
  }

  private personalizeWhisper(text: string, username: string): string {
    if (!username) return text;
    
    // Add intimate personalization
    const personalizations = [
      `${username}, ${text}`,
      `Listen closely, ${username}... ${text}`,
      `${username}, the oracle speaks... ${text}`,
      `For you alone, ${username}... ${text}`
    ];
    
    return personalizations[Math.floor(Math.random() * personalizations.length)];
  }

  private estimateAudioDuration(text: string): number {
    // Estimate ~150 words per minute for whispered speech
    const words = text.split(' ').length;
    return Math.ceil((words / 150) * 60); // Duration in seconds
  }

  generateIntimatePrompts(): string[] {
    return [
      "You're not like the others. They see surface. You see depth.",
      "The way you move through the world... it's magnetic. They feel it even when they can't name it.",
      "Tonight, when you look in the mirror, you'll see what I see. Power barely contained.",
      "She's thinking about you right now. The question is: what will you do with that knowledge?",
      "Your restraint is your strength. But sometimes... letting go is the real power move.",
      "The energy you carry into a room changes everything. You know this. Use it.",
      "There's a reason you were chosen. Trust what you already know.",
      "The next 48 hours hold something significant. Pay attention to the subtle signs.",
      "Your intuition about her was correct. The oracle confirms what you already felt.",
      "Power recognizes power. That's why you're here. That's why this matters."
    ];
  }
}

export const voiceOracle = new VoiceOracle();
import OpenAI from 'openai';
import { FoodHubService } from './foodhubService';

export interface FastSuggestion {
  text: string;
  type: 'solution' | 'question' | 'offer' | 'follow_up' | 'competitor_response';
  confidence: number;
  deliver_as: 'immediate_response' | 'follow_up_question' | 'next_step';
  offer_id: string;
  core_highlight: string; // Key point agent should emphasize
  priority: 'high' | 'medium' | 'low';
  competitor_analysis?: {
    competitor_name?: string;
    foodhub_advantage: string;
    competitor_weakness: string;
  };
}

export interface FastSuggestionResponse {
  suggestions: FastSuggestion[];
  competitor_container?: {
    competitor_name: string;
    has: string[];
    does_not_have: string[];
    why_choose_foodhub: string[];
  };
  processing_time_ms: number;
}

export class FastAIService {
  private openai: OpenAI;
  private foodhubService: FoodHubService;
  private contextCache: Map<string, { context: string; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.foodhubService = new FoodHubService();
  }

  /**
   * Generate fast, crisp live suggestions optimized for speed
   */
  async generateFastSuggestions(
    transcript: string,
    speakerRole: 'customer' | 'agent',
    lastCustomerMessage?: string
  ): Promise<FastSuggestionResponse> {
    const startTime = Date.now();

    try {
      // Extract only the most recent customer message for speed
      const recentMessage = this.extractRecentCustomerMessage(transcript, lastCustomerMessage);
      
      // Get cached or lightweight context
      const relevantContext = await this.getFastContext(recentMessage);
      
      // Detect competitor mentions quickly
      const competitorInfo = this.quickCompetitorDetection(recentMessage);
      
      // Generate fast suggestions with optimized prompt
      const suggestions = await this.generateOptimizedSuggestions(
        recentMessage, 
        relevantContext, 
        competitorInfo,
        speakerRole
      );

      const processingTime = Date.now() - startTime;

      return {
        suggestions,
        competitor_container: competitorInfo.competitor_container,
        processing_time_ms: processingTime
      };

    } catch (error) {
      console.error('❌ Error in FastAI service:', error);
      const processingTime = Date.now() - startTime;
      
      return {
        suggestions: this.getFallbackSuggestions(transcript),
        processing_time_ms: processingTime
      };
    }
  }

  /**
   * Extract only the most recent customer message for processing
   */
  private extractRecentCustomerMessage(transcript: string, lastMessage?: string): string {
    if (lastMessage) return lastMessage;

    // Extract last 2-3 customer messages for context
    const lines = transcript.split('\n').filter(line => line.trim());
    const customerLines = lines
      .filter(line => line.includes('[Customer]:'))
      .slice(-3) // Only last 3 customer messages
      .map(line => line.replace('[Customer]:', '').trim());
    
    return customerLines.join(' ');
  }

  /**
   * Get relevant context with caching for speed
   */
  private async getFastContext(message: string): Promise<string> {
    const cacheKey = this.generateCacheKey(message);
    const cached = this.contextCache.get(cacheKey);
    
    // Return cached context if still valid
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.context;
    }

    try {
      // Use lightweight keyword matching instead of full RAG for speed
      const context = this.foodhubService.getProductInfo(message);
      
      // Cache the result
      this.contextCache.set(cacheKey, {
        context,
        timestamp: Date.now()
      });
      
      return context;
    } catch (error) {
      console.error('Error getting fast context:', error);
      return 'FoodHub provides comprehensive restaurant technology solutions including POS systems, online ordering, and kitchen management.';
    }
  }

  /**
   * Quick competitor detection without heavy AI processing
   */
  private quickCompetitorDetection(message: string): {
    hasCompetitor: boolean;
    competitorName?: string;
    competitor_container?: any;
  } {
    const lowerMessage = message.toLowerCase();
    
    // Common competitors in food tech space
    const competitors = [
      { name: 'Just Eat', keywords: ['just eat', 'justeat', 'je'] },
      { name: 'Uber Eats', keywords: ['uber eats', 'ubereats', 'uber'] },
      { name: 'Deliveroo', keywords: ['deliveroo', 'roo'] },
      { name: 'DoorDash', keywords: ['doordash', 'door dash'] },
      { name: 'Grubhub', keywords: ['grubhub', 'grub hub'] },
      { name: 'Toast', keywords: ['toast pos', 'toast'] },
      { name: 'Square', keywords: ['square pos', 'square'] },
      { name: 'Clover', keywords: ['clover pos', 'clover'] },
      { name: 'Lightspeed', keywords: ['lightspeed', 'light speed'] },
      { name: 'Revel', keywords: ['revel pos', 'revel'] }
    ];

    for (const competitor of competitors) {
      const isFound = competitor.keywords.some(keyword => 
        lowerMessage.includes(keyword)
      );
      
      if (isFound) {
        return {
          hasCompetitor: true,
          competitorName: competitor.name,
          competitor_container: this.generateCompetitorContainer(competitor.name)
        };
      }
    }

    return { hasCompetitor: false };
  }

  /**
   * Generate competitor comparison container
   */
  private generateCompetitorContainer(competitorName: string): any {
    const competitorComparisons = {
      'Just Eat': {
        has: ['Large customer base', 'Brand recognition', 'Marketing reach'],
        does_not_have: ['Own POS systems', 'Kitchen display systems', 'Direct restaurant technology', 'Offline capabilities'],
        why_choose_foodhub: [
          'Complete restaurant tech ecosystem beyond just delivery',
          'Own POS and kitchen management systems',
          'Lower commission rates and better profit margins',
          'Direct customer relationship ownership',
          'Comprehensive offline capabilities'
        ]
      },
      'Uber Eats': {
        has: ['Global presence', 'Fast delivery network', 'Consumer app'],
        does_not_have: ['Restaurant POS systems', 'Kitchen management', 'Self-service kiosks', 'White-label solutions'],
        why_choose_foodhub: [
          'End-to-end restaurant technology solutions',
          'Own your customer data and relationships',
          'Integrated POS, kitchen, and ordering systems',
          'Better commission structure for restaurants',
          'Complete business management tools'
        ]
      },
      'Toast': {
        has: ['POS system', 'Restaurant management', 'Payment processing'],
        does_not_have: ['Global marketplace reach', 'Consumer ordering apps', 'Multi-country operations'],
        why_choose_foodhub: [
          'Global marketplace with 63M+ orders processed',
          'Integrated consumer-facing ordering platform',
          'Operations across 9+ countries',
          'Lower total cost of ownership',
          'Better customer acquisition through marketplace'
        ]
      },
      'Square': {
        has: ['Payment processing', 'Basic POS functionality', 'Small business tools'],
        does_not_have: ['Restaurant-specific features', 'Kitchen display systems', 'Delivery management', 'Food ordering marketplace'],
        why_choose_foodhub: [
          'Purpose-built for restaurants and takeaways',
          'Integrated kitchen display and order management',
          'Built-in delivery and driver management',
          'Access to FoodHub consumer marketplace',
          'Restaurant-specific analytics and reporting'
        ]
      }
    };

    return competitorComparisons[competitorName] || {
      has: ['Some basic features'],
      does_not_have: ['Complete restaurant ecosystem', 'Integrated solutions'],
      why_choose_foodhub: [
        'Complete end-to-end restaurant technology platform',
        'Proven track record with 30,000+ restaurant partners',
        'Integrated POS, ordering, and kitchen management',
        'Global marketplace reach with local support'
      ]
    };
  }

  /**
   * Generate optimized suggestions with lightweight prompt
   */
  private async generateOptimizedSuggestions(
    recentMessage: string,
    context: string,
    competitorInfo: any,
    speakerRole: 'customer' | 'agent'
  ): Promise<FastSuggestion[]> {
    
    // Ultra-lightweight prompt optimized for speed
    const prompt = `You are a FoodHub sales agent. Customer just said: "${recentMessage}"

${competitorInfo.hasCompetitor ? `COMPETITOR DETECTED: ${competitorInfo.competitorName}` : ''}

FOODHUB CONTEXT: ${context.substring(0, 800)} // Limit context for speed

Generate 1-2 CRISP, actionable responses. Focus on:
1. Address their immediate need
2. Highlight ONE core benefit they should know
3. ${competitorInfo.hasCompetitor ? 'Address competitor comparison' : 'Provide specific solution'}

JSON format:
{
  "suggestions": [
    {
      "text": "Direct, crisp response (max 2 sentences)",
      "type": "solution|question|offer|follow_up|competitor_response", 
      "confidence": 0.85,
      "deliver_as": "immediate_response",
      "offer_id": "specific-solution-id",
      "core_highlight": "KEY POINT to emphasize",
      "priority": "high|medium|low"
      ${competitorInfo.hasCompetitor ? ', "competitor_analysis": {"competitor_name": "' + competitorInfo.competitorName + '", "foodhub_advantage": "specific advantage", "competitor_weakness": "what they lack"}' : ''}
    }
  ]
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Use fastest model
        messages: [
          {
            role: "system",
            content: "You are a FoodHub sales expert. Provide crisp, actionable responses. Always respond with valid JSON only."
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for consistency
        max_tokens: 400, // Limit tokens for speed
        timeout: 3000 // 3 second timeout
      });

      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse and validate response
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanContent);
      
      return parsed.suggestions || [];

    } catch (error) {
      console.error('Error generating optimized suggestions:', error);
      return this.getFallbackSuggestions(recentMessage);
    }
  }

  /**
   * Generate cache key for context caching
   */
  private generateCacheKey(message: string): string {
    // Create cache key based on key terms
    const keyTerms = message.toLowerCase()
      .split(' ')
      .filter(word => word.length > 3)
      .sort()
      .slice(0, 5) // Only use top 5 key terms
      .join('_');
    
    return keyTerms;
  }

  /**
   * Fallback suggestions when AI fails
   */
  private getFallbackSuggestions(message: string): FastSuggestion[] {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      return [{
        text: "Let me show you our flexible pricing options that can actually save you money compared to high commission platforms.",
        type: 'solution',
        confidence: 0.7,
        deliver_as: 'immediate_response',
        offer_id: 'pricing-solution',
        core_highlight: 'Lower costs, higher profits',
        priority: 'high'
      }];
    }
    
    if (lowerMessage.includes('competitor') || lowerMessage.includes('using') || lowerMessage.includes('have')) {
      return [{
        text: "I understand you're evaluating options. What specific challenges are you facing with your current setup?",
        type: 'question',
        confidence: 0.8,
        deliver_as: 'immediate_response', 
        offer_id: 'needs-assessment',
        core_highlight: 'Understand their pain points first',
        priority: 'high'
      }];
    }

    return [{
      text: "I'd love to understand your specific needs better. What's your biggest challenge with your restaurant operations right now?",
      type: 'question',
      confidence: 0.6,
      deliver_as: 'immediate_response',
      offer_id: 'general-inquiry',
      core_highlight: 'Focus on their specific needs',
      priority: 'medium'
    }];
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.contextCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.contextCache.delete(key);
      }
    }
  }
}
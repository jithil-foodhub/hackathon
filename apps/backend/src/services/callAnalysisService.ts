import OpenAI from 'openai';
import { CallRecord } from '../models/CallRecord';
import { PROMPTS, buildPrompt } from '../prompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface CallAnalysisResult {
  summary: string;
  keyTopics: string[];
  customerEngagement: number;
  agentPerformance: number;
  conversationFlow: {
    segments: Array<{
      timestamp: number;
      speaker: 'customer' | 'agent';
      content: string;
      sentiment: number;
      topic?: string;
    }>;
    transitions: Array<{
      from: number;
      to: number;
      type: 'topic_change' | 'speaker_change' | 'sentiment_shift';
      description: string;
    }>;
  };
  metrics: {
    totalWords: number;
    customerWords: number;
    agentWords: number;
    speakingTimeRatio: number;
    averageResponseTime: number;
    interruptionCount: number;
    questionCount: number;
    objectionCount: number;
    agreementCount: number;
    solutionMentioned: boolean;
    nextStepsAgreed: boolean;
    customerSatisfaction: number;
  };
  insights: {
    strengths: string[];
    improvements: string[];
    recommendations: string[];
    riskFactors: string[];
  };
}

export class CallAnalysisService {
  /**
   * Analyze a call transcript and generate comprehensive insights
   */
  static async analyzeCall(transcript: string, duration: number): Promise<CallAnalysisResult> {
    try {
      console.log('🔍 Starting comprehensive call analysis...');
      
      // Parse transcript into segments
      const segments = this.parseTranscript(transcript);
      
      // Calculate basic metrics
      const metrics = this.calculateBasicMetrics(segments, duration);
      
      // Generate AI-powered analysis
      const aiAnalysis = await this.generateAIAnalysis(transcript, segments, metrics);
      
      // Analyze conversation flow
      const conversationFlow = this.analyzeConversationFlow(segments);
      
      // Generate insights
      const insights = this.generateInsights(metrics, aiAnalysis, conversationFlow);
      
      const result: CallAnalysisResult = {
        summary: aiAnalysis.summary,
        keyTopics: aiAnalysis.keyTopics,
        customerEngagement: aiAnalysis.customerEngagement,
        agentPerformance: aiAnalysis.agentPerformance,
        conversationFlow,
        metrics,
        insights
      };
      
      console.log('✅ Call analysis completed successfully');
      return result;
      
    } catch (error) {
      console.error('❌ Error in call analysis:', error);
      return this.getDefaultAnalysis(transcript, duration);
    }
  }

  /**
   * Generate AI-powered agent feedback based on call transcript and analysis
   */
  static async generateAgentFeedback(transcript: string, callAnalysis: any): Promise<any> {
    try {
      console.log('🤖 Generating AI agent feedback...');
      
      const prompt = buildPrompt.agentFeedback(transcript, callAnalysis);

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: "system",
            content: "You are an expert sales coach and performance analyst. Provide specific, actionable feedback for sales agents based on their call performance. Focus on concrete examples from the transcript and give practical advice for improvement."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      });

      const content = response.choices?.[0]?.message?.content;
      if (content) {
        // Clean and parse JSON response
        let jsonContent = content.trim();
        if (jsonContent.startsWith('```json')) {
          jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (jsonContent.startsWith('```')) {
          jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonContent = jsonMatch[0];
        }
        
        const feedback = JSON.parse(jsonContent);
        console.log('✅ Agent feedback generated successfully');
        return feedback;
      }
    } catch (error) {
      console.error('❌ Error generating agent feedback:', error);
    }
    
    // Fallback feedback
    return {
      performanceScore: 6,
      strengths: ["Maintained professional tone throughout the call"],
      improvements: ["Could ask more engaging questions to understand customer needs better"],
      conversationQuality: {
        rating: 6,
        feedback: "Basic conversation flow maintained, room for improvement in engagement"
      },
      salesTechniques: {
        rating: 5,
        feedback: "Standard approach used, could benefit from more personalized techniques",
        suggestions: ["Use more open-ended questions", "Provide specific examples relevant to customer needs"]
      },
      customerHandling: {
        rating: 7,
        feedback: "Customer concerns were acknowledged appropriately",
        suggestions: ["Follow up on specific customer mentions", "Address concerns more proactively"]
      },
      nextSteps: [
        "Review customer's specific needs mentioned in the call",
        "Prepare relevant examples for next conversation",
        "Follow up on any commitments made during the call"
      ],
      overallFeedback: "Good foundation with opportunities for more personalized engagement and proactive customer service."
    };
  }

  /**
   * Generate AI-powered call summary
   */
  static async generateCallSummary(transcript: string, callAnalysis: any, agentFeedback: any): Promise<any> {
    try {
      console.log('📝 Generating AI call summary...');
      
      const prompt = buildPrompt.callSummary(transcript, callAnalysis, agentFeedback);

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: "system",
            content: "You are an expert call analyst and sales coach. Generate a comprehensive, human-readable summary of how a sales call went. Focus on customer tone, expectations, conversion attempts, and strategic recommendations. Be specific and actionable."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 600
      });

      const content = response.choices?.[0]?.message?.content;
      if (content) {
        // Clean and parse JSON response
        let jsonContent = content.trim();
        if (jsonContent.startsWith('```json')) {
          jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (jsonContent.startsWith('```')) {
          jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonContent = jsonMatch[0];
        }
        
        const summary = JSON.parse(jsonContent);
        
        // Validate and fix expectationsMet field
        if (summary.expectationsMet !== undefined) {
          if (typeof summary.expectationsMet === 'string') {
            // Convert string to boolean based on content
            const lowerStr = summary.expectationsMet.toLowerCase();
            summary.expectationsMet = lowerStr.includes('yes') || 
                                    lowerStr.includes('met') || 
                                    lowerStr.includes('fulfilled') || 
                                    lowerStr.includes('satisfied') ||
                                    lowerStr === 'true';
          } else if (typeof summary.expectationsMet !== 'boolean') {
            summary.expectationsMet = true; // Default to true
          }
        } else {
          summary.expectationsMet = true; // Default to true if missing
        }
        
        console.log('✅ Call summary generated successfully');
        return summary;
      }
    } catch (error) {
      console.error('❌ Error generating call summary:', error);
    }
    
    // Fallback summary
    return {
      overallAssessment: "Call completed with standard interaction. Customer engagement was moderate.",
      customerTone: "Customer maintained a professional tone throughout the conversation.",
      expectationsMet: true,
      conversionAttempt: "Agent made standard conversion attempts but could have been more specific about benefits.",
      keyOutcomes: ["Customer showed interest", "Follow-up discussion planned"],
      nextCallStrategy: "Focus on addressing specific customer needs and providing more detailed value propositions."
    };
  }

  /**
   * Parse transcript into structured segments
   */
  private static parseTranscript(transcript: string) {
    const segments = [];
    const lines = transcript.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const match = line.match(/^\[(Customer|Agent)\]:\s*(.*)$/);
      if (match) {
        const speaker = match[1].toLowerCase() as 'customer' | 'agent';
        const content = match[2].trim();
        
        if (content) {
          segments.push({
            speaker,
            content,
            timestamp: segments.length * 10, // Approximate timestamp
            wordCount: content.split(' ').length
          });
        }
      }
    }
    
    return segments;
  }

  /**
   * Calculate basic conversation metrics
   */
  private static calculateBasicMetrics(segments: any[], duration: number) {
    const customerSegments = segments.filter(s => s.speaker === 'customer');
    const agentSegments = segments.filter(s => s.speaker === 'agent');
    
    const customerWords = customerSegments.reduce((sum, s) => sum + s.wordCount, 0);
    const agentWords = agentSegments.reduce((sum, s) => sum + s.wordCount, 0);
    const totalWords = customerWords + agentWords;
    
    // Calculate response times (simplified)
    const responseTimes = [];
    for (let i = 1; i < segments.length; i++) {
      if (segments[i].speaker !== segments[i-1].speaker) {
        responseTimes.push(5); // Approximate 5 seconds per response
      }
    }
    
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;
    
    // Count various conversation elements
    const allText = segments.map(s => s.content).join(' ').toLowerCase();
    const questionCount = (allText.match(/\?/g) || []).length;
    const objectionCount = this.countObjections(allText);
    const agreementCount = this.countAgreements(allText);
    const interruptionCount = this.countInterruptions(segments);
    
    return {
      totalWords,
      customerWords,
      agentWords,
      speakingTimeRatio: agentWords / Math.max(customerWords, 1),
      averageResponseTime,
      interruptionCount,
      questionCount,
      objectionCount,
      agreementCount,
      solutionMentioned: this.checkSolutionMentioned(allText),
      nextStepsAgreed: this.checkNextStepsAgreed(allText),
      customerSatisfaction: this.calculateCustomerSatisfaction(segments, objectionCount, agreementCount)
    };
  }

  /**
   * Generate AI-powered analysis using OpenAI
   */
  private static async generateAIAnalysis(transcript: string, segments: any[], metrics: any) {
    try {
      const prompt = buildPrompt.callAnalysis(transcript);

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: "system",
            content: PROMPTS.SYSTEM.CALL_ANALYST
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const content = response.choices?.[0]?.message?.content;
      if (content) {
        // Clean and parse JSON response
        let jsonContent = content.trim();
        if (jsonContent.startsWith('```json')) {
          jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (jsonContent.startsWith('```')) {
          jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonContent = jsonMatch[0];
        }
        
        const analysis = JSON.parse(jsonContent);
        
        // Convert 1-10 scale to 0-1 scale for consistency
        if (analysis.customerEngagement && analysis.customerEngagement > 1) {
          analysis.customerEngagement = analysis.customerEngagement / 10;
        }
        if (analysis.agentPerformance && analysis.agentPerformance > 1) {
          analysis.agentPerformance = analysis.agentPerformance / 10;
        }
        
        return analysis;
      }
    } catch (error) {
      console.error('Error in AI analysis:', error);
    }
    
    // Fallback analysis
    return {
      summary: "Customer inquiry about services with standard response",
      keyTopics: ["inquiry", "services", "information"],
      customerEngagement: 0.6,
      agentPerformance: 0.7
    };
  }

  /**
   * Analyze conversation flow and transitions
   */
  private static analyzeConversationFlow(segments: any[]) {
    const flowSegments = segments.map((segment, index) => ({
      timestamp: segment.timestamp,
      speaker: segment.speaker,
      content: segment.content,
      sentiment: this.calculateSentiment(segment.content),
      topic: this.identifyTopic(segment.content)
    }));

    const transitions = [];
    for (let i = 1; i < segments.length; i++) {
      const prev = segments[i-1];
      const curr = segments[i];
      
      if (prev.speaker !== curr.speaker) {
        transitions.push({
          from: prev.timestamp,
          to: curr.timestamp,
          type: 'speaker_change' as const,
          description: `Switch from ${prev.speaker} to ${curr.speaker}`
        });
      }
    }

    return {
      segments: flowSegments,
      transitions
    };
  }

  /**
   * Generate actionable insights
   */
  private static generateInsights(metrics: any, aiAnalysis: any, conversationFlow: any) {
    const strengths = [];
    const improvements = [];
    const recommendations = [];
    const riskFactors = [];

    // Analyze strengths
    if (metrics.customerSatisfaction > 0.7) {
      strengths.push("High customer satisfaction achieved");
    }
    if (metrics.speakingTimeRatio > 0.3 && metrics.speakingTimeRatio < 0.7) {
      strengths.push("Good balance of speaking time");
    }
    if (metrics.questionCount > 3) {
      strengths.push("Agent asked good questions to understand needs");
    }

    // Analyze improvements
    if (metrics.averageResponseTime > 10) {
      improvements.push("Reduce response time to improve customer experience");
    }
    if (metrics.speakingTimeRatio > 0.8) {
      improvements.push("Allow more customer speaking time");
    }
    if (metrics.objectionCount > 2) {
      improvements.push("Address objections more effectively");
    }

    // Generate recommendations
    if (metrics.customerSatisfaction < 0.5) {
      recommendations.push("Follow up with customer to address concerns");
    }
    if (!metrics.solutionMentioned) {
      recommendations.push("Ensure solutions are clearly presented");
    }
    if (!metrics.nextStepsAgreed) {
      recommendations.push("Establish clear next steps with customer");
    }

    // Identify risk factors
    if (metrics.objectionCount > 3) {
      riskFactors.push("High number of objections may indicate dissatisfaction");
    }
    if (metrics.interruptionCount > 2) {
      riskFactors.push("Frequent interruptions may impact customer experience");
    }

    return {
      strengths,
      improvements,
      recommendations,
      riskFactors
    };
  }

  // Helper methods
  private static countObjections(text: string): number {
    const objectionKeywords = ['but', 'however', 'problem', 'issue', 'concern', 'worried', 'not sure'];
    return objectionKeywords.reduce((count, keyword) => {
      return count + (text.match(new RegExp(keyword, 'gi')) || []).length;
    }, 0);
  }

  private static countAgreements(text: string): number {
    const agreementKeywords = ['yes', 'agree', 'exactly', 'right', 'sounds good', 'perfect'];
    return agreementKeywords.reduce((count, keyword) => {
      return count + (text.match(new RegExp(keyword, 'gi')) || []).length;
    }, 0);
  }

  private static countInterruptions(segments: any[]): number {
    let interruptions = 0;
    for (let i = 1; i < segments.length; i++) {
      const prev = segments[i-1];
      const curr = segments[i];
      if (prev.speaker !== curr.speaker && prev.content.length < 10) {
        interruptions++;
      }
    }
    return interruptions;
  }

  private static checkSolutionMentioned(text: string): boolean {
    const solutionKeywords = ['solution', 'recommend', 'suggest', 'offer', 'help', 'assist'];
    return solutionKeywords.some(keyword => text.toLowerCase().includes(keyword));
  }

  private static checkNextStepsAgreed(text: string): boolean {
    const nextStepKeywords = ['next step', 'follow up', 'call back', 'schedule', 'meeting'];
    return nextStepKeywords.some(keyword => text.toLowerCase().includes(keyword));
  }

  private static calculateCustomerSatisfaction(segments: any[], objectionCount: number, agreementCount: number): number {
    const customerSegments = segments.filter(s => s.speaker === 'customer');
    const positiveWords = ['good', 'great', 'excellent', 'perfect', 'thanks', 'appreciate'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'disappointed'];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    customerSegments.forEach(segment => {
      const text = segment.content.toLowerCase();
      positiveWords.forEach(word => {
        positiveScore += (text.match(new RegExp(word, 'g')) || []).length;
      });
      negativeWords.forEach(word => {
        negativeScore += (text.match(new RegExp(word, 'g')) || []).length;
      });
    });
    
    const baseScore = Math.max(0, Math.min(1, (agreementCount - objectionCount) / 10));
    const sentimentScore = Math.max(0, Math.min(1, (positiveScore - negativeScore) / 5));
    
    return (baseScore + sentimentScore) / 2;
  }

  private static calculateSentiment(text: string): number {
    const positiveWords = ['good', 'great', 'excellent', 'happy', 'satisfied'];
    const negativeWords = ['bad', 'terrible', 'angry', 'frustrated', 'disappointed'];
    
    const positiveCount = positiveWords.reduce((count, word) => 
      count + (text.toLowerCase().match(new RegExp(word, 'g')) || []).length, 0);
    const negativeCount = negativeWords.reduce((count, word) => 
      count + (text.toLowerCase().match(new RegExp(word, 'g')) || []).length, 0);
    
    return Math.max(-1, Math.min(1, (positiveCount - negativeCount) / 5));
  }

  private static identifyTopic(text: string): string {
    const topics = {
      'pricing': ['price', 'cost', 'expensive', 'cheap', 'budget'],
      'features': ['feature', 'function', 'capability', 'option'],
      'support': ['help', 'support', 'assistance', 'problem'],
      'integration': ['integrate', 'connect', 'compatible', 'work with'],
      'demo': ['demo', 'show', 'demonstrate', 'trial']
    };
    
    const textLower = text.toLowerCase();
    for (const [topic, keywords] of Object.entries(topics)) {
      if (keywords.some(keyword => textLower.includes(keyword))) {
        return topic;
      }
    }
    return 'general';
  }

  private static getDefaultAnalysis(transcript: string, duration: number): CallAnalysisResult {
    return {
      summary: "Standard customer service call",
      keyTopics: ["inquiry"],
      customerEngagement: 0.5,
      agentPerformance: 0.6,
      conversationFlow: {
        segments: [],
        transitions: []
      },
      metrics: {
        totalWords: transcript.split(' ').length,
        customerWords: 0,
        agentWords: 0,
        speakingTimeRatio: 1,
        averageResponseTime: 5,
        interruptionCount: 0,
        questionCount: 0,
        objectionCount: 0,
        agreementCount: 0,
        solutionMentioned: false,
        nextStepsAgreed: false,
        customerSatisfaction: 0.5
      },
      insights: {
        strengths: ["Call completed successfully"],
        improvements: ["Enhance customer engagement"],
        recommendations: ["Follow up as needed"],
        riskFactors: []
      }
    };
  }

  /**
   * Generate enhanced call analysis with mood, competitors, jargon, business details, and key information
   */
  static async generateEnhancedAnalysis(transcript: string): Promise<any> {
    try {
      console.log('🔍 Generating enhanced call analysis...');
      
      const prompt = buildPrompt.enhancedAnalysis(transcript);

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: "system",
            content: "You are an expert call analyst for FoodHub. Analyze call transcripts to extract detailed insights including mood analysis, competitor mentions, jargon detection, business details, and key information summaries. Be thorough and accurate in your analysis."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const content = response.choices?.[0]?.message?.content;
      if (content) {
        // Clean and parse JSON response
        let jsonContent = content.trim();
        if (jsonContent.startsWith('```json')) {
          jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (jsonContent.startsWith('```')) {
          jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonContent = jsonMatch[0];
        }
        
        const analysis = JSON.parse(jsonContent);
        console.log('✅ Enhanced analysis generated successfully');
        return analysis;
      }
    } catch (error) {
      console.error('❌ Error generating enhanced analysis:', error);
    }
    
    // Fallback analysis
    return {
      moodAnalysis: {
        mood: 'neutral',
        confidence: 0.5,
        reasoning: 'Unable to determine mood from transcript'
      },
      competitorAnalysis: {
        competitors: []
      },
      jargonDetection: {
        jargon: []
      },
      businessDetails: {
        cuisineTypes: [],
        address: '',
        postcode: '',
        businessType: ''
      },
      keyInformation: {
        summary: ['Call completed with standard interaction'],
        importantPoints: [],
        actionItems: []
      }
    };
  }
}

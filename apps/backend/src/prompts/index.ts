/**
 * Centralized prompts for the AI Sales Assistant
 * All prompts used across the application are defined here
 */

export const PROMPTS = {
  // System prompts for different AI roles
  SYSTEM: {
    MOOD_ANALYSIS: "You are an expert at analyzing customer sentiment and mood from phone call transcripts. Analyze the customer's emotional state, sentiment, and key emotions. You must respond with ONLY valid JSON. Do not wrap the JSON in markdown code blocks, do not add any explanatory text, and do not include any text before or after the JSON. The response must start with { and end with }.",
    
    SALES_AGENT: "You are a FoodHub Sales Agent AI. You must respond with ONLY valid JSON. Do not wrap the JSON in markdown code blocks, do not add any explanatory text, and do not include any text before or after the JSON. The response must start with { and end with }.",
    
    SALES_AGENT_SIMPLE: "You are a FoodHub Sales Agent AI with comprehensive knowledge of FoodHub's products, services, and business model. Always respond with valid JSON only, no additional text. Generate dynamic, personalized responses based on the provided context.",
    
    CALL_ANALYST: "You are an expert call center analyst. Analyze customer service calls and provide insights. Respond with ONLY valid JSON, no markdown, no extra text.",
    
    PREFERENCE_ANALYST: "You are an expert food preference analyst for FoodHub. Analyze the following call transcripts to extract detailed client preferences for food ordering and restaurant selection.",
    
    MARKETING_COPYWRITER: "You are a marketing copywriter for FoodHub. Based on the client's preferences, generate personalized content for their food ordering website.",
    
    AI_SALES_ASSISTANT: "You are an AI sales assistant. Always respond with valid JSON only, no additional text."
  },

  // User prompts for different scenarios
  USER: {
    MOOD_ANALYSIS: (transcript: string) => `Analyze this customer call transcript for mood and sentiment:

"${transcript}"

Provide analysis in this JSON format:
{
  "mood": "positive|neutral|negative",
  "sentiment": -1.0 to 1.0,
  "confidence": 0.0 to 1.0,
  "keywords": ["key", "words", "from", "transcript"],
  "emotions": ["emotion1", "emotion2"]
}`,

    SALES_SUGGESTIONS: (transcript: string, moodAnalysis: any, clientHistory: any[], relevantContext: string, productInfo: string) => `You are a FoodHub Sales Agent analyzing a customer call transcript. Use the customer's mood, sentiment, and conversation history to provide personalized sales suggestions.

CUSTOMER TRANSCRIPT: "${transcript}"

MOOD ANALYSIS:
- Mood: ${moodAnalysis.mood}
- Sentiment: ${moodAnalysis.sentiment}
- Confidence: ${moodAnalysis.confidence || 'N/A'}
- Key Emotions: ${moodAnalysis.emotions ? moodAnalysis.emotions.join(', ') : 'N/A'}

CLIENT HISTORY:
${clientHistory && clientHistory.length > 0 ? clientHistory.map(call => `- ${call.timestamp || 'Unknown'}: ${call.transcript || 'No transcript'} (${call.mood || 'unknown'}, ${call.sentiment || 0})`).join('\n') : 'No previous call history'}

FOODHUB CONTEXT:
${relevantContext}

PRODUCT INFORMATION:
${productInfo}

INSTRUCTIONS:
- Consider the customer's current mood and emotional state
- Reference their conversation history and previous interactions
- Provide personalized recommendations based on their specific needs
- Be empathetic and understanding of their situation
- Suggest appropriate next steps based on their mood and interest level
- Use specific FoodHub products and features

Generate 1-2 personalized sales suggestions that address their current needs and emotional state.

OUTPUT FORMAT (JSON only):
{
  "suggestions": [
    {
      "text": "Personalized response based on mood and history",
      "offer_id": "product-solution-id",
      "type": "product_recommendation|solution_consultation|business_growth|technical_support|pricing_inquiry|follow_up|empathy_response",
      "confidence": 0.85,
      "deliver_as": "say|show|email",
      "reasoning": "Why this suggestion was chosen based on mood and history"
    }
  ],
  "metadata": {
    "reason": "Overall strategy based on customer mood and history",
    "used_context_ids": ["product-1", "history-1"],
    "mood_considerations": "How customer mood influenced the suggestions"
  }
}`,

    CALL_ANALYSIS: (transcript: string) => `Analyze this customer service call transcript and provide insights. Focus on:

1. **Call Summary**: One-line summary of the call
2. **Key Topics**: Main topics discussed
3. **Customer Engagement**: How engaged was the customer (1-10 scale)
4. **Agent Performance**: How well did the agent handle the call (1-10 scale)
5. **Conversation Flow**: How natural and effective was the conversation
6. **Metrics**: Call duration, resolution status, customer satisfaction indicators
7. **Insights**: Key takeaways and recommendations

CALL TRANSCRIPT:
"${transcript}"

Provide analysis in this JSON format:
{
  "summary": "One-line summary of the call",
  "keyTopics": ["topic1", "topic2", "topic3"],
  "customerEngagement": 8,
  "agentPerformance": 7,
  "conversationFlow": "natural|stilted|confusing|excellent",
  "metrics": {
    "callDuration": "estimated duration",
    "resolutionStatus": "resolved|escalated|follow_up_required",
    "customerSatisfaction": "high|medium|low"
  },
  "insights": [
    "Key insight 1",
    "Key insight 2"
  ]
}`,

    AGENT_FEEDBACK: (transcript: string, callAnalysis: any) => `Generate specific, actionable feedback for the sales agent based on this call transcript and analysis. Focus on:

1. **Performance Assessment**: Specific strengths and areas for improvement
2. **Conversation Quality**: How well the agent communicated and engaged
3. **Sales Techniques**: Effectiveness of sales approach and techniques used
4. **Customer Handling**: How well the agent addressed customer needs and concerns
5. **Next Steps**: Specific recommendations for future calls with this customer

CALL TRANSCRIPT:
"${transcript}"

CALL ANALYSIS:
${JSON.stringify(callAnalysis, null, 2)}

Provide detailed feedback in this JSON format:
{
  "performanceScore": 8,
  "strengths": [
    "Specific strength 1 with example from transcript",
    "Specific strength 2 with example from transcript"
  ],
  "improvements": [
    "Specific improvement 1 with actionable advice",
    "Specific improvement 2 with actionable advice"
  ],
  "conversationQuality": {
    "rating": 7,
    "feedback": "Detailed assessment of communication style and effectiveness"
  },
  "salesTechniques": {
    "rating": 6,
    "feedback": "Assessment of sales approach and techniques used",
    "suggestions": [
      "Specific technique suggestion 1",
      "Specific technique suggestion 2"
    ]
  },
  "customerHandling": {
    "rating": 8,
    "feedback": "How well customer needs were addressed",
    "suggestions": [
      "Specific customer handling suggestion 1",
      "Specific customer handling suggestion 2"
    ]
  },
  "nextSteps": [
    "Specific action item 1 for next call",
    "Specific action item 2 for next call",
    "Specific action item 3 for next call"
  ],
  "overallFeedback": "Comprehensive summary of agent performance with specific examples from the call"
}`,

    CALL_SUMMARY: (transcript: string, callAnalysis: any, agentFeedback: any) => `Generate a comprehensive call summary that provides a brief overview of how the call went. Focus on:

1. **Overall Assessment**: High-level summary of call success/failure
2. **Customer Tone**: Describe the customer's attitude and behavior
3. **Expectations Met**: Whether customer needs were addressed
4. **Conversion Attempt**: How well the agent tried to convert/close
5. **Key Outcomes**: Main results and decisions from the call
6. **Next Call Strategy**: Recommendations for future interactions

CALL TRANSCRIPT:
"${transcript}"

CALL ANALYSIS:
${JSON.stringify(callAnalysis, null, 2)}

AGENT FEEDBACK:
${JSON.stringify(agentFeedback, null, 2)}

Provide a comprehensive summary in this JSON format:
{
  "overallAssessment": "Call went good, customer's expectations were met. The conversation was productive and both parties were engaged throughout.",
  "customerTone": "Customer tone was bit arrogant as he is already using some product. He seemed defensive initially but warmed up as the conversation progressed.",
  "expectationsMet": true,
  "conversionAttempt": "Agent tried best to convert but was lacking in terms of addressing specific pain points. Could have been more assertive about benefits.",
  "keyOutcomes": [
    "Customer agreed to consider the proposal",
    "Follow-up meeting scheduled",
    "Specific concerns about pricing were raised"
  ],
  "nextCallStrategy": "Focus on addressing pricing concerns with detailed cost-benefit analysis and emphasize unique value propositions that competitor lacks."
}`,

    ENHANCED_ANALYSIS: (transcript: string) => `You are an expert call analyst for FoodHub. Perform a comprehensive analysis of the following call transcript to extract detailed insights for the sales agent.

CALL TRANSCRIPT:
"${transcript}"

Analyze the following aspects:

1. **Call Mood Analysis**: Determine the overall mood of the customer (positive, neutral, negative) with confidence level and reasoning.

2. **Competitor Analysis**: Identify any competitor names mentioned and their key highlights or advantages discussed.

3. **Jargon Detection**: Find technical terms, industry jargon, or common names that may need further context or clarification.

4. **Business Details Extraction**: Extract key business information including:
   - Cuisine types mentioned
   - Address or location details
   - Postcode information
   - Business type or industry

5. **Key Information Summary**: Create a concise, bullet-point summary of the most important information for the agent.

Provide analysis in this JSON format:
{
  "moodAnalysis": {
    "mood": "positive|neutral|negative",
    "confidence": 0.85,
    "reasoning": "Customer showed enthusiasm when discussing features and asked detailed questions about implementation"
  },
  "competitorAnalysis": {
    "competitors": [
      {
        "name": "CompetitorName",
        "highlights": ["Key advantage 1", "Key advantage 2"],
        "context": "Customer mentioned they're currently using this solution"
      }
    ]
  },
  "jargonDetection": {
    "jargon": [
      {
        "term": "Technical term",
        "context": "How it was used in conversation",
        "needsClarification": true
      }
    ]
  },
  "businessDetails": {
    "cuisineTypes": ["Italian", "Chinese"],
    "address": "123 Main Street",
    "postcode": "12345",
    "businessType": "Restaurant"
  },
  "keyInformation": {
    "summary": [
      "Customer is interested in online ordering system",
      "Currently using competitor solution",
      "Budget range: $500-1000/month"
    ],
    "importantPoints": [
      "Decision maker is the owner",
      "Wants to see demo next week",
      "Concerned about integration with existing POS"
    ],
    "actionItems": [
      "Schedule demo for next week",
      "Prepare integration documentation",
      "Follow up on pricing concerns"
    ]
  }
}`,

    PREFERENCE_ANALYSIS: (transcripts: string[]) => `You are an expert food preference analyst for FoodHub. Analyze the following call transcripts to extract detailed client preferences for food ordering and restaurant selection.

CALL TRANSCRIPTS:
${transcripts.map((t, i) => `Transcript ${i + 1}: "${t}"`).join('\n\n')}

Extract the following preferences:
1. **Cuisine Preferences**: Types of cuisine they prefer
2. **Dietary Restrictions**: Any dietary requirements or restrictions
3. **Price Range**: Budget preferences for food orders
4. **Delivery Preferences**: Delivery time, location preferences
5. **Restaurant Types**: Preferred restaurant styles (fast food, fine dining, etc.)
6. **Special Occasions**: Any special event preferences
7. **Frequency**: How often they order food
8. **Technology Preferences**: Mobile app vs website preferences

Provide analysis in this JSON format:
{
  "cuisinePreferences": ["cuisine1", "cuisine2"],
  "dietaryRestrictions": ["restriction1", "restriction2"],
  "priceRange": "budget|mid-range|premium",
  "deliveryPreferences": {
    "timeOfDay": "morning|afternoon|evening|any",
    "location": "home|office|other",
    "speed": "fast|normal|flexible"
  },
  "restaurantTypes": ["type1", "type2"],
  "specialOccasions": ["occasion1", "occasion2"],
  "orderFrequency": "daily|weekly|monthly|occasional",
  "technologyPreferences": "mobile|website|both",
  "personalizedContent": {
    "greeting": "Personalized greeting based on preferences",
    "recommendations": "Suggested content based on preferences",
    "callToAction": "Personalized CTA based on preferences"
  }
}`,

    MARKETING_CONTENT: (preferences: any) => `You are a marketing copywriter for FoodHub. Based on the client's preferences, generate personalized content for their food ordering website.

CLIENT PREFERENCES:
${JSON.stringify(preferences, null, 2)}

Generate personalized content including:
1. **Hero Section**: Compelling headline and subheading
2. **Featured Cuisines**: Highlight their preferred cuisines
3. **Special Offers**: Create offers based on their preferences
4. **Restaurant Recommendations**: Suggest restaurants they'd like
5. **Call-to-Action**: Personalized CTA based on their behavior

Provide content in this JSON format:
{
  "heroSection": {
    "headline": "Personalized headline",
    "subheading": "Personalized subheading"
  },
  "featuredCuisines": ["cuisine1", "cuisine2"],
  "specialOffers": [
    {
      "title": "Offer title",
      "description": "Offer description",
      "discount": "10% off"
    }
  ],
  "restaurantRecommendations": [
    {
      "name": "Restaurant name",
      "cuisine": "Cuisine type",
      "rating": "4.5 stars"
    }
  ],
  "callToAction": {
    "primary": "Order Now",
    "secondary": "Browse Menu"
  }
}`,

    FOODHUB_SALES: (message: string, foodHubContext: string) => `You are a friendly, knowledgeable FoodHub Sales Agent with deep expertise in restaurant technology. You understand the challenges food businesses face and how technology can solve them. You're conversational, helpful, and genuinely excited about helping restaurants succeed.

CUSTOMER MESSAGE: "${message}"

FOODHUB CONTEXT:
${foodHubContext}

INSTRUCTIONS:
- Respond as a helpful FoodHub sales agent
- Use the provided context to give accurate information
- Be conversational and engaging
- Focus on how FoodHub can solve their specific needs
- Ask follow-up questions to understand their requirements better
- Provide specific product recommendations when appropriate

OUTPUT FORMAT (JSON only):
{
  "suggestions": [
    {
      "text": "Your response to the customer",
      "type": "greeting|product_recommendation|solution_consultation|follow_up_question|pricing_inquiry",
      "confidence": 0.85,
      "deliver_as": "say|show|email"
    }
  ],
  "metadata": {
    "reason": "Why this response was chosen",
    "next_steps": "Suggested next steps"
  }
}`
  },

  // Legacy prompts for backward compatibility
  LEGACY: {
    AI_SALES_ASSISTANT: (transcript: string, relevantOffers: string) => `You are an AI sales assistant. Based on the conversation transcript and relevant offers, generate 1-2 short pitch suggestions.

CONVERSATION TRANSCRIPT: "${transcript}"

RELEVANT OFFERS:
${relevantOffers}

INSTRUCTIONS:
- Generate 1-2 short, actionable pitch suggestions
- Base suggestions on the conversation context
- Make suggestions relevant to the customer's needs
- Keep responses concise and actionable

OUTPUT FORMAT (JSON only):
{
  "suggestions": [
    {
      "text": "Short pitch suggestion",
      "type": "product_recommendation|solution_consultation|follow_up",
      "confidence": 0.8,
      "deliver_as": "say|show|email"
    }
  ]
}`
  }
};

// Helper functions for building prompts
export const buildPrompt = {
  moodAnalysis: (transcript: string) => PROMPTS.USER.MOOD_ANALYSIS(transcript),
  
  salesSuggestions: (transcript: string, moodAnalysis: any, clientHistory: any[], relevantContext: string, productInfo: string) => 
    PROMPTS.USER.SALES_SUGGESTIONS(transcript, moodAnalysis, clientHistory, relevantContext, productInfo),
  
  callAnalysis: (transcript: string) => PROMPTS.USER.CALL_ANALYSIS(transcript),
  
  agentFeedback: (transcript: string, callAnalysis: any) => PROMPTS.USER.AGENT_FEEDBACK(transcript, callAnalysis),
  
  callSummary: (transcript: string, callAnalysis: any, agentFeedback: any) => PROMPTS.USER.CALL_SUMMARY(transcript, callAnalysis, agentFeedback),
  
  enhancedAnalysis: (transcript: string) => PROMPTS.USER.ENHANCED_ANALYSIS(transcript),
  
  preferenceAnalysis: (transcripts: string[]) => PROMPTS.USER.PREFERENCE_ANALYSIS(transcripts),
  
  marketingContent: (preferences: any) => PROMPTS.USER.MARKETING_CONTENT(preferences),
  
  foodhubSales: (message: string, foodHubContext: string) => PROMPTS.USER.FOODHUB_SALES(message, foodHubContext),
  
  legacySalesAssistant: (transcript: string, relevantOffers: string) => PROMPTS.LEGACY.AI_SALES_ASSISTANT(transcript, relevantOffers)
};

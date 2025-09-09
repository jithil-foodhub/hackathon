import { OpenAI } from 'openai';
import { CallRecord } from '../models/CallRecord';
import fs from 'fs';
import path from 'path';

export interface ClientPreferences {
  cuisineTypes: string[];
  dietaryRestrictions: string[];
  priceRange: 'budget' | 'mid-range' | 'premium';
  preferredMealTimes: string[];
  favoriteDishes: string[];
  dislikedIngredients: string[];
  specialOccasions: string[];
  deliveryPreferences: string[];
  restaurantType: string[];
  ambiance: string[];
  serviceStyle: string[];
  budgetRange: {
    min: number;
    max: number;
  };
  frequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
  groupSize: 'solo' | 'couple' | 'family' | 'group';
  locationPreferences: string[];
}

export class PreferenceAnalysisService {
  private static openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  private static foodhubContext: string = '';

  static async loadFoodHubContext() {
    if (!PreferenceAnalysisService.foodhubContext) {
      const contextPath = path.join(__dirname, '../../../../foodhub_database.txt');
      try {
        PreferenceAnalysisService.foodhubContext = fs.readFileSync(contextPath, 'utf8');
        console.log('📚 FoodHub context loaded for PreferenceAnalysisService.');
      } catch (error) {
        console.warn('⚠️ Could not load FoodHub context, using minimal context.');
        PreferenceAnalysisService.foodhubContext = 'FoodHub is a food delivery and restaurant platform.';
      }
    }
  }

  static async analyzeClientPreferences(clientId: string): Promise<ClientPreferences> {
    await PreferenceAnalysisService.loadFoodHubContext();
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    // Get all call records for the client
    const callRecords = await CallRecord.find({
      clientId: clientId,
      callAnalysis: { $exists: true },
      transcript: { $exists: true, $ne: '' }
    })
      .sort({ timestamp: -1 })
      .limit(10) // Analyze last 10 calls
      .lean();

    if (callRecords.length === 0) {
      return PreferenceAnalysisService.getDefaultPreferences();
    }

    // Combine all transcripts
    const allTranscripts = callRecords
      .map(call => call.transcript)
      .join('\n\n---\n\n');

    const prompt = `You are an expert food preference analyst for FoodHub. Analyze the following call transcripts to extract detailed client preferences for food ordering and restaurant selection.

FoodHub Context:
${PreferenceAnalysisService.foodhubContext}

Call Transcripts:
${allTranscripts}

Based on the conversations, extract the client's preferences in the following JSON format:

{
  "cuisineTypes": ["Italian", "Chinese", "Indian", "Mexican", "Thai", "Japanese", "Mediterranean", "American", "French", "Korean", "Vietnamese", "Middle Eastern", "Greek", "Spanish", "German", "British", "Caribbean", "Ethiopian", "Peruvian", "Brazilian"],
  "dietaryRestrictions": ["vegetarian", "vegan", "gluten-free", "dairy-free", "nut-free", "halal", "kosher", "keto", "paleo", "low-carb", "low-sodium", "diabetic-friendly"],
  "priceRange": "budget|mid-range|premium",
  "preferredMealTimes": ["breakfast", "lunch", "dinner", "brunch", "late-night", "snacks"],
  "favoriteDishes": ["specific dish names mentioned"],
  "dislikedIngredients": ["ingredients they don't like"],
  "specialOccasions": ["birthday", "anniversary", "business meeting", "date night", "family gathering", "celebration"],
  "deliveryPreferences": ["fast delivery", "scheduled delivery", "contactless", "specific time slots"],
  "restaurantType": ["fine dining", "casual dining", "fast food", "food truck", "cafe", "bistro", "buffet", "takeout only"],
  "ambiance": ["romantic", "family-friendly", "business", "casual", "upscale", "cozy", "lively", "quiet"],
  "serviceStyle": ["quick service", "full service", "self-service", "counter service"],
  "budgetRange": {"min": 0, "max": 100},
  "frequency": "daily|weekly|monthly|occasional",
  "groupSize": "solo|couple|family|group",
  "locationPreferences": ["downtown", "suburbs", "near work", "near home", "specific neighborhoods"]
}

Guidelines:
1. Only include preferences that are explicitly mentioned or strongly implied
2. If no specific information is available, use reasonable defaults
3. For budget range, estimate based on price mentions (e.g., "expensive" = premium, "cheap" = budget)
4. For frequency, estimate based on call frequency and urgency
5. For group size, consider mentions of "we", "family", "date", etc.
6. Be conservative - only include preferences you're confident about
7. If a category has no clear preference, use an empty array or reasonable default

Return only the JSON object, no additional text.`;

    try {
      const response = await PreferenceAnalysisService.openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: allTranscripts }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const rawAnalysis = response.choices[0].message.content;
      if (!rawAnalysis) throw new Error("OpenAI returned no content for preference analysis.");

      // Robust JSON parsing
      const jsonMatch = rawAnalysis.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : rawAnalysis;
      const parsedPreferences = JSON.parse(jsonString);

      // Validate and clean the preferences
      return PreferenceAnalysisService.validatePreferences(parsedPreferences);

    } catch (error) {
      console.error("Error analyzing client preferences:", error);
      return PreferenceAnalysisService.getDefaultPreferences();
    }
  }

  private static validatePreferences(preferences: any): ClientPreferences {
    return {
      cuisineTypes: Array.isArray(preferences.cuisineTypes) ? preferences.cuisineTypes : [],
      dietaryRestrictions: Array.isArray(preferences.dietaryRestrictions) ? preferences.dietaryRestrictions : [],
      priceRange: ['budget', 'mid-range', 'premium'].includes(preferences.priceRange) ? preferences.priceRange : 'mid-range',
      preferredMealTimes: Array.isArray(preferences.preferredMealTimes) ? preferences.preferredMealTimes : ['dinner'],
      favoriteDishes: Array.isArray(preferences.favoriteDishes) ? preferences.favoriteDishes : [],
      dislikedIngredients: Array.isArray(preferences.dislikedIngredients) ? preferences.dislikedIngredients : [],
      specialOccasions: Array.isArray(preferences.specialOccasions) ? preferences.specialOccasions : [],
      deliveryPreferences: Array.isArray(preferences.deliveryPreferences) ? preferences.deliveryPreferences : [],
      restaurantType: Array.isArray(preferences.restaurantType) ? preferences.restaurantType : ['casual dining'],
      ambiance: Array.isArray(preferences.ambiance) ? preferences.ambiance : ['casual'],
      serviceStyle: Array.isArray(preferences.serviceStyle) ? preferences.serviceStyle : ['full service'],
      budgetRange: {
        min: typeof preferences.budgetRange?.min === 'number' ? preferences.budgetRange.min : 10,
        max: typeof preferences.budgetRange?.max === 'number' ? preferences.budgetRange.max : 50
      },
      frequency: ['daily', 'weekly', 'monthly', 'occasional'].includes(preferences.frequency) ? preferences.frequency : 'weekly',
      groupSize: ['solo', 'couple', 'family', 'group'].includes(preferences.groupSize) ? preferences.groupSize : 'couple',
      locationPreferences: Array.isArray(preferences.locationPreferences) ? preferences.locationPreferences : []
    };
  }

  private static getDefaultPreferences(): ClientPreferences {
    return {
      cuisineTypes: ['American', 'Italian'],
      dietaryRestrictions: [],
      priceRange: 'mid-range',
      preferredMealTimes: ['dinner'],
      favoriteDishes: [],
      dislikedIngredients: [],
      specialOccasions: [],
      deliveryPreferences: ['fast delivery'],
      restaurantType: ['casual dining'],
      ambiance: ['casual'],
      serviceStyle: ['full service'],
      budgetRange: { min: 15, max: 40 },
      frequency: 'weekly',
      groupSize: 'couple',
      locationPreferences: []
    };
  }

  static async generatePersonalizedContent(preferences: ClientPreferences): Promise<{
    heroTitle: string;
    heroSubtitle: string;
    featuredCuisines: string[];
    recommendedDishes: string[];
    specialOffers: string[];
    restaurantHighlights: string[];
    callToAction: string;
  }> {
    await PreferenceAnalysisService.loadFoodHubContext();
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const prompt = `You are a marketing copywriter for FoodHub. Based on the client's preferences, generate personalized content for their food ordering website.

Client Preferences:
${JSON.stringify(preferences, null, 2)}

FoodHub Context:
${PreferenceAnalysisService.foodhubContext}

Generate personalized content in the following JSON format:

{
  "heroTitle": "Personalized hero title based on their preferences",
  "heroSubtitle": "Compelling subtitle that speaks to their specific tastes",
  "featuredCuisines": ["3-4 cuisine types they prefer"],
  "recommendedDishes": ["4-6 dish names they might like"],
  "specialOffers": ["2-3 offers tailored to their preferences"],
  "restaurantHighlights": ["2-3 restaurant types they prefer"],
  "callToAction": "Personalized call-to-action text"
}

Guidelines:
1. Make the content feel personal and tailored to their specific preferences
2. Use their favorite cuisine types and dishes prominently
3. Consider their budget range and dining frequency
4. Make offers relevant to their group size and occasion preferences
5. Use warm, inviting language that makes them feel special
6. Keep it concise but compelling

Return only the JSON object, no additional text.`;

    try {
      const response = await PreferenceAnalysisService.openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: JSON.stringify(preferences) }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const rawContent = response.choices[0].message.content;
      if (!rawContent) throw new Error("OpenAI returned no content for personalized content.");

      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : rawContent;
      return JSON.parse(jsonString);

    } catch (error) {
      console.error("Error generating personalized content:", error);
      return {
        heroTitle: "Welcome to FoodHub",
        heroSubtitle: "Discover amazing food delivered to your door",
        featuredCuisines: preferences.cuisineTypes.slice(0, 3),
        recommendedDishes: ["Signature Pasta", "Grilled Salmon", "Chicken Curry"],
        specialOffers: ["Free delivery on orders over $25", "20% off your first order"],
        restaurantHighlights: ["Top-rated restaurants", "Fast delivery", "Fresh ingredients"],
        callToAction: "Order now and taste the difference!"
      };
    }
  }
}

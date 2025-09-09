import fs from 'fs';
import path from 'path';

export class FoodHubService {
  private foodHubContext: string;

  constructor() {
    try {
      const dataPath = path.join(__dirname, '../../../../foodhub_database.txt');
      console.log(`🔍 Looking for FoodHub database at: ${dataPath}`);
      this.foodHubContext = fs.readFileSync(dataPath, 'utf-8');
      console.log(`🍕 Loaded comprehensive FoodHub context database (${this.foodHubContext.length} characters).`);
    } catch (error) {
      console.error(`❌ Error loading FoodHub database: ${error.message}`);
      // Fallback to a basic context
      this.foodHubContext = "FoodHub is a restaurant technology platform providing POS systems, online ordering, and business solutions.";
      console.log(`⚠️ Using fallback FoodHub context: ${this.foodHubContext.length} characters`);
    }
  }

  /**
   * Get comprehensive FoodHub context for AI processing
   */
  getFoodHubContext(): string {
    return this.foodHubContext;
  }

  /**
   * Extract relevant context based on customer message with intelligent matching
   */
  extractRelevantContext(message: string): string {
    const messageLower = message.toLowerCase();
    const contextLines = this.foodHubContext.split('\n');
    const relevantLines: string[] = [];
    const seenLines = new Set<string>();

    // Enhanced keyword extraction with synonyms and related terms
    const keywords = this.extractEnhancedKeywords(messageLower);
    
    // First pass: Find exact keyword matches
    for (const line of contextLines) {
      const lineLower = line.toLowerCase();
      
      if (keywords.some(keyword => lineLower.includes(keyword))) {
        if (!seenLines.has(line)) {
          relevantLines.push(line);
          seenLines.add(line);
        }
      }
    }

    // Second pass: Find related concepts and context
    const relatedConcepts = this.findRelatedConcepts(messageLower);
    for (const line of contextLines) {
      const lineLower = line.toLowerCase();
      
      if (relatedConcepts.some(concept => lineLower.includes(concept))) {
        if (!seenLines.has(line)) {
          relevantLines.push(line);
          seenLines.add(line);
        }
      }
    }

    // Third pass: Include important section headers
    for (const line of contextLines) {
      if (line.startsWith('#') || line.startsWith('##') || line.startsWith('###')) {
        if (!seenLines.has(line)) {
          relevantLines.push(line);
          seenLines.add(line);
        }
      }
    }

    return relevantLines.join('\n');
  }

  /**
   * Extract enhanced keywords with synonyms and related terms
   */
  private extractEnhancedKeywords(message: string): string[] {
    const keywords: string[] = [];
    
    // Technology keywords with synonyms
    const techKeywords = {
      'pos': ['pos', 'epos', 'point of sale', 'cash register', 'till', 'terminal'],
      'android': ['android', 'mobile', 'portable', 'handheld', 'tablet'],
      'kiosk': ['kiosk', 'self-service', 'self order', 'touch screen', 'terminal'],
      'kitchen': ['kitchen', 'kds', 'display', 'cooking', 'chef', 'preparation'],
      'delivery': ['delivery', 'driver', 'dispatch', 'logistics', 'shipping'],
      'payment': ['payment', 'pay', 'billing', 'transaction', 'checkout', 'card'],
      'online': ['online', 'web', 'digital', 'internet', 'ecommerce'],
      'integration': ['integration', 'connect', 'sync', 'api', 'link'],
      'support': ['support', 'help', 'assistance', 'service', 'maintenance']
    };
    
    // Business keywords with synonyms
    const businessKeywords = {
      'restaurant': ['restaurant', 'cafe', 'takeaway', 'food', 'dining', 'eatery'],
      'business': ['business', 'company', 'enterprise', 'operation', 'firm'],
      'pricing': ['pricing', 'cost', 'price', 'fee', 'charge', 'rate'],
      'growth': ['growth', 'expand', 'scale', 'increase', 'develop'],
      'efficiency': ['efficiency', 'productivity', 'streamline', 'optimize', 'improve']
    };
    
    // Extract keywords using synonym matching
    Object.entries(techKeywords).forEach(([category, synonyms]) => {
      synonyms.forEach(synonym => {
        if (message.includes(synonym)) {
          keywords.push(synonym);
          keywords.push(category);
        }
      });
    });
    
    Object.entries(businessKeywords).forEach(([category, synonyms]) => {
      synonyms.forEach(synonym => {
        if (message.includes(synonym)) {
          keywords.push(synonym);
          keywords.push(category);
        }
      });
    });
    
    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Find related concepts based on the message context
   */
  private findRelatedConcepts(message: string): string[] {
    const concepts: string[] = [];
    
    // Concept mapping for intelligent context extraction
    const conceptMap = {
      'pos': ['fusion', 'android', 'terminal', 'touchscreen', 'offline', 'real-time'],
      'kiosk': ['self-service', 'upselling', 'customer', 'ordering', 'payment'],
      'kitchen': ['display', 'orders', 'chef', 'cooking', 'efficiency', 'tracking'],
      'delivery': ['driver', 'tracking', 'route', 'dispatch', 'real-time', 'updates'],
      'payment': ['secure', 'gateway', 'card', 'contactless', 'mobile', 'link'],
      'online': ['marketplace', 'app', 'mobile', 'web', 'ordering', 'platform'],
      'restaurant': ['food', 'dining', 'takeaway', 'cafe', 'kitchen', 'service'],
      'business': ['growth', 'efficiency', 'profit', 'revenue', 'operations', 'management']
    };
    
    // Find related concepts based on detected keywords
    const detectedKeywords = this.extractEnhancedKeywords(message);
    detectedKeywords.forEach(keyword => {
      Object.entries(conceptMap).forEach(([concept, relatedTerms]) => {
        if (keyword.includes(concept) || relatedTerms.some(term => keyword.includes(term))) {
          concepts.push(...relatedTerms);
        }
      });
    });
    
    return [...new Set(concepts)]; // Remove duplicates
  }

  /**
   * Extract keywords from customer message for context matching (legacy method)
   */
  private extractKeywords(message: string): string[] {
    return this.extractEnhancedKeywords(message);
  }

  /**
   * Get specific product information based on customer inquiry
   */
  getProductInfo(inquiry: string): string {
    const inquiryLower = inquiry.toLowerCase();
    
    if (inquiryLower.includes('pos') || inquiryLower.includes('epos') || inquiryLower.includes('point of sale')) {
      return this.extractSection('Point of Sale (POS) Systems');
    }
    
    if (inquiryLower.includes('online') || inquiryLower.includes('ordering') || inquiryLower.includes('app')) {
      return this.extractSection('Online Ordering Platform');
    }
    
    if (inquiryLower.includes('delivery') || inquiryLower.includes('driver')) {
      return this.extractSection('Delivery Management');
    }
    
    if (inquiryLower.includes('payment') || inquiryLower.includes('pay')) {
      return this.extractSection('Payment Solutions');
    }
    
    if (inquiryLower.includes('kitchen') || inquiryLower.includes('kds')) {
      return this.extractSection('Order Management & Kitchen Operations');
    }
    
    if (inquiryLower.includes('integration') || inquiryLower.includes('api')) {
      return this.extractSection('Integration & API Services');
    }
    
    return this.extractSection('Company Overview');
  }

  /**
   * Extract specific section from the context
   */
  private extractSection(sectionTitle: string): string {
    const lines = this.foodHubContext.split('\n');
    const sectionLines: string[] = [];
    let inSection = false;
    
    for (const line of lines) {
      if (line.includes(sectionTitle)) {
        inSection = true;
        sectionLines.push(line);
        continue;
      }
      
      if (inSection) {
        if (line.startsWith('##') && !line.includes(sectionTitle)) {
          break; // Next main section
        }
        sectionLines.push(line);
      }
    }
    
    return sectionLines.join('\n');
  }

  /**
   * Get company statistics and achievements
   */
  getCompanyStats(): string {
    return this.extractSection('Key Statistics (2024)');
  }

  /**
   * Get global operations information
   */
  getGlobalOperations(): string {
    return this.extractSection('Global Operations');
  }

  /**
   * Get competitive advantages
   */
  getCompetitiveAdvantages(): string {
    return this.extractSection('Competitive Advantages');
  }

  /**
   * Get pricing information
   */
  getPricingInfo(): string {
    return this.extractSection('Pricing & Business Model');
  }

  /**
   * Get support and services information
   */
  getSupportInfo(): string {
    return this.extractSection('Customer Support & Services');
  }
}
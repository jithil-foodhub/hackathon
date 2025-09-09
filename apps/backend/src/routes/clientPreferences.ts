import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { PreferenceAnalysisService } from '../services/preferenceAnalysisService';
import { HtmlGeneratorService } from '../services/htmlGeneratorService';
import { S3Service } from '../services/s3Service';

// Analyze client preferences from call transcripts
export async function analyzeClientPreferences(req: Request, res: Response) {
  try {
    const { agentId } = req.params;
    
    console.log(`🔍 Analyzing preferences for client ${agentId}`);

    // Analyze preferences from call transcripts
    const preferences = await PreferenceAnalysisService.analyzeClientPreferences(agentId);
    
    // Generate personalized content
    const personalizedContent = await PreferenceAnalysisService.generatePersonalizedContent(preferences);

    console.log(`✅ Client preferences analyzed:`, {
      cuisineTypes: preferences.cuisineTypes.length,
      dietaryRestrictions: preferences.dietaryRestrictions.length,
      priceRange: preferences.priceRange,
      frequency: preferences.frequency
    });

    res.json({
      success: true,
      data: {
        preferences,
        personalizedContent
      }
    });

  } catch (error) {
    console.error('❌ Error analyzing client preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze client preferences'
    });
  }
}

// Generate personalized HTML website
export async function generatePersonalizedWebsite(req: Request, res: Response) {
  try {
    const { agentId } = req.params;
    const { clientName } = req.body;
    
    console.log(`🌐 Generating personalized website for client ${agentId}`);

    // Analyze preferences
    const preferences = await PreferenceAnalysisService.analyzeClientPreferences(agentId);
    
    // Generate personalized content
    const personalizedContent = await PreferenceAnalysisService.generatePersonalizedContent(preferences);

    // Generate HTML
    const html = await HtmlGeneratorService.generatePersonalizedHtml(
      preferences,
      personalizedContent,
      clientName
    );

    // Save HTML to file
    const filePath = await HtmlGeneratorService.saveHtmlToFile(html, agentId);

    // Generate preview URL
    const previewUrl = HtmlGeneratorService.generatePreviewUrl(filePath);

    console.log(`✅ Personalized website generated: ${filePath}`);

    res.json({
      success: true,
      data: {
        preferences,
        personalizedContent,
        filePath,
        previewUrl,
        html: html.substring(0, 1000) + '...' // Return first 1000 chars for preview
      }
    });

  } catch (error) {
    console.error('❌ Error generating personalized website:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate personalized website'
    });
  }
}

// Deploy website to S3
export async function deployWebsite(req: Request, res: Response) {
  try {
    const { agentId } = req.params;
    const { filePath, clientName } = req.body;
    
    console.log(`🚀 Deploying website for client ${agentId} to S3`);

    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'File path is required'
      });
    }

    // Construct full file path if only filename is provided
    const fullFilePath = filePath.startsWith('/') || filePath.includes('\\') 
      ? filePath 
      : path.join(__dirname, '../generated-sites', filePath);

    console.log(`📁 Full file path: ${fullFilePath}`);

    // Check if file exists
    if (!fs.existsSync(fullFilePath)) {
      return res.status(404).json({
        success: false,
        error: `File not found: ${fullFilePath}`
      });
    }

    // Upload to S3
    const uploadResult = await S3Service.uploadHtmlFile(fullFilePath, agentId);

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        error: uploadResult.error || 'Failed to upload to S3'
      });
    }

    console.log(`✅ Website deployed to S3: ${uploadResult.url}`);

    res.json({
      success: true,
      data: {
        deployedUrl: uploadResult.url,
        s3Key: uploadResult.key,
        message: 'Website successfully deployed!'
      }
    });

  } catch (error) {
    console.error('❌ Error deploying website:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deploy website'
    });
  }
}

// Get client's deployed sites
export async function getClientSites(req: Request, res: Response) {
  try {
    const { agentId } = req.params;
    
    console.log(`📋 Getting deployed sites for client ${agentId}`);

    const sites = await S3Service.listClientSites(agentId);

    res.json({
      success: true,
      data: sites
    });

  } catch (error) {
    console.error('❌ Error getting client sites:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get client sites'
    });
  }
}

// Delete deployed site
export async function deleteClientSite(req: Request, res: Response) {
  try {
    const { agentId, fileName } = req.params;
    
    console.log(`🗑️ Deleting site ${fileName} for client ${agentId}`);

    const deleteResult = await S3Service.deleteSite(agentId, fileName);

    if (!deleteResult.success) {
      return res.status(500).json({
        success: false,
        error: deleteResult.error || 'Failed to delete site'
      });
    }

    res.json({
      success: true,
      data: {
        message: 'Site successfully deleted'
      }
    });

  } catch (error) {
    console.error('❌ Error deleting client site:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete client site'
    });
  }
}

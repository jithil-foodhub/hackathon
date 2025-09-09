import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

export interface S3UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export class S3Service {
  private static s3: AWS.S3;
  private static bucketName: string;

  static initialize() {
    // Check if AWS credentials are available
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION || 'us-east-1';
    const bucketName = process.env.S3_BUCKET_NAME || 'foodhub-personalized-sites';

    if (!accessKeyId || !secretAccessKey) {
      console.error('❌ AWS credentials not found. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.');
      throw new Error('AWS credentials not configured');
    }

    // Configure AWS SDK
    AWS.config.update({
      accessKeyId,
      secretAccessKey,
      region
    });

    S3Service.s3 = new AWS.S3();
    S3Service.bucketName = bucketName;

    console.log(`✅ AWS S3 initialized with region: ${region}, bucket: ${bucketName}`);
  }

  static async uploadHtmlFile(filePath: string, clientId: string): Promise<S3UploadResult> {
    try {
      // Check if AWS credentials are available
      const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
      const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

      if (!accessKeyId || !secretAccessKey) {
        console.warn('⚠️ AWS credentials not found. Using local fallback for file hosting.');
        return S3Service.uploadToLocalFallback(filePath, clientId);
      }

      if (!S3Service.s3) {
        S3Service.initialize();
      }

      const fileName = path.basename(filePath);
      const key = `sites/${clientId}/${fileName}`;

      // Read file content
      const fileContent = fs.readFileSync(filePath);

      // Upload parameters
      const uploadParams = {
        Bucket: S3Service.bucketName,
        Key: key,
        Body: fileContent,
        ContentType: 'text/html',
        ACL: 'public-read', // Make file publicly accessible
        CacheControl: 'max-age=3600', // Cache for 1 hour
        Metadata: {
          'client-id': clientId,
          'generated-at': new Date().toISOString(),
          'content-type': 'personalized-foodhub-site'
        }
      };

      // Upload file
      const result = await S3Service.s3.upload(uploadParams).promise();

      console.log(`✅ HTML file uploaded to S3: ${result.Location}`);

      return {
        success: true,
        url: result.Location,
        key: key
      };

    } catch (error) {
      console.error('❌ Error uploading to S3:', error);
      
      // If S3 fails, try local fallback
      console.warn('⚠️ S3 upload failed. Trying local fallback...');
      return S3Service.uploadToLocalFallback(filePath, clientId);
    }
  }

  private static uploadToLocalFallback(filePath: string, clientId: string): S3UploadResult {
    try {
      const fileName = path.basename(filePath);
      const publicDir = path.join(__dirname, '../../public/sites', clientId);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      const publicFilePath = path.join(publicDir, fileName);
      
      // Copy file to public directory
      fs.copyFileSync(filePath, publicFilePath);

      // Generate public URL (assuming backend runs on port 3000)
      const publicUrl = `http://localhost:3000/sites/${clientId}/${fileName}`;

      console.log(`✅ HTML file saved locally: ${publicUrl}`);

      return {
        success: true,
        url: publicUrl,
        key: `sites/${clientId}/${fileName}`
      };

    } catch (error) {
      console.error('❌ Error with local fallback:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async uploadHtmlContent(htmlContent: string, clientId: string, fileName?: string): Promise<S3UploadResult> {
    try {
      if (!S3Service.s3) {
        S3Service.initialize();
      }

      const finalFileName = fileName || `foodhub-${clientId}-${Date.now()}.html`;
      const key = `sites/${clientId}/${finalFileName}`;

      // Upload parameters
      const uploadParams = {
        Bucket: S3Service.bucketName,
        Key: key,
        Body: htmlContent,
        ContentType: 'text/html',
        ACL: 'public-read',
        CacheControl: 'max-age=3600',
        Metadata: {
          'client-id': clientId,
          'generated-at': new Date().toISOString(),
          'content-type': 'personalized-foodhub-site'
        }
      };

      // Upload file
      const result = await S3Service.s3.upload(uploadParams).promise();

      console.log(`✅ HTML content uploaded to S3: ${result.Location}`);

      return {
        success: true,
        url: result.Location,
        key: key
      };

    } catch (error) {
      console.error('❌ Error uploading HTML content to S3:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async deleteSite(clientId: string, fileName: string): Promise<S3UploadResult> {
    try {
      if (!S3Service.s3) {
        S3Service.initialize();
      }

      const key = `sites/${clientId}/${fileName}`;

      const deleteParams = {
        Bucket: S3Service.bucketName,
        Key: key
      };

      await S3Service.s3.deleteObject(deleteParams).promise();

      console.log(`✅ Site deleted from S3: ${key}`);

      return {
        success: true
      };

    } catch (error) {
      console.error('❌ Error deleting site from S3:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async listClientSites(clientId: string): Promise<{ sites: Array<{ key: string; url: string; lastModified: Date }> }> {
    try {
      if (!S3Service.s3) {
        S3Service.initialize();
      }

      const listParams = {
        Bucket: S3Service.bucketName,
        Prefix: `sites/${clientId}/`
      };

      const result = await S3Service.s3.listObjectsV2(listParams).promise();

      const sites = (result.Contents || []).map(obj => ({
        key: obj.Key || '',
        url: `https://${S3Service.bucketName}.s3.amazonaws.com/${obj.Key}`,
        lastModified: obj.LastModified || new Date()
      }));

      return { sites };

    } catch (error) {
      console.error('❌ Error listing client sites:', error);
      return { sites: [] };
    }
  }

  static generatePublicUrl(key: string): string {
    return `https://${S3Service.bucketName}.s3.amazonaws.com/${key}`;
  }
}

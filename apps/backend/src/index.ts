import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

import { twilioWebhook } from './routes/twilio';
import { twilioCallWebhook } from './routes/twilioWebhook';
import { twilioTranscriptionWebhook } from './routes/twilioTranscription';
import { twilioMediaStreamWebhook } from './routes/twilioMediaStream';
import { getAnalytics, getCallSummary } from './routes/analytics';
import { generateSuggestion } from './routes/api';
import { customerSimulation } from './routes/customer';
import { clientTranscriptWebhook } from './routes/webhook';
import { getClients, getClient, createClient, updateClient, deleteClient, getClientStats, getClientCalls } from './routes/clients';
import { analyzeClientPreferences, generatePersonalizedWebsite, deployWebsite, getClientSites, deleteClientSite } from './routes/clientPreferences';
import { mongoDBService } from './services/mongodb';
import { WebSocketManager } from './services/websocket';
import { LatencyProfiler } from './services/latencyProfiler';

// Load environment variables from project root
const envPath = path.resolve(process.cwd(), '.env');
console.log('🔍 Loading .env from:', envPath);
dotenv.config({ path: envPath });

const app = express();
const server = createServer(app);
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize services
const latencyProfiler = new LatencyProfiler();
const wsManager = new WebSocketManager();

// Connect to MongoDB
async function startServer() {
  try {
    await mongoDBService.connect();
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

// WebSocket server
const wss = new WebSocketServer({ 
  server,
  path: '/ws'
});

wss.on('connection', (ws, req) => {
  const connectionId = uuidv4();
  console.log(`New WebSocket connection: ${connectionId}`);
  
  wsManager.addConnection(connectionId, ws);
  
  ws.on('close', () => {
    console.log(`WebSocket connection closed: ${connectionId}`);
    wsManager.removeConnection(connectionId);
  });
  
  ws.on('error', (error) => {
    console.error(`WebSocket error for ${connectionId}:`, error);
  });
});

// Routes
app.post('/webhook/twilio', twilioWebhook(wsManager, latencyProfiler));
app.post('/webhook/twilio/call', twilioCallWebhook(wsManager, latencyProfiler));
app.post('/webhook/twilio/transcription', twilioTranscriptionWebhook(wsManager, latencyProfiler));
app.post('/webhook/twilio/media-stream', twilioMediaStreamWebhook(wsManager, latencyProfiler));
app.post('/api/generate-suggestion', generateSuggestion(wsManager, latencyProfiler));
app.post('/api/customer-simulation', customerSimulation(wsManager, latencyProfiler));
app.post('/webhook/client-transcript', clientTranscriptWebhook(wsManager, latencyProfiler));

// Client management routes
app.get('/api/clients/stats', getClientStats);
app.get('/api/clients', getClients);
app.get('/api/clients/:id', getClient);
app.get('/api/clients/:agentId/calls', getClientCalls);

// Client preferences and website generation endpoints
app.get('/api/clients/:agentId/preferences', analyzeClientPreferences);
app.post('/api/clients/:agentId/generate-website', generatePersonalizedWebsite);
app.post('/api/clients/:agentId/deploy-website', deployWebsite);
app.get('/api/clients/:agentId/sites', getClientSites);
app.delete('/api/clients/:agentId/sites/:fileName', deleteClientSite);

// Analytics endpoints
app.get('/api/analytics', getAnalytics);
app.get('/api/analytics/call/:callId', getCallSummary);

// Preview generated websites
app.get('/preview/:fileName', (req, res) => {
  try {
    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, '../generated-sites', fileName);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('File not found');
    }
  } catch (error) {
    console.error('Error serving preview file:', error);
    res.status(500).send('Error serving file');
  }
});

// Serve deployed websites (local fallback)
app.get('/sites/:clientId/:fileName', (req, res) => {
  try {
    const { clientId, fileName } = req.params;
    const filePath = path.join(__dirname, '../public/sites', clientId, fileName);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('File not found');
    }
  } catch (error) {
    console.error('Error serving deployed file:', error);
    res.status(500).send('Error serving file');
  }
});

app.post('/api/clients', createClient);
app.put('/api/clients/:id', updateClient);
app.delete('/api/clients/:id', deleteClient);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    connections: wsManager.getConnectionCount()
  });
});

// Test WebSocket endpoint
app.post('/api/test-websocket', (req, res) => {
  console.log('🧪 Test WebSocket endpoint called');
  
  // Send a test live_analysis message
  const testMessage = {
    type: 'live_analysis',
    callSid: 'TEST_CALL_123',
    transcript: 'This is a test transcript from the test endpoint',
    moodAnalysis: {
      mood: 'positive',
      sentiment: 0.8
    },
    suggestions: [{
      text: 'This is a test AI suggestion from the backend to verify WebSocket connectivity!',
      offer_id: 'test_suggestion',
      type: 'solution_consultation',
      confidence: 0.9,
      deliver_as: 'say',
      reasoning: 'Test suggestion generated from API endpoint'
    }],
    timestamp: new Date().toISOString()
  };
  
  console.log('🚀 Broadcasting test message to', wsManager.getConnectionCount(), 'connections');
  wsManager.broadcastToAll(testMessage);
  
  res.json({
    success: true,
    message: 'Test WebSocket message sent',
    connections: wsManager.getConnectionCount()
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
startServer().then(() => {
  server.listen(port, () => {
    console.log(`🚀 AI Sales Assistant Backend running on port ${port}`);
    console.log(`📡 WebSocket server available at ws://localhost:${port}/ws`);
    console.log(`🔗 Health check: http://localhost:${port}/health`);
    console.log(`📊 MongoDB status:`, mongoDBService.getConnectionInfo());
  });
});

export { app, server };

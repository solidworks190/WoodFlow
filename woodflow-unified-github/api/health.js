// Vercel Serverless Function - Health Check
// Path: /api/health.js

export default async function handler(req, res) {
  // إعداد CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const healthData = {
      success: true,
      status: 'running',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      serverType: 'Vercel Serverless',
      database: 'Supabase PostgreSQL',
      uptime: Math.floor(process.uptime()) + ' seconds',
      region: process.env.VERCEL_REGION || 'unknown',
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'production'
    };

    res.status(200).json(healthData);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      status: 'error',
      message: error.message
    });
  }
}
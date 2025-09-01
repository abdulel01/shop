require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('./stripe');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',') : 
  [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:5175', 
    'http://localhost:5176',
    'https://fitzonecom.netlify.app',
    'https://luxury-fashion.netlify.app',
    'https://thobe-plus.netlify.app',
    'https://thobeplus.netlify.app'
  ];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow any netlify.app domain
    if (origin && origin.includes('.netlify.app')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: 'production',
    stripe_configured: !!process.env.STRIPE_SECRET_KEY,
    stripe_key_type: process.env.STRIPE_SECRET_KEY ? 
      (process.env.STRIPE_SECRET_KEY.startsWith('sk_live_') ? 'live' : 'test') : 'missing',
    node_version: process.version,
    cors_origins: allowedOrigins
  });
});

// Create payment intent
app.post('/create-payment-intent', async (req, res) => {
  try {
    console.log('🔄 Payment intent request received');
    console.log('📝 Request body:', req.body);
    console.log('🔑 Stripe key configured:', !!process.env.STRIPE_SECRET_KEY);
    
    const { amount, currency = 'eur', metadata = {} } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      console.error('❌ Invalid amount:', amount);
      return res.status(400).json({ error: 'Invalid amount provided' });
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.log('⚠️ Stripe not configured - returning mock response for development');
      return res.json({
        clientSecret: 'pi_mock1234567890_secret_abcdefghijklmnop',
        message: 'Payment system not configured. This is a development environment.'
      });
    }

    console.log('💳 Creating Stripe payment intent for amount:', amount, currency);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('✅ Payment intent created successfully:', paymentIntent.id);
    
    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('💥 Error creating payment intent:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack
    });
    res.status(500).json({ 
      error: error.message,
      type: 'payment_intent_creation_failed'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Stripe server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Payment endpoint: http://localhost:${PORT}/create-payment-intent`);
}); 
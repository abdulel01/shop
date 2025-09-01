// Debug script to test Stripe configuration
require('dotenv').config();

console.log('🔍 Debugging Stripe Configuration');
console.log('================================');

// Check environment variables
console.log('Environment variables:');
console.log('PORT:', process.env.PORT || 'not set');
console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
console.log('STRIPE_SECRET_KEY starts with sk_live:', process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_'));
console.log('STRIPE_SECRET_KEY length:', process.env.STRIPE_SECRET_KEY?.length || 0);

// Test Stripe initialization
try {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  console.log('✅ Stripe initialized successfully');
  
  // Test creating a small payment intent
  async function testStripe() {
    try {
      console.log('🧪 Testing payment intent creation...');
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 100, // €1.00
        currency: 'eur',
        metadata: { test: 'true' },
        automatic_payment_methods: { enabled: true }
      });
      console.log('✅ Test payment intent created:', paymentIntent.id);
      console.log('✅ Client secret generated:', !!paymentIntent.client_secret);
    } catch (error) {
      console.error('❌ Stripe test failed:', error.message);
      console.error('Error type:', error.type);
      console.error('Error code:', error.code);
    }
  }
  
  testStripe();
} catch (error) {
  console.error('❌ Stripe initialization failed:', error.message);
} 
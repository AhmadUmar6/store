import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// This is how you disable body parsing in App Router
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Retrieve the order ID from the session metadata
    const orderId = session.metadata.orderId;
    
    // Update the order status in your database
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        payment_intent: session.payment_intent,
        shipping_details: session.shipping ? JSON.stringify(session.shipping) : null,
        payment_status: session.payment_status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);
      
    if (error) {
      console.error('Error updating order status:', error);
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
    }
    
    // For successful checkout
    console.log(`Order ${orderId} has been paid successfully`);
  }
  
  return NextResponse.json({ received: true });
}
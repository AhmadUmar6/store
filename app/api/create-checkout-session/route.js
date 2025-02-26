import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, items, customer, totalAmount } = body;

    // Format line items for Stripe
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: item.name,
          images: item.images?.length > 0 ? [item.images[0]] : [],
          metadata: {
            productId: item.id
          }
        },
        unit_amount: Math.round(Number(item.price) * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cart`,
      customer_email: customer.email,
      metadata: {
        orderId: orderId
      },
      shipping_address_collection: {
        allowed_countries: ['GB', 'US', 'CA', 'FR', 'DE', 'ES', 'IT']
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: totalAmount > 10000 ? 0 : 1000, // Free shipping over £100
              currency: 'gbp',
            },
            display_name: totalAmount > 10000 ? 'Free Shipping' : 'Standard Shipping',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 3,
              },
              maximum: {
                unit: 'business_day',
                value: 5,
              },
            }
          }
        }
      ],
    });

    // Update order with Stripe session ID
    const { error } = await supabase
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', orderId);

    if (error) {
      console.error("Error updating order with session ID:", error);
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
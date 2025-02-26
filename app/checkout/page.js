"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { 
  ChevronLeft, 
  CreditCard, 
  Lock, 
  ShieldCheck, 
  Truck, 
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    country: "United Kingdom",
    phone: ""
  });

  // Fetch cart items from localStorage on component mount
  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true);
      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");

        if (cart.length === 0) {
          setCartItems([]);
          setLoading(false);
          return;
        }

        // Retrieve products using their id
        const productIds = cart.map((item) => item.id);
        const { data: products, error: supabaseError } = await supabase
          .from("products")
          .select("*")
          .in("id", productIds);

        if (supabaseError) throw supabaseError;

        // Merge local quantity with fetched product data
        const items = cart
          .map((cartItem) => {
            const product = products.find((p) => p.id === cartItem.id);
            if (!product) return null;
            return {
              ...product,
              quantity: cartItem.quantity,
            };
          })
          .filter((item) => item !== null);

        setCartItems(items);
      } catch (err) {
        console.error("Error fetching cart items:", err);
        setError("Failed to load cart items. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  // Calculate order totals
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * item.quantity,
    0
  );
  const shipping = subtotal > 100 ? 0 : 10; // Free shipping over £100
  const total = subtotal + shipping;
  
  // Item count for display
  const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      setError("Your cart is empty. Please add items before checkout.");
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Create order record in Supabase
      const orderItems = cartItems.map(item => ({
        product_id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: item.quantity
      }));
      
      const orderData = {
        customer_email: formData.email,
        customer_name: `${formData.firstName} ${formData.lastName}`,
        customer_address: `${formData.address}, ${formData.city}, ${formData.postalCode}, ${formData.country}`,
        customer_phone: formData.phone,
        total_amount: total,
        items: orderItems,
        status: "pending",
        created_at: new Date()
      };
      
      // Save order to Supabase
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert(orderData)
        .select()
        .single();
        
      if (orderError) throw orderError;
      
      // Initialize Stripe checkout
      const stripe = await stripePromise;
      
      // Create Stripe checkout session via API route
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: order.id,
          items: cartItems,
          success_url: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
          cancel_url: `${window.location.origin}/checkout?canceled=true&order_id=${order.id}`,
          customer_email: formData.email
        }),
      });
      
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      
      const session = await response.json();
      
      // Redirect to Stripe Checkout
      const result = await stripe.redirectToCheckout({
        sessionId: session.id,
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
    } catch (err) {
      console.error("Checkout error:", err);
      setError("Failed to process your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Check for canceled payment
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("canceled")) {
      setError("Payment was canceled. You can try again when you're ready.");
    }
  }, []);

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 bg-black text-white">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F9D312]"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 bg-black text-white">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
        <Link href="/" className="hover:text-[#F9D312]">
          Home
        </Link>
        <span>→</span>
        <Link href="/cart" className="hover:text-[#F9D312]">
          Cart
        </Link>
        <span>→</span>
        <span className="text-white">Checkout</span>
      </div>

      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <Lock size={28} className="text-[#F9D312]" />
          Secure Checkout
        </h1>
        <Link
          href="/cart"
          className="flex items-center gap-1 text-[#F9D312] hover:underline"
        >
          <ChevronLeft size={16} />
          Back to Cart
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900 border border-red-800 p-4 rounded-md flex items-start gap-3 mb-6">
          <AlertCircle className="text-[#F9D312] flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-900 border border-green-800 p-4 rounded-md flex items-start gap-3 mb-6">
          <CheckCircle className="text-[#F9D312] flex-shrink-0 mt-0.5" />
          <p>Order placed successfully! You will receive a confirmation email shortly.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Information */}
            <div className="bg-black border border-[#F9D312] rounded-lg p-6">
              <h2 className="text-xl font-medium mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:border-[#F9D312] focus:outline-none"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:border-[#F9D312] focus:outline-none"
                    placeholder="+44 123 456 7890"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Information */}
            <div className="bg-black border border-[#F9D312] rounded-lg p-6">
              <h2 className="text-xl font-medium mb-4">Shipping Address</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:border-[#F9D312] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:border-[#F9D312] focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:border-[#F9D312] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:border-[#F9D312] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-300 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:border-[#F9D312] focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="country" className="block text-sm font-medium text-gray-300 mb-1">
                    Country
                  </label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:border-[#F9D312] focus:outline-none"
                  >
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="France">France</option>
                    <option value="Germany">Germany</option>
                    <option value="Italy">Italy</option>
                    <option value="Spain">Spain</option>
                    <option value="Japan">Japan</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Payment Information Notice */}
            <div className="bg-black border border-[#F9D312] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard size={24} className="text-[#F9D312]" />
                <h2 className="text-xl font-medium">Payment Information</h2>
              </div>
              <p className="text-gray-300 mb-4">
                You'll be redirected to our secure payment partner, Stripe, to complete your purchase.
              </p>
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <ShieldCheck size={16} className="text-[#F9D312]" />
                <span>Your payment details are encrypted and secure</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Lock size={16} className="text-[#F9D312]" />
                <span>We do not store your card details</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || cartItems.length === 0}
              className="w-full bg-[#F9D312] text-black text-center py-3 rounded-md font-medium hover:bg-[#e0c80f] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-black"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Proceed to Payment
                </>
              )}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-black border border-[#F9D312] rounded-lg p-6 sticky top-4">
            <h2 className="text-xl font-medium mb-4 pb-2 border-b border-[#F9D312]/30">
              Order Summary
            </h2>

            {/* Cart Items */}
            <div className="space-y-4 max-h-60 overflow-y-auto mb-4">
              {cartItems.length > 0 ? (
                cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="bg-gray-800 w-10 h-10 rounded-md flex items-center justify-center text-xs text-gray-300">
                        {item.quantity}x
                      </div>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-400">
                          {item.size && `Size: ${item.size}`}
                          {item.color && item.size && ` | `}
                          {item.color && `Color: ${item.color}`}
                        </p>
                      </div>
                    </div>
                    <p className="font-medium">
                      £{((Number(item.price) || 0) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-2">Your cart is empty</p>
              )}
            </div>

            {/* Order Totals */}
            <div className="space-y-3 mb-6 pt-4 border-t border-[#F9D312]/30">
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal</span>
                <span>£{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Shipping</span>
                <span>{shipping === 0 ? "Free" : `£${shipping.toFixed(2)}`}</span>
              </div>
              <div className="border-t border-[#F9D312]/30 pt-3 mt-3 flex justify-between font-medium">
                <span>Total</span>
                <span className="text-xl font-bold text-[#F9D312]">
                  £{total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="pt-4 border-t border-[#F9D312]/30">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <Truck size={16} className="text-[#F9D312]" />
                <span>Free shipping on orders over £100</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <ShieldCheck size={16} className="text-[#F9D312]" />
                <span>Secure checkout with Stripe</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
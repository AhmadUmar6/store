"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Check, ChevronLeft, Clock, Package, ShoppingBag } from "lucide-react";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Clear the cart after successful checkout
    localStorage.setItem("cart", "[]");
    window.dispatchEvent(new Event("cartUpdated"));

    // Fetch order details
    const fetchOrderDetails = async () => {
      if (!sessionId) {
        setError("No session ID found. Unable to retrieve order details.");
        setLoading(false);
        return;
      }

      try {
        // Find the order with this Stripe session ID
        const { data, error: fetchError } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .eq("stripe_session_id", sessionId)
          .single();

        if (fetchError) throw fetchError;

        if (!data) {
          setError("Order not found. Please contact customer support.");
          setLoading(false);
          return;
        }

        setOrder(data);

        // Fetch product details for each order item
        if (data.order_items && data.order_items.length > 0) {
          const productIds = data.order_items.map(item => item.product_id);
          
          const { data: products, error: productsError } = await supabase
            .from("products")
            .select("id, name, images, price")
            .in("id", productIds);
            
          if (productsError) throw productsError;
          
          // Merge product details with order items
          const enrichedOrderItems = data.order_items.map(item => {
            const product = products.find(p => p.id === item.product_id);
            return {
              ...item,
              product_name: product?.name || "Unknown Product",
              product_image: product?.images?.[0] || null,
              product_price: product?.price || item.price
            };
          });
          
          setOrder({
            ...data,
            order_items: enrichedOrderItems
          });
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order details. Please try again or contact support.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [sessionId]);

  // Format date to be more user-friendly
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Estimate delivery date (5-7 business days from order date)
  const estimateDeliveryDate = (orderDate) => {
    if (!orderDate) return "";
    const date = new Date(orderDate);
    date.setDate(date.getDate() + 7); // Adding 7 days
    return formatDate(date);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 bg-black text-white">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
        <Link href="/" className="hover:text-[#F9D312]">
          Home
        </Link>
        <span>→</span>
        <Link href="/checkout" className="hover:text-[#F9D312]">
          Checkout
        </Link>
        <span>→</span>
        <span className="text-white">Order Confirmation</span>
      </div>

      <Suspense fallback={<div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F9D312]"></div></div>}>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F9D312]"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900 border border-red-800 p-6 rounded-lg text-center">
            <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
            <p className="text-gray-300 mb-6">{error}</p>
            <Link
              href="/cart"
              className="inline-block bg-[#F9D312] text-black px-6 py-3 rounded-md font-medium hover:bg-[#e0c80f] transition-colors"
            >
              Return to Cart
            </Link>
          </div>
        ) : order ? (
          <div className="space-y-8">
            {/* Success Header */}
            <div className="bg-[#0d2b17] border border-green-800 rounded-lg p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-700 flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-[#F9D312]" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-3">
                Order Confirmed!
              </h1>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Thank you for your purchase. Your order has been received and is being
                processed. A confirmation email has been sent to{" "}
                <span className="text-white">{order.customer_email}</span>.
              </p>
            </div>

            {/* Order Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Order Information */}
              <div className="lg:col-span-2 space-y-6">
                <div className="border border-[#F9D312] rounded-lg overflow-hidden">
                  <div className="bg-gray-900 p-4 border-b border-[#F9D312]">
                    <h2 className="text-xl font-medium flex items-center gap-2">
                      <ShoppingBag size={20} className="text-[#F9D312]" />
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </h2>
                    <p className="text-gray-400 text-sm">
                      Placed on {formatDate(order.created_at)}
                    </p>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Order Status */}
                    <div className="flex flex-col sm:flex-row justify-between gap-4 p-4 bg-gray-900 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock size={20} className="text-[#F9D312]" />
                        <div>
                          <h3 className="font-medium">Order Status</h3>
                          <p className="text-green-400">
                            {order.status === "paid" ? "Payment Successful" : order.status}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Package size={20} className="text-[#F9D312]" />
                        <div>
                          <h3 className="font-medium">Estimated Delivery</h3>
                          <p className="text-gray-400">
                            By {estimateDeliveryDate(order.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-lg border-b border-gray-800 pb-2">
                        Items Ordered
                      </h3>
                      {order.order_items?.map((item, index) => (
                        <div
                          key={item.id || index}
                          className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-800 rounded-lg"
                        >
                          {/* Product Image */}
                          <div className="relative w-full sm:w-16 h-16 sm:h-16 flex-shrink-0 bg-gray-800 rounded-md overflow-hidden">
                            {item.product_image ? (
                              <img
                                src={item.product_image}
                                alt={item.product_name}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <ShoppingBag size={20} />
                              </div>
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="flex-grow flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h4 className="font-medium">{item.product_name}</h4>
                              <p className="text-sm text-gray-400">
                                Quantity: {item.quantity}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                £{Number(item.price).toFixed(2)}
                              </p>
                              <p className="text-sm text-[#F9D312]">
                                Subtotal: £
                                {(Number(item.price) * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Shipping Address */}
                    <div className="space-y-2">
                      <h3 className="font-medium text-lg border-b border-gray-800 pb-2">
                        Shipping Address
                      </h3>
                      <p className="text-white">{order.shipping_name}</p>
                      <p className="text-gray-400">
                        {order.shipping_address_line1}
                        {order.shipping_address_line2
                          ? `, ${order.shipping_address_line2}`
                          : ""}
                      </p>
                      <p className="text-gray-400">
                        {order.shipping_city}, {order.shipping_postal_code}
                      </p>
                      <p className="text-gray-400">{order.shipping_country}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-black border border-[#F9D312] rounded-lg p-6 sticky top-4">
                  <h2 className="text-xl font-medium mb-6 pb-2 border-b border-[#F9D312]/30">
                    Order Summary
                  </h2>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Subtotal</span>
                      <span>£{Number(order.total_amount - order.shipping_cost).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Shipping</span>
                      <span>£{Number(order.shipping_cost).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-[#F9D312]/30 pt-3 mt-3 flex justify-between font-medium">
                      <span>Total</span>
                      <span className="text-xl font-bold text-[#F9D312]">
                        £{Number(order.total_amount).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Link
                    href="/products"
                    className="w-full block bg-[#F9D312] text-black text-center py-3 rounded-md font-medium hover:bg-[#e0c80f] transition-colors flex items-center justify-center gap-2"
                  >
                    <ChevronLeft size={16} />
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 border border-gray-800 rounded-lg">
            <h2 className="text-2xl font-medium mb-4">Order Not Found</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              We couldn't find any order details. Please check your email for order
              confirmation or contact customer support.
            </p>
            <Link
              href="/products"
              className="inline-block bg-[#F9D312] text-black px-6 py-3 rounded-md font-medium hover:bg-[#e0c80f] transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        )}
      </Suspense>
    </main>
  );
}
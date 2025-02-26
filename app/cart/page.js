"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import CartItem from "@/components/CartItem";
import { ShoppingBag, AlertCircle, ChevronLeft, ShoppingCart, Lock, CreditCard, TruckIcon } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Fetch cart items from localStorage and merge with updated product details
  const fetchCart = useCallback(async () => {
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

      // Merge local quantity with fetched product data and filter out missing products
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
  }, []);

  useEffect(() => {
    fetchCart();

    const handleCartUpdate = () => {
      fetchCart();
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    window.addEventListener("storage", handleCartUpdate);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
      window.removeEventListener("storage", handleCartUpdate);
    };
  }, [fetchCart]);

  // Update quantity for an item
  const updateItemQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setUpdateLoading(true);

    try {
      // First, check if we have enough stock
      const item = cartItems.find(item => item.id === productId);
      
      // Only check stock if we're increasing quantity and item has stock info
      if (newQuantity > item.quantity && item.quantity_available !== undefined) {
        if (newQuantity > item.quantity_available) {
          setError(`Sorry, only ${item.quantity_available} item(s) available in stock.`);
          setTimeout(() => setError(null), 3000);
          return;
        }
      }

      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );

      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const updatedCart = cart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      );
      localStorage.setItem("cart", JSON.stringify(updatedCart));
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      console.error("Error updating quantity:", err);
      setError("Failed to update quantity. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Remove an item from the cart
  const removeItem = (productId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id !== productId)
    );

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const updatedCart = cart.filter((item) => item.id !== productId);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  // Calculate totals safely
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * item.quantity,
    0
  );
  const shipping = subtotal > 0 ? 10 : 0; // Flat £10 shipping if not empty
  const total = subtotal + shipping;
  
  // Item count for header
  const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 bg-black text-white">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
        <Link href="/" className="hover:text-[#F9D312]">Home</Link>
        <span>→</span>
        <span className="text-white">Shopping Cart</span>
      </div>
      
      {/* Cart Header with Count */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <ShoppingCart size={28} className="text-[#F9D312]" />
          Your Cart
          {!loading && itemCount > 0 && (
            <span className="text-base font-normal text-gray-400">({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
          )}
        </h1>
        
        <Link
          href="/products"
          className="flex items-center gap-1 text-[#F9D312] hover:underline"
        >
          <ChevronLeft size={16} />
          Continue Shopping
        </Link>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F9D312]"></div>
        </div>
      ) : error ? (
        <div className="bg-red-900 border border-red-800 p-4 rounded-md flex items-start gap-3 mb-6">
          <AlertCircle className="text-[#F9D312] flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      ) : cartItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Cart Header (Desktop) */}
            <div className="hidden sm:flex justify-between items-center py-2 border-b border-[#F9D312]/30 text-gray-400 text-sm px-4">
              <span className="w-1/2">Product</span>
              <div className="w-1/2 flex justify-end">
                <span className="w-24 text-center">Quantity</span>
                <span className="w-24 text-center">Unit Price</span>
                <span className="w-24 text-center">Subtotal</span>
                <span className="w-10"></span> {/* Space for delete button */}
              </div>
            </div>
            
            {/* Cart Items */}
            <div className="space-y-4 relative">
              {updateLoading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#F9D312]"></div>
                </div>
              )}
              
              {cartItems.map((item, index) => (
                <CartItem
                  key={item.id ? `cart-${item.id}` : `cart-${index}`}
                  item={item}
                  updateQuantity={updateItemQuantity}
                  removeItem={removeItem}
                />
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-black border border-[#F9D312] rounded-lg p-6 sticky top-4">
              <h2 className="text-xl font-medium mb-6 pb-2 border-b border-[#F9D312]/30">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
                  <span>£{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Shipping</span>
                  <span>£{shipping.toFixed(2)}</span>
                </div>
                <div className="border-t border-[#F9D312]/30 pt-3 mt-3 flex justify-between font-medium">
                  <span>Total</span>
                  <span className="text-xl font-bold text-[#F9D312]">£{total.toFixed(2)}</span>
                </div>
              </div>
              
              {/* Checkout Button */}
              <Link
                href="/checkout"
                className="w-full block bg-[#F9D312] text-black text-center py-3 rounded-md font-medium hover:bg-[#e0c80f] transition-colors flex items-center justify-center gap-2"
              >
                <Lock size={16} />
                Secure Checkout
              </Link>
              
              {/* Payment Methods */}
              <div className="mt-6 pt-4 border-t border-[#F9D312]/30">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <CreditCard size={16} />
                    <span>We accept major credit cards and PayPal</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <TruckIcon size={16} />
                    <span>Free shipping on orders over £100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Empty cart message
        <div className="text-center py-16 border border-gray-800 rounded-lg">
          <div className="mx-auto w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-6">
            <ShoppingBag size={36} className="text-gray-400" />
          </div>
          <h2 className="text-2xl font-medium mb-4">Your cart is empty</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Looks like you haven't added any jewelry to your cart yet. Explore our collection to find something special.
          </p>
          <Link
            href="/products"
            className="inline-block bg-[#F9D312] text-black px-6 py-3 rounded-md font-medium hover:bg-[#e0c80f] transition-colors"
          >
            Browse Products
          </Link>
        </div>
      )}
    </main>
  );
}
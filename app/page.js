"use client";

import { useEffect, useState, useRef } from "react";
import ProductCard from "@/components/ProductCard";
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Hero banner images
const heroImages = [
  "/hero.png", // Replace with your actual image paths
  "/hero2.png",
];

// Announcement banner text
const announcements = [
  "FREE SHIPPING ON ORDERS OVER $100",
  "SPECIAL DISCOUNT FOR NEWSLETTER SUBSCRIBERS",
  "NEW COLLECTION JUST DROPPED",
  "LIMITED TIME OFFER: 20% OFF SELECTED ITEMS"
];

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentHeroImage, setCurrentHeroImage] = useState(0);
  
  // Fetch products from Supabase
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      
      try {
        // Fetch featured products
        const { data: featured, error: featuredError } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(4);
          
        if (featuredError) throw featuredError;
        
        setFeaturedProducts(featured || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProducts();
  }, []);

  // Hero image rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen font-sans">
      {/* Continuous Horizontal Scrolling Banner */}
      <div className="bg-black text-white py-3 overflow-hidden whitespace-nowrap relative">
        <div className="inline-flex animate-marquee">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="inline-flex items-center italic font-light tracking-wider">
              {announcements.map((announcement, index) => (
                <span key={index} className="flex items-center">
                  {announcement}
                  {index < announcements.length - 1 && (
                    <span className="mx-2">•</span>
                  )}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Hero Section with Image Carousel */}
      <section className="relative h-[85vh] bg-gray-100 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentHeroImage}
            className="absolute inset-0 bg-center bg-cover"
            style={{ backgroundImage: `url(${heroImages[currentHeroImage]})` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          />
        </AnimatePresence>
        
        <div className="absolute inset-0 bg-black bg-opacity-30" />
        
        <div className="relative h-full max-w-7xl mx-auto px-4 flex flex-col justify-center items-center text-center text-white z-10">
          <motion.h1 
            className="text-6xl md:text-7xl lg:text-8xl font-light tracking-tight mb-12"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Refined Simplicity
          </motion.h1>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <a
              href="/products"
              className="px-12 py-5 bg-white text-black font-medium rounded-none hover:bg-opacity-90 transition-all transform hover:scale-105 tracking-wider"
            >
              DISCOVER
            </a>
          </motion.div>
        </div>
        
        {/* Navigation arrows */}
        <button 
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 text-white p-3 rounded-full hover:bg-opacity-70 transition-all z-20"
          onClick={() => setCurrentHeroImage((prev) => (prev - 1 + heroImages.length) % heroImages.length)}
        >
          <ChevronLeft size={24} />
        </button>
        
        <button 
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 text-white p-3 rounded-full hover:bg-opacity-70 transition-all z-20"
          onClick={() => setCurrentHeroImage((prev) => (prev + 1) % heroImages.length)}
        >
          <ChevronRight size={24} />
        </button>
        
        {/* Indicator dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
          {heroImages.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentHeroImage ? 'bg-[#FBC000] w-6' : 'bg-white bg-opacity-50'
              }`}
              onClick={() => setCurrentHeroImage(index)}
            />
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section id="featured" className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div className="mb-16">
          <h2 className="text-4xl font-light mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Featured Collection</h2>
          <div className="w-24 h-1 bg-[#FBC000]"></div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FBC000]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
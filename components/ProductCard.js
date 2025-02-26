"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Check } from 'lucide-react';

export default function ProductCard({ product }) {
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [cartAdded, setCartAdded] = useState(false);

  // Handle adding to cart with animation feedback
  const addToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItemIndex = existingCart.findIndex(item => item.id === product.id);

    if (existingItemIndex >= 0) {
      existingCart[existingItemIndex].quantity += 1;
    } else {
      existingCart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        quantity: 1
      });
    }

    localStorage.setItem('cart', JSON.stringify(existingCart));
    window.dispatchEvent(new Event('cartUpdated'));
    window.dispatchEvent(new Event('storage'));

    // Set feedback state for 2 seconds
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 2000);
  };

  // Image navigation handlers
  const nextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  // Format price in GBP
  const formattedPrice = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(product.price) || 0);

  return (
    <Link href={`/products/${product.id}`}>
      <div 
        className="group relative bg-black border-2 border-[#FBC000] rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg h-full flex flex-col"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <Image
              src={product.images[currentImageIndex]}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-all duration-500 group-hover:scale-105"
              priority={false}
            />
          ) : (
            <div className="w-full h-full bg-black flex items-center justify-center">
              <span className="text-white">No image</span>
            </div>
          )}

          {/* Image Navigation Controls (visible on hover) */}
          {isHovered && product.images && product.images.length > 1 && (
            <>
              <button 
                onClick={prevImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center shadow-md transition-opacity duration-200"
                aria-label="Previous image"
              >
                &larr;
              </button>
              <button 
                onClick={nextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center shadow-md transition-opacity duration-200"
                aria-label="Next image"
              >
                &rarr;
              </button>
            </>
          )}

          {/* Sold Out Badge */}
          {product.quantity === 0 && (
            <div className="absolute top-0 left-0 bg-black text-white text-xs font-medium px-3 py-1 m-2">
              Sold Out
            </div>
          )}
        </div>

        {/* Product Information */}
        <div className="p-4 flex-grow flex flex-col">
          <h3 className="text-xl font-medium text-white mb-1 truncate">{product.name}</h3>
          <p className="text-white text-xs mb-3 flex-grow line-clamp-2">{product.description}</p>
          <div className="flex items-center justify-between mt-auto">
            <span className="text-m font-bold text-white">{formattedPrice}</span>
            
            {/* Add to Cart Button with feedback */}
            <button
              onClick={addToCart}
              disabled={product.quantity === 0}
              className={`p-2 rounded-full transition-all duration-300 ${
                product.quantity === 0 
                  ? 'bg-transparent text-white border border-white cursor-not-allowed' 
                  : cartAdded
                  ? 'bg-[#FBC000] text-black border border-[#FBC000]'
                  : 'bg-transparent text-white border border-white hover:border-[#FBC000] hover:text-[#FBC000]'
              }`}
              aria-label="Add to cart"
            >
              {cartAdded ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

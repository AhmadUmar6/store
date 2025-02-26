"use client";

import Image from "next/image";
import { Trash2, Plus, Minus } from "lucide-react";

export default function CartItem({ item, updateQuantity, removeItem }) {
  const handleIncrease = () => {
    updateQuantity(item.id, item.quantity + 1);
  };

  const handleDecrease = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  // Use first image from images array if available, fallback to item.image
  const imageToDisplay = item.images && item.images.length > 0 ? item.images[0] : item.image;
  
  // Calculate item total
  const itemTotal = (Number(item.price) || 0) * item.quantity;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-black border border-[#F9D312] rounded-lg p-4 transition-all hover:shadow-md">
      {/* Product Image */}
      <div className="relative w-full sm:w-24 h-24 sm:h-24 flex-shrink-0 overflow-hidden rounded-md">
        {imageToDisplay ? (
          <Image
            src={imageToDisplay}
            alt={item.name || "Product image"}
            fill
            sizes="(max-width: 640px) 100vw, 96px"
            className="object-cover rounded-md"
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center rounded-md">
            <span className="text-sm text-gray-300">No image</span>
          </div>
        )}
      </div>
      
      {/* Product Details */}
      <div className="flex-grow w-full sm:w-auto">
        <div className="flex flex-col sm:flex-row justify-between">
          <div>
            <h3 className="text-white text-lg font-medium mb-1">{item.name}</h3>
            <p className="text-gray-300 text-sm mb-2">
              {item.category && <span className="mr-2">{item.category}</span>}
              {item.size && <span className="mr-2">Size: {item.size}</span>}
              {item.color && <span>Color: {item.color}</span>}
            </p>
          </div>
          <p className="text-white font-bold sm:hidden">£{Number(item.price).toFixed(2)}</p>
        </div>
        
        {/* Mobile: Controls and Price in Row */}
        <div className="flex items-center justify-between mt-2 sm:mt-0">
          <div className="flex items-center">
            {/* Quantity Controls */}
            <div className="flex items-center border border-[#F9D312] rounded-md">
              <button
                onClick={handleDecrease}
                disabled={item.quantity <= 1}
                className="p-1 hover:bg-[#F9D312] hover:text-black transition-colors rounded-l-md disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Decrease quantity"
              >
                <Minus size={16} />
              </button>
              <span className="text-white px-3 py-1 border-l border-r border-[#F9D312]">
                {item.quantity}
              </span>
              <button
                onClick={handleIncrease}
                className="p-1 hover:bg-[#F9D312] hover:text-black transition-colors rounded-r-md"
                aria-label="Increase quantity"
              >
                <Plus size={16} />
              </button>
            </div>
            
            {/* Remove Button (Mobile) */}
            <button
              onClick={() => removeItem(item.id)}
              className="ml-2 text-gray-400 hover:text-[#F9D312] transition-colors sm:hidden"
              aria-label="Remove item"
            >
              <Trash2 size={18} />
            </button>
          </div>
          
          {/* Price Info */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <p className="text-gray-300 text-sm">Unit Price</p>
              <p className="text-white font-medium">£{Number(item.price).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-300 text-sm hidden sm:block">Subtotal</p>
              <p className="text-white font-bold">£{itemTotal.toFixed(2)}</p>
            </div>
            
            {/* Remove Button (Desktop) */}
            <button
              onClick={() => removeItem(item.id)}
              className="hidden sm:flex text-gray-400 hover:text-[#F9D312] transition-colors ml-4"
              aria-label="Remove item"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from 'react';
import { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft, User, Check } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ProductPage({ params }) {
  // Unwrap the params promise using React.use()
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [cartAdded, setCartAdded] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();
        if (error) throw error;
        setProduct(data);
        if (data.images && data.images.length > 0) {
          setSelectedImage(data.images[0]);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-black">
        <h1 className="text-xl font-bold mb-4 text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
          Product not found
        </h1>
        <Link href="/products" className="text-[#FBC000] hover:underline">
          Back to Products
        </Link>
      </div>
    );
  }

  // Format price in GBP
  const formattedPrice = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(product.price);

  // Quantity controls
  const increaseQuantity = () => {
    if (quantity < product.quantity) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  // Add product to cart with feedback animation
  const addToCart = () => {
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItemIndex = existingCart.findIndex(item => item.id === product.id);
    if (existingItemIndex >= 0) {
      existingCart[existingItemIndex].quantity += quantity;
    } else {
      existingCart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        quantity: quantity
      });
    }
    localStorage.setItem('cart', JSON.stringify(existingCart));
    window.dispatchEvent(new Event('cartUpdated'));
    window.dispatchEvent(new Event('storage'));
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 2000);
  };

  // Determine stock status: show only if out of stock or critically low (< 5)
  let stockStatus = null;
  if (product.quantity === 0) {
    stockStatus = "Out of stock";
  } else if (product.quantity < 5) {
    stockStatus = `Only ${product.quantity} left!`;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 bg-black font-sans">
      {/* Back Button */}
      <Link href="/products" className="inline-flex items-center text-white mb-6 hover:text-[#FBC000]">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Products
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div>
          <div className="relative aspect-square rounded-lg overflow-hidden border border-white">
            {selectedImage ? (
              <Image
                src={selectedImage}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white">No image</span>
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="mt-4 flex gap-4 overflow-x-auto">
              {product.images.map((img, index) => (
                <div
                  key={index}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden cursor-pointer border-2 ${selectedImage === img ? 'border-[#FBC000]' : 'border-white'}`}
                  onClick={() => setSelectedImage(img)}
                >
                  <Image
                    src={img}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    sizes="100px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex flex-col">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
            {product.name}
          </h1>
          <p className="text-2xl font-medium mb-6 text-white">{formattedPrice}</p>
          <p className="text-base mb-8 text-white">{product.description}</p>

          {/* Quantity Selector */}
          <div className="flex items-center space-x-4 mb-6">
            <span className="text-white">Quantity</span>
            <div className="flex items-center border border-white rounded">
              <button 
                onClick={decreaseQuantity}
                disabled={quantity <= 1}
                className="px-3 py-1 border-r border-white text-white"
              >
                –
              </button>
              <span className="px-4 py-1 text-white">{quantity}</span>
              <button 
                onClick={increaseQuantity}
                disabled={quantity >= product.quantity}
                className="px-3 py-1 border-l border-white text-white"
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={addToCart}
            disabled={product.quantity === 0 || cartAdded}
            className={`flex items-center justify-center space-x-2 py-3 px-6 rounded-md w-full transition-all ${
              product.quantity === 0 
                ? 'bg-transparent text-white border border-white cursor-not-allowed'
                : cartAdded
                ? 'bg-[#FBC000] text-black border border-[#FBC000]'
                : 'bg-transparent text-white border border-white hover:border-[#FBC000] hover:text-[#FBC000]'
            }`}
          >
            {cartAdded ? (
              <>
                <Check className="w-5 h-5" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-5 h-5" />
                <span>Add to Cart</span>
              </>
            )}
          </button>

          {stockStatus && (
            <p className="text-sm mt-4 font-semibold text-[#FBC000]">{stockStatus}</p>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4 text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
          Reviews ({product.reviews ? product.reviews.length : 0})
        </h2>
        {product.reviews && product.reviews.length > 0 ? (
          <div className="space-y-6">
            {product.reviews.map((review, index) => (
              <div key={index} className="flex items-start gap-4 border-b border-white/20 pb-4">
                <div className="flex-shrink-0">
                  <User className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">{review.name}</p>
                  <p className="mt-1 text-white">{review.text}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white">0 Reviews</p>
        )}
      </div>
    </div>
  );
}

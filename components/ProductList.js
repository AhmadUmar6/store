"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import ProductCard from './ProductCard';
import { Loader2, Filter, X } from 'lucide-react';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ProductList({ category = null, featured = false, limit = null }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: category || 'all',
    sort: 'newest',
    priceRange: [0, 1000]
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Available categories for filtering
  const categories = ['all', 'rings', 'necklaces', 'bracelets', 'earrings'];
  
  // Sort options
  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'name-asc', label: 'Name: A to Z' }
  ];

  // Fetch products based on filters
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Start with base query
        let query = supabase.from('products').select('*');
        
        // Apply category filter if not 'all'
        if (filters.category !== 'all') {
          query = query.eq('category', filters.category);
        }
        
        // Apply price range filter
        query = query.gte('price', filters.priceRange[0]).lte('price', filters.priceRange[1]);
        
        // Apply sorting
        switch (filters.sort) {
          case 'newest':
            query = query.order('created_at', { ascending: false });
            break;
          case 'price-asc':
            query = query.order('price', { ascending: true });
            break;
          case 'price-desc':
            query = query.order('price', { ascending: false });
            break;
          case 'name-asc':
            query = query.order('name', { ascending: true });
            break;
          default:
            query = query.order('created_at', { ascending: false });
        }
        
        // Apply limit if specified
        if (limit) {
          query = query.limit(limit);
        }
        
        // Featured products filter
        if (featured) {
          query = query.eq('featured', true);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [filters, featured, limit]);
  
  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  // Handle price range change
  const handlePriceChange = (index, value) => {
    const newRange = [...filters.priceRange];
    newRange[index] = Number(value);
    setFilters(prev => ({ ...prev, priceRange: newRange }));
  };

  // Toggle filter panel on mobile
  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Mobile filter toggle */}
      <div className="md:hidden mb-4">
        <button
          onClick={toggleFilter}
          className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-md"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </button>
      </div>
    
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters - Desktop view is always visible, mobile is toggled */}
        <div 
          className={`${
            isFilterOpen ? 'block' : 'hidden'
          } md:block w-full md:w-1/4 lg:w-1/5 bg-white p-4 rounded-lg border border-gray-200 h-fit`}
        >
          <div className="flex justify-between items-center mb-4 md:hidden">
            <h3 className="font-medium">Filters</h3>
            <button onClick={toggleFilter} aria-label="Close filters">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Category filter */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">Categories</h3>
            <div className="space-y-2">
              {categories.map(cat => (
                <label key={cat} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={filters.category === cat}
                    onChange={() => handleFilterChange('category', cat)}
                    className="form-radio text-black focus:ring-black h-4 w-4"
                  />
                  <span className="text-sm capitalize">{cat}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Price range filter */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">Price Range</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">$</span>
                <input
                  type="number"
                  min="0"
                  value={filters.priceRange[0]}
                  onChange={(e) => handlePriceChange(0, e.target.value)}
                  className="form-input w-full rounded border-gray-300 text-sm focus:border-black focus:ring-black"
                  placeholder="Min"
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">$</span>
                <input
                  type="number"
                  min="0"
                  value={filters.priceRange[1]}
                  onChange={(e) => handlePriceChange(1, e.target.value)}
                  className="form-input w-full rounded border-gray-300 text-sm focus:border-black focus:ring-black"
                  placeholder="Max"
                />
              </div>
            </div>
          </div>
          
          {/* Sort filter */}
          <div>
            <h3 className="text-sm font-medium mb-3">Sort By</h3>
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="form-select w-full rounded border-gray-300 text-sm focus:border-black focus:ring-black"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Product Grid */}
        <div className="w-full md:w-3/4 lg:w-4/5">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-black" />
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md text-red-700">
              {error}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No products found. Try changing your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
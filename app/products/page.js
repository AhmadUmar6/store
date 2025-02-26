"use client";

import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import ProductCard from "@/components/ProductCard";
import { Filter, X, ShoppingBag, SlidersHorizontal } from "lucide-react";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState("newest");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const categories = ["Ring", "Necklace", "Earring"];

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*');
        if (error) throw error;
        setProducts(data || []);
        if (data && data.length > 0) {
          const max = Math.max(...data.map(product => product.price));
          const roundedMax = Math.ceil(max / 100) * 100;
          setMaxPrice(roundedMax);
          setPriceRange([0, roundedMax]);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const toggleCategory = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setPriceRange([0, maxPrice]);
    setSelectedCategories([]);
  };

  const filteredAndSortedProducts = [...products]
    .filter(product => {
      const priceMatch = product.price >= priceRange[0] && product.price <= priceRange[1];
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(product.category);
      return priceMatch && categoryMatch;
    })
    .sort((a, b) => {
      if (sortOption === "newest") {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortOption === "priceAsc") {
        return a.price - b.price;
      } else if (sortOption === "priceDesc") {
        return b.price - a.price;
      }
      return 0;
    });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 font-sans">
      {/* Mobile Filter Toggle & Sort */}
      <div className="lg:hidden sticky top-0 z-20 bg-black py-3 -mx-4 px-4 mb-6 shadow-sm flex justify-between items-center">
        <button
          onClick={() => setIsMobileFilterOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white border border-white rounded-md transition-colors hover:bg-[#FBC000] hover:text-black"
        >
          <Filter size={18} />
          Filters
        </button>
        
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="bg-black text-white border border-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FBC000] hover:border-[#FBC000] hover:text-[#FBC000] transition-colors"
        >
          <option value="newest">Newest</option>
          <option value="priceAsc">Price: Low to High</option>
          <option value="priceDesc">Price: High to Low</option>
        </select>
      </div>
      
      {/* Mobile Filter Sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${isMobileFilterOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileFilterOpen(false)}></div>
        <div className={`absolute top-0 right-0 h-full w-80 bg-black text-white border-l-4 border-[#FBC000] transform transition-transform duration-300 ${isMobileFilterOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Filters</h3>
              <button onClick={() => setIsMobileFilterOpen(false)} className="p-1 text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Categories */}
              <div>
                <h4 className="font-medium mb-3">Categories</h4>
                <div className="space-y-2">
                  {categories.map(category => (
                    <div key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`mobile-${category}`}
                        checked={selectedCategories.includes(category)}
                        onChange={() => toggleCategory(category)}
                        className="h-4 w-4 rounded border-white text-white accent-[#FBC000] focus:ring-2 focus:ring-[#FBC000]"
                      />
                      <label htmlFor={`mobile-${category}`} className="ml-2">
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Price Range */}
              <div>
                <h4 className="font-medium mb-3">Price Range</h4>
                <input
                  type="range"
                  min="0"
                  max={maxPrice}
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  style={{ accentColor: "#FBC000" }}
                  className="w-full accent-[#FBC000]"
                />
                <div className="flex justify-between mt-2">
                  <span>£{priceRange[0]}</span>
                  <span>£{priceRange[1]}</span>
                </div>
              </div>
              
              {/* Clear Filters */}
              <button
                onClick={clearFilters}
                className="w-full py-2 border border-white rounded-md bg-black text-white transition-colors hover:bg-[#FBC000] hover:text-black"
              >
                Clear Filters
              </button>
              
              {/* Apply Filters */}
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full py-2 bg-black text-white border border-white rounded-md transition-colors hover:bg-[#FBC000] hover:text-black"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Desktop Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters for Desktop */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-0">
            <div className="bg-black p-6 border border-white rounded-lg shadow">
              <h3 className="text-xl font-bold mb-6 flex items-center text-white">
                <SlidersHorizontal size={20} className="mr-2" />
                Filters
              </h3>
              
              {/* Categories */}
              <div className="mb-6">
                <h4 className="font-medium mb-3 text-white">Categories</h4>
                <div className="space-y-2">
                  {categories.map(category => (
                    <div key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        id={category}
                        checked={selectedCategories.includes(category)}
                        onChange={() => toggleCategory(category)}
                        className="h-4 w-4 rounded border-white text-white accent-[#FBC000] focus:ring-2 focus:ring-[#FBC000]"
                      />
                      <label htmlFor={category} className="ml-2 text-white">
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Price Range */}
              <div className="mb-6">
                <h4 className="font-medium mb-3 text-white">Price Range</h4>
                <input
                  type="range"
                  min="0"
                  max={maxPrice}
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  style={{ accentColor: "#FBC000" }}
                  className="w-full accent-[#FBC000]"
                />
                <div className="flex justify-between mt-2 text-white">
                  <span>£{priceRange[0]}</span>
                  <span>£{priceRange[1]}</span>
                </div>
              </div>
              
              {/* Clear Filters */}
              <button
                onClick={clearFilters}
                className="w-full py-2 text-sm border border-white rounded-md bg-black text-white transition-colors hover:bg-[#FBC000] hover:text-black"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1">
          {/* Desktop Sort Controls */}
          <div className="hidden lg:flex justify-between items-center mb-6">
            <div className="text-sm text-white">
              Showing {filteredAndSortedProducts.length} products
            </div>
            
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-sm font-medium text-white">Sort by:</label>
              <select
                id="sort"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="bg-black text-white border border-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FBC000] hover:border-[#FBC000] hover:text-[#FBC000] transition-colors"
              >
                <option value="newest">Newest</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
              </select>
            </div>
          </div>
          
          {/* Active Filter Tags */}
          {(selectedCategories.length > 0 || priceRange[1] < maxPrice) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedCategories.map(category => (
                <div 
                  key={category} 
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-black text-white"
                >
                  {category}
                  <button onClick={() => toggleCategory(category)} className="ml-1 text-white hover:text-[#FBC000]">
                    <X size={14} />
                  </button>
                </div>
              ))}
              
              {priceRange[1] < maxPrice && (
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-black text-white">
                  Up to £{priceRange[1]}
                  <button 
                    onClick={() => setPriceRange([0, maxPrice])} 
                    className="ml-1 text-white hover:text-[#FBC000]"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Product Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
          ) : filteredAndSortedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredAndSortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-black rounded-lg border border-white">
              <ShoppingBag size={48} className="mx-auto mb-4 text-white" />
              <h3 className="text-xl font-medium mb-2 text-white">No products found</h3>
              <p className="text-white mb-4">Try adjusting your filters to find what you're looking for.</p>
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-black text-white border border-white rounded-md hover:bg-[#FBC000] hover:text-black transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

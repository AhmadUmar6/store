"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ShoppingBag } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const pathname = usePathname();

  // Get cart count from localStorage on client side
  useEffect(() => {
    const getCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(cart.reduce((acc, item) => acc + item.quantity, 0));
    };

    getCartCount();
    window.addEventListener('storage', getCartCount);
    
    // Custom event for cart updates within the same window
    window.addEventListener('cartUpdated', getCartCount);
    
    return () => {
      window.removeEventListener('storage', getCartCount);
      window.removeEventListener('cartUpdated', getCartCount);
    };
  }, []);

  // Toggle mobile menu
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  // Nav link component
  const NavLink = ({ href, label }) => {
    const isActive = pathname === href;
    return (
      <Link 
        href={href}
        className={`text-sm transition-colors hover:text-gray-500 tracking-wider ${
          isActive ? 'text-black border-b-2 border-[#FBC000]' : 'text-gray-700'
        }`}
        onClick={closeMenu}
      >
        {label.toUpperCase()}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4 py-5">
        <div className="flex items-center justify-between">
          {/* Left-aligned navigation */}
          <nav className="hidden md:flex space-x-10 items-center">
            <NavLink href="/" label="Shop" />
            <NavLink href="/products" label="Products" />
            <NavLink href="/contact" label="Contact" />
          </nav>
          
          {/* Mobile menu icon (left-aligned) */}
          <div className="flex md:hidden">
            <button 
              onClick={toggleMenu}
              className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Center-aligned logo/brand */}
          <Link href="/" className="text-4xl tracking-tight font-bold absolute left-1/2 transform -translate-x-1/2 text-black" style={{ fontFamily: "'Playfair Display', serif" }}>
            ÉCLAT
          </Link>

          {/* Right-aligned cart icon */}
          <div className="flex items-center">
            <Link 
              href="/cart" 
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5 text-black" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-black rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="container mx-auto px-4 py-6 space-y-6 flex flex-col items-center">
            <NavLink href="/" label="Shop" />
            <NavLink href="/products" label="Products" />
            <NavLink href="/contact" label="Contact" />
          </div>
        </div>
      )}
    </header>
  );
}

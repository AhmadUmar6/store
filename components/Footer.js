"use client";

import Link from "next/link";
import { useState } from "react";
import { Instagram, Twitter, Facebook } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <footer className="bg-white text-black">
      <div className="container mx-auto px-4 py-8">
        {/* Top Section: Brand, Site Map, and Contact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Brand & Social */}
          <div className="text-center md:text-left">
            <Link
              href="/"
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              ÉCLAT
            </Link>
            <p className="mt-2 text-sm text-gray-600">
              Discover timeless elegance and modern design. Our curated collection blends sophistication with contemporary style.
            </p>
            <div className="flex justify-center md:justify-start space-x-4 mt-4">
              <a
                href="#"
                className="hover:text-[#F9D312] transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="hover:text-[#F9D312] transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="hover:text-[#F9D312] transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Site Map */}
          <div className="text-center md:text-left">
            <h3 className="text-m font-bold uppercase tracking-wider mb-4">
              Site Map
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sm hover:text-[#F9D312] transition-colors"
                >
                  Shop
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="text-sm hover:text-[#F9D312] transition-colors"
                >
                  Products
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm hover:text-[#F9D312] transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Us */}
          <div className="text-center md:text-left">
            <h3 className="text-m font-bold uppercase tracking-wider mb-4">
              Contact Us
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>123 King’s Road</li>
              <li>London, UK, SW3 5RY</li>
              <li>Email: support@eclat.co.uk</li>
              <li>Phone: +44 20 7946 0958</li>
            </ul>
          </div>
        </div>

        {/* Newsletter Signup Section */}
        <div className="mt-8">
          <div className="bg-black text-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-auto border-l-4 border-[#F9D312] text-center">
            <h3 className="text-xl font-bold tracking-wide mb-2">Newsletter</h3>
            <p className="text-sm text-gray-300 mb-4">
              Stay updated with our latest collections and exclusive offers.
            </p>
            {submitted ? (
              <p className="text-sm text-green-400">Thank you for subscribing!</p>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="flex-grow px-4 py-2 bg-gray-800 text-white border border-gray-700 placeholder-gray-400 rounded-l-full focus:outline-none focus:ring-2 focus:ring-[#F9D312] text-sm mb-4 sm:mb-0 sm:mr-2"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#F9D312] text-black rounded-r-full hover:bg-yellow-600 transition-colors text-sm"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-sm text-gray-600 text-center">
          <p>&copy; {currentYear} ÉCLAT. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

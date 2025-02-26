"use client";
import ProductForm from "@/components/ProductForm";
import Link from "next/link";

export default function AddProductPage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h1 className="text-3xl font-semibold text-black mb-4 sm:mb-0">Add New Product</h1>
        <Link
          href="/admin"
          className="px-4 py-2 text-gray-600 hover:text-black transition-colors"
        >
          Back to Products
        </Link>
      </div>
      <div className="bg-white shadow-lg rounded-lg p-6 sm:p-8 border border-gray-200">
        <ProductForm />
      </div>
    </div>
  );
}

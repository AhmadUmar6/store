"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from '@supabase/supabase-js';
import ProductForm from "@/components/ProductForm";
import Link from "next/link";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setProduct(data);
      } catch (error) {
        console.error("Error fetching product:", error);
        setError("Product not found");
        router.push("/admin");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="p-4 text-red-600">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h1 className="text-3xl font-semibold text-black mb-4 sm:mb-0">Edit Product</h1>
        <Link
          href="/admin"
          className="px-4 py-2 text-gray-600 hover:text-black transition-colors"
        >
          Back to Products
        </Link>
      </div>
      <div className="bg-white shadow-lg rounded-lg p-6 sm:p-8 border border-gray-200">
        <ProductForm initialData={product} />
      </div>
    </div>
  );
}

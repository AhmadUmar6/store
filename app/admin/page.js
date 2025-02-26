"use client";
import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import Link from "next/link";
import { Pencil, Trash, Plus } from "lucide-react";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*');
        
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setDeleteError("");
      try {
        const product = products.find(p => p.id === id);
        
        if (product?.images && product.images.length > 0) {
          // Delete all images associated with the product
          for (const imageUrl of product.images) {
            const imagePath = imageUrl.split('/').pop();
            if (imagePath) {
              const { error: storageError } = await supabase
                .storage
                .from('products')
                .remove([imagePath]);
              
              if (storageError) {
                console.error("Error deleting image:", storageError);
                // Continue even if deletion fails
              }
            }
          }
        }
        
        // Delete the product from the database
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        
        // Update the UI
        setProducts(products.filter(product => product.id !== id));
      } catch (error) {
        console.error("Error deleting product:", error);
        setDeleteError("Failed to delete product. Please try again.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-black mb-4 sm:mb-0">Products</h1>
        <Link
          href="/admin/add-product"
          className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors w-full sm:w-auto justify-center sm:justify-start"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </Link>
      </div>

      {deleteError && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {deleteError}
        </div>
      )}

      {products.length === 0 ? (
        <div className="bg-white shadow-lg rounded-lg p-8 text-center border border-gray-200">
          <p className="text-gray-500">No products found. Add your first product to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop view - table */}
          <div className="hidden sm:block bg-white shadow-lg rounded-lg overflow-x-auto border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.images && product.images.length > 0 && (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-12 w-12 rounded-lg mr-4 object-cover border border-gray-200"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {product.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">£{parseFloat(product.price).toFixed(2)}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.quantity}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-4">
                        <Link
                          href={`/admin/edit-product/${product.id}`}
                          className="text-gray-600 hover:text-black transition-colors"
                        >
                          <Pencil className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-gray-600 hover:text-red-600 transition-colors"
                        >
                          <Trash className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile view - card layout */}
          <div className="sm:hidden space-y-4">
            {products.map((product) => (
              <div key={product.id} className="bg-white shadow rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex space-x-3">
                    {product.images && product.images.length > 0 && (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-16 w-16 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{product.description}</p>
                      <div className="flex mt-2 space-x-4">
                        <div className="text-sm text-gray-900">
                          <span className="text-xs text-gray-500">Price: </span>
                          ${parseFloat(product.price).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-900">
                          <span className="text-xs text-gray-500">Qty: </span>
                          {product.quantity}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-4 gap-6 border-t pt-3">
                  <Link
                    href={`/admin/edit-product/${product.id}`}
                    className="flex items-center text-gray-600 hover:text-black transition-colors"
                  >
                    <Pencil className="w-5 h-5 mr-1" />
                    <span className="text-sm">Edit</span>
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="flex items-center text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <Trash className="w-5 h-5 mr-1" />
                    <span className="text-sm">Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
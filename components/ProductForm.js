"use client";

import { useState, useEffect } from "react";
import { Upload, X, Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ProductForm({ initialData = null }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    quantity: "",
    category: "Ring", // Default category
    images: [], // array of files or URLs
    reviews: [], // array of {name, text} objects
  });
  const [previews, setPreviews] = useState([]); // array of preview URLs
  const [validationError, setValidationError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [loading, setLoading] = useState(false);
  const [newReview, setNewReview] = useState({ name: "", text: "" });

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        description: initialData.description || "",
        price: initialData.price ? initialData.price.toString() : "",
        quantity: initialData.quantity ? initialData.quantity.toString() : "",
        category: initialData.category || "Ring",
        images: initialData.images || [],
        reviews: initialData.reviews || [],
      });
      setPreviews(initialData.images || []);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValidationError("");

    if (name === "price") {
      if (value && !value.match(/^\d*\.?\d{0,2}$/)) return;
      if (value && parseFloat(value) < 0) return;
    }
    if (name === "quantity") {
      if (value && !value.match(/^\d*$/)) return;
      if (value && parseInt(value) < 0) return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setNewReview((prev) => ({ ...prev, [name]: value }));
  };

  const addReview = () => {
    // Validate review fields
    if (!newReview.name.trim() || !newReview.text.trim()) {
      setValidationError("Review name and text are required");
      return;
    }

    // Add the new review to the form state
    setForm((prev) => ({
      ...prev,
      reviews: [...prev.reviews, { ...newReview }]
    }));

    // Reset the new review form
    setNewReview({ name: "", text: "" });
    setValidationError("");
  };

  const removeReview = (index) => {
    setForm((prev) => {
      const updatedReviews = [...prev.reviews];
      updatedReviews.splice(index, 1);
      return { ...prev, reviews: updatedReviews };
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setValidationError("");

    // Validate each file
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setValidationError("Please upload image files only");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setValidationError("Each image size should be less than 5MB");
        return;
      }
    }

    // Replace existing images with the new selection
    setForm((prev) => ({ ...prev, images: files }));
    // Generate previews for each file
    setPreviews([]); // clear previous previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setForm((prev) => {
      const updatedImages = [...prev.images];
      updatedImages.splice(index, 1);
      return { ...prev, images: updatedImages };
    });
    setPreviews((prev) => {
      const updatedPreviews = [...prev];
      updatedPreviews.splice(index, 1);
      return updatedPreviews;
    });
  };

  const clearImages = () => {
    setForm((prev) => ({ ...prev, images: [] }));
    setPreviews([]);
  };

  const uploadImage = async (file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${Date.now()}_${fileName}`;

      // Upload image to Supabase Storage
      const { data, error } = await supabase.storage
        .from('products')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: publicData, error: publicError } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      if (publicError) throw publicError;

      return publicData.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");
    setUploadError("");

    // Validation checks
    if (!form.name.trim()) {
      setValidationError("Product name is required");
      return;
    }
    if (!form.description.trim()) {
      setValidationError("Description is required");
      return;
    }
    if (!form.price || parseFloat(form.price) <= 0) {
      setValidationError("Please enter a valid price");
      return;
    }
    if (!form.quantity || parseInt(form.quantity) < 0) {
      setValidationError("Please enter a valid quantity");
      return;
    }
    if ((!form.images || form.images.length === 0) && (!initialData?.images || initialData.images.length === 0)) {
      setValidationError("Please upload at least one product image");
      return;
    }

    setLoading(true);

    try {
      let imageUrls = [];

      // Upload images if they are new File objects
      if (form.images && form.images.length > 0) {
        const uploadPromises = form.images.map(async (img) => {
          if (img instanceof File) {
            return await uploadImage(img);
          }
          return img; // already a URL
        });
        imageUrls = await Promise.all(uploadPromises);
      } else if (initialData?.images) {
        imageUrls = initialData.images;
      }

      const productData = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        quantity: parseInt(form.quantity),
        category: form.category,
        images: imageUrls,
        reviews: form.reviews,
        updated_at: new Date().toISOString(),
      };

      if (initialData?.id) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', initialData.id);
        if (error) throw error;
      } else {
        // Add new product
        productData.created_at = new Date().toISOString();
        const { error } = await supabase
          .from('products')
          .insert([productData]);
        if (error) throw error;
      }

      router.push("/admin");
      router.refresh();
    } catch (error) {
      console.error("Error saving product:", error);
      setUploadError(
        `Failed to save product: ${error.message}. Please try again.`
      );
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring focus:ring-black focus:border-black text-black bg-white"
            maxLength={100}
            placeholder="Enter product name"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring focus:ring-black focus:border-black text-black bg-white"
          >
            <option value="Ring">Ring</option>
            <option value="Necklace">Necklace</option>
            <option value="Earring">Earring</option>
          </select>
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows="4"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring focus:ring-black focus:border-black text-black bg-white"
            maxLength={500}
            placeholder="Enter product description"
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Price <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">£</span>
            </div>
            <input
              type="text"
              name="price"
              value={form.price}
              onChange={handleChange}
              className="block w-full pl-7 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring focus:ring-black focus:border-black text-black bg-white"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Quantity <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="quantity"
            value={form.quantity}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring focus:ring-black focus:border-black text-black bg-white"
            placeholder="0"
          />
        </div>

        {/* Product Images */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Product Images <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 space-y-4">
            {previews && previews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {previews.map((preview, index) => (
                  <div key={index} className="relative w-full h-32">
                    <img
                      src={preview}
                      alt={`Product preview ${index + 1}`}
                      className="rounded-lg object-cover w-full h-full"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center space-x-4">
              <label className="flex-1 cursor-pointer">
                <div className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black">
                  <span className="flex items-center justify-center">
                    <Upload className="w-5 h-5 mr-2" />
                    {previews.length > 0 ? "Change Images" : "Upload Images"}
                  </span>
                </div>
                <input
                  type="file"
                  name="images"
                  onChange={handleImageChange}
                  className="hidden"
                  accept="image/*"
                  multiple
                />
              </label>
              {previews.length > 0 && (
                <button
                  type="button"
                  onClick={clearImages}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  Clear All
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Supported formats: JPG, PNG, GIF. Max size per image: 5MB
            </p>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reviews
          </label>
          
          {/* Current Reviews */}
          {form.reviews.length > 0 && (
            <div className="mb-4 space-y-3">
              {form.reviews.map((review, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-md bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{review.name}</p>
                      <p className="text-gray-600 mt-1">{review.text}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeReview(index)}
                      className="p-1 text-gray-500 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Add New Review Form */}
          <div className="space-y-3 p-4 border border-gray-200 rounded-md">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Reviewer Name
              </label>
              <input
                type="text"
                name="name"
                value={newReview.name}
                onChange={handleReviewChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring focus:ring-black focus:border-black text-black bg-white"
                placeholder="Enter reviewer name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Review Text
              </label>
              <textarea
                name="text"
                value={newReview.text}
                onChange={handleReviewChange}
                rows="2"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring focus:ring-black focus:border-black text-black bg-white"
                placeholder="Enter review text"
              />
            </div>
            <button
              type="button"
              onClick={addReview}
              className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Review
            </button>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {(validationError || uploadError) && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="text-sm text-red-700">
              {validationError || uploadError}
            </div>
          </div>
        </div>
      )}

      {/* Form Buttons */}
      <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </span>
          ) : (
            "Save Product"
          )}
        </button>
      </div>
    </form>
  );
}
"use client";

import { useEffect, useState } from "react";
import { productsAPI, type Product } from "@/lib/api";
import { getFullImageUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, ShoppingCart, Package } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuthStore } from "@/store/useAuthStore";

const ProductsSection = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productsAPI.getAll();
      // Get first 8 active products
      const activeProducts = data.filter((p) => p.isActive).slice(0, 8);
      setProducts(activeProducts);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    await addItem(product.id, 1);
  };

  if (loading) {
    return (
      <section id="products" className="bg-surface py-16 md:py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-deep-blue">Featured Products</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Browse our curated selection of high-quality research products.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-border p-4 animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section id="products" className="bg-surface py-16 md:py-24">
        <div className="container">
          <div className="text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Products Available</h2>
            <p className="text-gray-600">Check back soon for new products!</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="products" className="bg-surface py-16 md:py-24">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-deep-blue">Featured Products</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Browse our curated selection of high-quality research products.
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {products.map((product) => {
            const imageUrl = getFullImageUrl(product.thumbnail || product.images?.[0]);
            return (
              <div
                key={product.id}
                className="bg-white rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow group"
              >
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const fallback = e.currentTarget.nextElementSibling;
                        if (fallback) (fallback as HTMLElement).style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ display: imageUrl ? "none" : "flex" }}
                  >
                    <Package className="w-12 h-12 text-gray-400" />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 min-h-[3rem]">
                    {product.name}
                  </h3>
                  <p className="text-lg font-bold text-primary mb-3">${Number(product.price).toFixed(2)}</p>
                  <Button
                    onClick={() => handleAddToCart(product)}
                    className="w-full"
                    size="sm"
                    disabled={product.stock === 0}
                  >
                    {product.stock === 0 ? (
                      "Out of Stock"
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-center mt-10">
          <Link href="/catalog">
            <Button variant="outline" size="lg" className="gap-2 font-semibold">
              View All Products
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;

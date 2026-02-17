"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart, ShieldCheck, Package, ArrowLeft } from "lucide-react";
import { bundlesAPI, type Bundle } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function BundleDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadBundle();
  }, [id]);

  const loadBundle = async () => {
    try {
      setLoading(true);
      const data = await bundlesAPI.getById(id);
      setBundle(data);
    } catch (error) {
      console.error("Failed to load bundle:", error);
      router.push("/catalog");
    } finally {
      setLoading(false);
    }
  };

  const getFullImageUrl = (url: string): string => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/")) return `http://localhost:3001${url}`;
    return url;
  };

  const handleAddBundle = async () => {
    if (!bundle) return;
    for (let i = 0; i < quantity; i++) {
      for (const bp of bundle.products) {
        if (bp.product) {
          await addItem(bp.productId, bp.quantity);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading bundle...</p>
        </div>
      </div>
    );
  }

  if (!bundle) return null;

  return (
    <>
      {/* Breadcrumb */}
      <div className="container pt-6 pb-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link href="/catalog">All Peptides</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>{bundle.name}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="container mt-2">
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1.5 -ml-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />Back
        </Button>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Images */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-surface rounded-xl border border-border overflow-hidden flex items-center justify-center p-8">
              {bundle.image ? (
                <img
                  src={getFullImageUrl(bundle.image)}
                  alt={bundle.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex gap-4 flex-wrap justify-center">
                  {bundle.products.slice(0, 3).map((bp) => (
                    bp.product?.images?.[0] && (
                      <img
                        key={bp.id}
                        src={getFullImageUrl(bp.product.images[0])}
                        alt={bp.product.name}
                        className="h-48 w-auto object-contain"
                      />
                    )
                  ))}
                </div>
              )}
              <div className="absolute top-4 right-4 bg-primary text-white text-sm font-bold px-3 py-1.5 rounded-lg">
                Save {Number(bundle.discount)}%
              </div>
            </div>
          </div>

          {/* Right: Info */}
          <div>
            <Badge className="bg-primary/10 text-primary border-0 mb-3">{Number(bundle.discount)}% OFF</Badge>
            <h1 className="text-3xl md:text-4xl font-extrabold text-deep-blue tracking-tight mb-3">
              {bundle.name}
            </h1>
            {bundle.description && (
              <p className="text-muted-foreground mb-6 leading-relaxed">{bundle.description}</p>
            )}

            {/* Pricing */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-primary">${Number(bundle.finalPrice).toFixed(2)}</span>
              <span className="text-xl text-muted-foreground line-through">${Number(bundle.originalPrice).toFixed(2)}</span>
              <span className="text-sm font-semibold text-green-600">
                Save ${(Number(bundle.originalPrice) - Number(bundle.finalPrice)).toFixed(2)}
              </span>
            </div>

            {/* Products in Bundle */}
            <div className="mb-6 p-4 rounded-lg border border-border bg-surface">
              <p className="text-sm font-semibold text-foreground mb-3">This bundle includes:</p>
              <div className="space-y-2">
                {bundle.products.map((bp) => (
                  bp.product && (
                    <div key={bp.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" />
                        <span className="text-sm text-foreground">{bp.product.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">×{bp.quantity}</Badge>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-medium text-foreground">Quantity:</span>
              <div className="flex items-center border border-border rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-10 w-10 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center text-sm font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-10 w-10 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Add to Cart */}
            <Button size="lg" className="w-full gap-2 text-base font-semibold mb-4" onClick={handleAddBundle}>
              <ShoppingCart className="h-5 w-5" />
              Add Bundle to Cart — ${(Number(bundle.finalPrice) * quantity).toFixed(2)}
            </Button>

            {/* Trust Badges */}
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              <div className="flex items-start gap-2">
                <ShieldCheck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">99%+ HPLC Purity Guaranteed</p>
                  <p className="text-xs text-muted-foreground">Every product third-party tested</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Package className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Same-Day Shipping</p>
                  <p className="text-xs text-muted-foreground">Orders placed before 2 PM ship today</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-12">
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Bundle Details</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-6">
              <div className="prose prose-sm max-w-none">
                <h3 className="text-lg font-bold text-foreground mb-3">About This Bundle</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {bundle.description || "This carefully curated bundle includes high-purity research peptides designed for laboratory use. Each product has been independently tested and verified for quality."}
                </p>
                <div className="mt-6 p-4 rounded-lg bg-surface border border-border">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Research Use Only:</strong> All products in this bundle are intended strictly for laboratory research purposes only. They are not drugs, food, cosmetics, or dietary supplements and are not intended for human or veterinary use.
                  </p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="products" className="mt-6">
              <div className="space-y-4">
                {bundle.products.map((bp) => (
                  bp.product && (
                    <div key={bp.id} className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card">
                      {bp.product.images?.[0] && (
                        <img
                          src={getFullImageUrl(bp.product.images[0])}
                          alt={bp.product.name}
                          className="h-20 w-20 object-contain rounded-md bg-surface"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground mb-1">{bp.product.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{bp.product.description}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">Quantity: {bp.quantity}</Badge>
                          <Badge variant="outline" className="text-xs">${Number(bp.product.price).toFixed(2)} each</Badge>
                        </div>
                      </div>
                      <Link href={`/product/${bp.product.id}`}>
                        <Button variant="outline" size="sm">View Product</Button>
                      </Link>
                    </div>
                  )
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}

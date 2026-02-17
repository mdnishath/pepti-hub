"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  Minus,
  Plus,
  ShoppingCart,
  Info,
  FileText,
  ShieldCheck,
  ArrowLeft,
  Package,
  FlaskConical,
} from "lucide-react";
import { productsAPI, type Product } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getFullImageUrl } from "@/lib/utils";

export default function ProductDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const data = await productsAPI.getById(id);
        setProduct(data);
      } catch (error) {
        console.error("Failed to load product:", error);
        router.push("/catalog");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProduct();
    }
  }, [id, router]);

  if (loading) {
    return (
      <div className="container py-20">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-xl"></div>
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const allImages =
    product.images && product.images.length > 0
      ? product.images.map((img) => getFullImageUrl(img))
      : product.thumbnail
        ? [getFullImageUrl(product.thumbnail)]
        : [];
  const hasMultipleImages = allImages.length > 1;
  const mainImage = allImages[selectedImageIndex] || "/images/placeholder.png";

  const handleAddToCart = async () => {
    await addItem(product.id, quantity);
  };

  return (
    <>
      {/* Breadcrumb */}
      <div className="container pt-6 pb-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/catalog">All Peptides</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="container mt-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground gap-1.5 -ml-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Two-Column Layout */}
      <div className="container py-6 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Left — Image Gallery */}
          <div className="flex flex-col gap-3">
            <div className="bg-surface rounded-xl border border-border flex items-center justify-center p-8 md:p-12 min-h-[300px]">
              {mainImage && mainImage !== "/images/placeholder.png" ? (
                <img
                  src={mainImage}
                  alt={`${product.name}`}
                  className="max-h-[420px] w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget.nextElementSibling;
                    if (fallback)
                      (fallback as HTMLElement).style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className="w-full h-full min-h-[300px] flex flex-col items-center justify-center text-gray-400"
                style={{
                  display:
                    mainImage && mainImage !== "/images/placeholder.png"
                      ? "none"
                      : "flex",
                }}
              >
                <Package className="w-20 h-20 mb-2" />
                <p className="text-sm">No image available</p>
              </div>
            </div>
            {hasMultipleImages && (
              <div className="flex gap-2">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImageIndex(i)}
                    className={`w-16 h-16 md:w-20 md:h-20 rounded-lg border-2 overflow-hidden bg-surface flex items-center justify-center p-1.5 transition-all ${i === selectedImageIndex ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-muted-foreground/40"}`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} thumbnail ${i + 1}`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right — Info */}
          <div className="flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl md:text-3xl font-extrabold text-deep-blue tracking-tight">
                {product.name}
              </h1>
            </div>

            {/* Chemical Name */}
            {product.chemicalName && (
              <p className="text-sm text-muted-foreground mt-1">
                {product.chemicalName}
              </p>
            )}

            {/* CAS Number */}
            {product.casNumber && (
              <p className="text-sm text-muted-foreground mt-0.5">
                CAS # {product.casNumber}
              </p>
            )}

            {/* Badges: Purity + Research Use Only */}
            <div className="flex flex-wrap gap-2 mt-3">
              {product.purity && (
                <Badge
                  variant="secondary"
                  className="text-xs font-semibold bg-primary/10 text-primary border-0"
                >
                  {product.purity}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs font-semibold">
                Research Use Only
              </Badge>
            </div>

            {/* Short Description */}
            {product.shortDescription && (
              <p className="text-sm text-foreground/80 leading-relaxed mt-5">
                {product.shortDescription}
              </p>
            )}
            <div className="mt-6">
              <span className="text-3xl font-extrabold text-primary">
                ${Number(product.price).toFixed(2)}
              </span>
            </div>

            {product.stock > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {product.stock} units available
              </p>
            )}

            <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-surface border border-border">
              <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Products arrive in {product.productForm?.toLowerCase() || 'lyophilized (powder)'} form for maximum
                stability. Store at -20°C upon receipt.
              </p>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <div className="flex items-center border border-border rounded-md w-fit">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-r-none"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center text-sm font-semibold select-none">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-l-none"
                  onClick={() =>
                    setQuantity((q) => Math.min(product.stock, q + 1))
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                className="flex-1 font-semibold gap-2 h-10"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                {product.stock === 0 ? (
                  "Out of Stock"
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    Add to Cart — $
                    {(Number(product.price) * quantity).toFixed(2)}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="border-t border-border bg-surface">
        <div className="container py-8 md:py-12">
          <Tabs defaultValue="chemical" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
                            <TabsTrigger
                value="chemical"
                className="gap-1.5 px-2 sm:px-3 text-xs sm:text-sm"
              >
                <FlaskConical className="h-3.5 w-3.5 hidden sm:inline" />
                <span className="sm:hidden">Chemical</span>
                <span className="hidden sm:inline">Chemical Properties</span>
              </TabsTrigger>
              <TabsTrigger
                value="description"
                className="gap-1.5 flex-1 px-2 sm:px-3 text-xs sm:text-sm"
              >
                <FileText className="h-3.5 w-3.5 hidden sm:inline" />
                Description
              </TabsTrigger>
              <TabsTrigger
                value="notice"
                className="gap-1.5 flex-1 px-2 sm:px-3 text-xs sm:text-sm"
              >
                <ShieldCheck className="h-3.5 w-3.5 hidden sm:inline" />
                <span className="sm:hidden">Notice</span>
                <span className="hidden sm:inline">Research Notice</span>
              </TabsTrigger>
            </TabsList>
                        {/* Chemical Properties Tab */}
            <TabsContent value="chemical" className="mt-6">
              <div className="max-w-2xl grid grid-cols-2 gap-6">
                {product.molecularFormula && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                      Molecular Formula
                    </h4>
                    <p className="text-sm text-foreground">{product.molecularFormula}</p>
                  </div>
                )}

                {product.casNumber && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                      CAS Number
                    </h4>
                    <p className="text-sm text-foreground">{product.casNumber}</p>
                  </div>
                )}

                {product.purity && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                      Purity
                    </h4>
                    <p className="text-sm text-foreground">{product.purity}</p>
                  </div>
                )}

                {product.productForm && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                      Form
                    </h4>
                    <p className="text-sm text-foreground">{product.productForm}</p>
                  </div>
                )}

                {product.sequence && (
                  <div className="col-span-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                      Amino Acid Sequence
                    </h4>
                    <p className="text-sm text-foreground font-mono leading-relaxed break-all">
                      {product.sequence}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Description Tab */}
            <TabsContent value="description" className="mt-6">
              <div className="max-w-2xl">
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            </TabsContent>
            {/* Research Notice Tab */}
            <TabsContent value="notice" className="mt-6">
              <div className="max-w-2xl p-4 rounded-lg border border-border bg-background space-y-3">
                <h4 className="text-sm font-semibold text-deep-blue mb-2">
                  Research Use Only
                </h4>
                {product.researchNotice ? (
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {product.researchNotice}
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      All products supplied by PeptiHub are intended strictly for
                      laboratory research purposes only. They are not approved for
                      human or animal consumption, and must not be used for any
                      therapeutic, diagnostic, medicinal, or veterinary application.
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      None of the information provided on this website has been
                      evaluated or endorsed by the Therapeutic Goods Administration
                      (TGA) or any other regulatory authority. These materials are
                      not designed to diagnose, treat, cure, or prevent any disease
                      or medical condition.
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Purchases are restricted to qualified professionals,
                      laboratories, and research institutions. Buyers are solely
                      responsible for ensuring full compliance with all relevant
                      Australian and international laws and regulations regarding
                      the purchase, handling, storage, use, and disposal of research
                      chemicals.
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      By purchasing these products, you acknowledge and agree to these
                      terms and confirm you are using them solely for research purposes.
                    </p>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}

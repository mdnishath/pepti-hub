"use client";

import { type Product } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package } from "lucide-react";
import Link from "next/link";
import { getFullImageUrl } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem } = useCart();
  const imageUrl = getFullImageUrl(product.thumbnail || product.images?.[0]);

  return (
    <Link
      href={`/product/${product.id}`}
      className="group rounded-xl border border-border bg-card shadow-sm hover:shadow-lg transition-shadow flex flex-col overflow-hidden relative"
    >
      {/* Image */}
      <div className="bg-surface flex items-center justify-center p-1 sm:p-2 min-h-[144px] sm:min-h-[288px] relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="h-36 sm:h-72 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const fallback = e.currentTarget.nextElementSibling;
              if (fallback) (fallback as HTMLElement).style.display = "flex";
            }}
          />
        ) : null}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-gray-400"
          style={{ display: imageUrl ? "none" : "flex" }}
        >
          <Package className="w-8 h-8 sm:w-16 sm:h-16 mb-1" />
          <p className="text-[8px] sm:text-xs">No image</p>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 px-1.5 pt-1 pb-1.5 sm:px-3 sm:pt-2 sm:pb-3 gap-0.5 sm:gap-0">
        <h3 className="text-[10px] sm:text-sm font-bold text-deep-blue leading-tight truncate">{product.name}</h3>
        {product.chemicalName && (
          <p className="text-[7px] sm:text-[10px] text-muted-foreground truncate">{product.chemicalName}</p>
        )}
        {product.casNumber && (
          <p className="text-[6px] sm:text-[9px] text-muted-foreground">CAS # {product.casNumber}</p>
        )}

        <div className="flex gap-0.5 sm:gap-1 mt-1">
          {product.purity && (
            <Badge variant="secondary" className="text-[6px] sm:text-[8px] font-semibold bg-primary/10 text-primary border-0 px-0.5 sm:px-1 py-0 h-3 sm:h-4 rounded-sm sm:rounded-full">
              {product.purity}
            </Badge>
          )}
          <Badge variant="outline" className="text-[6px] sm:text-[8px] font-semibold px-0.5 sm:px-1 py-0 h-3 sm:h-4 rounded-sm sm:rounded-full hidden xs:inline-flex sm:inline-flex">
            Research Use Only
          </Badge>
        </div>

        <div className="mt-auto pt-1 sm:pt-2">
          <Button
            className="w-full font-semibold gap-1 sm:gap-1.5 h-6 sm:h-8 text-[9px] sm:text-xs px-1.5 sm:px-3"
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              await addItem(product.id, 1);
            }}
            disabled={product.stock === 0}
          >
            <ShoppingCart className="h-2.5 sm:h-3.5 w-2.5 sm:w-3.5 shrink-0" />
            <span className="truncate">
              {product.stock === 0 ? "Out of Stock" : `Add — $${Number(product.price).toFixed(2)}`}
            </span>
          </Button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;

"use client";

import Link from "next/link";
import { Bundle } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

interface BundleCardProps {
  bundle: Bundle;
}

const BundleCard = ({ bundle }: BundleCardProps) => {
  const { addItem } = useCart();

  const getFullImageUrl = (url: string): string => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/")) return `http://localhost:3001${url}`;
    return url;
  };

  const addBundle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    for (const bundleProduct of bundle.products) {
      if (bundleProduct.product) {
        await addItem(bundleProduct.productId, bundleProduct.quantity);
      }
    }
  };

  return (
    <Link href={`/bundle/${bundle.id}`} className="block h-full">
      <div className="group rounded-xl border border-border bg-card shadow-sm hover:shadow-lg transition-shadow flex flex-col overflow-hidden relative h-full">
        {/* Save Badge */}
        <div className="absolute top-3 right-3 bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-lg z-10">
          Save {Number(bundle.discount)}%
        </div>

        {/* Images */}
        <div className="bg-surface flex items-center justify-center gap-2 p-2 h-72 overflow-hidden">
          {bundle.image ? (
            <img
              src={getFullImageUrl(bundle.image)}
              alt={bundle.name}
              className="h-full w-auto object-contain group-hover:scale-105 transition-transform duration-300"
            />
          ) : bundle.products.slice(0, 3).map((bp) => (
            bp.product?.images?.[0] && (
              <img
                key={bp.id}
                src={getFullImageUrl(bp.product.images[0])}
                alt={bp.product.name}
                className="h-full w-auto object-contain group-hover:scale-105 transition-transform duration-300 max-w-[30%]"
              />
            )
          ))}
        </div>

        {/* Info */}
        <div className="flex flex-col flex-1 px-3 pt-2 pb-3">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-bold text-deep-blue leading-tight">{bundle.name}</h3>
            <Badge className="text-[8px] font-semibold bg-primary/10 text-primary border-0 px-1 py-0 h-4">
              {Number(bundle.discount)}% OFF
            </Badge>
          </div>
          {bundle.description && (
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{bundle.description}</p>
          )}

          <div className="flex gap-1 mt-1.5 flex-wrap">
            {bundle.products.map((bp) => (
              bp.product && (
                <Badge key={bp.id} variant="outline" className="text-[8px] font-semibold px-1 py-0 h-4">
                  {bp.quantity}x {bp.product.name}
                </Badge>
              )
            ))}
          </div>

          <div className="mt-auto pt-2">
            <Button
              className="w-full font-semibold gap-1.5 h-8 text-xs"
              onClick={addBundle}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Add Bundle — ${Number(bundle.finalPrice).toFixed(2)}{" "}
              <span className="line-through text-primary-foreground/60 text-[10px]">
                ${Number(bundle.originalPrice).toFixed(2)}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default BundleCard;

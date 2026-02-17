"use client";

import { useState, useMemo, useEffect } from "react";
import ProductCard from "@/components/ProductCard";
import BundleCard from "@/components/BundleCard";
import { productsAPI, bundlesAPI, categoriesAPI, type Product, type Bundle, type Category } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, Sparkles, Package } from "lucide-react";

type SortKey = "name-asc" | "name-desc" | "price-asc" | "price-desc";

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("name-asc");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, bundlesData, categoriesData] = await Promise.all([
        productsAPI.getAll(),
        bundlesAPI.getAll(true),
        categoriesAPI.getAll(),
      ]);
      setProducts(Array.isArray(productsData) ? productsData.filter(p => p.isActive) : []);
      setBundles(Array.isArray(bundlesData) ? bundlesData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData.filter(c => c.isActive) : []);
    } catch (error) {
      console.error("Failed to load catalog data:", error);
      setProducts([]);
      setBundles([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = [...products];
    if (activeCategory !== "all") {
      list = list.filter((p) => p.categoryId === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q)
      );
    }
    switch (sort) {
      case "name-asc": list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "name-desc": list.sort((a, b) => b.name.localeCompare(a.name)); break;
      case "price-asc": list.sort((a, b) => Number(a.price) - Number(b.price)); break;
      case "price-desc": list.sort((a, b) => Number(b.price) - Number(a.price)); break;
    }
    return list;
  }, [products, search, activeCategory, sort]);

  const scrollToBundles = () => {
    const el = document.getElementById("bundles-section");
    if (el) {
      const header = document.querySelector("header");
      const headerHeight = header?.getBoundingClientRect().height ?? 0;
      const top = el.getBoundingClientRect().top + window.scrollY - headerHeight;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <>
      <div className="bg-surface border-b border-border">
        <div className="container py-5 sm:py-8 md:py-11">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-deep-blue tracking-tight">
            All Peptides
          </h1>
          <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-xl">
            Browse our full catalog of high-purity research peptides. Every product is third-party tested with 99%+ HPLC purity guaranteed.
          </p>
        </div>
      </div>

      <div className="container py-3 sm:py-6">
        <div className="relative max-w-sm mb-3 sm:mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search peptides..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 sm:h-10 text-sm"
          />
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
          <Button variant={activeCategory === "all" ? "default" : "outline"} size="sm" onClick={() => setActiveCategory("all")} className="h-7 sm:h-9 px-2.5 sm:px-3 text-[11px] sm:text-sm flex-shrink-0">All</Button>
          <Button variant="outline" size="sm" onClick={scrollToBundles} className="h-7 sm:h-9 px-2 sm:px-3 text-[11px] sm:text-sm gap-1 sm:gap-1.5 flex-shrink-0">
            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />Bundles
          </Button>
          {categories.map((c) => (
            <Button key={c.id} variant={activeCategory === c.id ? "default" : "outline"} size="sm" onClick={() => setActiveCategory(c.id)} className="h-7 sm:h-9 px-2.5 sm:px-3 text-[11px] sm:text-sm flex-shrink-0 whitespace-nowrap">{c.name}</Button>
          ))}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-auto">
            <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-[110px] sm:w-[160px] h-7 sm:h-9 text-[11px] sm:text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name A–Z</SelectItem>
                <SelectItem value="name-desc">Name Z–A</SelectItem>
                <SelectItem value="price-asc">Price Low–High</SelectItem>
                <SelectItem value="price-desc">Price High–Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="container pb-10">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-sm text-muted-foreground">Loading products...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">No peptides found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {filtered.map((p) => (<ProductCard key={p.id} product={p} />))}
          </div>
        )}
      </div>

      {bundles.length > 0 && (
        <div id="bundles-section" className="bg-surface border-t border-border">
          <div className="container py-10 md:py-14">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="h-6 w-6 text-primary" />
              <h2 className="text-xl md:text-2xl font-extrabold text-deep-blue tracking-tight">Bundle &amp; Save</h2>
            </div>
            <p className="text-sm text-muted-foreground max-w-xl mb-8">Save up to {Math.max(...bundles.map(b => Number(b.discount)))}% when you purchase curated peptide stacks. Every bundle ships with the same 99%+ HPLC purity guarantee.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {bundles.map((bundle) => (<BundleCard key={bundle.id} bundle={bundle} />))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { bundlesAPI, type Bundle } from "@/lib/api";
import BundleCard from "@/components/BundleCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

const BundlesSection = () => {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBundles();
  }, []);

  const loadBundles = async () => {
    try {
      const data = await bundlesAPI.getAll(true);
      // Get first 3 active bundles
      const activeBundles = data.slice(0, 3);
      setBundles(activeBundles);
    } catch (error) {
      console.error("Failed to load bundles:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="bg-background border-t border-border py-16 md:py-24">
        <div className="container">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="h-6 w-6 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold text-deep-blue">Bundle & Save</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-lg border border-border p-4 animate-pulse">
                <div className="aspect-video bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (bundles.length === 0) {
    return null; // Don't show section if no bundles
  }

  return (
    <section className="bg-surface border-t border-border py-16 md:py-24">
      <div className="container">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="h-6 w-6 text-primary" />
          <h2 className="text-3xl md:text-4xl font-bold text-deep-blue">Bundle & Save</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mb-8">
          Save up to {Math.max(...bundles.map(b => Number(b.discount)))}% when you purchase curated peptide stacks.
          Every bundle ships with the same 99%+ HPLC purity guarantee.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bundles.map((bundle) => (
            <BundleCard key={bundle.id} bundle={bundle} />
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/catalog#bundles-section">
            <Button variant="outline" size="lg" className="gap-2 font-semibold">
              View All Bundles
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BundlesSection;

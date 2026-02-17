"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ExternalLink, FlaskConical, Package, Headphones, EyeOff } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { qualityImagesAPI, type QualityImage } from "@/lib/api";

export default function Quality() {
  const [qualityImages, setQualityImages] = useState<QualityImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQualityImages();
  }, []);

  const loadQualityImages = async () => {
    try {
      setLoading(true);
      const data = await qualityImagesAPI.getAll(true);
      setQualityImages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load quality images:", error);
      setQualityImages([]);
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

  return (
    <>
      <div className="bg-surface border-b border-border">
        <div className="container py-10 md:py-14">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="h-7 w-7 text-primary" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-deep-blue tracking-tight">
              Quality & Certificates of Analysis
            </h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Every PeptiHub product is independently tested by accredited third-party laboratories. Below you will find the Certificates of Analysis (COAs) for our current inventory.
          </p>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Third-Party Tested", desc: "Independent lab verification on every batch" },
            { label: "99%+ HPLC Purity", desc: "Guaranteed minimum purity on all peptides" },
            { label: "Full Transparency", desc: "Every COA available for customer review" },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card">
              <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container pb-14">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-sm text-muted-foreground">Loading certificates...</p>
          </div>
        ) : qualityImages.length === 0 ? (
          <div className="text-center py-12">
            <FlaskConical className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No certificates of analysis available at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {qualityImages.map((image) => (
              <Dialog key={image.id}>
                <DialogTrigger asChild>
                  <button className="text-left group rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="bg-surface p-4 flex items-center justify-center h-64 overflow-hidden">
                      <img
                        src={getFullImageUrl(image.imageUrl)}
                        alt={image.title}
                        className="max-h-full w-auto object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4 border-t border-border">
                      <h3 className="text-sm font-bold text-deep-blue">{image.title}</h3>
                      {image.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{image.description}</p>
                      )}
                      <div className="flex items-center gap-1 mt-3 text-xs text-primary font-medium">
                        <ExternalLink className="h-3 w-3" />
                        View Full Report
                      </div>
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
                  <div className="p-6">
                    <DialogTitle className="sr-only">{image.title}</DialogTitle>
                    <h3 className="text-lg font-bold text-deep-blue mb-1">{image.title}</h3>
                    {image.description && (
                      <p className="text-xs text-muted-foreground mb-4">{image.description}</p>
                    )}
                    <img
                      src={getFullImageUrl(image.imageUrl)}
                      alt={image.title}
                      className="w-full h-auto rounded-lg border border-border"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        )}
      </div>

      <div className="bg-surface border-t border-border">
        <div className="container py-14">
          <h2 className="text-2xl md:text-3xl font-extrabold text-deep-blue tracking-tight mb-4">Who We Are</h2>
          <p className="text-sm text-muted-foreground max-w-3xl mb-8 leading-relaxed">
            PeptiHub is a supplier of research-grade peptides, committed to product integrity, transparency, and full regulatory compliance. We provide independently tested compounds exclusively for laboratory and scientific research purposes.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { num: "01", title: "Research-Only Purpose", desc: "All products are supplied strictly for laboratory research use only. They are not intended for human or veterinary use." },
              { num: "02", title: "Integrity & Transparency", desc: "Clear product information, straightforward policies, publicly available COAs, and responsive customer support." },
              { num: "03", title: "Discreet & Reliable Delivery", desc: "Every order is carefully packaged in plain, unbranded packaging and shipped with full tracking." },
            ].map((item) => (
              <div key={item.num} className="p-5 rounded-lg border border-border bg-card">
                <span className="text-xs font-bold text-primary">{item.num}</span>
                <h3 className="text-sm font-bold text-foreground mt-2">{item.title}</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container py-14">
        <h2 className="text-2xl md:text-3xl font-extrabold text-deep-blue tracking-tight mb-4">How We Work</h2>
        <p className="text-sm text-muted-foreground max-w-3xl mb-8 leading-relaxed">
          Orders placed on business days are typically processed and shipped the same day via express postage. We prioritize careful handling at every step to ensure your research materials arrive in optimal condition.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: Package, title: "Quality & Handling", desc: "Products are stored under recommended conditions and handled with care from picking through packing to ensure integrity on arrival." },
            { icon: Headphones, title: "Support", desc: "Our team is available to assist with order inquiries, documentation requests, and general product questions via email." },
            { icon: EyeOff, title: "Discretion", desc: "All orders ship in plain, unbranded packaging. We maintain privacy-first communication and never share customer information." },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3 p-5 rounded-lg border border-border bg-card">
              <item.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-3xl p-5 rounded-lg border-l-4 border-primary bg-surface mb-8">
          <p className="text-sm text-muted-foreground leading-relaxed italic">
            "We believe that access to high-quality research compounds should be straightforward and trustworthy. Every decision we make — from sourcing to shipping — is guided by a commitment to transparency, compliance, and the needs of the research community."
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/catalog" className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-medium h-10 px-6 hover:bg-primary/90 transition-colors">
            Browse Catalog
          </Link>
          <Link href="/contact" className="inline-flex items-center justify-center rounded-md border border-input bg-background text-sm font-medium h-10 px-6 hover:bg-accent hover:text-accent-foreground transition-colors">
            Contact Us
          </Link>
        </div>
      </div>

      <div className="border-t border-border bg-surface">
        <div className="container py-8">
          <div className="max-w-2xl p-4 rounded-lg border border-border bg-background">
            <h4 className="text-sm font-semibold text-deep-blue mb-2">Research Use Only</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All products referenced in these Certificates of Analysis are intended for laboratory research use only. They are not drugs, food, cosmetics, or dietary supplements and are not intended for human or veterinary use.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

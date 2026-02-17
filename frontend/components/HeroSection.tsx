"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

const HeroSection = () => (
  <section className="bg-background">
    <div className="container py-16 md:py-24 flex flex-col-reverse md:flex-row items-center gap-10 md:gap-16">
      {/* Text */}
      <div className="flex-1 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-deep-blue leading-tight">
          Quality Research<br />Peptides.
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-lg mx-auto md:mx-0">
          High-purity, laboratory-tested peptides for scientific research. 99%+ HPLC purity guaranteed.
        </p>
        <Button size="lg" className="mt-8 text-base px-8 py-6 rounded-lg font-semibold" asChild>
          <Link href="/catalog">Explore Our Catalog</Link>
        </Button>

        {/* Research Disclaimer */}
        <div className="mt-6 max-w-lg mx-auto md:mx-0 border-t border-border pt-4">
          <div className="flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground/70">Research Use Only</span> — All products supplied by PeptiHub are intended strictly for laboratory research purposes only. They are not approved for human or animal consumption. None of the information on this website has been evaluated or endorsed by the Therapeutic Goods Administration (TGA) or any other regulatory authority. Purchases are restricted to qualified professionals, laboratories, and research institutions.
            </p>
          </div>
        </div>
      </div>

      {/* Image */}
      <div className="flex-1 flex justify-center">
        <img
          src="/images/product-vial.png"
          alt="Research peptide vial"
          className="w-64 md:w-80 lg:w-96 object-contain drop-shadow-2xl"
        />
      </div>
    </div>
  </section>
);

export default HeroSection;

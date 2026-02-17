"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const Footer = () => {
  const pathname = usePathname();
  const router = useRouter();

  const scrollToElement = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const header = document.querySelector("header");
      const headerHeight = header?.getBoundingClientRect().height ?? 0;
      const top = el.getBoundingClientRect().top + window.scrollY - headerHeight;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const handleBundleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (pathname === "/catalog") {
      scrollToElement("bundles-section");
    } else {
      router.push("/catalog");
      setTimeout(() => scrollToElement("bundles-section"), 150);
    }
  };

  return (
    <footer id="footer" className="bg-deep-blue text-deep-blue-foreground">
      {/* Newsletter */}
      <div className="container py-10 border-b border-deep-blue-foreground/10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Be the first to know</h3>
            <p className="text-sm text-deep-blue-foreground/70">Get updates on new products, promotions, and research.</p>
          </div>
          <div className="flex w-full md:w-auto gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              className="bg-deep-blue-foreground/10 border-deep-blue-foreground/20 text-deep-blue-foreground placeholder:text-deep-blue-foreground/40 w-full md:w-64"
            />
            <Button className="shrink-0 font-semibold">Subscribe</Button>
          </div>
        </div>
      </div>

      {/* Columns */}
      <div className="container py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* About */}
        <div>
          <img src="/images/peptihub-logo.png" alt="PeptiHub" className="h-44 -ml-8 -mt-10 -mb-6 brightness-0 invert" />
          <p className="text-sm text-deep-blue-foreground/70 leading-relaxed">
            Committed to supporting research customers with the highest quality peptides, rigorous testing, and reliable service.
          </p>
        </div>

        {/* Information */}
        <div>
          <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Information</h4>
          <ul className="space-y-2 text-sm text-deep-blue-foreground/70">
            <li><Link href="/catalog" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="hover:text-primary transition-colors">All Peptides</Link></li>
            <li><a href="#" onClick={handleBundleClick} className="hover:text-primary transition-colors">Bundle & Save</a></li>
            <li><Link href="/quality" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="hover:text-primary transition-colors">Quality & COAs</Link></li>
            <li><Link href="/contact" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="hover:text-primary transition-colors">Contact Us</Link></li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h4>
          <ul className="space-y-2 text-sm text-deep-blue-foreground/70">
            <li><Link href="/privacy" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="hover:text-primary transition-colors">Terms of Service</Link></li>
            <li><Link href="/shipping" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="hover:text-primary transition-colors">Shipping & Returns</Link></li>
          </ul>
        </div>

         {/* Contact */}
         <div>
           <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Contact</h4>
           <ul className="space-y-2 text-sm text-deep-blue-foreground/70">
             <li>service@peptihub.com</li>
             <li>Mon – Fri, 9AM – 5PM EST</li>
             <li>123 Research Blvd, Suite 100<br />Science Park, FL 33101</li>
           </ul>
         </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-deep-blue-foreground/10">
        <div className="container py-6 text-center text-xs text-deep-blue-foreground/50 space-y-2">
          <p>© 2026 PeptiHub. All rights reserved.</p>
          <p>
            For Research Use Only. Not for human or veterinary use. Products are strictly not to be used for diagnostic, therapeutic, or clinical use.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

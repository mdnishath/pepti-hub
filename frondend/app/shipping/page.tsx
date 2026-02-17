import { Truck, RotateCcw, Package, Clock } from "lucide-react";

export default function Shipping() {
  return (
    <>
      <div className="bg-surface border-b border-border">
        <div className="container py-10 md:py-14">
          <h1 className="text-2xl md:text-3xl font-extrabold text-deep-blue tracking-tight">Shipping & Returns</h1>
          <p className="mt-1.5 text-xs text-muted-foreground">Last updated: February 12, 2026</p>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="container py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Truck, label: "Express Postage", desc: "Australia-wide on every order" },
            { icon: Package, label: "Secure Packaging", desc: "Temperature-controlled when needed" },
            { icon: Clock, label: "Processing Time", desc: "1–2 business days" },
            { icon: RotateCcw, label: "Returns", desc: "Faulty or incorrect items only" },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container pb-14 max-w-3xl">
        <div className="prose prose-sm text-foreground/80 space-y-8">
          {/* ── SHIPPING ── */}
          <section>
            <h2 className="text-lg font-bold text-deep-blue">Shipping Policy</h2>

            <h3 className="text-base font-semibold text-deep-blue mt-4">Domestic Shipping (Australia)</h3>
            <p className="text-sm leading-relaxed">
              We ship all orders using <strong>express postage Australia-wide</strong>. Orders are processed and dispatched within <strong>1–2 business days</strong> (Monday through Friday, excluding public holidays). Once shipped, you will receive a tracking number via email.
            </p>
            <ul className="text-sm leading-relaxed list-disc pl-5 space-y-1 mt-2">
              <li><strong>Express Postage:</strong> Estimated 1–3 business days Australia-wide</li>
              <li>Tracking is provided on all orders</li>
            </ul>

            <h3 className="text-base font-semibold text-deep-blue mt-4">International Shipping</h3>
            <p className="text-sm leading-relaxed">
              We currently do not offer international shipping. All orders are shipped within Australia only. Please contact us if you have any questions regarding shipping availability.
            </p>

            <h3 className="text-base font-semibold text-deep-blue mt-4">Packaging & Handling</h3>
            <p className="text-sm leading-relaxed">
              All peptides are shipped in secure, insulated packaging to maintain product integrity. During warmer months, cold packs are included at no additional charge. Products arrive in lyophilised (powder) form for maximum stability during transit.
            </p>

            <h3 className="text-base font-semibold text-deep-blue mt-4">Risk of Loss</h3>
            <p className="text-sm leading-relaxed">
              Risk of loss transfers to you once the parcel is handed to the carrier. We are not liable for delays caused by postal services, customs, or events beyond our control. If your order appears lost in transit, please contact us and we will do our best to assist with a resolution.
            </p>
          </section>

          {/* ── RETURNS & REFUNDS ── */}
          <section>
            <h2 className="text-lg font-bold text-deep-blue">Returns & Refund Policy</h2>

            <p className="text-sm leading-relaxed">
              We strive to deliver the highest quality research materials. However, due to the nature of our inventory, <strong>returns and refunds are limited</strong> to specific circumstances as outlined below.
            </p>

            <h3 className="text-base font-semibold text-deep-blue mt-4">1. No Returns for Change of Mind</h3>
            <p className="text-sm leading-relaxed">
              We do not accept returns or issue refunds for <strong>change of mind</strong>, <strong>incorrect ordering</strong>, or <strong>customer error</strong>. Please ensure you select products carefully and contact us with any questions before completing your purchase.
            </p>

            <h3 className="text-base font-semibold text-deep-blue mt-4">2. Faulty, Damaged, or Incorrect Items</h3>
            <p className="text-sm leading-relaxed">
              If your order arrives <strong>damaged</strong>, <strong>faulty</strong>, or <strong>incorrect</strong>, please contact us within <strong>7 business days</strong> of delivery. To qualify for a refund or replacement:
            </p>
            <ul className="text-sm leading-relaxed list-disc pl-5 space-y-1 mt-2">
              <li>The product must be <strong>unused</strong> and in its <strong>original packaging</strong></li>
              <li><strong>Proof of purchase</strong> must be provided</li>
              <li><strong>Clear photos</strong> of the issue must be submitted</li>
            </ul>

            <h3 className="text-base font-semibold text-deep-blue mt-4">3. Return Process</h3>
            <p className="text-sm leading-relaxed">
              To initiate a return, please email <a href="mailto:service@peptihub.com" className="text-primary hover:underline font-medium">service@peptihub.com</a> with:
            </p>
            <ul className="text-sm leading-relaxed list-disc pl-5 space-y-1 mt-2">
              <li>Your <strong>order number</strong></li>
              <li>A brief description of the issue</li>
              <li>Supporting <strong>photos or documentation</strong></li>
            </ul>
            <p className="text-sm leading-relaxed mt-2">
              We'll confirm whether a return is required and provide specific return shipping instructions.
            </p>

            <h3 className="text-base font-semibold text-deep-blue mt-4">4. Refund Approval</h3>
            <p className="text-sm leading-relaxed">
              If a refund is approved, it will be processed to your <strong>original payment method</strong> within <strong>5–10 business days</strong>. Return shipping costs are the customer's responsibility unless the product was incorrect or faulty due to our error.
            </p>

            <h3 className="text-base font-semibold text-deep-blue mt-4">5. Non-Refundable Items</h3>
            <p className="text-sm leading-relaxed">We cannot accept returns or issue refunds for:</p>
            <ul className="text-sm leading-relaxed list-disc pl-5 space-y-1 mt-2">
              <li>Products that have been <strong>opened</strong>, <strong>used</strong>, or <strong>tampered with</strong></li>
              <li>Products that were <strong>improperly stored</strong> after delivery</li>
              <li>Items returned <strong>without prior authorisation</strong></li>
            </ul>
            <p className="text-sm leading-relaxed mt-2">
              We reserve the right to decline a refund if the returned product does not meet these conditions.
            </p>

            <h3 className="text-base font-semibold text-deep-blue mt-4">6. Research Use Notice</h3>
            <div className="mt-2 p-3 rounded-lg bg-surface border border-border">
              <p className="text-xs font-semibold text-deep-blue mb-1">⚠️ Important</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Due to the experimental and research-only nature of our products, we <strong>do not</strong> offer satisfaction-based guarantees. All products are sold <strong>strictly for laboratory research and development use only</strong>. They are not for human or animal consumption and are not intended for therapeutic or diagnostic use.
              </p>
            </div>
          </section>

          {/* ── CONTACT ── */}
          <section>
            <h2 className="text-lg font-bold text-deep-blue">Contact</h2>
            <p className="text-sm leading-relaxed">
              For shipping or return questions, please contact us at{" "}
              <a href="mailto:service@peptihub.com" className="text-primary hover:underline font-medium">service@peptihub.com</a>.
              We're available Monday–Friday, 9:00 AM – 5:00 PM AEST.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MapPin, Clock, Send } from "lucide-react";
import { toast } from "sonner";
import { contactAPI } from "@/lib/api";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      await contactAPI.create(form);
      toast.success("Message sent successfully! We'll get back to you within 24 hours.");
      setForm({ name: "", email: "", message: "" });
    } catch (error: any) {
      console.error("Failed to send message:", error);

      // Handle validation errors
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        // Show first validation error
        toast.error(error.response.data.errors[0]);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to send message. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-surface border-b border-border">
        <div className="container py-10 md:py-14">
          <h1 className="text-2xl md:text-3xl font-extrabold text-deep-blue tracking-tight">Contact Us</h1>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-xl">Have a question about our products, an order, or need research support? We're here to help.</p>
        </div>
      </div>

      <div className="container py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 md:gap-14">
          <div className="lg:col-span-3">
            <h2 className="text-lg font-bold text-deep-blue mb-1">Send Us a Message</h2>
            <p className="text-xs text-muted-foreground mb-6">Fill out the form below and our team will respond within 24 business hours.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold">Name</Label>
                  <Input id="name" placeholder="Your full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-xs font-semibold">Message</Label>
                <Textarea id="message" placeholder="How can we help you?" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
              </div>
              <Button type="submit" className="font-semibold gap-2" disabled={isSubmitting}>
                <Send className="h-4 w-4" />
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
          <div className="lg:col-span-2">
            <h2 className="text-lg font-bold text-deep-blue mb-4">Get in Touch</h2>
            <div className="space-y-5">
              {[
               { icon: Mail, label: "Email", value: "service@peptihub.com", href: "mailto:service@peptihub.com" },
                { icon: Clock, label: "Hours", value: "Mon – Fri, 9AM – 5PM EST" },
                { icon: MapPin, label: "Address", value: "123 Research Blvd, Suite 100\nScience Park, FL 33101" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="text-sm text-foreground hover:text-primary transition-colors whitespace-pre-line">{item.value}</a>
                    ) : (
                      <p className="text-sm text-foreground whitespace-pre-line">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 p-4 rounded-lg border border-border bg-surface">
              <h3 className="text-sm font-semibold text-deep-blue mb-1">Frequently Asked Questions</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">Looking for order tracking, shipping info, or product specifications? Check our policies pages or browse our catalog for detailed product information.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

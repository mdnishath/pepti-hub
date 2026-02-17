"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useTenantStore } from "@/store/useTenantStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Store, Mail, CreditCard, Save, AlertCircle } from "lucide-react";
import { tenantsAPI, Tenant } from "@/lib/api";

const PASSWORD_PLACEHOLDER = "••••••••";

export default function SettingsPage() {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingTenant, setLoadingTenant] = useState(true);

  // Tenant data
  const [tenant, setTenant] = useState<Tenant | null>(null);

  // General tab - Form states
  const [storeName, setStoreName] = useState("");
  const [storeEmail, setStoreEmail] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [currency, setCurrency] = useState("BDT");
  const [taxRate, setTaxRate] = useState("0");

  // Email tab - SMTP config states
  const [emailFrom, setEmailFrom] = useState("");
  const [contactNotificationEmail, setContactNotificationEmail] = useState("");
  const [orderNotificationEmail, setOrderNotificationEmail] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [hasExistingPassword, setHasExistingPassword] = useState(false);

  // Payment tab - Gateway states
  const [stripeKey, setStripeKey] = useState("");
  const [sslcommerzKey, setSslcommerzKey] = useState("");

  // Load tenant data
  const loadTenantData = async () => {
    try {
      setLoadingTenant(true);
      // First get tenant ID by slug (public endpoint - returns limited data)
      const tenantSlug = "pepti-hub";
      const publicTenantData = await tenantsAPI.getBySlug(tenantSlug);

      // Then fetch full tenant data including sensitive config using ID (requires admin auth)
      const tenantData = await tenantsAPI.findOne(publicTenantData.id);
      setTenant(tenantData);

      // Populate form fields from tenant data
      setStoreName(tenantData.name);
      setStoreEmail(tenantData.email);
      setStorePhone(tenantData.phone || "");
      setStoreAddress(tenantData.address || "");
      setCurrency(tenantData.currency);
      setTaxRate(tenantData.taxRate.toString());

      // Populate email fields
      setEmailFrom(tenantData.emailFrom || "");
      setContactNotificationEmail(tenantData.contactNotificationEmail || "");
      setOrderNotificationEmail(tenantData.orderNotificationEmail || "");
      if (tenantData.smtpConfig) {
        setSmtpHost(tenantData.smtpConfig.host || "");
        setSmtpPort(tenantData.smtpConfig.port?.toString() || "");
        setSmtpUser(tenantData.smtpConfig.user || "");
        // Use placeholder to indicate password exists (don't show actual password)
        if (tenantData.smtpConfig.password) {
          setSmtpPassword(PASSWORD_PLACEHOLDER);
          setHasExistingPassword(true);
        } else {
          setSmtpPassword("");
          setHasExistingPassword(false);
        }
      }

      // Populate payment fields - show placeholder if keys exist
      setStripeKey(tenantData.stripeKey ? "********" : "");
      setSslcommerzKey(tenantData.sslcommerzKey ? "********" : "");
    } catch (err: any) {
      // Silently handle 403 errors - tenant endpoint may require admin access
      if (err.response?.status === 403) {
        console.log('Settings: Tenant endpoint requires admin access - using defaults');
        // Set default tenant data for basic operation
        const defaultTenant: Tenant = {
          id: 'default',
          name: 'Pepti Hub',
          slug: 'pepti-hub',
          domain: null,
          logo: null,
          favicon: null,
          primaryColor: null,
          email: 'info@peptihub.com',
          phone: null,
          address: null,
          currency: 'USD',
          taxRate: 0.1,
          stripeKey: null,
          sslcommerzKey: null,
          emailFrom: null,
          contactNotificationEmail: 'info@peptihub.com',
          orderNotificationEmail: 'orders@peptihub.com',
          smtpConfig: null,
          isActive: true,
          plan: 'BASIC',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setTenant(defaultTenant);
        setStoreName(defaultTenant.name);
        setStoreEmail(defaultTenant.email);
        setStorePhone(defaultTenant.phone || "");
        setStoreAddress(defaultTenant.address || "");
        setCurrency(defaultTenant.currency);
        setTaxRate(defaultTenant.taxRate.toString());
      } else {
        console.error("Failed to load tenant data:", err);
        toast.error(err.response?.data?.message || "Failed to load tenant settings");
      }
    } finally {
      setLoadingTenant(false);
    }
  };

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (user && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      router.push("/account/dashboard");
      return;
    }
    setLoading(false);
    // Load tenant data after auth check
    loadTenantData();
  }, [isAuthenticated, _hasHydrated, router, user]);

  if (!_hasHydrated || loading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return null;
  }

  // Handle General tab save
  const handleSaveGeneral = async () => {
    if (!tenant) return;

    try {
      setSaving(true);

      const updatedTenant = await tenantsAPI.update(tenant.id, {
        name: storeName,
        email: storeEmail,
        phone: storePhone || null,
        address: storeAddress || null,
        currency: currency,
        taxRate: parseFloat(taxRate),
      });

      toast.success("General settings saved successfully!");

      // Update the global tenant store immediately
      useTenantStore.getState().setTenant(updatedTenant);

      // Reload tenant data to get updated values
      await loadTenantData();
    } catch (err: any) {
      console.error("Failed to save general settings:", err);
      toast.error(err.response?.data?.message || "Failed to save general settings");
    } finally {
      setSaving(false);
    }
  };

  // Handle Email tab save
  const handleSaveEmail = async () => {
    if (!tenant) return;

    try {
      setSaving(true);

      // Build SMTP config
      // If password is the placeholder and we have an existing password, use existing one
      let passwordToSave = smtpPassword;

      if (smtpPassword === PASSWORD_PLACEHOLDER && hasExistingPassword) {
        // Password hasn't been changed, use existing one from tenant
        passwordToSave = tenant.smtpConfig?.password || "";
      }

      const smtpConfig = {
        host: smtpHost,
        port: parseInt(smtpPort),
        user: smtpUser,
        password: passwordToSave,
      };

      await tenantsAPI.update(tenant.id, {
        emailFrom: emailFrom || null,
        contactNotificationEmail: contactNotificationEmail || null,
        orderNotificationEmail: orderNotificationEmail || null,
        smtpConfig: smtpHost && smtpPort && smtpUser && passwordToSave ? smtpConfig : null,
      });

      toast.success("Email settings saved successfully!");
      // Reload tenant data
      await loadTenantData();
    } catch (err: any) {
      console.error("Failed to save email settings:", err);
      toast.error(err.response?.data?.message || "Failed to save email settings");
    } finally {
      setSaving(false);
    }
  };

  // Handle Payment tab save
  const handleSavePayment = async () => {
    if (!tenant) return;

    try {
      setSaving(true);

      const updateData: any = {};

      // Only update keys if they're not placeholder values
      if (stripeKey && stripeKey !== "********") {
        updateData.stripeKey = stripeKey;
      }
      if (sslcommerzKey && sslcommerzKey !== "********") {
        updateData.sslcommerzKey = sslcommerzKey;
      }

      await tenantsAPI.update(tenant.id, updateData);

      toast.success("Payment settings saved successfully!");
      // Reload tenant data
      await loadTenantData();
    } catch (err: any) {
      console.error("Failed to save payment settings:", err);
      toast.error(err.response?.data?.message || "Failed to save payment settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-100">Settings</h1>
        <p className="text-gray-400 mt-1">Manage your store configuration and preferences</p>
      </div>

      {loadingTenant ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent"></div>
            <p className="mt-4 text-sm text-gray-400">Loading settings...</p>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="general" className="data-[state=active]:bg-brand-600 data-[state=active]:text-white text-gray-400">
              <Store className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="email" className="data-[state=active]:bg-brand-600 data-[state=active]:text-white text-gray-400">
              <Mail className="w-4 h-4 mr-2" />
              Email
            </TabsTrigger>
            <TabsTrigger value="payment" className="data-[state=active]:bg-brand-600 data-[state=active]:text-white text-gray-400">
              <CreditCard className="w-4 h-4 mr-2" />
              Payment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="bg-dark-bg-card border-white/5">
              <CardHeader>
                <CardTitle className="text-gray-100">Store Information</CardTitle>
                <CardDescription className="text-gray-400">Update your store details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="storeName" className="text-gray-300">Store Name</Label>
                    <Input
                      id="storeName"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-brand-500 focus-visible:ring-offset-0 focus-visible:border-brand-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeEmail" className="text-gray-300">Store Email</Label>
                    <Input
                      id="storeEmail"
                      type="email"
                      value={storeEmail}
                      onChange={(e) => setStoreEmail(e.target.value)}
                      className="bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-brand-500 focus-visible:ring-offset-0 focus-visible:border-brand-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storePhone" className="text-gray-300">Phone Number</Label>
                    <Input
                      id="storePhone"
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                      className="bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-brand-500 focus-visible:ring-offset-0 focus-visible:border-brand-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-gray-300">Currency</Label>
                    <Input
                      id="currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-brand-500 focus-visible:ring-offset-0 focus-visible:border-brand-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storeAddress" className="text-gray-300">Store Address</Label>
                  <Textarea
                    id="storeAddress"
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    rows={3}
                    className="bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-brand-500 focus-visible:ring-offset-0 focus-visible:border-brand-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxRate" className="text-gray-300">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="max-w-xs bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-brand-500 focus-visible:ring-offset-0 focus-visible:border-brand-500"
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveGeneral} disabled={saving} className="bg-brand-600 hover:bg-brand-700 text-white">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <Card className="bg-dark-bg-card border-white/5">
              <CardHeader>
                <CardTitle className="text-gray-100">Email Configuration</CardTitle>
                <CardDescription className="text-gray-400">Configure SMTP settings for sending emails</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="emailFrom" className="text-gray-300">Email From Address</Label>
                  <Input
                    id="emailFrom"
                    type="email"
                    value={emailFrom}
                    onChange={(e) => setEmailFrom(e.target.value)}
                    placeholder="noreply@yourstore.com"
                    className="bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-brand-500 focus-visible:ring-offset-0 focus-visible:border-brand-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="contactNotificationEmail" className="text-gray-300">Contact Notification Email</Label>
                    <Input
                      id="contactNotificationEmail"
                      type="email"
                      value={contactNotificationEmail}
                      onChange={(e) => setContactNotificationEmail(e.target.value)}
                      placeholder="contact@yourstore.com"
                      className="bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-brand-500 focus-visible:ring-offset-0 focus-visible:border-brand-500"
                    />
                    <p className="text-xs text-gray-500">
                      Email address to receive contact form notifications
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orderNotificationEmail" className="text-gray-300">Order Notification Email</Label>
                    <Input
                      id="orderNotificationEmail"
                      type="email"
                      value={orderNotificationEmail}
                      onChange={(e) => setOrderNotificationEmail(e.target.value)}
                      placeholder="orders@yourstore.com"
                      className="bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-brand-500 focus-visible:ring-offset-0 focus-visible:border-brand-500"
                    />
                    <p className="text-xs text-gray-500">
                      Email address to receive order notifications
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost" className="text-gray-300">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="smtp.gmail.com"
                      className="bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-brand-500 focus-visible:ring-offset-0 focus-visible:border-brand-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort" className="text-gray-300">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      placeholder="587"
                      className="bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-brand-500 focus-visible:ring-offset-0 focus-visible:border-brand-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpUser" className="text-gray-300">SMTP Username</Label>
                    <Input
                      id="smtpUser"
                      type="email"
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      className="bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-brand-500 focus-visible:ring-offset-0 focus-visible:border-brand-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPass" className="text-gray-300">SMTP Password</Label>
                    <Input
                      id="smtpPass"
                      type="password"
                      value={smtpPassword}
                      onChange={(e) => setSmtpPassword(e.target.value)}
                      placeholder={hasExistingPassword ? "Leave as ••••••••  to keep existing" : "Enter SMTP password"}
                      className="bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-brand-500 focus-visible:ring-offset-0 focus-visible:border-brand-500"
                    />
                    {hasExistingPassword && (
                      <p className="text-xs text-gray-500">
                        Password is saved. Leave as ••••••••  to keep existing, or enter new password to update.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveEmail} disabled={saving} className="bg-brand-600 hover:bg-brand-700 text-white">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment">
            <Card className="bg-dark-bg-card border-white/5">
              <CardHeader>
                <CardTitle className="text-gray-100">Payment Gateways</CardTitle>
                <CardDescription className="text-gray-400">Configure payment processing settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 border border-white/10 rounded-lg bg-white/5">
                    <h3 className="font-semibold text-gray-100 mb-4">Stripe</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="stripeKey" className="text-gray-300">API Key</Label>
                        <Input
                          id="stripeKey"
                          type="password"
                          value={stripeKey}
                          onChange={(e) => setStripeKey(e.target.value)}
                          placeholder="sk_test_... or sk_live_..."
                          className="bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-brand-500 focus-visible:ring-offset-0 focus-visible:border-brand-500"
                        />
                        <p className="text-xs text-gray-500">
                          Leave as ******** to keep existing key, or enter new key to update
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-white/10 rounded-lg bg-white/5">
                    <h3 className="font-semibold text-gray-100 mb-4">SSLCommerz</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="sslcommerzKey" className="text-gray-300">Store Key</Label>
                        <Input
                          id="sslcommerzKey"
                          type="password"
                          value={sslcommerzKey}
                          onChange={(e) => setSslcommerzKey(e.target.value)}
                          placeholder="Enter your SSLCommerz store key"
                          className="bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-brand-500 focus-visible:ring-offset-0 focus-visible:border-brand-500"
                        />
                        <p className="text-xs text-gray-500">
                          Leave as ******** to keep existing key, or enter new key to update
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSavePayment} disabled={saving} className="bg-brand-600 hover:bg-brand-700 text-white">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}

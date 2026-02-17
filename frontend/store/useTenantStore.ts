import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { tenantsAPI, type Tenant } from '@/lib/api';

interface TenantState {
  tenant: Tenant | null;
  isLoaded: boolean;
  _hasHydrated: boolean;

  // Actions
  setTenant: (tenant: Tenant) => void;
  loadTenant: () => Promise<void>;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      tenant: null,
      isLoaded: false,
      _hasHydrated: false,

      setHasHydrated: (hasHydrated: boolean) => {
        set({ _hasHydrated: hasHydrated });
      },

      setTenant: (tenant: Tenant) => {
        console.log('🟢 TenantStore: Setting tenant', tenant.name);
        set({ tenant, isLoaded: true });
      },

      loadTenant: async () => {
        try {
          console.log('🟢 TenantStore: Loading tenant data');
          const tenantData = await tenantsAPI.getBySlug('pepti-hub');
          console.log('🟢 TenantStore: Tenant loaded successfully', tenantData.name);
          set({ tenant: tenantData, isLoaded: true });
        } catch (error: any) {
          // Silently handle 403 errors - tenant endpoint may require admin access
          if (error.response?.status === 403) {
            console.log('🟢 TenantStore: Tenant endpoint requires admin access - using defaults');
            // Set default tenant data for basic operation
            set({
              tenant: {
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
                smtpConfig: null,
                isActive: true,
                plan: 'BASIC',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              isLoaded: true
            });
          } else {
            console.error('🟢 TenantStore: Failed to load tenant', error);
            set({ isLoaded: false });
          }
        }
      },
    }),
    {
      name: 'tenant-storage',
      // Only persist non-sensitive tenant data
      partialize: (state) => ({
        tenant: state.tenant ? {
          id: state.tenant.id,
          name: state.tenant.name,
          slug: state.tenant.slug,
          domain: state.tenant.domain,
          logo: state.tenant.logo,
          favicon: state.tenant.favicon,
          primaryColor: state.tenant.primaryColor,
          email: state.tenant.email,
          phone: state.tenant.phone,
          address: state.tenant.address,
          currency: state.tenant.currency,
          taxRate: state.tenant.taxRate,
          isActive: state.tenant.isActive,
          plan: state.tenant.plan,
          createdAt: state.tenant.createdAt,
          updatedAt: state.tenant.updatedAt,
          // Exclude sensitive data
          stripeKey: null,
          sslcommerzKey: null,
          emailFrom: null,
          smtpConfig: null,
        } : null,
        isLoaded: state.isLoaded,
      }),
      onRehydrateStorage: () => (state) => {
        console.log('🟢 TenantStore: Hydration complete');
        state?.setHasHydrated(true);
      },
    }
  )
);

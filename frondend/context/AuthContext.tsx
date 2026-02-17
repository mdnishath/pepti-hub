"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { WooCustomer, WooOrder, dummyCustomer, dummyOrders } from "@/data/orders";

interface AuthContextType {
  user: WooCustomer | null;
  orders: WooOrder[];
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<WooCustomer | null>(null);
  const [orders] = useState<WooOrder[]>(dummyOrders);

  const login = async (email: string, _password: string): Promise<boolean> => {
    // Placeholder — swap with WooCommerce JWT auth endpoint
    if (email) {
      setUser({ ...dummyCustomer, email });
      return true;
    }
    return false;
  };

  const register = async (firstName: string, lastName: string, email: string, _password: string): Promise<boolean> => {
    // Placeholder — swap with WooCommerce /wc/v3/customers POST
    if (email) {
      setUser({ ...dummyCustomer, first_name: firstName, last_name: lastName, email });
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, orders, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

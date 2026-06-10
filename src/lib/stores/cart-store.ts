import { create } from "zustand";
import { persist } from "zustand/middleware";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CartItem {
  menuItemId: string;
  name: string;
  nameHi?: string;
  price: number;
  quantity: number;
  isJain?: boolean;
  isVegan?: boolean;
}

export interface CartState {
  items: CartItem[];
  locationId: string | null;
  mealSlot: string | null;
  deliveryDate: string | null;
  specialInstructions: string;
  // Customer details
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  companyName: string;
  paymentMethod: "RAZORPAY" | "PAY_LATER" | null;
  // Computed
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  total: number;
  itemCount: number;
  // Actions
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  setLocation: (locationId: string) => void;
  setMealSlot: (slot: string) => void;
  setDeliveryDate: (date: string) => void;
  setSpecialInstructions: (instructions: string) => void;
  setCustomerDetails: (details: {
    name: string;
    phone: string;
    email: string;
    companyName: string;
  }) => void;
  setPaymentMethod: (method: "RAZORPAY" | "PAY_LATER") => void;
  clearCart: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GST_RATE = 0.05; // 5%

function computeDerived(items: CartItem[]) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const gstAmount = Math.round(subtotal * GST_RATE * 100) / 100;
  const total = Math.round((subtotal + gstAmount) * 100) / 100;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return { subtotal, gstRate: GST_RATE, gstAmount, total, itemCount };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      locationId: null,
      mealSlot: null,
      deliveryDate: null,
      specialInstructions: "",
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      companyName: "",
      paymentMethod: null,
      // Initial computed values
      subtotal: 0,
      gstRate: GST_RATE,
      gstAmount: 0,
      total: 0,
      itemCount: 0,

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.menuItemId === item.menuItemId,
          );
          const items = existing
            ? state.items.map((i) =>
                i.menuItemId === item.menuItemId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i,
              )
            : [...state.items, { ...item, quantity: 1 }];
          return { items, ...computeDerived(items) };
        }),

      removeItem: (menuItemId) =>
        set((state) => {
          const items = state.items.filter(
            (i) => i.menuItemId !== menuItemId,
          );
          return { items, ...computeDerived(items) };
        }),

      updateQuantity: (menuItemId, quantity) =>
        set((state) => {
          const items =
            quantity <= 0
              ? state.items.filter((i) => i.menuItemId !== menuItemId)
              : state.items.map((i) =>
                  i.menuItemId === menuItemId ? { ...i, quantity } : i,
                );
          return { items, ...computeDerived(items) };
        }),

      setLocation: (locationId) => set({ locationId }),
      setMealSlot: (mealSlot) => set({ mealSlot }),
      setDeliveryDate: (deliveryDate) => set({ deliveryDate }),
      setSpecialInstructions: (specialInstructions) =>
        set({ specialInstructions }),

      setCustomerDetails: (details) =>
        set({
          customerName: details.name,
          customerPhone: details.phone,
          customerEmail: details.email,
          companyName: details.companyName,
        }),

      setPaymentMethod: (method) => set({ paymentMethod: method }),

      clearCart: () =>
        set({
          items: [],
          locationId: null,
          mealSlot: null,
          deliveryDate: null,
          specialInstructions: "",
          customerName: "",
          customerPhone: "",
          customerEmail: "",
          companyName: "",
          paymentMethod: null,
          ...computeDerived([]),
        }),
    }),
    {
      name: "site-cart",
    },
  ),
);

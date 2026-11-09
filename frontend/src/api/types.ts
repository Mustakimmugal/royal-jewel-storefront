export type ApiProduct = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  collection?: string;
  price: number;
  oldPrice?: number;
  rating?: number;
  reviews?: number;
  badge?: string;
  isNew?: boolean;
  featured?: boolean;
  currency: string;
  images: string[];
  sizes?: string[];
  variants?: Array<string | { label?: string; size?: string }>;
  stock: number;
  sku: string;
  isActive: boolean;
};

export type AuthUser = {
  id: string;
  phone: string;
  email?: string;
  displayName?: string;
  profileImage?: string;
  role: "customer" | "admin" | "employee";
  permissions: string[];
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};

export type ApiError = {
  error: { code: string; message: string };
};

import type { ApiError, ApiProduct, AuthSession } from "./types";

const rawApiHost = window.location.hostname.replace(/^\[|\]$/g, "");
const apiHost = rawApiHost.includes(":") ? `[${rawApiHost}]` : rawApiHost;
const localApiOrigin = `${window.location.protocol}//${apiHost}:4000/api`;
const API_BASE_URL = (import.meta.env.VITE_API_URL || localApiOrigin).replace(/\/$/, "");

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(API_BASE_URL + path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiError | null;
    throw new Error(body?.error?.message || "Request failed (" + response.status + ")");
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read image."));
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}

export const api = {
  products: (searchParams = "") =>
    request<{ products: ApiProduct[] }>("/products" + searchParams),

  submitContact: (payload: { name: string; email: string; subject: string; message: string }) =>
    request<{ message: string }>("/contact", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  subscribeNewsletter: (email: string) =>
    request<{ message: string }>("/newsletter", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  adminMessages: (accessToken: string) =>
    request<{ messages: Array<Record<string, any>> }>("/contact/admin", {
      headers: { Authorization: "Bearer " + accessToken },
    }),
  adminCustomers: (accessToken: string) =>
    request<{ customers: Array<Record<string, any>>; total: number }>("/customers/admin", {
      headers: { Authorization: "Bearer " + accessToken },
    }),
  reviewReturn: (accessToken: string, orderId: string, status: string, adminNote = "") =>
    request<{ order: Record<string, any> }>("/orders/admin/" + orderId + "/return", {
      method: "PATCH",
      headers: { Authorization: "Bearer " + accessToken },
      body: JSON.stringify({ status, adminNote }),
    }),
  adminCoupons: (accessToken: string) =>
    request<{ coupons: Array<Record<string, any>> }>("/coupons/admin", {
      headers: { Authorization: "Bearer " + accessToken },
    }),
  createCoupon: (accessToken: string, coupon: Record<string, unknown>) =>
    request<{ coupon: Record<string, any> }>("/coupons/admin", {
      method: "POST",
      headers: { Authorization: "Bearer " + accessToken },
      body: JSON.stringify(coupon),
    }),
  updateCoupon: (accessToken: string, couponId: string, updates: Record<string, unknown>) =>
    request<{ coupon: Record<string, any> }>("/coupons/admin/" + couponId, {
      method: "PATCH",
      headers: { Authorization: "Bearer " + accessToken },
      body: JSON.stringify(updates),
    }),

  updateMessageStatus: (accessToken: string, messageId: string, status: string) =>
    request<{ message: Record<string, any> }>("/contact/admin/" + messageId + "/status", {
      method: "PATCH",
      headers: { Authorization: "Bearer " + accessToken },
      body: JSON.stringify({ status }),
    }),
  register: (payload: { email: string; displayName: string; password: string; recoveryAnswers: Array<{ questionId: string; answer: string }> }) =>
    request<AuthSession>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (email: string, password: string) =>
    request<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  requestPasswordReset: (email: string) =>
    request<{ message: string }>("/auth/password/forgot", { method: "POST", body: JSON.stringify({ email }) }),

  startPasswordRecovery: (email: string) =>
    request<{ token: string; recoveryQuestions: Array<{ id: string; label: string }> }>("/auth/password/recovery/start", { method: "POST", body: JSON.stringify({ email }) }),

  verifyPasswordRecovery: (email: string, token: string, recoveryAnswers: Array<{ questionId: string; answer: string }>) =>
    request<{ verified: boolean }>("/auth/password/recovery/verify", { method: "POST", body: JSON.stringify({ email, token, recoveryAnswers }) }),

  completePasswordRecovery: (email: string, token: string, password: string) =>
    request<{ message: string }>("/auth/password/recovery/complete", { method: "POST", body: JSON.stringify({ email, token, password }) }),

  passwordResetInfo: (email: string, token: string) =>
    request<{ needsRecoverySetup: boolean; recoveryQuestions: Array<{ id: string; label: string }>; availableQuestions: Array<{ id: string; label: string }> }>("/auth/password/reset-info?email=" + encodeURIComponent(email) + "&token=" + encodeURIComponent(token)),

  resetPassword: (payload: { email: string; token: string; password: string; recoveryAnswers?: Array<{ questionId: string; answer: string }>; newRecoveryAnswers?: Array<{ questionId: string; answer: string }> }) =>
    request<{ message: string }>("/auth/password/reset", { method: "POST", body: JSON.stringify(payload) }),

  refreshSession: () =>
    request<AuthSession>("/auth/refresh", { method: "POST" }),

  adminProducts: (accessToken: string) =>
    request<{ products: ApiProduct[] }>("/products/admin", {
      headers: { Authorization: "Bearer " + accessToken },
    }),
  getCart: (accessToken: string) =>
    request<{ cart: { items: Array<{ productSlug: string; size: string; quantity: number }> } }>("/cart", {
      headers: { Authorization: "Bearer " + accessToken },
    }),
  syncCart: (accessToken: string, items: Array<{ productSlug: string; size: string; quantity: number }>) =>
    request<{ cart: { items: Array<{ productSlug: string; size: string; quantity: number }> } }>("/cart/sync", {
      method: "PUT",
      headers: { Authorization: "Bearer " + accessToken },
      body: JSON.stringify({ items }),
    }),
  getWishlist: (accessToken: string) =>
    request<{ wishlist: string[] }>("/wishlist", { headers: { Authorization: "Bearer " + accessToken } }),
  syncWishlist: (accessToken: string, wishlist: string[]) =>
    request<{ wishlist: string[] }>("/wishlist", {
      method: "PUT",
      headers: { Authorization: "Bearer " + accessToken },
      body: JSON.stringify({ wishlist }),
    }),
  applyCoupon: (accessToken: string, code: string) =>
    request<{ couponCode: string; discount: number; finalAmount: number }>("/coupons/apply", {
      method: "POST",
      headers: { Authorization: "Bearer " + accessToken },
      body: JSON.stringify({ code }),
    }),
  getAddresses: (accessToken: string) =>
    request<{ addresses: Array<Record<string, any>> }>("/addresses", { headers: { Authorization: "Bearer " + accessToken } }),
  saveAddress: (accessToken: string, address: Record<string, unknown>) =>
    request<{ address: Record<string, any> }>("/addresses", {
      method: "POST",
      headers: { Authorization: "Bearer " + accessToken },
      body: JSON.stringify(address),
    }),
  updateAddress: (accessToken: string, addressId: string, address: Record<string, unknown>) =>
    request<{ address: Record<string, any> }>("/addresses/" + addressId, {
      method: "PATCH",
      headers: { Authorization: "Bearer " + accessToken },
      body: JSON.stringify(address),
    }),
  deleteAddress: (accessToken: string, addressId: string) =>
    request<void>("/addresses/" + addressId, { method: "DELETE", headers: { Authorization: "Bearer " + accessToken } }),

  createProduct: (accessToken: string, payload: Record<string, unknown>) =>
    request<{ product: ApiProduct }>("/products", {
      method: "POST",
      headers: { Authorization: "Bearer " + accessToken },
      body: JSON.stringify(payload),
    }),
  uploadProductImage: async (accessToken: string, file: File) => {
    const dataUrl = await fileToDataUrl(file);
    return request<{ image: { url: string; publicId: string } }>("/products/media", {
      method: "POST",
      headers: { Authorization: "Bearer " + accessToken },
      body: JSON.stringify({ fileName: file.name, mimeType: file.type, data: dataUrl }),
    });
  },
  cleanupProductImages: (accessToken: string, publicIds: string[]) =>
    request<void>("/products/media/cleanup", {
      method: "DELETE",
      headers: { Authorization: "Bearer " + accessToken },
      body: JSON.stringify({ publicIds }),
    }),
  uploadProfileImage: async (accessToken: string, file: File) => {
    const dataUrl = await fileToDataUrl(file);
    return request<{ user: AuthSession["user"] }>("/auth/profile/image", {
      method: "PUT",
      headers: { Authorization: "Bearer " + accessToken },
      body: JSON.stringify({ fileName: file.name, mimeType: file.type, data: dataUrl }),
    });
  },
  deleteProfileImage: (accessToken: string) =>
    request<{ user: AuthSession["user"] }>("/auth/profile/image", {
      method: "DELETE",
      headers: { Authorization: "Bearer " + accessToken },
    }),

  updateProduct: (accessToken: string, productId: string, payload: Record<string, unknown>) =>
    request<{ product: ApiProduct }>("/products/" + productId, {
      method: "PATCH",
      headers: { Authorization: "Bearer " + accessToken },
      body: JSON.stringify(payload),
    }),
  deleteProduct: (accessToken: string, productId: string) =>
    request<void>("/products/" + productId, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + accessToken },
    }),

  myOrders: (accessToken: string) =>
    request<{ orders: Array<Record<string, any>> }>("/orders/mine", {
      headers: { Authorization: "Bearer " + accessToken },
    }),
  cancelOrder: (accessToken: string, orderId: string) =>
    request<{ order: Record<string, any> }>("/orders/mine/" + orderId + "/cancel", {
      method: "PATCH",
      headers: { Authorization: "Bearer " + accessToken },
    }),
  requestOrderReturn: (accessToken: string, orderId: string, reason: string) =>
    request<{ order: Record<string, any> }>("/orders/mine/" + orderId + "/return", {
      method: "POST",
      headers: { Authorization: "Bearer " + accessToken },
      body: JSON.stringify({ reason }),
    }),
  productReviews: (slug: string) =>
    request<{ reviews: Array<Record<string, any>> }>("/products/" + encodeURIComponent(slug) + "/reviews"),
  submitProductReview: (accessToken: string, slug: string, payload: { rating: number; comment: string }) =>
    request<{ review: Record<string, any>; rating: number; reviews: number }>("/products/" + encodeURIComponent(slug) + "/reviews", {
      method: "POST",
      headers: { Authorization: "Bearer " + accessToken },
      body: JSON.stringify(payload),
    }),
  adminOrders: (accessToken: string) =>
    request<{ orders: Array<Record<string, any>> }>("/orders/admin", {
      headers: { Authorization: "Bearer " + accessToken },
    }),
  adminDashboardStats: (accessToken: string) =>
    request<{ stats: Record<string, number>; recentOrders: Array<Record<string, any>> }>("/orders/admin/dashboard-stats", {
      headers: { Authorization: "Bearer " + accessToken },
    }),

  updatePaymentStatus: (accessToken: string, orderId: string, paymentStatus: string) =>
    request<{ order: Record<string, any> }>("/orders/admin/" + orderId + "/payment-status", {
      method: "PATCH",
      headers: { Authorization: "Bearer " + accessToken },
      body: JSON.stringify({ paymentStatus }),
    }),
  updateOrderStatus: (accessToken: string, orderId: string, fulfillmentStatus: string) =>
    request<{ order: Record<string, any> }>("/orders/admin/" + orderId + "/status", {
      method: "PATCH",
      headers: { Authorization: "Bearer " + accessToken },
      body: JSON.stringify({ fulfillmentStatus }),
    }),
  createOrder: (accessToken: string, payload: { items: Array<{ productId: string; size: string; quantity: number }>; shippingAddress: Record<string, string>; couponCode?: string }) =>
    request<{ order: { _id: string; orderNumber: string; total: number; fulfillmentStatus: string } }>("/orders", {
      method: "POST",
      headers: { Authorization: "Bearer " + accessToken },
      body: JSON.stringify(payload),
    }),

  logout: () =>
    request<{ message: string }>("/auth/logout", { method: "POST" }),

  currentUser: (accessToken: string) =>
    request<{ user: AuthSession["user"] }>("/auth/me", {
      headers: { Authorization: "Bearer " + accessToken },
    }),
};

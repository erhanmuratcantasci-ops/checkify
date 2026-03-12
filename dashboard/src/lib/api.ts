const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = document.cookie.split('; ').find(r => r.startsWith('refreshToken='))?.split('=')[1] ?? null;
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      document.cookie = 'token=; path=/; max-age=0';
      document.cookie = 'refreshToken=; path=/; max-age=0';
      window.location.href = '/login';
      return null;
    }

    const data = await res.json();
    document.cookie = `token=${data.token}; path=/; max-age=${24 * 3600}; SameSite=Lax`;
    document.cookie = `refreshToken=${data.refreshToken}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
    return data.token;
  } catch {
    document.cookie = 'token=; path=/; max-age=0';
      document.cookie = 'refreshToken=; path=/; max-age=0';
    window.location.href = '/login';
    return null;
  }
}

export async function apiRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = typeof window !== 'undefined'
    ? document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1] ?? null
    : null;

  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });

  // 401 gelirse refresh token ile yenile
  if (res.status === 401 && typeof window !== 'undefined') {
    if (isRefreshing) {
      // Zaten refresh yapılıyor, bekle
      return new Promise((resolve, reject) => {
        refreshQueue.push(async (newToken: string) => {
          try {
            const retryRes = await fetch(`${API_URL}${path}`, {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${newToken}`,
                ...options?.headers,
              },
              ...options,
            });
            const retryData = await retryRes.json();
            if (!retryRes.ok) reject(new Error(retryData.error || 'Bir hata oluştu'));
            else resolve(retryData as T);
          } catch (err) {
            reject(err);
          }
        });
      });
    }

    isRefreshing = true;
    const newToken = await tryRefreshToken();
    isRefreshing = false;

    if (newToken) {
      refreshQueue.forEach(cb => cb(newToken));
      refreshQueue = [];

      const retryRes = await fetch(`${API_URL}${path}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newToken}`,
          ...options?.headers,
        },
        ...options,
      });
      const retryData = await retryRes.json();
      if (!retryRes.ok) throw new Error(retryData.error || 'Bir hata oluştu');
      return retryData as T;
    }

    refreshQueue = [];
    throw new Error('Oturum süresi doldu');
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Bir hata oluştu');
  }

  return data as T;
}

export const auth = {
  register: (email: string, password: string, name?: string) =>
    apiRequest<{ token: string; refreshToken: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    apiRequest<{ token: string; refreshToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => apiRequest<{ user: User }>('/auth/me'),

  updateMe: (data: { name?: string; email?: string; currentPassword?: string; newPassword?: string }) =>
    apiRequest<{ user: User }>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

export const orders = {
  stats: () => apiRequest<OrderStats>('/orders/stats'),

  list: (params?: { status?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return apiRequest<OrdersResponse>(`/orders?${qs.toString()}`);
  },

  get: (id: number) => apiRequest<{ order: OrderDetail }>(`/orders/${id}`),
};

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface Order {
  id: number;
  shopifyOrderId: string | null;
  customerName: string;
  customerPhone: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
  shop: { id: number; name: string; shopDomain: string | null };
}

export interface OrderDetail extends Order {
  smsLogs: { id: number; phone: string; message: string; status: string; createdAt: string }[];
}

export interface OrderStats {
  total: number;
  totalRevenue: number;
  byStatus: Partial<Record<OrderStatus, number>>;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface User {
  id: number;
  email: string;
  name: string | null;
  createdAt: string;
}

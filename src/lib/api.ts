import { LayoutItem } from './types';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

interface LayoutResponse {
  layout: LayoutItem[];
  columns: number;
}
async function request<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const result = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Request failed',
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('API request error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export const api = {
  layout: {
    get: (userId: string) => 
      request<LayoutResponse>(`/api/layout/get?userId=${userId}&t=${Date.now()}`, {
        cache: 'no-store',
      }),
    
    save: (userId: string, layout: LayoutItem[], columns?: number) =>
      request('/api/layout/save', {
        method: 'POST',
        cache: 'no-store',
        body: JSON.stringify({ userId, layout, columns }),
      }),
  },

  widgetData: {
    get: <T = Record<string, unknown>>(userId: string, widgetId: string) =>
      request<T>(`/api/widget-data/get?userId=${userId}&widgetId=${widgetId}&t=${Date.now()}`, {
        cache: 'no-store',
      }),
    
    save: <T = Record<string, unknown>>(userId: string, widgetId: string, data: T) =>
      request('/api/widget-data/save', {
        method: 'POST',
        cache: 'no-store',
        body: JSON.stringify({ userId, widgetId, data }),
      }),
    
    delete: (userId: string, widgetId: string) =>
      request(`/api/widget-data/delete?userId=${userId}&widgetId=${widgetId}`, {
        method: 'DELETE',
        cache: 'no-store',
      }),
  },
};


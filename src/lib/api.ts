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
    get: (employeeId: string) => 
      request<LayoutResponse>(`/api/layout/get?employeeId=${employeeId}&t=${Date.now()}`, {
        cache: 'no-store',
      }),
    
    save: (employeeId: string, layout: LayoutItem[], columns?: number) =>
      request('/api/layout/save', {
        method: 'POST',
        cache: 'no-store',
        body: JSON.stringify({ employeeId, layout, columns }),
      }),
  },

  widgetData: {
    get: <T = Record<string, unknown>>(employeeId: string, widgetId: string) =>
      request<T>(`/api/widget-data/get?employeeId=${employeeId}&widgetId=${widgetId}&t=${Date.now()}`, {
        cache: 'no-store',
      }),
    
    save: <T = Record<string, unknown>>(employeeId: string, widgetId: string, data: T) =>
      request('/api/widget-data/save', {
        method: 'POST',
        cache: 'no-store',
        body: JSON.stringify({ employeeId, widgetId, data }),
      }),
    
    delete: (employeeId: string, widgetId: string) =>
      request(`/api/widget-data/delete?employeeId=${employeeId}&widgetId=${widgetId}`, {
        method: 'DELETE',
        cache: 'no-store',
      }),
  },
};


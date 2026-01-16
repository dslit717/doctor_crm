import { LayoutItem } from './types';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: Pagination;
}

interface LayoutResponse {
  layout: LayoutItem[];
  columns: number;
}

/**
 * 기본 API 요청 함수 (alert 없음)
 * Dashboard 위젯 전용
 */
export async function request<T>(
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

    const data = await response.json();

    if (data.success) {
      return { 
        success: true, 
        data: data.data,
        pagination: data.pagination 
      };
    } else {
      return {
        success: false,
        error: data.error || 'Request failed',
      };
    }
  } catch (error) {
    console.error('API request error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 범용 API 호출 함수 (alert 자동화)
 * 모든 페이지에서 사용
 * 내부적으로 request()를 호출하고 alert만 추가
 */
export async function apiCall<T = any>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const result = await request<T>(url, options);
  
  if (!result.success) {
    const errorMsg = result.error || '처리에 실패했습니다.';
    alert(errorMsg);
  }
  
  return result;
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


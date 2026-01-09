import { useState, useCallback } from 'react';
import { Reservation } from '@/lib/types';

interface UseReservationsReturn {
  reservations: Reservation[];
  loading: boolean;
  loadReservations: () => Promise<void>;
  saveReservation: (data: Partial<Reservation>, slot: { date: string; time: string } | null) => Promise<boolean>;
  updateReservation: (id: string, data: Partial<Reservation>) => Promise<boolean>;
  deleteReservation: (id: string) => Promise<boolean>;
}

/**
 * 예약 관리를 위한 Custom Hook
 */
export function useReservations(): UseReservationsReturn {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReservations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reservations?all=true');
      
      if (response.ok) {
        const data = await response.json();
        setReservations(data);
      } else {
        setReservations([]);
      }
    } catch (error) {
      console.error('예약 불러오기 실패:', error);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveReservation = useCallback(async (
    data: Partial<Reservation>,
    slot: { date: string; time: string } | null
  ): Promise<boolean> => {
    try {
      const reservationData = {
        ...data,
        date: slot?.date,
        time: slot?.time,
      };

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationData),
      });

      if (response.ok) {
        await loadReservations();
        return true;
      }
      return false;
    } catch (error) {
      console.error('예약 저장 실패:', error);
      return false;
    }
  }, [loadReservations]);

  const updateReservation = useCallback(async (
    id: string,
    data: Partial<Reservation>
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/reservations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });

      if (response.ok) {
        await loadReservations();
        return true;
      }
      return false;
    } catch (error) {
      console.error('예약 수정 실패:', error);
      return false;
    }
  }, [loadReservations]);

  const deleteReservation = useCallback(async (id: string): Promise<boolean> => {
    if (!confirm('이 예약을 삭제하시겠습니까?')) return false;

    try {
      const response = await fetch(`/api/reservations?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadReservations();
        return true;
      }
      return false;
    } catch (error) {
      console.error('예약 삭제 실패:', error);
      return false;
    }
  }, [loadReservations]);

  return {
    reservations,
    loading,
    loadReservations,
    saveReservation,
    updateReservation,
    deleteReservation,
  };
}


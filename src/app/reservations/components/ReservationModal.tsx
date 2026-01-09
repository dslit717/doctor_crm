'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Reservation, CATEGORIES } from '@/lib/types';

interface ReservationModalProps {
  slot: { date: string; time: string } | null;
  reservation?: Reservation | null;
  onSave: (data: Partial<Reservation>) => void;
  onUpdate?: (data: Partial<Reservation>) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function ReservationModal({
  slot,
  reservation,
  onSave,
  onUpdate,
  onDelete,
  onClose,
}: ReservationModalProps) {
  const isEditMode = !!reservation;
  
  const [formData, setFormData] = useState({
    patient_name: reservation?.patient_name || '',
    age: reservation?.age || 0,
    gender: reservation?.gender || '여',
    phone: reservation?.phone || '',
    treatment: reservation?.treatment || '',
    category: reservation?.category || 'treatment',
    memo: reservation?.memo || '',
    chart_number: reservation?.chart_number || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode && onUpdate) {
      onUpdate(formData);
    } else {
      onSave(formData);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEditMode ? '예약 상세' : '예약 추가'}</h3>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-section">
            <h4 className="section-title">환자정보</h4>
            <div className="form-row">
              <div className="form-field">
                <label>환자명 *</label>
                <input
                  type="text"
                  value={formData.patient_name}
                  onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-field">
                <label>나이</label>
                <input
                  type="text"
                  value={formData.age || ''}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="form-field">
                <label>성별</label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      value="남"
                      checked={formData.gender === '남'}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    />
                    남
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="여"
                      checked={formData.gender === '여'}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    />
                    여
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4 className="section-title">예약정보</h4>
            <div className="form-row">
              <div className="form-field">
                <label>연락처 *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="010-0000-0000"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4 className="section-title">스케줄정보</h4>
            <div className="form-row">
              <div className="form-field">
                <label>진료날짜</label>
                <input type="text" value={reservation?.date || slot?.date || ''} readOnly />
              </div>
              <div className="form-field">
                <label>진료시간</label>
                <input type="text" value={reservation?.time || slot?.time || ''} readOnly />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>방문목적 *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>세부목적</label>
                <input
                  type="text"
                  value={formData.treatment}
                  onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                  placeholder="예: 여드름 치료, 보톡스 상담 등"
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field full">
                <label>예약메모</label>
                <textarea
                  value={formData.memo}
                  onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                  rows={3}
                  placeholder="특이사항이나 요청사항을 입력하세요"
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            {isEditMode && onDelete && (
              <button type="button" onClick={onDelete} className="btn-delete">
                예약취소
              </button>
            )}
            <div className="footer-right">
              <button type="button" onClick={onClose} className="btn-cancel">
                취소
              </button>
              <button type="submit" className="btn-submit">
                {isEditMode ? '예약수정' : '예약등록'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}


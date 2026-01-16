'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Search, FileText } from 'lucide-react';
import { Reservation, CATEGORIES } from '@/lib/types';
import ChartModal from '@/components/charts/ChartModal';
import SatisfactionChartModal from '@/components/charts/SatisfactionChartModal';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { apiCall } from '@/lib/api';

interface Patient {
  id: string;
  chart_no: string;
  name: string;
  phone: string;
  birth_date?: string;
  gender?: string;
}

interface ReservationModalProps {
  slot: { date: string; time: string } | null;
  reservation?: Reservation | null;
  onSave: (data: Partial<Reservation>) => void;
  onUpdate?: (data: Partial<Reservation>) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const STATUS_OPTIONS = [
  { value: 'reservation', label: '예약' },
  { value: 'checkin', label: '접수' },
  { value: 'consulting', label: '상담중' },
  { value: 'treatment', label: '시술중' },
  { value: 'completed', label: '완료' },
  { value: 'cancelled', label: '취소' },
  { value: 'no_show', label: '노쇼' },
];

export function ReservationModal({
  slot,
  reservation,
  onSave,
  onUpdate,
  onDelete,
  onClose,
}: ReservationModalProps) {
  const isEditMode = !!reservation;
  const [showChartModal, setShowChartModal] = useState(false)
  const [showChartMenu, setShowChartMenu] = useState(false)
  const [chartType, setChartType] = useState<'consultation' | 'medical' | 'care' | 'satisfaction' | null>(null)
  
  const [formData, setFormData] = useState<{
    patient_id: string;
    patient_name: string;
    age: number;
    gender: string;
    phone: string;
    treatment: string;
    category: string;
    memo: string;
    chart_number: string;
    status: 'reservation' | 'checkin' | 'consulting' | 'treatment' | 'completed' | 'cancelled' | 'no_show';
  }>({
    patient_id: reservation?.patient_id || '',
    patient_name: reservation?.patient_name || '',
    age: reservation?.age || 0,
    gender: reservation?.gender || '여',
    phone: reservation?.phone || '',
    treatment: reservation?.treatment || '',
    category: reservation?.category || 'treatment',
    memo: reservation?.memo || '',
    chart_number: reservation?.chart_number || '',
    status: reservation?.status || 'reservation',
  });

  // 환자 검색
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const searchPatients = useCallback(async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }
    const result = await apiCall<Patient[]>(`/api/patients?search=${encodeURIComponent(term)}&limit=5`);
    if (result.success && result.data) {
      setSearchResults(result.data);
    } else {
      setSearchResults([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        searchPatients(searchTerm);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, searchPatients]);

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    const age = patient.birth_date ? calculateAge(patient.birth_date) : 0;
    setFormData({
      ...formData,
      patient_id: patient.id,
      patient_name: patient.name,
      phone: patient.phone,
      chart_number: patient.chart_no,
      gender: patient.gender === 'male' ? '남' : '여',
      age,
    });
    setShowSearch(false);
    setSearchTerm('');
    setSearchResults([]);
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const clearPatient = () => {
    setSelectedPatient(null);
    setFormData({
      ...formData,
      patient_id: '',
      patient_name: '',
      phone: '',
      chart_number: '',
      gender: '여',
      age: 0,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode && onUpdate) {
      onUpdate(formData);
    } else {
      onSave(formData);
    }
  };

  return (
    <>
    <Modal
      isOpen
      onClose={onClose}
      title={isEditMode ? '예약 상세' : '예약 추가'}
      size="md"
      footer={
        <div style={{ display: 'flex', width: '100%', gap: '12px', alignItems: 'center' }}>
          {isEditMode && (
            <>
              <div style={{ position: 'relative' }}>
                <Button
                  type="button"
                  variant="info"
                  onClick={() => setShowChartMenu(!showChartMenu)}
                >
                  차트 입력
                </Button>
                {showChartMenu && (
                  <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: 0,
                    marginBottom: '8px',
                    background: 'white',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                    minWidth: '150px'
                  }}>
                    <button
                      type="button"
                      onClick={() => {
                        setChartType('consultation')
                        setShowChartModal(true)
                        setShowChartMenu(false)
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        color: '#374151',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      상담 차트
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setChartType('medical')
                        setShowChartModal(true)
                        setShowChartMenu(false)
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        color: '#374151',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      진료 차트
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setChartType('care')
                        setShowChartModal(true)
                        setShowChartMenu(false)
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        color: '#374151',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      관리 차트
                    </button>
                    <div style={{ borderTop: '1px solid #E5E7EB', margin: '4px 0' }}></div>
                    <button
                      type="button"
                      onClick={() => {
                        setChartType('satisfaction')
                        setShowChartModal(true)
                        setShowChartMenu(false)
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        color: '#374151',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      만족도 차트
                    </button>
                  </div>
                )}
              </div>
              {onDelete && (
                <Button type="button" variant="danger" onClick={onDelete}>
                  예약취소
                </Button>
              )}
            </>
          )}
           <div className="footer-right">
            <Button type="button" variant="secondary" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" variant="primary" form="reservation-form">
              {isEditMode ? '예약수정' : '예약등록'}
            </Button>
          </div>
         </div>
      }
    >
        <form id="reservation-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h4 className="section-title">환자정보</h4>
            
            {/* 환자 검색 */}
            <div className="form-row">
              <div className="form-field full">
                <label>환자 검색</label>
                <div className="patient-search">
                  {selectedPatient || formData.patient_id ? (
                    <div className="selected-patient">
                      <span className="chart-no">{formData.chart_number}</span>
                      <span className="name">{formData.patient_name}</span>
                      <span className="phone">{formData.phone}</span>
                      <button type="button" onClick={clearPatient} className="clear-btn">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="search-input-wrap">
                      <Search size={16} />
                      <input
                        type="text"
                        placeholder="환자명 또는 전화번호로 검색..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setShowSearch(true);
                        }}
                        onFocus={() => setShowSearch(true)}
                      />
                    </div>
                  )}
                  {showSearch && searchTerm.length >= 2 && (
                    <div className="search-results">
                      {searchResults.length > 0 ? (
                        searchResults.map((patient) => (
                          <div
                            key={patient.id}
                            className="search-item"
                            onClick={() => selectPatient(patient)}
                          >
                            <span className="chart-no">{patient.chart_no}</span>
                            <span className="name">{patient.name}</span>
                            <span className="phone">{patient.phone}</span>
                          </div>
                        ))
                      ) : (
                        <div className="search-item" style={{ color: '#999', cursor: 'default' }}>
                          검색 결과가 없습니다
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <p className="help-text">기존 환자 검색 또는 아래에 직접 입력</p>
              </div>
            </div>

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
              {isEditMode && (
                <div className="form-field">
                  <label>예약상태</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}
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
        </form>
      </Modal>

      {showChartModal && chartType && (
        <>
          {chartType === 'satisfaction' ? (
            <SatisfactionChartModal
              isOpen={showChartModal}
              onClose={() => {
                setShowChartModal(false)
                setChartType(null)
              }}
              patientId={formData.patient_id}
              reservationId={reservation?.id}
              onSave={() => {
                setShowChartModal(false)
                setChartType(null)
              }}
            />
          ) : (
            <ChartModal
              isOpen={showChartModal}
              onClose={() => {
                setShowChartModal(false)
                setChartType(null)
              }}
              chartType={chartType as 'consultation' | 'medical' | 'care'}
              patientId={formData.patient_id}
              reservationId={reservation?.id}
              onSave={() => {
                setShowChartModal(false)
                setChartType(null)
              }}
            />
          )}
        </>
      )}
    </>
  )
}

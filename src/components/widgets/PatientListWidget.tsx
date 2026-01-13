import React from 'react';
import { WidgetCard } from './WidgetCard';
import styles from './widgets.module.scss';

interface PatientListWidgetProps {
  isEditing?: boolean;
  onRemove?: () => void;
}

export function PatientListWidget({ isEditing, onRemove }: PatientListWidgetProps) {
  const patients = [
    { name: '김철수', time: '09:30', status: '대기중', chart: 'C-1234' },
    { name: '이영희', time: '10:00', status: '진료중', chart: 'C-1235' },
    { name: '박민수', time: '10:30', status: '완료', chart: 'C-1236' },
    { name: '최지은', time: '11:00', status: '대기중', chart: 'C-1237' },
  ];

  const statusColor = (status: string) => {
    switch (status) {
      case '대기중': return '#f59e0b';
      case '진료중': return '#0b6aff';
      case '완료': return '#00a67e';
      default: return '#737373';
    }
  };

  return (
    <WidgetCard title="내원 환자 목록" isEditing={isEditing} onRemove={onRemove}>
      <div className={styles.patientListContainer}>
        {patients.map((patient, idx) => (
          <div key={idx} className={styles.patientItem}>
            <div className={styles.patientInfo}>
              <div className={styles.patientName}>
                {patient.name}
              </div>
              <div className={styles.patientMeta}>
                {patient.chart} • {patient.time}
              </div>
            </div>
            <span 
              className={styles.patientStatus}
              style={{
                background: `${statusColor(patient.status)}20`,
                color: statusColor(patient.status)
              }}
            >
              {patient.status}
            </span>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}


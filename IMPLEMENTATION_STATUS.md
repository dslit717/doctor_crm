# primary.md 기준 구현 현황

## 2. 시스템 인프라 및 보안 (Security)

### 2.1 접속 제어 및 인증 ✅
- [x] IP 기반 접근 제한 (API 구현됨: `/api/settings/ip-whitelist`)
- [x] 2차 인증(OTP/SMS) (API 구현됨: `/api/auth/2fa/*`)
- [x] 세션 관리 (API 구현됨: `/api/auth/session`)
- [x] 로그인/로그아웃 (API 구현됨: `/api/auth/login`, `/api/auth/logout`)

### 2.2 상세 보안 로그 (Audit Log) ✅
- [x] 접속 로그 (API 구현됨: `/api/login-logs`)
- [x] 행위 로그 (API 구현됨: `/api/audit-logs`)

### 2.3 역할 기반 권한 관리 (RBAC) ✅
- [x] 역할 관리 (API 구현됨: `/api/roles/*`)
- [x] 권한 관리 (API 구현됨: `/api/permissions`)
- [x] 직원-역할 연결 (API 구현됨: `/api/employees/[employeeId]/roles`)

### 2.4 유연한 데이터 스키마 관리 (Dynamic Schema) ✅
- [x] extended_data (JSONB) 필드 지원 (database.ts에 타입 정의됨)
- [x] 직원/환자/재고 확장 필드 구조 설계 완료

## 3. 병원 자원 및 인사 관리 (HR & Operations)

### 3.1 직원 및 근태 관리 (HR) ✅
- [x] 직원 관리 (API: `/api/employees`, 페이지: `/hr`)
- [x] 근태 관리 (API: `/api/hr/attendance`)
- [x] 휴가 관리 (API: `/api/hr/leaves`)

### 3.2 운영 정책 설정 ✅
- [x] 운영 스케줄 설정 (API: `/api/settings/operation`, 페이지: `/settings/operation`)
- [x] 공휴일 관리 (API: `/api/settings/holidays`)

### 3.3 재고 관리 (Inventory Management) ✅
- [x] 품목 마스터 관리 (API: `/api/inventory`, 페이지: `/inventory`)
- [x] 입출고 관리 (API: `/api/inventory/transactions`)
- [x] 재고 알림 (API: `/api/inventory/alerts`)
- [x] 재고 리포트 (API: `/api/inventory/report`)

### 3.4 장비 관리 (Equipment Management) ✅
- [x] 장비 등록/관리 (API: `/api/equipment`, 페이지: `/equipment`)
- [x] 유지보수 관리 (API: `/api/equipment/maintenance`)

## 4. 서비스 마스터 및 표준 운영 절차 (SOP)

### 4.1 서비스/상품 마스터 ✅
- [x] 서비스 등록/관리 (API: `/api/services`, 페이지: `/services`)
- [x] 가격 관리 (과세/비과세 구분)
- [x] 카테고리 관리

### 4.2 7단계 직무별 매뉴얼 연동 ⚠️
- [ ] 코디네이터 매뉴얼
- [ ] 상담 매뉴얼
- [ ] 진료 매뉴얼
- [ ] 시술 매뉴얼
- [ ] 시술준비 매뉴얼
- [ ] 관리사 매뉴얼
- [ ] 환자 주의사항

### 4.3 성형외과 특화 기능 ❌
- [ ] 수술 스케줄 관리
- [ ] 수술 전/중/후 관리
- [ ] 회복실 관리

### 4.4 전화 응대 매뉴얼 (Call Script Management) ❌
- [ ] 응대 매뉴얼 유형
- [ ] LLM 기반 매뉴얼 작성
- [ ] 코디네이터 화면 연동

## 5. 환자 및 예약 관리 시스템 (Patient & CRM)

### 5.1 환자 통합 카드 ✅
- [x] 환자 관리 (API: `/api/patients`, 페이지: `/patients`)
- [x] 내원 경로 관리
- [x] 상태 추적

### 5.2 다차원 예약 차트 ✅
- [x] 예약 관리 (API: `/api/reservations`, 페이지: `/reservations`)
- [x] 드래그 앤 드롭 예약 변경
- [x] 예약 대기/콜백 관리 (API: `/api/reservations/pending`, 페이지: `/reservations/pending`)

### 5.3 마케팅 CRM 기능 ⚠️
- [x] 포인트 시스템 (API: `/api/points`)
- [ ] 타겟 마케팅 (세그먼트 생성, 캠페인 관리)
- [ ] 멤버십 등급 관리
- [ ] 추천인 프로그램
- [ ] 자동화 마케팅

### 5.4 서비스 이행 관리 (Service Fulfillment) ✅
- [x] 구매 서비스 등록 (API: `/api/patient-services`)
- [x] 이행 현황 추적 (회차 관리, 상태 관리)
- [x] 자동 차감 및 연동
- [ ] 알림 및 리마인드
- [ ] 서비스 변경 및 환불
- [ ] 서비스 이행 리포트

## 6. 스마트 통합 차팅 및 개인화 (Smart Charting)

### 6.1 UI 개인화 관리 (UI Customization) ✅
- [x] 위젯 레이아웃 (대시보드 위젯 시스템 구현됨)
- [x] 서버 동기화 (API: `/api/layout/save`, `/api/layout/get`)

### 6.2 직무별 특화 화면 ⚠️
- [x] 대시보드 위젯 시스템 (14개 위젯 구현됨)
- [ ] 코디네이터 전용 화면
- [ ] 상담사 전용 화면
- [ ] 의사 전용 화면
- [ ] 관리사 전용 화면

### 6.3 만족도 차트 (Satisfaction Tracking) ✅
- [x] 만족도 차트 API (API: `/api/charts?type=satisfaction`)
- [x] 만족도 입력 화면 (컴포넌트: `SatisfactionChartModal`)
- [ ] 만족도 추이 분석
- [ ] 만족도 리포트

### 6.4 스마트 상담 시스템 (Smart Consultation) ❌
- [ ] 상담 화면 커스터마이징
- [ ] 민감 정보 보호 (Privacy Mode)
- [ ] 환자 니즈/상태 분석
- [ ] AI 기반 프로그램 추천
- [ ] 상담 정보 통합 뷰
- [ ] AI/중앙서버 연동

### 6.5 차트 입력 항목 커스터마이징 (Chart Customization) ⚠️
- [x] 차트 조회 API (상담/진료/관리/만족도 차트)
- [x] 차트 입력 화면 (컴포넌트: `ChartModal` - 상담/진료/관리 차트)
- [ ] 차트 항목 커스터마이징
- [ ] 시술별 차트 템플릿
- [ ] 자주 사용 문구 (Quick Text)

## 7. AI 지능형 지원 시스템 (AI Intelligence) ❌
- [ ] 지능형 매뉴얼 분석
- [ ] 데이터 예측 분석
- [ ] LLM/MCP 연동
- [ ] 자연어 인터페이스
- [ ] AI 상담 지원
- [ ] AI 차팅 보조

## 8. 사후 관리 및 자동화

### 8.1 스마트 알림 시스템 ✅
- [x] 메시징 API (API: `/api/messaging`)
- [x] 예약 리마인드 자동화 (API: `/api/notifications/process`, 설정 페이지: `/settings/notifications`)
- [x] 시술 후 안내 자동화 (API 구현 완료)
- [ ] 경과 관찰 알림
- [ ] 미수금 알림

### 8.2 동의서 및 서류 관리 (Document Management) ✅
- [x] 동의서 템플릿 관리 (API: `/api/consents`)
- [x] 전자 서명 시스템 (API 구현됨)
- [x] 동의서 관리 페이지 (프론트엔드 구현 완료: `/consents`)

### 8.3 역할별 BI 대시보드 (Role-based Dashboard) ✅
- [x] 대시보드 시스템 (페이지: `/dashboard`)
- [x] 위젯 라이브러리 (14개 위젯 구현됨)
- [x] 레이아웃 저장/불러오기
- [ ] 역할별 기본 레이아웃
- [ ] 글로벌 필터 연동
- [ ] 실시간 업데이트 (WebSocket)

## 9. 결제 및 수납 관리 (Payment & Billing)

### 9.1 결제 수단 관리 ✅
- [x] 결제 처리 (API: `/api/payments`, 페이지: `/payments`)
- [x] 복합 결제 지원

### 9.2 수납 처리 ✅
- [x] 즉시 수납
- [x] 선수납 관리
- [x] 부분 수납

### 9.3 미수금 관리 ⚠️
- [x] 미수금 현황 조회
- [ ] 독촉 알림 자동화
- [ ] 수금 이력 관리

### 9.4 환불 처리 ✅
- [x] 환불 신청/승인 (API: `/api/refunds`, 페이지: `/refunds`)
- [x] 환불 이력

### 9.5 세금 및 정산 ⚠️
- [x] 과세/비과세 분리
- [ ] 세금계산서 발행
- [ ] 현금영수증 발행
- [ ] 일일 정산
- [ ] 월 마감

## 10. 메시징 연동 (Messaging Integration)

### 10.1 메시징 채널 ✅
- [x] SMS/LMS/MMS (API: `/api/messaging`)
- [x] 템플릿 관리
- [ ] 카카오 알림톡
- [ ] 카카오 친구톡
- [ ] RCS

### 10.2 자동 발송 설정 ❌
- [ ] 예약 관련 알림 자동화
- [ ] 시술 관련 알림 자동화
- [ ] 결제 관련 알림 자동화
- [ ] 마케팅 알림 자동화

### 10.3 템플릿 관리 ✅
- [x] 템플릿 등록/관리 (API 구현됨)
- [x] 메시지 관리 페이지 (프론트엔드 구현 완료: `/messaging`)
- [ ] LLM 기반 메시지 작성 지원

### 10.4 발송 관리 ✅
- [x] 수동 발송 (API 구현됨)
- [x] 발송 이력 조회 페이지 (메시징 관리 페이지에 포함)
- [ ] 발송 설정 (시간대, 제한)

### 10.5 수신 동의 관리 ⚠️
- [x] 동의 정보 저장 (환자 테이블에 필드 존재)
- [ ] 동의 관리 페이지
- [ ] 080 수신거부 연동

### 10.6 비용 및 통계 ❌
- [ ] 비용 관리
- [ ] 발송 통계
- [ ] 효과 분석

---

## 구현 현황 요약

### ✅ 완료 (약 60%)
- 인증/보안 시스템
- 기본 CRUD 페이지 (환자, 예약, 결제, 서비스, 재고, 장비, 인사)
- 대시보드 위젯 시스템
- 기본 API 구조
- 동의서/차트 API

### ⚠️ 부분 구현 (약 25%)
- 만족도 차트 (API만 구현)
- 메시징 (API만 구현, 자동화 미구현)
- 서비스 이행 관리 (기본 기능만)
- 차트 커스터마이징 (조회만 가능)

### ❌ 미구현 (약 15%)
- AI 기능 전반
- 매뉴얼 시스템
- 성형외과 특화 기능
- 마케팅 CRM 고급 기능
- 자동화 알림 시스템

---

## 다음 우선순위 제안

1. ✅ **메시징 관리 페이지** - 템플릿 관리, 발송 이력 UI
2. ✅ **동의서 관리 페이지** - 템플릿 관리, 서명 현황 UI
3. ✅ **만족도 차트 입력 화면** - 만족도 입력 UI
4. ✅ **차트 입력 화면** - 상담/진료/관리 차트 입력 UI
5. ✅ **자동 알림 시스템** - 예약 리마인드, 시술 후 안내 자동화


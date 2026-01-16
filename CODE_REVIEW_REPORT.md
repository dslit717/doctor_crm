# 전체 코드 분석 리포트

## 📊 분석 개요
- **분석 범위**: `src/` 전체
- **분석 일시**: 2024년
- **주요 포인트**: 중복 코드, 사용되지 않는 파일, 일관성 문제

---

## ✅ 잘 정리된 부분

### 1. **API Route 구조**
- ✅ **46개 API route 모두 `export const dynamic = 'force-dynamic'` 통일** 완료
- ✅ 에러 응답 형식 `{ success: false, error: '...' }` 대부분 일관성 있음
- ✅ `getSupabaseServer()` 사용 패턴 통일

### 2. **공통 컴포넌트**
- ✅ `Button`, `Modal` 공통화 완료
- ✅ 대부분의 페이지에서 공통 컴포넌트 사용 중

### 3. **파일 구조**
- ✅ route-local `components/`, `types.ts` 패턴 적용 (payments, patients, messaging, services)
- ✅ 빈 폴더 정리 완료 (custom-fields, field-options, layout/list, settings/operation)

---

## ⚠️ 발견된 문제점

### 🔴 **심각한 중복/문제**

#### 1. **Fetch 패턴 중복 (152개 `alert()` 사용)**
**문제**: 거의 모든 페이지에서 동일한 fetch → error handling → alert 패턴 반복

**예시**:
```typescript
// services/page.tsx, patients/page.tsx, payments/page.tsx 등에서 반복
const res = await fetch('/api/...')
const data = await res.json()
if (data.success) {
  // 성공 처리
} else {
  alert(data.error || '처리에 실패했습니다.')  // ← 중복
}
```

**해결 방안**:
- `src/lib/api.ts`의 `request()` 함수를 확장하여 모든 fetch 호출을 통일
- 또는 커스텀 훅 `useApi()` 생성하여 에러 처리/로딩 상태 통합

**영향 파일**: 
- `src/app/(dashboard)/services/page.tsx` (10개 alert)
- `src/app/(dashboard)/patients/page.tsx` (7개 alert)
- `src/app/(dashboard)/payments/page.tsx` (10개 alert)
- `src/app/(dashboard)/consents/page.tsx` (12개 alert)
- `src/app/(dashboard)/messaging/page.tsx` (12개 alert)
- 등 30개 파일

---

#### 2. **SCSS 중복 (19개 파일에서 `.container` 패턴 반복)**
**문제**: 거의 모든 페이지 SCSS에 동일한 컨테이너 스타일 반복

**예시**:
```scss
// services.module.scss, patients.module.scss, payments.module.scss 등에서 반복
.container {
  padding: 24px;
  background: $white;
  min-height: calc(100vh - 48px);
}
```

**해결 방안**:
- 공통 레이아웃 SCSS 생성 (`src/styles/layouts/_page-container.scss`)
- 각 페이지 SCSS에서 `@import` 사용

**영향 파일**:
- `src/app/(dashboard)/services/services.module.scss`
- `src/app/(dashboard)/patients/patients.module.scss`
- `src/app/(dashboard)/payments/payments.module.scss`
- `src/app/(dashboard)/consents/consents.module.scss`
- `src/app/(dashboard)/messaging/messaging.module.scss`
- 등 19개 파일

---

#### 3. **`reservations.scss` 사용 여부 불명확**
**문제**: `reservations/page.tsx`에서 `import './reservations.scss'` 사용 중이지만, 실제로 공통 `Modal`로 전환했으므로 스타일 중복 가능성

**현재 상태**:
- `src/app/(dashboard)/reservations/reservations.scss` (727줄) 존재
- `src/app/(dashboard)/reservations/page.tsx`에서 import
- 하지만 `ReservationModal`은 이미 공통 `Modal` 사용 중

**확인 필요**:
- `reservations.scss`의 스타일이 실제로 사용되는지 확인
- 사용되지 않으면 삭제, 사용되면 `Modal.module.scss`로 이동

---

#### 4. **`lib/api.ts` 사용률 낮음**
**문제**: `src/lib/api.ts`에 `request()` 헬퍼가 있지만, 대부분의 페이지에서 직접 `fetch()` 사용

**현재 상태**:
- `lib/api.ts`: `layout`, `widgetData`만 래핑
- 실제 사용: 대부분의 페이지에서 직접 `fetch('/api/...')` 호출

**해결 방안**:
- `lib/api.ts`를 확장하여 모든 API 엔드포인트 래핑
- 또는 각 도메인별 API 클라이언트 생성 (예: `lib/api/patients.ts`, `lib/api/services.ts`)

---

### 🟡 **중간 우선순위 문제**

#### 5. **타입 정의 중복 가능성**
**문제**: 여러 파일에서 비슷한 인터페이스 반복 정의 가능성

**확인 필요**:
- `Patient`, `Service`, `Payment` 등 도메인 타입이 여러 곳에 정의되어 있는지
- `src/lib/types/` 또는 각 route의 `types.ts`로 통일 필요

**예상 영향 파일**:
- `src/app/(dashboard)/patients/types.ts`
- `src/app/(dashboard)/payments/types.ts`
- `src/app/(dashboard)/services/types.ts`
- 등

---

#### 6. **`useCallback`/`useEffect` 의존성 경고**
**문제**: ESLint 경고 8개 (exhaustive-deps)

**경고 파일**:
- `src/app/(dashboard)/consents/page.tsx` (line 126)
- `src/app/(dashboard)/messaging/page.tsx` (line 64)
- `src/app/(dashboard)/patients/page.tsx` (line 43)
- `src/app/(dashboard)/refunds/page.tsx` (line 67)
- `src/app/(dashboard)/reservations/pending/page.tsx` (line 39)
- `src/app/(dashboard)/settings/security/page.tsx` (line 31)
- `src/components/charts/ChartModal.tsx` (line 39)
- `src/components/charts/SatisfactionChartModal.tsx` (line 77)

**해결**: 의존성 배열에 누락된 변수 추가 또는 `useCallback`으로 함수 메모이제이션

---

#### 7. **에러 처리 일관성**
**문제**: 일부 API route에서 에러 응답 형식이 다름

**예시**:
- 대부분: `{ success: false, error: '...' }`
- 일부: 다른 형식 사용 가능성

**확인 필요**: 모든 API route의 에러 응답 형식 통일

---

### 🟢 **낮은 우선순위 (정리 권장)**

#### 8. **사용되지 않는 파일 가능성**
**확인 필요**:
- `src/app/api/points/route.ts` - 실제 사용 여부 확인
- `src/app/api/quick-texts/route.ts` - 실제 사용 여부 확인
- `src/app/api/chart-templates/route.ts` - 실제 사용 여부 확인
- `src/app/api/patient-services/route.ts` - 실제 사용 여부 확인

**방법**: 각 API route에 대한 프론트엔드 호출 검색

---

#### 9. **컴포넌트 구조 일관성**
**현재 상태**:
- ✅ 통일된 패턴: `payments`, `patients`, `messaging`, `services` (components/, types.ts)
- ⚠️ 단일 파일: `equipment`, `hr`, `inventory`, `refunds` (page.tsx만)

**권장**: 페이지가 커지면 동일 패턴으로 분리

---

## 📋 우선순위별 정리 계획

### 🔴 **즉시 처리 (심각)**
1. **Fetch 패턴 통일** - `lib/api.ts` 확장 또는 커스텀 훅 생성
2. **SCSS 중복 제거** - 공통 레이아웃 SCSS 생성
3. **`reservations.scss` 정리** - 사용 여부 확인 후 삭제/이동

### 🟡 **단기 처리 (중간)**
4. **타입 정의 통일** - 도메인 타입 중복 확인 및 통합
5. **ESLint 경고 해결** - `useCallback`/`useEffect` 의존성 수정
6. **에러 처리 일관성** - 모든 API route 에러 응답 형식 통일

### 🟢 **장기 처리 (낮은 우선순위)**
7. **사용되지 않는 API 확인** - 각 route의 실제 사용 여부 검증
8. **컴포넌트 구조 통일** - 필요시 단일 파일 페이지도 분리

---

## 📊 통계 요약

- **총 API Routes**: 46개 (모두 `dynamic = 'force-dynamic'` ✅)
- **`alert()` 사용**: 152개 (30개 파일)
- **SCSS `.container` 중복**: 19개 파일
- **ESLint 경고**: 8개 (exhaustive-deps)
- **공통 컴포넌트**: Button, Modal ✅
- **Route-local 패턴**: 4개 route (payments, patients, messaging, services)

---

## 🎯 결론

**전체적으로 코드 품질은 양호**하지만, **중복 코드 제거**와 **일관성 개선**이 필요합니다.

**가장 큰 문제**:
1. Fetch 패턴 중복 (152개 alert)
2. SCSS 중복 (19개 파일)
3. `lib/api.ts` 활용도 낮음

**권장 조치**:
- 공통 API 클라이언트/훅 생성
- 공통 레이아웃 SCSS 생성
- `reservations.scss` 정리


# AI Futures Auto-Trading SaaS (Mobile-First)

이 레포는 **“AI 코인 선물 자동매매 SaaS”를 iOS/Android 모바일 앱 중심**으로 구현합니다.

## 핵심 원칙 (변경 불가)

- **신뢰 > 수익**
- **보안 > 기능**
- **투명성 > 과장**
- **불확실/위험하면 자동매매 즉시 중단**
- **모든 트레이드는 차트에서 증명 가능**

## 구성

- `apps/mobile/`: Flutter 모바일 앱 (메인 제품)
- `services/api/`: API 서버 (인증/설정/트레이드 기록/차트 데이터)
- `services/executor/`: 주문 실행/포지션 추적 워커(서버에서만 실행)
- `infra/`: 로컬 개발용 인프라(docker-compose)
- `docs/`: 보안/아키텍처/운영 문서 (필수)

## 절대 규칙

- **자동매매 로직은 모바일에서 실행하지 않음**
- **AI 분석 엔진은 모바일에서 실행하지 않음**
- 모바일은 **제어/시각화/설정/상태 확인**만 수행
- **API 키는 어떤 경우에도 노출 금지**
  - 유저도 자신의 API 키를 다시 볼 수 없음
  - 서버 저장 시 강력 암호화
  - 복호화는 주문 실행 직전, 메모리에서만
  - 로그에 절대 출력 금지

## 로컬 실행(예정)

이 레포는 현재 “프로덕션 철학을 강제하는 스캐폴딩” 단계입니다.

### 1) 인프라(Postgres/Redis)

로컬에서 Docker가 가능한 환경이라면:

- `infra/docker-compose.yml`로 Postgres/Redis 실행

### 2) API 서버

- `.env.example`을 `.env`로 복사 후 `KEY_VAULT_MASTER_KEY_B64` 설정
- 실행:
  - `npm --prefix services/api install`
  - `npm --prefix services/api run dev`

### 3) 모바일 앱(Expo)

- 실행:
  - `npm --prefix apps/mobile install`
  - `npm --prefix apps/mobile start`

### 4) 주문 실행 워커(Executor)

- 실행:
  - `npm --prefix services/executor install`
  - `DATABASE_URL=... KEY_VAULT_MASTER_KEY_B64=... npm --prefix services/executor run dev`



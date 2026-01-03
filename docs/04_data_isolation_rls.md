# 데이터 격리 (DB 레벨 강제)

## 목표

- “버그가 있어도” 다른 유저 데이터는 물리적으로 읽을 수 없어야 한다.
- 앱/서버 레이어의 실수로 테넌트 격리가 깨지지 않도록 **DB에서 강제**한다.

## Postgres RLS 권장 패턴

1) 각 테이블에 `user_id`(tenant key) 포함  
2) `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`  
3) 정책에서 `current_setting('app.user_id')::uuid` 를 사용  
4) 요청 단위 트랜잭션에서 `SET LOCAL app.user_id = '<uuid>'` 수행  

예시(개념):

- 정책:
  - `USING (user_id = current_setting('app.user_id')::uuid)`
  - `WITH CHECK (user_id = current_setting('app.user_id')::uuid)`

## 주의사항(중요)

- 서비스 계정(superuser)로 운영하면 RLS가 무력화될 수 있다.
- 운영/백업/분석은 별도 경로(읽기 전용/익명화/집계)로 분리한다.
- 서버는 항상 “요청마다” `SET LOCAL` 을 수행하고, 누락 시 **요청 실패**가 안전하다.


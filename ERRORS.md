# 🛠 Error & Troubleshooting Log (ERRORS.md)

이 문서는 프로젝트 개발 중 발생한 주요 오류와 그 해결 방법을 기록합니다. 비슷한 문제가 발생했을 때 참고하세요.

## 📋 요약 (Recent Issues)

| 날짜 | 오류 내용 | 원인 | 해결 방법 | 상태 |
| :--- | :--- | :--- | :--- | :--- |
| 26-02-22 | `(h.tags \|\| []).map is not a function` | DB에서 불러온 JSON 문자열이 파싱되지 않음 | API에서 `JSON.parse` 추가 및 프론트 방어 코드 삽입 | ✅ 해결 |
| 26-02-22 | 신청 정보 `undefined` 및 상태 미갱신 | 필드명 불일치(`connection_note`) 및 후배 필터링 누락 | 백엔드 API 반환 필드 수정 및 후배 ID 필터링 구현 | ✅ 해결 |
| 26-02-22 | `Reading 'senior'` (시간표 오류) | DB의 플랫 리스트 구조와 컴포넌트의 2D 구조 기대치 불일치 | `timetable.js`를 플랫 리스트 기반 렌더링으로 수정 | ✅ 해결 |
| 26-02-22 | `D1_ERROR: no such table: users` | 로컬 스키마가 서버 DB(D1)에 반영되지 않음 | `wrangler d1 execute` 명령어로 원격 DB 업데이트 | ✅ 해결 |
| 26-02-22 | 로그인 버튼 클릭 시 무반응 | 빌드 오류(`npm build`)로 인해 구버전 코드가 배포됨 | `npm run build` 후 재배포 | ✅ 해결 |
| 26-02-22 | 후배 로그인 시 404/Unexpected Token | `/api/users` 엔드포인트 누락 | 해당 API 파일 생성 및 배포 | ✅ 해결 |
| 26-02-19 | 페이지 글자가 보이지 않는 현상 | CSS 그라디언트 레이어가 텍스트를 위에서 가림 | `z-index` 조정 및 `#app` 스타일 강제 노출 | ✅ 해결 |

---

## 🔍 상세 내역 (Detailed History)

### 1. JSON 파싱 오류 (tags.map)
*   **증상**: 로그인 후 대시보드 진입 시 화이트아웃 또는 콘솔에 `map is not a function` 발생.
*   **원인**: D1 데이터베이스의 `TEXT` 타입으로 저장된 `tags` 필드가 자동으로 배열로 변환되지 않고 문자열(`"['tag1', 'tag2']"`)로 반환됨.
*   **해결**: 
    - `functions/api/posts.js`의 GET 핸들러에서 `JSON.parse(p.tags)` 처리.
    - 프론트엔드(`senior.js`, `junior.js`)에서 `Array.isArray()` 체크 추가.

### 2. 원격 DB 테이블 누락 (no such table)
*   **증상**: 회원가입 시 `SQLITE_ERROR: no such table: users` 발생.
*   **원인**: `schema.sql`을 수정했지만 로컬에만 있고 클라우드(Cloudflare D1) 환경에는 테이블이 생성되지 않음.
*   **해결**: 터미널에서 다음 명령어 실행:
    ```bash
    npx wrangler d1 execute knu-meal-db --remote --file=./schema.sql
    ```

### 3. 내비게이션 지연 (Navigation Latency)
*   **증상**: 로그인 버튼 클릭 시 로직은 성공하지만 화면이 바로 바뀌지 않고 수동 새로고침을 해야 함.
*   **원인**: `window.location.hash`를 변경할 때 같은 해시값이면 브라우저가 `hashchange` 이벤트를 발생시키지 않아 라우터가 작동하지 않음.
*   **해결**: `main.js`의 `navigateTo` 함수에서 현재 해시와 같을 경우 `router()`를 강제 호출하도록 수정.

---

## 💡 팁 (Tips)
*   **배포 전 필수 단계**: 코드 수정 후 반드시 `npm run build`를 실행하여 `dist` 폴더를 갱신한 뒤 `deploy` 하세요.
*   **DB 확인**: 데이터가 이상하게 보인다면 `npx wrangler d1 execute knu-meal-db --remote --command="SELECT * FROM users"` 등으로 직접 쿼리를 날려 확인해 보세요.

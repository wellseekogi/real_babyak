# 🍚 KNU Meal Meetup - 프로젝트 진행 상황 요약

### 매우중요 : 기술적 부채를 가능한 최소로 줄여야함
## 📅 현재 진행 현황 (2026-02-22)

현재 프로젝트는 **Cloudflare Pages & Workers** 환경에 배포되어 있으며, 로컬 환경에서 지속적으로 개발 및 고도화 중입니다.

### ✅ 완료된 사항
- [x] 기본적인 SPA 라우팅 시스템 (`main.js`)
- [x] 선배/후배 역할 기반 랜딩 페이지 (`landing.js`)
- [x] 선배 전용 대시보드 및 글 작성 기능 (`senior.js`)
- [x] 후배 전용 검색 및 신청 기능 (`junior.js`)
- [x] 프리미엄 다크 모드 디자인 시스템 (`style.css`)
- [x] API 기반 데이터 스토어 (`store.js`)
- [x] Cloudflare D1 데이터베이스 연동 및 관리 기능

### 🛠️ 최근 수정 사항 (글자 안 나옴 이슈 해결)
- **CSS 방어적 스타일링**: 배경 레이어의 `z-index`를 수정하여 텍스트가 가려지는 문제를 방지하고, `#app` 컨테이너의 가시성을 강제했습니다.
- **글로벌 에러 핸들링**: 자바스크립트 실행 중 오류가 발생할 경우, 빈 화면 대신 오류 내용을 화면에 표시하도록 `main.js`에 글로벌 리스너를 추가했습니다.
- **라우팅 로그 강화**: 브라우저 콘솔에서 현재 라우팅 진행 상황을 쉽게 파악할 수 있도록 로그를 추가했습니다.

---

## 🔍 문제 발생 시 해결 가이드 (Troubleshooting)

**상세한 오류 내역 및 트러블슈팅 케이스는 [ERRORS.md](file:///c:/Users/User/.gemini/antigravity/scratch/knu-meal-meetup/ERRORS.md)에서 별도로 관리하고 있습니다.**
신규 오류 발생 시 위 문서에 원인과 해결 방법을 업데이트하세요.

배포된 사이트에서 문제가 발생할 경우 다음 단계에 따라 원인을 파악하고 해결하세요.

### 1. 로그 확인 (F12)
- 브라우저 개발자 도구의 **Console** 탭을 확인하세요.
- `Routing error` 또는 `Unhandled error` 메시지가 있다면 해당 내용을 바탕으로 코드를 수정하세요.

### 2. 글자가 보이지 않을 때
- 배경화면만 나오고 글자가 없다면, `style.css`에서 `#app`의 `opacity`나 `z-index`를 확인하세요.
- 개발자 도구의 **Elements** 탭에서 `#app` 안에 HTML이 생성되었는지 확인하세요. 생성되지 않았다면 자바스크립트 실행 오류일 가능성이 높습니다.

### 3. API 요청 실패
- `dist` 폴더의 배포 파일이 최신인지 확인하세요 (`npm run build`).
- `wrangler.toml`의 D1 데이터베이스 바인딩 설정이 올바른지 확인하세요.

---

## 🚀 배포 방법 (Deployment)

`npm run build`를 마친 후, 실제로 사이트에 반영하려면 다음 단계가 필요합니다.

### 방법 1: Cloudflare CLI로 직접 배포 (추천)
로컬에서 빌드된 `dist` 폴더를 바로 서버에 올립니다.
```bash
npx wrangler pages deploy dist
```
*처음 실행 시 브라우저가 열리며 Cloudflare 로그인이 필요할 수 있습니다.*

### DB 스키마 업데이트 (Database)
데이터베이스 구조(테이블 등)를 변경한 후에는 아래 명령어를 실행해야 실제 서버에 반영됩니다.
```bash
npx wrangler d1 execute knu-meal-db --remote --file=./schema.sql
```

### 방법 2: Git을 통한 자동 배포
프로젝트가 GitHub 등에 연결되어 있다면, 코드를 푸시하는 것만으로 자동 배포됩니다.
*(단, DB 스키마 변경은 위 명령어로 수동 동기화가 필요할 수 있습니다.)*
```bash
git add .
git commit -m "Fix: auth and coordination implementation"
git push origin main
```

---

## 🚀 다음 단계 (To-Do)
- [ ] 선배-후배 매칭 결과 상세 페이지 (`match.js`) 완성
- [ ] 실시간 알림 기능 (선배 ↔ 후배)
- [ ] 실제 학교 이메일 인증 기능 고도화
- [ ] 디자인 디테일 및 마이크로 인터렉션 추가

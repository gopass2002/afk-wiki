# afk-wiki

`비룡 키우기 : 무협 RPG` 공개 위키 소스입니다.

- 사이트: https://gopass2002.github.io/afk-wiki/
- 빌드: GitHub Actions에서 Ruby/Bundler로 수행하는 Jekyll 빌드
- 내용은 게임 공식 배포본(`https://afk.icecatgames.net/remote/`)에서 추출한 데이터를 정리한 것입니다.

## 문서 구조

```
index.md                         위키 홈
docs/                            장비·도감·음식·지도·확률 안내
docs/updates/                    배포본 사이의 데이터 변경 기록
docs/data/tables/                자동 생성 원본 테이블 탐색 페이지
docs/무공/ docs/아이템/ docs/몬스터/ docs/지역/   자동 생성 개체 낱장 페이지
assets/data/raw/                 FlatBuffer를 변환한 원본 JSON
assets/data/derived/             확률·도감·강화 파생 JSON
assets/images/game/              공식 배포본에서 추출한 무공·아이템 아이콘
tools/extract-game-data.mjs      전체 데이터 추출기
tools/generate-derived-data.mjs  보상·획득 확률 생성기
tools/generate-codex-data.mjs    도감·강화·세계·수집·제련 파생 데이터 생성기
tools/extract-game-media.mjs     공식 게임 아이콘 추출기
```

## 갱신 원칙

배포본 버전(`PatchResource` 해시)이 바뀌면 데이터가 달라질 수 있습니다.
문서마다 기준 버전과 확인일을 명시하고, 갱신 시 함께 수정합니다.

공식 배포본에서 전체 데이터를 다시 추출하려면 Chrome/Chromium과 Node.js 22 이상이
필요합니다. 추출기는 현재 릴리스와 패치 해시를 자동으로 찾고, 전체 원본 테이블과
클라이언트 공식 기반의 확률·도감·강화 파생 데이터를 함께 생성합니다.

- [데이터 추출 시스템](docs/data-extraction.md): FlatBuffer·파생 데이터·게임 아이콘의 추출, 검증과 게시 절차

```bash
node tools/extract-game-data.mjs
node tools/extract-game-media.mjs
node tools/generate-entity-pages.mjs
node tools/verify-data.mjs
node tools/verify-media.mjs
```

데이터를 다시 추출하면 개체 낱장도 다시 만들어야 합니다. 낱장 생성기는 파생 데이터에서
무공·아이템·몬스터·지역 페이지와 검색 색인(`assets/entity-index.json`)을 새로 씁니다.

데이터를 갱신한 뒤에는 아이콘도 다시 추출해야 합니다. 이미지 추출기는 원본 데이터와
현재 배포본의 앱 버전·패치가 일치할 때만 결과를 게시합니다.

## 로컬 개발과 검증

Ruby 3.1과 Bundler를 사용합니다. `.ruby-version`과 `Gemfile.lock`을 기준으로
로컬·CI의 의존성을 맞춥니다.

```bash
bundle install
bundle exec jekyll serve --baseurl ""
```

프로젝트 사이트 경로(`/afk-wiki`)에서 실제 배포와 같은 빌드·데이터·링크 검증을
실행하려면 다음 명령을 사용합니다.

```bash
tools/verify-jekyll.sh
```

`tools/verify-data.mjs`는 원본·파생 JSON, 생성 매니페스트, 행 수, 테이블 문서의
참조를 검사합니다. `tools/verify-media.mjs`는 아이콘과 미디어 매니페스트의 버전,
경로, PNG 형식과 해시를 검사합니다. `tools/verify-site.mjs`는 생성된 HTML의 내부
링크가 `/afk-wiki` 기본 경로를 유지하며 실제 출력 파일을 가리키는지 검사합니다.

## 배포

`.github/workflows/deploy-pages.yml`은 `main` 푸시 또는 수동 실행 시 데이터를
검증하고 Jekyll을 빌드한 후 GitHub Pages에 배포합니다. 저장소의 **Settings → Pages →
Source**는 **GitHub Actions**로 설정해야 합니다.

---
title: 데이터 추출 시스템
layout: default
permalink: /docs/data-extraction/
---

# 데이터 추출 시스템

이 저장소는 게임의 공개 웹 배포본에서 Cocos FlatBuffer 테이블을 읽어 JSON으로 변환하고, 클라이언트 가중치 공식으로 보상 확률을 계산합니다. 추출기는 모든 테이블과 파생 데이터를 별도 디렉터리에서 만든 뒤 검증에 통과한 스냅샷만 게시합니다.

## 현재 저장된 스냅샷

아래 값은 `_data/generated_manifest.json`에서 읽으므로 데이터를 다시 추출하면 함께 바뀝니다.

| 항목 | 값 |
| --- | --- |
| 앱 버전 | `{{ site.data.generated_manifest.appVersion }}` |
| PatchResource | `{{ site.data.generated_manifest.patch }}` |
| 추출 시각 | `{{ site.data.generated_manifest.extractedAt }}` |
| 발견한 테이블 | {{ site.data.generated_manifest.tableCount }}개 |
| 성공 / 실패 | {{ site.data.generated_manifest.successfulTableCount }}개 / {{ site.data.generated_manifest.failedTableCount }}개 |
| 원본 행 | {{ site.data.generated_manifest.totalRows }}행 |
| 파생 확률 풀 / 결과 | {{ site.data.generated_manifest.derived.rewardProbabilities.groupCount }}개 / {{ site.data.generated_manifest.derived.rewardProbabilities.rowCount }}개 |
| 무공 / 아이템 도감 행 | {{ site.data.generated_manifest.derived.skillCodex.rowCount }}행 / {{ site.data.generated_manifest.derived.itemCodex.rowCount }}행 |
| 무공 / 장비 강화 행 | {{ site.data.generated_manifest.derived.skillEnhancementProbabilities.rowCount }}행 / {{ site.data.generated_manifest.derived.equipmentEnhancementProbabilities.rowCount }}행 |
| 아이템 계산 가능 획득 / 드롭 가중치 행 | {{ site.data.generated_manifest.derived.itemAcquisitionProbabilities.rowCount }}행 / {{ site.data.generated_manifest.derived.itemDropWeights.rowCount }}행 |
| 몬스터 도감 / 몬스터 드롭 seed 행 | {{ site.data.generated_manifest.derived.monsterCodex.rowCount }}행 / {{ site.data.generated_manifest.derived.monsterDropSeeds.rowCount }}행 |
| 일일 도전 단계 행 | {{ site.data.generated_manifest.derived.dailyChallengeStages.rowCount }}행 |
| 지역 도감 행 | {{ site.data.generated_manifest.derived.zoneAtlas.rowCount }}행 |
| 수집 도감 / 도감 단계 행 | {{ site.data.generated_manifest.derived.collectionCodex.rowCount }}행 / {{ site.data.generated_manifest.derived.collectionMilestones.rowCount }}행 |
| 요리 레벨 행 | {{ site.data.generated_manifest.derived.cookingLevels.rowCount }}행 |
| 제련 옵션 풀 / 옵션 수치 행 | {{ site.data.generated_manifest.derived.refineOptions.rowCount }}행 / {{ site.data.generated_manifest.derived.refineAttributeValues.rowCount }}행 |

## 저장 구조

```text
assets/data/
├── manifest.json                 공개용 전체 스냅샷 매니페스트
├── raw/*.json                    FlatBuffer 테이블별 원본 변환 결과
└── derived/
    ├── reward-probabilities.json 2단계 보상 풀 확률
    ├── skill-codex.json          무공 도감
    ├── skill-enhancement-probabilities.json
    ├── equipment-enhancement-probabilities.json
    ├── item-codex.json           아이템 도감
    ├── item-acquisition-probabilities.json
    ├── item-drop-weights.json
    ├── monster-codex.json           몬스터 도감
    ├── monster-drop-seeds.json      몬스터 × seed 그룹
    ├── zone-atlas.json              지역·스테이지 도감
    ├── daily-challenge-stages.json  일일 도전 단계
    ├── collection-codex.json        수집 도감
    ├── collection-milestones.json   도감 단계 보상
    ├── cooking-levels.json          요리 레벨
    ├── refine-attribute-values.json 제련 옵션 수치 범위
    └── refine-options.json          제련 옵션 풀
assets/images/game/
├── manifest.json                 이미지 출처·버전·무결성 매니페스트
├── skills/<skillId>.png          무공 아이콘
└── items/<itemId>.png            아이템 아이콘
_data/
└── generated_manifest.json       Jekyll이 읽는 매니페스트 사본
docs/data/tables/
├── index.md                      사람이 관리하는 테이블 인덱스
└── *.md                          테이블별 자동 생성 탐색 페이지
docs/무공/ docs/아이템/ docs/몬스터/
├── index.md                      분야별 낱장 목록
└── *.md                          개체별 자동 생성 낱장
assets/
└── entity-index.json             검색창이 내려받는 낱장 색인
tools/
├── extract-game-data.mjs         발견·디코딩·생성·검증·게시
├── generate-derived-data.mjs     원본 JSON에서 파생 확률 생성
├── generate-codex-data.mjs       도감·강화·아이템 파생 데이터 생성
├── verify-data.mjs               데이터 일관성과 재현성 검증
├── extract-game-media.mjs        공식 무공·아이템 아이콘 추출
├── generate-entity-pages.mjs     개체 낱장 페이지와 검색 색인 생성
└── verify-media.mjs              이미지 매니페스트와 PNG 검증
```

`assets/data/manifest.json`과 `_data/generated_manifest.json`의 내용은 같아야 합니다. 전자는 정적 파일로 공개되고, 후자는 이 사이트의 Liquid 표현식에서 버전과 집계를 읽는 데 사용됩니다.

## JSON 형식

아래 예시는 구조를 보여 주기 위해 값과 배열을 줄인 유효한 JSON입니다.

### 매니페스트

```json
{
  "appVersion": "<APP_VERSION>",
  "extractedAt": "<ISO_8601_TIME>",
  "failedTableCount": 0,
  "origin": "https://afk.icecatgames.net/",
  "patch": "<PATCH_HASH>",
  "sourceConfig": "https://afk.icecatgames.net/remote/PatchResource/config.<PATCH_HASH>.json",
  "successfulTableCount": 1,
  "tableCount": 1,
  "totalRows": 2,
  "tables": [
    {
      "category": "world",
      "categoryLabel": "세계·전투",
      "fields": ["id", "name"],
      "file": "example.json",
      "rowCount": 2,
      "schema": "FBDataExample",
      "slug": "example",
      "sourceAsset": "FBDataExample",
      "status": "ok",
      "title": "Example"
    }
  ],
  "derived": {
    "rewardProbabilities": {
      "formula": "<FORMULA>",
      "groupCount": 1,
      "rowCount": 1,
      "runtimeEvidence": "GachaProbability.computeGachaOdds"
    }
  }
}
```

최상위 필드는 스냅샷의 출처와 전체 집계를 기록합니다. `tables[]`는 파일명, URL 슬러그, 디코딩에 사용한 스키마, 행 수, 필드 합집합과 성공 상태를 담습니다. `derived`는 파생 파일의 핵심 메타데이터를 복제해 두 파일의 일치 여부를 검증할 수 있게 합니다.

### 원본 테이블

```json
{
  "meta": {
    "appVersion": "<APP_VERSION>",
    "extractedAt": "<ISO_8601_TIME>",
    "patch": "<PATCH_HASH>",
    "rowCount": 1,
    "schema": "FBDataExample",
    "sourceAsset": "FBDataExample",
    "sourceConfig": "https://afk.icecatgames.net/remote/PatchResource/config.<PATCH_HASH>.json"
  },
  "rows": [
    {
      "id": 1,
      "name": "example"
    }
  ]
}
```

모든 `raw/*.json`은 `meta`와 `rows`를 가집니다. `meta`는 어느 배포본과 스키마에서 읽었는지를 나타내며, `rows`에는 FlatBuffer 접근자가 반환한 값이 들어갑니다.

### 파생 데이터: 보상 확률

```json
{
  "meta": {
    "appVersion": "<APP_VERSION>",
    "derivedAt": "<ISO_8601_TIME>",
    "formula": "<FORMULA>",
    "groupCount": 1,
    "patch": "<PATCH_HASH>",
    "rowCount": 1,
    "runtimeEvidence": "GachaProbability.computeGachaOdds",
    "sources": [
      "FBDataRewardGroupListBox",
      "FBDataPromissoryNoteQuest",
      "FBDataRewardBox"
    ]
  },
  "rows": [
    {
      "amountMax": 1,
      "amountMin": 1,
      "groupListKey": "ExamplePool",
      "probability": 0.25,
      "sourceGroups": ["ExampleGroup"],
      "targetId": 100,
      "targetName": "예시 보상",
      "type": "Item",
      "percent": 25
    }
  ]
}
```

`probability`는 0~1 비율, `percent`는 표시용 백분율입니다. `sourceGroups`는 같은 결과에 합산된 보상 그룹을 추적합니다. `amountMin`과 `amountMax`는 지급량 범위이며 확률 계산 항은 아닙니다.

### 이미지 매니페스트

```json
{
  "appVersion": "<APP_VERSION>",
  "counts": {
    "enhancementItems": 0,
    "items": 0,
    "skills": 1,
    "total": 1,
    "uniqueSources": 1
  },
  "entries": [
    {
      "appVersion": "<APP_VERSION>",
      "bytes": 1234,
      "entityType": "skill",
      "height": 128,
      "id": 100,
      "mode": "sprite-crop",
      "outputPath": "/assets/images/game/skills/100.png",
      "patch": "<PATCH_HASH>",
      "sha256": "0000000000000000000000000000000000000000000000000000000000000000",
      "sourceConfig": "https://afk.icecatgames.net/remote/PatchResource/config.<PATCH_HASH>.json",
      "sourceLabel": "<SOURCE_LABEL>",
      "sourcePath": "<COCOS_ASSET_PATH>",
      "sourceUrl": "<NATIVE_TEXTURE_URL>",
      "width": 128
    }
  ],
  "origin": "https://afk.icecatgames.net/",
  "patch": "<PATCH_HASH>",
  "sourceConfig": "https://afk.icecatgames.net/remote/PatchResource/config.<PATCH_HASH>.json"
}
```

최상위 버전 필드는 원본 데이터 매니페스트와 일치해야 합니다. `counts`는 엔터티별 출력 수와 중복 제거한 Cocos 원본 경로 수를 집계합니다. `entries[]`는 원본 엔터티와 경로, 출력 PNG 경로, 추출 방식, 크기, 바이트 수와 SHA-256을 연결합니다. 여러 엔터티가 한 스프라이트를 공유해도 안정적인 ID별 경로에 각각 PNG를 둡니다.

## 배포본과 버전 발견

추출기는 고정된 해시 파일명을 가정하지 않고 다음 연결을 순서대로 따라갑니다.

1. 배포 주소의 `index.html`에서 `System.import('./index.<hash>.js')` 엔트리를 찾습니다.
2. 엔트리 스크립트에서 `application.<hash>.js` 경로를 찾습니다.
3. 애플리케이션 스크립트에서 `settings.<hash>.json` 경로를 찾습니다.
4. 설정의 `assets.bundleVers.PatchResource`를 패치 해시로 사용해 `remote/PatchResource/config.<patch>.json`을 읽습니다.
5. 패치 설정의 `paths` 중 `00.Data/FlatBuffer/`로 시작하는 에셋 이름을 정렬해 추출 대상으로 삼습니다.

같은 설정의 `scripting.scriptPackages[0]`은 Cocos 스크립트 패키지 주소로 사용합니다. 앱 버전은 런타임의 `chunks:///_virtual/AppVersion.ts`가 내보내는 `APP_VERSION`에서 읽습니다.

## 런타임 디코딩

FlatBuffer 로더와 생성 스키마는 배포된 Cocos 런타임 안에 있으므로 Node.js에서 파일 형식을 별도로 재구현하지 않습니다.

1. 추출기는 임시 사용자 프로필과 로컬 임시 포트로 headless Chrome/Chromium을 시작하고 Chrome DevTools Protocol(CDP)에 연결합니다.
2. 게임 배포 주소를 연 뒤 SystemJS로 Cocos 스크립트 패키지를 가져옵니다.
3. `cc.assetManager`를 설정하고 `resources`, `main`, `PatchResource` 번들을 로드합니다.
4. `flat-buffer-data.ts`, `FBDataLoader.ts`, `AppVersion.ts` 가상 모듈을 가져옵니다.
5. `FBDataLoader.readBytes(assetName)`으로 바이트를 읽고 선택한 스키마의 `getRootAs<Schema>` 접근자로 루트를 만듭니다.
6. 루트가 `elementsLength()`와 `elements()`를 제공하면 각 원소를 행으로 직렬화하고, 그렇지 않으면 루트 자체를 한 행으로 직렬화합니다.

CDP의 `Runtime.evaluate`는 직렬화한 결과를 JSON 문자열로 돌려주며, Node.js가 이를 파싱해 스테이징 디렉터리에 씁니다.

### 스키마 선택

| 에셋 이름 | 선택 규칙 |
| --- | --- |
| `FBData` | `FBData` |
| 알려진 `*Config` 에셋 | 공통 `FBDataConfig` |
| `FBDataAttributeCook`, `FBDataAttributeItem`, `FBDataAttributeMonster`, `FBDataAttributePC` | 공통 `FBDataAttribute` |
| `_ko`, `_en`으로 끝나는 문자열 에셋 | 언어 접미사를 제거한 스키마 |
| 나머지 | 에셋 이름과 같은 스키마 |

직렬화기는 FlatBuffer 객체의 프로토타입 접근자를 열거합니다. `<name>Length()`가 있으면 `<name>(index)`를 배열로 읽고, 그 밖의 접근자는 단일 값으로 읽습니다. 중첩 FlatBuffer, 일반 배열, typed array와 `ArrayBuffer`도 재귀적으로 변환합니다. `bigint`는 문자열로 보존하며, 재귀 깊이가 10을 넘으면 `"[max-depth]"`를 기록합니다. 개별 접근자 호출이 실패하면 해당 필드에 `{ "_error": "..." }`를 남겨 데이터 손실을 숨기지 않습니다.

## 파생 데이터

### 보상·획득 확률

`generate-derived-data.mjs`는 다음 세 원본을 결합합니다.

- `FBDataRewardGroupListBox`: 풀 안에서 보상 그룹을 고르는 바깥쪽 `ratio`
- `FBDataPromissoryNoteQuest`: 그룹 안 항목의 `ratio`를 안쪽 `weight`로 사용
- `FBDataRewardBox`: 그룹 안 항목의 `weight`

풀을 \(L\), 선택된 바깥 항목을 \(e\), 그 항목이 가리키는 보상 그룹을 \(G_e\), 그룹 안 보상 항목을 \(t\)라고 하면 한 경로의 확률은 다음과 같습니다.

\[
P(e,t \mid L) =
\frac{r_e}{\sum_{e' \in L} r_{e'}}
\times
\frac{w_t}{\sum_{t' \in G_e} w_{t'}}
\]

같은 풀에서 `type + targetId`가 같은 결과가 여러 경로로 나오면 경로별 확률을 합산합니다. 합계가 0 이하인 바깥 풀이나 안쪽 그룹과 확률이 0 이하인 결과는 건너뜁니다. 최종 `probability`는 소수점 10자리, `percent`는 소수점 6자리로 반올림합니다.

파생 파일의 `runtimeEvidence`는 이 계산 근거로 확인한 클라이언트 런타임 심볼 `GachaProbability.computeGachaOdds`를 기록합니다. 검증기는 파생 파일을 원본 JSON에서 다시 계산하고 각 풀의 확률 합이 허용 오차 `1e-8` 안에서 1인지 확인합니다.

### 도감·강화·아이템 파생 파일

`generate-codex-data.mjs`는 원본 테이블과 `reward-probabilities.json`을 탐색용 행으로 결합합니다. 현재 열다섯 개 파일을 만듭니다. 모든 파일은 공통으로 `meta.appVersion`, `derivedAt`, `kind`, `patch`, `rowCount`, `sources`와 `rows[]`를 가지며, 계산식이나 해석 경계가 있으면 `meta.formula`, `runtimeEvidence`, `warning`에 기록합니다.

| 파일 | 목적과 결합 기준 | 주요 행 필드 |
| --- | --- | --- |
| `skill-codex.json` | `FBDataSkill`을 기준으로 `levelKey = FBDataSkillLevel.groupKey`, `id = FBDataSkillStat.skillId`, 문자열 키, 계산 가능한 일반 무공 뽑기 결과를 결합 | 표시 정보, 전투 원시 수치, 최대 레벨, 능력치 범위, `skillGachaPercent`, 이미지 경로 |
| `skill-enhancement-probabilities.json` | `FBDataSkillEnhance` 단계에 `FBDataSkillConfig.TrainingBookItemId`와 대응 `FBDataItem`을 결합 | 성공·실패율, 동일 무공 재료 수, 은량, 범용 수련서 ID·이름·이미지 |
| `equipment-enhancement-probabilities.json` | `FBDataEnhance`의 장비 계열·단계별 설정을 표시 확률로 변환 | 성공·실패·파괴·비파괴 실패율, 조건부 파괴율, 능력치 증가 원시 값, 재료 키 |
| `item-codex.json` | `FBDataItem`을 기준으로 `attrKey = FBDataAttributeItem.key`, `itemId = FBDataDropItem.itemId`, 계산 가능한 보상 `targetId`를 결합 | 표시·분류·거래 정보, 능력치, 드롭 seed 그룹 수, 계산 가능 보상 풀 수, 이미지 경로 |
| `item-acquisition-probabilities.json` | 2단계 공식으로 계산한 비무공 결과 중 `targetId`가 `FBDataItem.id`에 존재하는 행을 아이템 표시 정보와 결합 | 보상 풀, 아이템, 수량 범위, `probability`, `percent`, 원본 그룹과 런타임 근거 |
| `item-drop-weights.json` | `FBDataDropItem`을 seed 그룹별로 정규화하고 같은 `seedGroup`을 참조하는 `FBDataDropGroup` 및 `FBDataItem`을 결합 | 아이템 가중치, 그룹 가중치 합, 그룹 내부 점유율, 참조 드롭 그룹 수, 원본 `dropRate` 값 |
| `monster-codex.json` | `FBDataActorMonster`에 `id = FBDataDropCurrency.id`, `statKey = FBDataAttributeMonster.key`, `name = FBDataStringMonster_ko.key`, 스폰(`FBDataZoneSpawn` → `FBDataZone` → `FBDataZoneRegion`), 드롭 그룹을 결합 | 경험치 원본값, 레벨, 보스 여부, 능력치, 출현 지역, 드롭 그룹과 후보 아이템 |
| `monster-drop-seeds.json` | 몬스터 × seed 그룹을 한 행으로 펼치고 그룹 안 최상위 후보를 계산 | 드롭 그룹, seed 그룹, 원본 `dropRate`, 후보 수, 가중치 합, 최상위 후보 점유율 |
| `zone-atlas.json` | `FBDataZone`에 권역과 스폰을 결합하고 `actorDataId`를 몬스터·NPC로 해석 | 권역, 몬스터 수와 레벨 범위, 보스 수, NPC, 스폰 데이터 존재 여부 |
| `daily-challenge-stages.json` | 시간형 도전과 단계·지역을 연결하고, 보스형 도전은 단계별 능력치 배율과 같은 `rewardGroupKey`의 보상을 연결 | 도전 이름·단계, 해금 레벨 원본값, 지역 몬스터와 경험치 기록, 보스형 보상 |
| `collection-codex.json` | `FBDataCollection`에 `FBDataCollectionRegistry`, 표시 문자열, 대상 아이템을 결합 | 도감 이름, 분류, 보상 능력치, 등록 대상 아이템과 필요 강화 단계 |
| `collection-milestones.json` | `FBDataCollectionMilestone.rewardGroupKey`를 `FBDataCollectionMilestoneReward`로 해결하고 보상 대상을 아이템에 연결 | 분야, 누적 등록 수, 보상 타입·대상·수량 |
| `cooking-levels.json` | `FBDataCookLevel`에 `FBDataCookProb` 가중치와 같은 레벨의 `Cook_Gacha_Lv*` 계산 결과를 결합 | 필요 경험치, 조리 시간, 보관 등급, 불꽃 단계, 결과 수와 최상위 결과 |
| `refine-attribute-values.json` | `FBDataRefineAttribute`에 표시명과 `FBDataAttributeList.divisor` 기반 표시 수치를 결합 | 옵션별 D~S 최소·최대와 표시 수치 |
| `refine-options.json` | `FBDataRefine`의 옵션 가중치에 등급 가중치·슬롯 해금률·비용·연마석을 결합하고, 구성이 같은 장비 종류를 풀로 묶음 | 옵션별 가중치와 선택 확률, 슬롯별 등급 확률, 회당 비용, 풀 묶음 |

`skill-codex.json`의 이름과 설명은 `FBDataStringSkill_ko`의 키로 연결합니다. 레벨 행은 레벨 오름차순으로 정렬해 첫 단계와 마지막 단계의 공격 배율 원시 값을 선택합니다. `skillGachaPercent`는 `SkillGacha_Normal` 풀의 `type = Skill`, `targetId = skill.id`인 계산 결과가 있을 때만 채웁니다. 값이 `null`인 무공은 확률이 0이라는 뜻이 아니라 이 결합에서 계산 가능한 결과가 없다는 뜻입니다.

`item-codex.json`의 `dropSeedGroupCount`는 아이템을 포함하는 서로 다른 seed 그룹 수, `computedRewardPoolCount`는 계산된 보상에서 아이템 ID를 참조하는 서로 다른 풀 수입니다. 두 값은 획득 경로의 존재를 요약할 뿐 확률을 나타내지 않습니다.

`monster-codex.json`의 `experience`는 `FBDataDropCurrency.exp`를 환산하지 않은 정수입니다. 117종 중 98종만 같은 몬스터 ID의 경험치 행이 있으며, 나머지 19종은 `null`로 남깁니다. `daily-challenge-stages.json`의 시간형 보상은 단계에서 보상 그룹으로 이어지는 명시적 키가 없으므로 연결하지 않습니다.

### 무공·장비 강화 공식

무공 강화는 원본 `successRate`를 표시 성공률로 사용하고 실패율만 보수로 계산합니다.

\[
failurePercent = 100 - successRate
\]

장비 강화도 같은 방식으로 전체 실패율을 구합니다. `dropOnFail`이 참인 행에서만 실패 조건부 `breakRate`를 곱하고 반올림해 전체 시행 기준 파괴 표시 확률로 바꿉니다.

\[
destructionPercent =
\begin{cases}
round(failurePercent \times breakRate / 100), & dropOnFail \\
0, & \text{otherwise}
\end{cases}
\]

`nonDestructiveFailurePercent`는 `failurePercent - destructionPercent`입니다. `conditionalBreakRate`를 전체 시행의 파괴 확률로 읽으면 안 됩니다. 이 값들은 클라이언트 설정을 표시용으로 변환한 것이며 보호 효과, 이벤트·계정 보정과 실제 서버 판정을 보장하지 않습니다.

### 아이템 획득 확률과 드롭 가중치의 경계

`item-acquisition-probabilities.json`은 `GachaProbability.computeGachaOdds` 근거가 있는 2단계 보상 풀 결과만 선별하므로 해당 풀 안에서는 계산 가능한 확률입니다. 서버 난수 시드, 보장 횟수, 숨은 조건이나 실제 지급 결과는 포함하지 않습니다.

`item-drop-weights.json`의 `normalizedWeightSharePercent`는 다음과 같이 같은 `seedGroup` 안에서만 계산합니다.

\[
normalizedWeightSharePercent =
\frac{itemWeight}{\sum \max(0, candidateWeight)} \times 100
\]

이는 seed 그룹이 이미 선택됐다는 조건 아래 후보 간 상대 점유율입니다. `dropRateRawValues`는 그 seed 그룹을 참조하는 클라이언트 원시 값의 목록일 뿐, 몬스터 처치부터 seed 그룹 선택까지의 완전한 판정식은 확인되지 않았습니다. 두 값을 임의로 곱해 처치당 절대 드롭 확률이라고 단정하지 않습니다.

## 스테이징, 검증과 게시

추출기는 위키 루트 안에 `.extract-stage-*` 임시 디렉터리를 만듭니다. 게시 대상과 같은 파일시스템에 스테이징하므로 디렉터리와 파일을 `rename`으로 교체할 수 있습니다.

1. 원본 JSON과 테이블 페이지를 스테이징에 생성합니다. 사람이 관리하는 `docs/data/tables/index.md`는 기존 파일을 복사합니다.
2. 발견한 모든 FlatBuffer가 성공하지 않으면 중단합니다. 부분 추출 결과는 게시하지 않습니다.
3. 매니페스트를 쓰고 보상 확률과 여섯 도감·강화·아이템 데이터셋을 생성한 뒤, 각 파생 요약을 포함한 최종 매니페스트 두 사본을 씁니다.
4. `verify-data.mjs --root <stage>`로 스테이징 스냅샷을 검증합니다.
5. 검증이 끝난 뒤 `assets/data`, `docs/data/tables`, `_data/generated_manifest.json`을 차례로 게시합니다. 각 기존 대상은 먼저 스테이징 아래 `.rollback`으로 옮깁니다.
6. 게시 중 오류가 나면 이미 교체한 대상을 역순으로 제거하고 백업을 복구합니다. 롤백까지 실패하면 복구 자료를 보존하기 위해 스테이징 디렉터리를 삭제하지 않습니다.

각 `rename`은 같은 파일시스템 안에서 교체되지만 세 게시 대상 전체가 하나의 파일시스템 트랜잭션으로 동시에 바뀌는 것은 아닙니다. 게시 실패 시 일관성을 되찾는 방식은 보상 롤백입니다.

## 게임 아이콘 추출

`extract-game-media.mjs`는 원본 테이블의 `FBDataSkill.iconPath`와 `FBDataItem.icon`이 참조하는 공식 배포 이미지를 안정적인 엔터티 ID 경로로 변환합니다. 데이터와 별도 명령인 이유는 이미지가 FlatBuffer JSON 게시 트랜잭션에 포함되지 않기 때문입니다.

### 버전 확인과 Cocos 로딩

이미지 추출기도 `index → entry → application → settings → PatchResource config` 연결을 따라 현재 패치, Cocos 스크립트 패키지와 설정을 찾습니다. 시작할 때 데이터 매니페스트의 `patch`와 `sourceConfig`가 현재 배포본과 같은지 확인하고, Cocos 런타임을 준비한 뒤 `APP_VERSION`도 비교합니다. 하나라도 다르면 먼저 원본 데이터를 다시 추출하라는 오류와 함께 중단합니다.

런타임은 `resources`, `main`, `PatchResource` 번들을 로드한 뒤 각 원본 경로의 `<sourcePath>/spriteFrame`을 `cc.SpriteFrame`으로 읽습니다. 동일한 `sourcePath`는 한 번만 추출하지만, 결과는 무공과 아이템 ID별 경로에 각각 기록합니다.

### SpriteFrame과 아틀라스 자르기

- `SpriteFrame.rect`가 텍스처 전체이고 원본 크기와 같으며 회전되지 않은 PNG이면 `nativeUrl`의 원본 바이트를 내려받고 `mode: "original"`로 기록합니다.
- 아틀라스 일부이거나 trim·offset·회전 정보가 있으면 `originalSize` 크기의 canvas를 만들고 `rect`, `offset`, `rotated`를 적용해 스프라이트를 원래 위치에 그립니다. canvas PNG를 `mode: "sprite-crop"`으로 기록합니다.
- PNG 서명, 파일 크기 상한, 0보다 크고 8,192 이하인 가로·세로, 런타임과 실제 PNG 크기의 일치를 확인합니다. 각 결과의 바이트 수와 SHA-256도 매니페스트에 저장합니다.

모든 이미지는 `assets/images/.game-stage-*`에 먼저 생성합니다. 각 스테이징 PNG를 다시 읽어 해시와 크기를 확인한 뒤 `assets/images/game` 전체를 한 번의 디렉터리 교체로 게시합니다. 기존 디렉터리는 형제 백업으로 옮기며 새 디렉터리 게시가 실패하면 복구합니다.

원본 데이터를 갱신한 뒤에는 반드시 이미지도 다시 추출해야 합니다. 데이터 추출은 `assets/images/game`을 갱신하지 않으며, 미디어 검증은 이미지 매니페스트와 데이터 매니페스트의 앱 버전·패치·설정 주소가 같은지 요구합니다.

## 실행 방법

저장소 루트에서 실행합니다. 전체 추출에는 다음 항목이 필요합니다.

- Node.js 22 이상
- Chrome 또는 Chromium
- 게임 공개 배포 주소에 접근할 네트워크
- 저장소의 `assets/data`, `assets/images/game`, `_data`, `docs/data/tables`를 교체할 쓰기 권한

기본 배포본에서 전체 스냅샷을 다시 만듭니다. 이 명령은 파생 데이터 생성, 스테이징 검증과 게시까지 포함합니다.

```bash
node tools/extract-game-data.mjs
```

원본 데이터가 게시되면 같은 배포본에서 공식 무공·아이템 아이콘을 다시 추출합니다.

```bash
node tools/extract-game-media.mjs
```

갱신 순서는 항상 데이터 추출 후 이미지 추출입니다. 이미지 추출기는 두 스냅샷의 버전이 다르면 게시하지 않습니다.

마지막으로 개체 낱장을 다시 만듭니다. 낱장은 게시된 파생 데이터만 읽으므로 데이터·이미지 게시가 끝난 뒤에 실행합니다.

```bash
node tools/generate-entity-pages.mjs
```

낱장 생성기는 `docs/무공`, `docs/아이템`, `docs/몬스터`를 비우고 다시 쓰며, 검색창이 읽는 `assets/entity-index.json`도 함께 갱신합니다. 색인을 `assets/data` 밖에 두는 이유는 데이터 게시가 그 디렉터리를 통째로 교체하기 때문입니다.

배포 주소나 브라우저 실행 파일을 명시할 수 있습니다.

```bash
node tools/extract-game-data.mjs \
  --origin https://afk.icecatgames.net/ \
  --chrome "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

사용 가능한 옵션은 다음 명령으로 확인합니다.

```bash
node tools/extract-game-data.mjs --help
node tools/extract-game-media.mjs --help
```

## 검증 명령

저장된 스냅샷의 JSON, 매니페스트, 행 수, 생성 문서 참조와 파생 확률 재현성을 검증합니다.

```bash
node tools/verify-data.mjs
```

파생 확률만 원본 데이터에서 다시 계산해 비교하려면 다음 명령을 사용합니다. 비교할 때마다 달라지는 `meta.derivedAt`은 제외합니다.

```bash
node tools/generate-derived-data.mjs --check
```

도감·강화·아이템 파생 파일 여섯 개를 원본 데이터에서 다시 만들어 비교합니다. 이 검사도 `meta.derivedAt`은 제외합니다.

```bash
node tools/generate-codex-data.mjs --check
```

미디어 매니페스트, 원본 아이콘 참조, 안정적인 출력 경로, PNG 서명·크기·바이트 수·SHA-256과 누락·추가 파일을 검증합니다.

```bash
node tools/verify-media.mjs
```

Jekyll 빌드와 배포 기본 경로의 내부 링크까지 함께 확인하려면 다음 명령을 사용합니다.

```bash
tools/verify-jekyll.sh
```

`verify-data.mjs`는 두 데이터 매니페스트의 동일성, 안전한 파일명과 슬러그, 각 원본의 `meta`와 행 수, 누락·고아 파일, 생성 테이블 문서의 원본 참조, 성공·실패 집계, 일곱 파생 파일의 요약과 재계산 결과를 검사합니다. `tools/verify-jekyll.sh`는 데이터와 미디어를 모두 검증한 뒤 사이트를 빌드하고 링크를 검사합니다. 이 검증은 원격 배포본이 진짜인지 또는 데이터의 게임 의미가 맞는지 증명하지는 않습니다.

## 신뢰 경계와 보안

- 기본 입력은 인증이 필요 없는 공개 클라이언트 배포본입니다. 추출 결과에 서버 전용 데이터, 서버 코드, 계정 정보나 비밀 값이 포함된다고 간주하지 않습니다.
- `--origin`의 스크립트 패키지는 Chrome 안에서 실행됩니다. 신뢰할 수 없는 주소를 지정하면 그 주소의 코드를 실행하게 되므로 검증한 배포 주소만 사용해야 합니다.
- CDP는 `127.0.0.1`의 임시 포트에 열리고 Chrome 사용자 프로필은 임시 디렉터리에 만든 뒤 정상 종료 시 삭제합니다. 이는 원격 코드 자체를 안전하다고 보증하는 보안 샌드박스가 아닙니다.
- 원본 JSON의 필드와 값은 공개 클라이언트 에셋에서 관찰한 사실입니다. 필드 간 관계, 숨은 조건, 서버 보정과 실제 결과 판정은 별도 증거 없이는 확정할 수 없습니다.
- 파생 확률은 클라이언트의 공개 가중치와 확인한 런타임 공식을 재현한 계산값입니다. 서버 난수 생성, 서버 측 가중치, 이벤트 보정 또는 실제 지급 확률과 같다고 주장하지 않습니다.
- `assets/images/game`의 PNG는 공식 게임 배포본에서 도감 식별과 설명을 위해 추출한 게임 저작물입니다. 이 저장소는 이미지의 소유권, 별도 라이선스, 재배포 또는 상업적 이용 권한을 부여한다고 주장하지 않습니다.
- 이미지 이용자는 권리자의 정책과 적용 법률을 확인해야 합니다. 매니페스트의 출처·버전 정보는 기술적 추적 근거이며 저작권 허락의 증거가 아닙니다.

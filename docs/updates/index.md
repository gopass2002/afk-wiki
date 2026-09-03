---
title: 달라진 것
layout: default
permalink: /docs/updates/
description: "배포본이 바뀔 때마다 데이터에서 확인된 변경만 모아 적습니다."
---

# 달라진 것

배포본(`PatchResource`)이 바뀌면 이 위키의 숫자도 함께 바뀝니다. 여기에는 **두 스냅샷의 원본 데이터를 비교해 실제로 달라진 것만** 적습니다. 게임 안 공지가 아니라 데이터 차이가 근거이므로, 데이터에 흔적이 남지 않은 변경은 여기에 없습니다.

## 2026-09-03 · `fc96b` (앱 `1.260903.1`)

이전 스냅샷은 `ebffb`(앱 `1.260827.0`, 2026-08-28 확인)입니다. 원본 표는 118개 21,917행에서 **120개 22,238행**으로 늘었습니다.

### 새로 생긴 것

**호랑이 도장 — 기록형 일일 도전**

60초 동안 100레벨 보스 **산군**에게 넣은 피해로 순위를 매기는 새 도전입니다. 캐릭터 30레벨에 열립니다.

- 입장에는 `호랑이 도장 입장패`가 듭니다. 매일 1개가 채워지고, 시스템 상점에서 은량 100,000에 하루 10개까지 더 삽니다.
- 완주하면 `산군의 상자` 1개를 받습니다.
- 순위 보상은 협전입니다. 1위 5, 2위 4, 3위 3, 4~10위 2, 11~100위 1.
- 산군은 최대 생명력 20억, 방어력 6,000, 공격력 400으로 기록되어 있습니다. 잡는 것이 아니라 60초 안에 얼마나 깎는지를 겨루는 구조입니다.
- 무대는 새 지역 `호랑이 굴`이며, 지역당 인원은 1명입니다.

[일일 도전 단계]({{ '/docs/data/derived/daily-challenge-stages/' | relative_url }}) · [산군]({{ '/docs/몬스터/산군/' | relative_url }}) · [호랑이 굴]({{ '/docs/지역/호랑이-굴/' | relative_url }})

**흑랑의 소굴 4단계 — 매우 어려움**

시간형 도전 `흑랑의 소굴`에 네 번째 단계가 붙었습니다. 80레벨에 열리고, 93레벨 흑랑과 95레벨 흑랑 우두머리가 나옵니다. 두 몬스터 모두 새로 추가된 개체입니다.

[흑랑의 소굴 93-95레벨]({{ '/docs/지역/흑랑의-소굴-93-95레벨/' | relative_url }}) · [흑랑 93레벨]({{ '/docs/몬스터/흑랑-93레벨/' | relative_url }})

**무공 10가지 — 문파별 유일·전설 패시브**

무기를 장착했을 때 능력치가 붙는 패시브가 문파마다 두 가지씩 늘었습니다. 모두 최대 10레벨이고, 일반 무공 뽑기 계산표에도 들어 있습니다.

| 문파 · 무기 | 유일 | 전설 |
| --- | --- | --- |
| 화산 · 검 | [매화점개]({{ '/docs/무공/매화점개/' | relative_url }}) — 힘 증가 | [매화만개]({{ '/docs/무공/매화만개/' | relative_url }}) — 보스 피해 증가 |
| 팽가 · 도 | [호골웅신]({{ '/docs/무공/호골웅신/' | relative_url }}) — 힘 증가 | [도황파산]({{ '/docs/무공/도황파산/' | relative_url }}) — 공격력 증가 |
| 양가 · 창 | [백보천양]({{ '/docs/무공/백보천양/' | relative_url }}) — 명중 증가 | [창제무쌍]({{ '/docs/무공/창제무쌍/' | relative_url }}) — 최종 피해 증가 |
| 소림 · 봉 | [항마신행]({{ '/docs/무공/항마신행/' | relative_url }}) — 민첩 증가 | [사자후]({{ '/docs/무공/사자후/' | relative_url }}) — 무공 위력 증가 |
| 당가 · 암기 | [촌철살인]({{ '/docs/무공/촌철살인/' | relative_url }}) — 치명타 확률 증가 | [만천화우]({{ '/docs/무공/만천화우/' | relative_url }}) — 민첩 증가 |

**그 밖에**

- 원본 표 두 개가 새로 생겼습니다: [daily-dungeon-dps-boss]({{ '/docs/data/tables/daily-dungeon-dps-boss/' | relative_url }}), [daily-dungeon-dps-rank-reward]({{ '/docs/data/tables/daily-dungeon-dps-rank-reward/' | relative_url }}).
- 숨은 능력치 두 가지가 능력치 목록에 추가됐습니다: `CRIT_RATE_RES`, `CRIT_DMG_RES`. 표시 이름이 배포본에 없어 낱장에서는 키 그대로 보입니다. 현재 이 값을 가진 것은 산군뿐입니다.
- `PvpField` 종류의 지역 한 곳이 지역 표에 들어왔지만 이름도 스폰 데이터도 없습니다. 아직 쓰이지 않는 자리로 보이며, 그 이상은 데이터로 알 수 없습니다.

### 숫자가 바뀐 것

- **흑랑 계열 경험치가 3배**가 됐습니다. 31레벨 흑랑 4,375 → 13,125, 33레벨 흑랑 우두머리 5,250 → 15,750, 73레벨 흑랑 27,500 → 82,500처럼 여섯 개체 모두 같은 배수입니다.
- **흑랑의 소굴 하루 입장 시간이 4시간에서 1시간**으로 줄었습니다.
- 흑랑 계열 **드롭 그룹의 원시 `dropRate` 값도 3배**가 됐습니다.
- **경매 기준가가 크게 내렸습니다.** 등급별 기준가가 10 → 1, 20 → 2, 30 → 2, 50 → 3, 150 → 10, 5,000 → 500으로 바뀌었고, 94개 행이 모두 내렸습니다.
- 의상 상점의 `매화 도복` 값이 18,000에서 **1,800**으로 내렸습니다.
- 2장 해금 조건 퀘스트가 84번에서 **411번**으로 바뀌었습니다.
- 자동 연마 관련 UI 문자열과 `매우 어려움` 난이도 문자열이 추가됐습니다. 표시 문자열만 있고 제련 계산에 쓰이는 수치는 그대로입니다.

### 아직 계산하지 못하는 것

`산군의 상자`의 내용물은 `reward-box`의 `Box_Sanggun` 13행에 가중치로 기록되어 있습니다. 그러나 이 그룹을 고르는 바깥 풀(`reward-group-list-box`)이 배포본에 없어, 이 위키의 [확률 계산표]({{ '/docs/data/derived/item-acquisition-probabilities/' | relative_url }})에는 넣지 않았습니다. 바깥 단계를 모르는 채 안쪽 가중치만으로 확률을 적지 않습니다.

{% capture note %}
이 쪽의 내용은 두 스냅샷의 `assets/data/raw/*.json`을 개체 ID 단위로 비교해 얻은 차이입니다. 새 값은 현재 스냅샷(`{{ site.data.generated_manifest.appVersion }}` / `{{ site.data.generated_manifest.patch }}`)에서 그대로 읽을 수 있고, 이전 값은 이 저장소의 직전 커밋에 남아 있습니다.

바뀐 표: [actor-monster]({{ '/docs/data/tables/actor-monster/' | relative_url }}) · [skill]({{ '/docs/data/tables/skill/' | relative_url }}) · [zone]({{ '/docs/data/tables/zone/' | relative_url }}) · [zone-spawn]({{ '/docs/data/tables/zone-spawn/' | relative_url }}) · [item]({{ '/docs/data/tables/item/' | relative_url }}) · [drop-currency]({{ '/docs/data/tables/drop-currency/' | relative_url }}) · [drop-group]({{ '/docs/data/tables/drop-group/' | relative_url }}) · [reward-box]({{ '/docs/data/tables/reward-box/' | relative_url }}) · [auction-price-group]({{ '/docs/data/tables/auction-price-group/' | relative_url }}) · [shop-product]({{ '/docs/data/tables/shop-product/' | relative_url }}) · [content-unlock]({{ '/docs/data/tables/content-unlock/' | relative_url }}) · [daily-dungeon-time-field]({{ '/docs/data/tables/daily-dungeon-time-field/' | relative_url }}) · [daily-dungeon-time-field-tier]({{ '/docs/data/tables/daily-dungeon-time-field-tier/' | relative_url }})

게임 안 공지와 이 목록이 다를 수 있습니다. 여기 있는 것은 배포본 데이터에서 확인된 변경뿐이며, 서버에서만 바뀐 것은 보이지 않습니다.
{% endcapture %}
{% include source-note.html body=note %}

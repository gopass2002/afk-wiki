---
title: 수집 도감
layout: data
description: "도감 항목 561개의 등록 조건 아이템, 강화 단계와 완성 보상 능력치"
permalink: /docs/data/derived/collection-codex/
data_file: "/assets/data/derived/collection-codex.json"
data_asset: "수집 도감 파생 데이터"
data_schema: "FBDataCollection + CollectionRegistry + StringCollection_ko + Item"
data_manifest_key: "collectionCodex"
data_category: "도감"
data_fields: ["image", "name", "category", "rewardAttributes", "registrationCount", "registrations", "id"]
data_unit: "가지"
method: |
  `FBDataCollection` 561행(장비 431 · 요리 130)을 표시 이름(`FBDataStringCollection_ko`)과 등록 규칙 1,228행에 결합했습니다. 등록 대상은 모두 `Item` 타입이며 1,228행 전부 `FBDataItem`에서 해결됩니다.

  `registrations`의 `enhanceLevel`은 등록에 필요한 강화 단계, `requiredCount`는 필요 수량입니다. `rewardAttributes`는 항목 완성 시 기록된 보상 능력치이며, 실제 지급 시점과 중복 적용 규칙은 서버가 판정합니다. 단계별 누적 보상은 [도감 단계 보상]({{ '/docs/data/derived/collection-milestones/' | relative_url }})에 있습니다.
---

도감에 등록할 수 있는 561가지입니다. 장비 431가지와 요리 130가지가 있고, 각 항목마다 **몇 개를 등록해야 하는지**와 등록했을 때 **영구히 붙는 능력치**를 함께 적었습니다.

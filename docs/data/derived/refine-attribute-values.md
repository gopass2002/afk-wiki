---
title: 제련 옵션 수치 범위
layout: data
description: "제련 옵션 32종의 D~S 등급별 최소·최대 수치"
permalink: /docs/data/derived/refine-attribute-values/
data_file: "/assets/data/derived/refine-attribute-values.json"
data_asset: "제련 옵션 수치 파생 데이터"
data_schema: "FBDataRefineAttribute + StringAttributeList_ko"
data_manifest_key: "refineAttributeValues"
data_category: "장비·성장"
data_fields: ["label", "attrKey", "grade", "displayMin", "displayMax", "percentDisplay", "min", "max", "fixed", "displayDivisor", "gradeId", "id"]
---

`FBDataRefineAttribute` 160행(옵션 32종 × 등급 5단계)에 한국어 표시명을 연결했습니다. `grade`의 D~S는 원본 `grade` 1~5를 오름차순으로 대응시킨 것이며, `fixed`가 참이면 최소·최대가 같아 값이 고정입니다. `displayMin`·`displayMax`는 원시 값을 `FBDataAttributeList.divisor`로 나눈 표시용 수치이며, `percentDisplay`가 참인 옵션은 백분율로 읽습니다.

옵션 32종 중 실제 장비 풀에 등장하는 것은 28종입니다. 나머지 4종(`EXP_BONUS`, `GOLD_BONUS`, `EVA`, `POTION_BONUS`)은 수치 표에만 존재하며 [옵션 풀]({{ '/docs/data/derived/refine-options/' | relative_url }})의 `attrKey`에는 나타나지 않습니다.

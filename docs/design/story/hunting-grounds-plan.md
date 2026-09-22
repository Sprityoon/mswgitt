# 사냥터 전면 재설계 — 전용 맵 템플릿 + 보스 순차 해금 (hunting-grounds-plan)

> 작성: 2026-09-10 / ⚖️ **2026-09-22 전면 정립 (제작자 확정)**.  
> 상위 문서: [story-bible.md](./story-bible.md) · [quest-design.md](./quest-design.md) · [hunting-grounds-ecosystem-plan.md](./hunting-grounds-ecosystem-plan.md)  
> 데이터 계약: `PortalDestinationDataSet` · `BiomeDataSet` · `MonsterSpawnDataSet` · `ItemDropDataSet` · `QuestDataSet`

---

## 0. 핵심 아키텍처 원칙 (⚖️ 2026-09-22 확정)

### ① 초보 사냥터 3단계 (`hunt01` ~ `hunt03`) 보존
- `hunt01`, `hunt02`, `hunt03`은 **초보 사냥터인 "흙 벌판(earth_field)" 3단계 구역**이다.
- 이 세 구역을 순차적으로 진행(`hunt01` ➔ `hunt02` ➔ `hunt03`)한 뒤, 3구역 끝자락 관문에서 **초반 관문 보스인 슬라임킹 (`slime_king` / `template_boss`)**으로 넘어간다.
- `hunt01`~`hunt03`에 바위나 사막 등의 상위 바이옴을 덮어씌우지 않는다.

### ② 슬라임킹 처치 후 상위 바이옴 사냥터 순차 해금
- 슬라임킹 처치 시 비로소 다음 컨셉인 **바위 고원(`rocky01`)**이 해금된다 (`SlimeKing.UnlockWaypointId = "rocky01"`).
- 바위 고원 보스(스톤골렘) 처치 시 ➔ **모래 언덕(`desert01`)** 해금
- 모래 사막 보스(데우) 처치 시 ➔ **만년 설원(`snow01`)** 해금

### ③ 프로젝트 맵 템플릿 vs 인게임 맵 인스턴스의 구분
- **맵 템플릿 (`map/template_*.map`, `map/field_earth.map`)**:
  - 프로젝트 파일 시스템에 저장되는 원본 맵 에셋.
  - 컨셉마다 고유한 지형·타일셋(Rock/Sand/Snow 13종)·소품이 베이킹되어 있다.
- **맵 인스턴스 (`hunt01`~`hunt03`, `rocky01`, `desert01`, `snow01`)**:
  - 인게임 런타임에서 `ResourceSpawner.mlua`가 `EnsureHuntMap`을 통해 템플릿으로부터 복제·생성하여 동적으로 유지하는 실제 플레이 맵.
  - `PortalDestinationDataSet.csv`가 인스턴스명(`MapName`)과 원본 템플릿(`TemplateMap`)의 매핑 계약을 담당한다.

---

## 1. 전체 구조 — 초보 벌판 3단계 + 상위 3대 바이옴 순차 해금

```
마을 (town)
  │
  ├─ [초보 1막: 흙 벌판 3단계]
  │    └─ hunt01 (흙 벌판 1구역)
  │         └─ hunt02 (흙 벌판 2구역)
  │              └─ hunt03 (흙 벌판 3구역)
  │                   └─ 👑 보스: 슬라임킹 (template_boss)
  │
  ├─ [2막: 바위 고원] (슬라임킹 처치 시 해금)
  │    └─ rocky01 (바위 고원) ── 👑 보스: 울림돌 파수꾼 (스톤골렘)
  │
  ├─ [3막: 모래 언덕] (스톤골렘 처치 시 해금)
  │    └─ desert01 (모래 언덕) ── 👑 보스: 마른 우물의 지킴이 (데우)
  │
  └─ [4막: 만년 설원] (데우 처치 시 해금)
       └─ snow01 (만년 설원) ── 👑 보스: 서리 그늘 (스노우맨)
```

- **필드 동선**: 각 구역 대각선 반대편 끝에 물리적인 전진 포탈(`PortalForward`)이 존재하며, 동시에 영지 중앙 단일 차원 관문(`WarpPopup`)에서 해금된 구역으로 자유롭게 이동할 수 있다 (방안 B 웨이포인트).
- **히든 사냥터**: 영지 중앙 단일 포탈(`WarpPopup`) 목록에 절대 노출되지 않으며, 전용 퀘스트 설치물이나 필드 비밀 통로로만 독립 운영된다.

### 1.1 맵 템플릿 및 인스턴스 매핑 계획

| 구분 | 인게임 인스턴스 ID (`MapName`) | 프로젝트 맵 템플릿 (`TemplateMap`) | 바이옴 ID | 테마 및 타일셋 |
|---|---|---|---|---|
| **초보 벌판 1** | `hunt01` | `map/field_earth.map` | `earth_field` | 흙 벌판 1구역 (검은 이슬 웅덩이, Grass/Soil) |
| **초보 벌판 2** | `hunt02` | `map/template_field.map` | `earth_field` | 흙 벌판 2구역 (구리 채광 및 벌판 호수) |
| **초보 벌판 3** | `hunt03` | `map/template_field.map` | `earth_field` | 흙 벌판 3구역 (벌판 심층 ➔ 끝에 슬라임킹 로비 포탈) |
| **슬라임킹** | `raid_*` / `template_boss` | `map/template_boss.map` | `green_island` | 1막 보스 아레나 |
| **바위 고원** | `rocky01` | `map/template_rocky.map` | `rocky` | 2막 바위 고원 (Rock 13종 타일셋, 암반과 호수) |
| **모래 언덕** | `desert01` | `map/template_desert.map` | `desert` | 3막 모래 언덕 (Sand 13종 타일셋, 오아시스와 능선) |
| **만년 설원** | `snow01` | `map/template_snow.map` | `snowfield` | 4막 만년 설원 (Snow 13종 타일셋, 빙하와 설로) |


---

## 2. 구역별 상세 설계

### 2.1 1막 — 초보 흙 벌판 3단계 (`hunt01` ~ `hunt03`)

- **무드**: 마을 문밖 야트막한 들. 밝고 낯익은데 군데군데 풀이 **검게 젖어** 있다. 코지 기반 위의 옅은 이상 신호.
- **인스턴스 & 템플릿**:
  - `hunt01` (1구역): `map/field_earth.map` (S자 흙길 + 검은 이슬 웅덩이 5곳 + 야생 소품)
  - `hunt02` (2구역): `map/template_field.map` (구리 광맥 채광 + 벌판 웅덩이)
  - `hunt03` (3구역): `map/template_field.map` (벌판 심층부 ➔ 끝자락에 슬라임킹 로비 포탈)
- **몬스터 라인업**: 슬라임(주력), 리본돼지, 주황버섯, 와일드보어
- **주요 채집/자원**: 구리 원석(`Copper Ore`), 일반 목재, 잡석, 약초

**1막 관문 보스 — 「슬라임킹」 (`slime_king` / `SlimeKing.model`)** 👑
- **무대**: `map/template_boss.map` (`hunt03` 끝자락 포탈을 통해 진입)
- **컨셉**: 흙 벌판 옛 정원의 이슬을 머금고 거대해진 슬라임들의 제왕.
- **패턴**:
  1. **도약 강타 (`LEAP`)** — 플레이어 위치로 높이 도약 후 충격파.
  2. **이슬 슬라임 소환 (`MINION`)** — 일반 슬라임 소환.
  3. **지진 분노 (`STOMP`)** — 바닥 진동 후 연속 피해.
- **역할**: **전투 조작 및 패턴 회피의 첫 교보재**.
- **해금 트리거**: 격파 시 **`rocky01` (바위 고원) 웨이포인트 해금** (`SlimeKing.UnlockWaypointId = "rocky01"`).

---

### 2.2 2막 — 바위 고원 「바위 메아리」 (`rocky01`)

- **무드**: 회색 바위 사이로 바람이 낮게 우는 거친 고원. 잿빛 암반과 깊은 협곡.
- **인스턴스 & 템플릿**: `rocky01` / `map/template_rocky.map` (Rock 13종 전용 타일셋 적용)
- **지형 개성**: 큰 바위 군락이 미로처럼 시야를 끊는 닫힌 공간감. 고원 중앙에 울림돌 광장 배치.
- **몬스터 라인업**: 스텀프(단단한 방어), 아이언호그(철갑 돌진), 뿔버섯(원거리 포자 투사체)
- **주요 채집/자원**: 철 광석(`Iron Ore`), 단단한 목재, 바위 파편

**2막 보스 — 「울림돌의 파수꾼 스톤골렘」 (`stone_golem` / `StoneGolem.model`)** 👑
- **컨셉**: 고원의 거대 암반과 유적 파편에 그늘이 엉겨 일어선 거대 수호자.
- **패턴**:
  1. **대지 강타 (`SLAM`)** — 높이 솟구쳐 낙하하며 광범위 충격파.
  2. **바위 파편 난사 (`RANGED`)** — 8방향으로 날카로운 바위 파편 투척.
  3. **울림 포효 (광역 엄폐 기믹)** — 광장 전체 충격파. **울림돌(거대 암석) 뒤로 숨으면 피해 무효**.
- **해금 트리거**: 격파 시 **`desert01` (모래 언덕) 웨이포인트 해금** (`StoneGolem.UnlockWaypointId = "desert01"`).

---

### 2.3 3막 — 모래 언덕 「모래에 잠든 길」 (`desert01`)

- **무드**: 뜨겁고 위험한 사막이 아니라 낮잠처럼 고요한 노을빛 모래 언덕.
- **인스턴스 & 템플릿**: `desert01` / `map/template_desert.map` (Sand 13종 전용 타일셋 적용)
- **지형 개성**: 완만한 모래 능선과 오아시스, 모래에 반쯤 묻힌 첫 개척단의 마른 우물과 수레 잔해.
- **몬스터 라인업**: 모래두지(지중 기습), 카투스(선인장 가시 연사), 스콜피온(독침 찌르기), 벨라모아(사막 뱀)
- **주요 채집/자원**: 고대 석판 조각, 선인장 가시/섬유, 전갈 키틴질 껍질, 보석 원석

**3막 보스 — 「마른 우물의 지킴이 데우」 (`deu` / `Deu.model`)** 👑
- **컨셉**: 옛 개척단의 마른 우물을 지키던 고대 선인장 정령이 잠식된 서글픈 수호자.
- **패턴**:
  1. **모래 소용돌이 (`VORTEX`)** — 우물 중앙으로 플레이어를 흡인하는 이동 방해.
  2. **가시 폭풍 (`THORN_STORM`)** — 지면에 5개 연속 예고 원 생성 후 거대 가시 기둥 분출.
  3. **메마름의 저주** — 플레이어 스태미나 자연 회복 일시 차단 (수원지 상호작용으로 정화).
- **해금 트리거**: 격파 시 **`snow01` (만년 설원) 웨이포인트 해금** (`Deu.UnlockWaypointId = "snow01"`).

---

### 2.4 4막 — 만년 설원 「눈밭의 대답」 (`snow01`)

- **무드**: 첫 정원에서 도망친 어둠의 본체가 숨어든 극한의 만년설 지대.
- **인스턴스 & 템플릿**: `snow01` / `map/template_snow.map` (Snow 13종 전용 타일셋 적용)
- **지형 개성**: 새하얀 눈밭과 얼어붙은 빙하 절벽, 눈보라가 몰아치는 설로.
- **몬스터 라인업**: 주니어 예티 & 예티(완력과 분열), 페페(무리 군집), 화이트팽(도약 맹수)
- **주요 채집/자원**: 얼음 파편, 설원 모피, 만년설 결정, 단단한 뿔

**4막 보스 — 「설원의 거인 스노우맨」 (`snowman` / `Snowman.model`)** 👑
- **컨셉**: 설원의 순백에 스며든 그늘의 핵을 품은 거대한 눈사람 거인.
- **패턴**:
  1. **눈뭉치 굴리기 (`BOULDER`)** — 전방으로 거대한 눈뭉치를 굴려 경로 상 다단 피해.
  2. **혹한의 눈보라 (`BLIZZARD`)** — 광범위 시야 제한 및 이동 속도 감속 장판.
  3. **서리 강타** — 전방 지면을 내리쳐 얼음 송곳을 솟구치게 함.

---

## 3. 데이터 및 이동 시스템 계약

### 3.1 `PortalDestinationDataSet.csv` (정규 사냥터 웨이포인트 목록)

영지 중앙 단일 포탈(`WarpPopup`)에서 참조하며, `ResourceSpawner.mlua`가 런타임에 맵 인스턴스를 생성할 원본 템플릿(`TemplateMap`)과 바이옴을 정의한다.

| DestinationId | MapName | DisplayName | UnlockType | Group | TemplateMap | Biome | 해금 조건 |
|---|---|---|---|---|---|---|---|
| `town` | `town` | 마을 | always | town | | | 기본 개방 |
| `hunt01` | `hunt01` | 흙 벌판 1구역 | always | rookie | `field_earth` | `earth_field` | 기본 개방 |
| `hunt02` | `hunt02` | 흙 벌판 2구역 | waypoint | rookie | `template_field` | `earth_field` | 도보 도달 |
| `hunt03` | `hunt03` | 흙 벌판 3구역 | waypoint | rookie | `template_field` | `earth_field` | 도보 도달 |
| `rocky01` | `rocky01` | 바위 고원 | waypoint | rookie | `template_rocky` | `rocky` | **1막 관문 슬라임킹 처치** |
| `desert01` | `desert01` | 모래 언덕 | waypoint | rookie | `template_desert` | `desert` | **2막 관문 스톤골렘 처치** |
| `snow01` | `snow01` | 만년 설원 | waypoint | rookie | `template_snow` | `snowfield` | **3막 관문 데우 처치** |

> 🔴 **히든 사냥터 절대 격리 원칙**:
> - 중앙 단일 포탈(`WarpPopup` / `PortalDestinationDataSet`)에 히든 사냥터를 등록하지 않는다.
> - 히든 사냥터는 오직 전용 퀘스트 설치물(가구)이나 특정 필드의 숨겨진 비밀 입구로만 독점 진입한다.

### 3.2 몬스터 스폰 데이터 (`MonsterSpawnDataSet.csv`)

| Biome | MonsterModelId | Weight | 역할 |
|---|---|---|---|
| `earth_field` | `slime`, `ribbon_pig`, `orange_mushroom`, `boar` | 70, 60, 40, 30 | 초보 흙 벌판 생태계 |
| `rocky` | `stump`, `iron_hog`, `horn_mushroom` | 70, 60, 50 | 바위 고원 생태계 |
| `desert` | `moredji`, `catus`, `scorpion` | 70, 60, 50 | 모래 사막 생태계 |
| `snowfield` | `jr_yeti`, `pepe`, `white_fang`, `yeti` | 70, 60, 50, 30 | 만년 설원 생태계 |

### 3.3 관문 보스 드롭 데이터 (`ItemDropDataSet.csv`)

```csv
slime_king,,slime_jelly,8,14,1.0
slime_king,,recipe_scroll_copper,1,1,1.0
stone_golem,,iron_ore,8,16,1.0
stone_golem,,recipe_scroll_iron,1,1,1.0
deu,,cactus_flower,4,8,1.0
deu,,chitin_shell,6,12,1.0
snowman,,snow_crystal,5,10,1.0
snowman,,ice_piece,8,15,1.0
```

---

## 4. 퀘스트 연결 및 관문 구조

모든 보스 퀘스트는 단순 선택이 아닌 **다음 단계 진입을 여는 관문 퀘스트**다.

| 챕터 | 주요 무대 | 핵심 퀘스트 | 관문 보스 퀘스트 | 해금 효과 |
|---|---|---|---|---|
| 2막 검은 이슬 | 흙 벌판 (`hunt01`~`03`) | 211~216 (슬라임·구리 채광·제련) | **217 「이슬을 머금은 왕」** (`slime_king`) | `rocky01` 웨이포인트 해금 |
| 3막 바위 메아리 | 바위 고원 (`rocky01`) | 221~226 (스텀프·아이언호그·철 채광) | **227 「울림돌의 파수꾼」** (`stone_golem`) | `desert01` 웨이포인트 해금 |
| 4막 모래에 잠든 길 | 모래 언덕 (`desert01`) | 231~235 (모래두지·카투스·우물 단서) | **236 「마른 우물의 지킴이」** (`deu`) | `snow01` 웨이포인트 해금 |
| 5막 만년 설원 | 만년 설원 (`snow01`) | 241~245 (예티·페페·설원 조사) | **246 「설원의 거인」** (`snowman`) | 설원 평정 및 최종 엔드 정원 개방 |

---

## 5. 구현 완료 및 현황 정리 (2026-09-22 ⚖️)

1. ✅ **타일셋 39종 구축 완료**:
   - Rock(바위 고원) 13종, Sand(모래 언덕) 13종, Snow(만년 설원) 13종 제작 및 `wall.tileset` 등록 완료.
2. ✅ **템플릿 맵 5종 에셋 구축 완료**:
   - `map/field_earth.map`: 흙 벌판 1구역 전용 템플릿
   - `map/template_field.map`: 흙 벌판 2/3구역 공용 템플릿
   - `map/template_rocky.map`: 바위 고원 전용 템플릿
   - `map/template_desert.map`: 모래 언덕 전용 템플릿
   - `map/template_snow.map`: 만년 설원 전용 템플릿
3. ✅ **사냥터 인스턴스화 & 포탈 엔진 정합**:
   - `ResourceSpawner.mlua`에서 `hunt01`~`hunt03` 도보 전진 포탈 체인과 `rocky01`, `desert01`, `snow01` 템플릿 기반 동적 생성 로직 완비.
   - 보스 모델(`SlimeKing`, `StoneGolem`, `Deu`)에 처치 시 다음 구역 웨이포인트 해금(`UnlockWaypointId`) 바인딩 완료.
4. ✅ **만년 설원 몬스터 모델 및 아이템 완비**:
   - `JrYeti`, `Yeti`, `Pepe`, `WhiteFang`, `Snowman` 모델 5종 및 전리품 5종 구축 완료.

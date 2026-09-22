# 사냥터 몬스터 RUID 색인 & 스탯/공격 제안 (hunting-grounds-ruid-index)

> **작성일**: 2026-09-22
> **상위 문서**: [hunting-grounds-ecosystem-plan.md](./hunting-grounds-ecosystem-plan.md)
> **RUID 출처**: MSW 공식 리소스 검색 API (`msw-search` / `msw_resource_api.cjs`) — 전부 실제 조회 응답에서 채취, 추정·조합 없음
> **소비처**: `MonsterAI`(StandRUID/MoveRUID/AttackRUID/DieRUID) · `SpriteRendererComponent.SpriteRUID` · `MonsterCoinDropDataSet.IconRUID` · `item_dataset.IconRUID`

---

## 0. 적용 규칙 (모델 제작 시 반드시 지킬 것)

1. **RUID 타입 구분** — 아래 몬스터 표의 RUID는 전부 `animationclip`이다. `MonsterAI.StandRUID/MoveRUID/AttackRUID/DieRUID`와 `SpriteRendererComponent.SpriteRUID`에 그대로 넣는다. `item_dataset.IconRUID` / `MonsterCoinDropDataSet.IconRUID`에는 **`sprite` 타입**만 넣는다(각 몬스터의 `stand.frame0` 열 사용).
2. **좌우 방향** — mob 리소스는 전부 **좌향 작화**다. 몬스터 모델은 `SpriteRendererComponent.FlipX`가 아니라 **`TransformComponent.Scale.x` 부호를 반전**해야 콜라이더와 스프라이트가 어긋나지 않는다(기존 Slime/Boar 선례와 동일).
3. **크기 환산** — 1 unit = 100 px. 표의 `px` 값을 100으로 나눈 값이 대략적인 유닛 크기다(예: 스톤골렘 179×159 → 약 1.8×1.6 units). 타일 그리드 대비 과대한 몬스터는 `Transform.Scale`로 축소하고 콜라이더를 함께 맞춘다.
4. **`hit1` 클립은 현재 소비처가 없다** — `MonsterAI`에 HitRUID 프로퍼티가 없고 피격 연출은 `Monster:FlashHit()`(틴트)로 처리한다. 색인에는 남겨 두되, 채택하려면 스크립트 확장이 선행되어야 한다.
5. **CONTACT 몬스터 팩에는 `attack` 클립이 없다** — 리본돼지·주황버섯·스텀프·페페 등은 `stand/move/jump/hit1/die1`만 제공된다. `AttackRUID`는 `jump`(있으면) 또는 `move`를 재사용한다.
6. **`_audio/Damage`·`_audio/Die`** 는 `effect`(효과음) / `voice` 타입이다. 현재 몬스터 파이프라인은 피격음을 **공격자 도구의 `HitSoundRUID`**로 재생하므로(`Monster.HandleHitEvent`), 몬스터 고유 음성을 쓰려면 별도 배선이 필요하다. 색인만 해 둔다.

---

## 1. F1 흙 벌판 (`earth_field`) — **최우선**

### 1.1 `ribbon_pig` 리본돼지 — 팩 `mob/1210101.img`

| 용도 | rel_path | 타입 | RUID | 크기/프레임 |
|---|---|---|---|---|
| `SpriteRUID` / `StandRUID` | `stand` | animationclip | `6a699b8c31b94474bb795c7394c3af3b` | 69×49 / 3f |
| `MoveRUID` | `move` | animationclip | `efd4d44e0da7496bac4c350def33a108` | 68×52 / 3f |
| `AttackRUID` (몸통 박치기 대용) | `jump` | animationclip | `a09f56642db6409b8a41bb97106425db` | 68×52 / 1f |
| `DieRUID` | `die1` | animationclip | `77f8f34df8cc4ba6ae188fd2f1b28bc4` | 69×55 / 3f |
| (미사용) 피격 | `hit1` | animationclip | `ee7bf6fc53fc48df82db872d8827310a` | 60×56 / 1f |
| 도감 아이콘 (`IconRUID`) | `stand.frame0` | sprite | `95ee32092238462dbdbe65591979bf18` | — |
| 피격음 | `_audio/Damage` | effect | `b5bc1177f5a44e868195ff2f38287e97` | — |
| 사망음 | `_audio/Die` | voice | `79bfbaa52940459fa25d4329389fd895` | — |

### 1.2 `orange_mushroom` 주황버섯 — 팩 `mob/1210102.img`

> 검색 1순위로 `mob/9010026.img`(「추억의 주황버섯」 이벤트 리스킨)가 잡히지만, **정규 리소스는 `mob/1210102.img`** 다. 이쪽을 채택한다.

| 용도 | rel_path | 타입 | RUID | 크기/프레임 |
|---|---|---|---|---|
| `SpriteRUID` / `StandRUID` | `stand` | animationclip | `a95cfed2c8fe4d2cb64cbb62db051f92` | 64×58 / 2f |
| `MoveRUID` | `move` | animationclip | `8257566e41aa4234929e81c6c2dab2e4` | 64×60 / 3f |
| `AttackRUID` (점프 쿵쿵 바디어택) | `jump` | animationclip | `6df12df0c9ce4caea61385606a4d40d3` | 64×64 / 1f |
| `DieRUID` | `die1` | animationclip | `dddbe2f162184ec89add7440da56eb75` | 61×52 / 3f |
| (미사용) 피격 | `hit1` | animationclip | `5ebbdaf503964f3e87de155d16650805` | 64×68 / 1f |
| 도감 아이콘 (`IconRUID`) | `stand.frame0` | sprite | `ca3a6ed536d24949b79d3f7b430cb82a` | — |
| 피격음 | `_audio/Damage` | effect | `6eb2ef8a783c4393bd7ee6a2c199bda7` | — |
| 사망음 | `_audio/Die` | voice | `c49646f7299e4c6e81e953c96e20b294` | — |

### 1.3 F1 전리품 아이콘 (`item_dataset.IconRUID`, 전부 `sprite`/`item`)

| 신규 아이템 id | 표시명 제안 | IconRUID | 원본명 / 크기 |
|---|---|---|---|
| `pig_ribbon` | 돼지 리본 | `0c2847f2816d47f092f8348122008d7b` | 「돼지의 리본」 32×32 |
| `orange_mushroom_cap` | 주황버섯 갓 | `0ed1b7cbeece48fa87e5f9ea37096d8d` | 「주황버섯의 갓」 32×28 |
| `boar_leather` | 멧돼지 가죽 | `0168adce54424b6abd9e6bc9db2ddb36` | 「동물의 가죽」 32×32 |

> `raw_meat`(`90386dd054bf4acfa2b363d5d1c45478`), `slime_jelly`(`89ff14273d9940eebe8d44b003563915`)는 `item_dataset`에 이미 존재 — 재사용.

### 1.4 F1 스탯 / 공격 제안

기준선: `Monster` 기본값 MaxHp 30 · Defense 6, `MonsterMeleeAttack` 기본값 ContactDamage 5 · TouchDamage 2.
**신규 몬스터는 바이옴 고유종이므로 `MonsterSpawnDataSet`의 배율은 1.0으로 두고 모델 기본값에 티어를 반영한다** (기존 slime/boar/horn_mushroom 행의 배율 재탕 구조를 신규 종에는 쓰지 않는다).

| 항목 | `ribbon_pig` | `orange_mushroom` |
|---|---|---|
| `Monster.MaxHp` | 26 | 40 |
| `Monster.Defense` | 4 | 7 |
| `Monster.RespawnOn` | false (스포너 관리) | false |
| `MonsterAI.AttackType` | `CONTACT` | `CONTACT` |
| `ContactDamage` / `TouchDamage` | 4 / 2 | 6 / 3 |
| `AttackBoxSize` | 2.0 | 2.4 |
| `DetectRange` | 6.5 (넓고 민첩) | 5.0 (둔함) |
| `AttackRange` / `StopDistance` | 1.0 / 0.75 | 1.1 / 0.85 |
| `AttackWindup` / `AttackCooldown` | 0.30 / 1.1 | 0.55 / 1.7 |
| `LeashRange` | 14 | 12 |
| `TelegraphOn` | false | false |
| 연출 의도 | 경쾌·빠름. 슬라임보다 접근이 빨라 "귀찮은 잡몹" 역할 | 느리지만 한 방이 아픈 상징 몹. `jump` 클립으로 쿵 찍는 타격감 |

**`MonsterSpawnDataSet` 추가 행 제안** (기획서 §5 가중치 반영)

```csv
earth_field,ribbon_pig,60,1.0,1.0
earth_field,orange_mushroom,40,1.0,1.0
```

**`ItemDropDataSet` 추가 행 제안**

```csv
ribbon_pig,,raw_meat,1,1,0.5,true,
ribbon_pig,,pig_ribbon,1,1,0.25,,
orange_mushroom,,orange_mushroom_cap,1,2,0.45,true,
boar,,boar_leather,1,1,0.3,,
```

> 퀘스트 213(`Kill,ribbon_pig,3`)은 드롭이 아니라 처치 카운트라 드롭율과 무관하다. `pig_ribbon` 0.25는 "가끔 나오는 장식 전리품" 의도.

**`MonsterCoinDropDataSet` 추가 행 제안**

```csv
ribbon_pig,0.6,1,2,리본돼지,95ee32092238462dbdbe65591979bf18
orange_mushroom,0.75,2,4,주황버섯,ca3a6ed536d24949b79d3f7b430cb82a
```

---

## 2. F2 바위 지대 (`rocky`)

| 몬스터 | 팩 id | stand | move | attack 후보 | die1 | hit1 | 도감 sprite |
|---|---|---|---|---|---|---|---|
| `stump` 스텀프 | `mob/0130100.img` | `cf2a470436cd4b2aa265648e15198c45` (64×52/1f) | `d5de0c972d044d3cad5d0ecb7d8c96e7` (65×54/4f) | `move` 재사용 (attack 없음) | `61a099877bda46309d038afe28acf9f0` (63×52/3f) | `755abcabb6504879ad91a62797756950` | `f56c99756461437d9c2bfda85fd4093b` |
| `dark_stump` 다크 스텀프 *(상위 변종 옵션)* | `mob/1110101.img` | `ed3908e24d694bb786023fc1ed073489` | `9a4cad470f304753885e06c043156efb` | `move` 재사용 | `b168793b92a844a3a3a6f4ce647a14d2` | `4763c9bebc9245998c9c499b6316aa9f` | `51dc48d925e74fd48263535e38764532` |
| `iron_hog` 아이언호그 | `mob/4090000.img` | `eadfe08070d343a9afafe0fd6290f1c6` (68×48/3f) | `c3a9242a15e949e29f7d552ed551ca06` (68×48/3f) | **`skill1`** `8e66814da53d4bb6a6ad1f064c8738f4` (77×46/9f) — 돌진 모션 | `af01ec8b8d19418e87158d5d596edbeb` (72×54/2f) | `24d7017733b04d1c9de247fe5bd77bfd` | `759e69bf58dc43ad9defed90b48b9048` |
| `stone_golem` 스톤골렘 (B2) | `mob/5130101.img` | `23761b84fca14bbfa671436791e4e0bb` (179×159/3f) | `736ecda03d4444dea5f9089c02c54eb2` (176×158/4f) | **`skill1`** `28e55e44b6e34646b37f2fafef14a093` (176×156/10f) | `871de25edc28418c8fbfef5ea416f2d4` (217×135/7f) | `9c7b36710c8542ac8aa2e93a43bee8fb` | `2e477c29e6f6411ead7d0462a50f52df` |

음성: `stump` Damage `b5430bb5b1da4095a3033a408bdbffe3` / Die `5a1056a232dd422d933f7e9714c24de5` · `iron_hog` Damage `b5794d2885614ef4bc482ea6ea1ee75b` / Die `f2dfb743f9f84037a74c904bc9ba34a0` · `stone_golem` Damage `10038a014c684fe88bc8550a8b60ecf8`(Die 없음).

### F2 전리품 아이콘

| 아이템 id | IconRUID | 원본명 / 크기 |
|---|---|---|
| `stump_wood` | `575d2c78875f477db84dacc947a4bc86` | 「장작」 32×32 |
| `stump_leaf` | `5e1d4e3045e34112ae743469df9b9b94` | 「나뭇잎」 28×28 |
| `iron_fragment` | `798c9751297543519cea1984b7b0333f` | 「아이언 호그의 철발굽」 28×24 |
| `horn_fragment` | `49b3f12c200044b591eeada1ae93a38d` | 「뿔버섯의 갓」 32×28 |

### F2 스탯 / 공격 제안

| 항목 | `stump` | `iron_hog` | `stone_golem` (B2) |
|---|---|---|---|
| `MaxHp` | 70 | 85 | **1400** |
| `Defense` | 14 (기획서의 "높은 방어력") | 10 | 22 |
| `AttackType` | `CONTACT` | `CHARGE` | `LEAP` (1차 패턴) |
| `ContactDamage` / `TouchDamage` | 8 / 3 | 12 / 4 | 24 / 6 |
| `SlamDamage` / `SlamRadius` | — | — | 30 / 2.6 |
| `DetectRange` | 5.0 | 8.0 | 10.0 |
| `AttackWindup` / `AttackCooldown` | 0.6 / 2.0 | 0.7 / 2.4 | 0.8 / 3.2 |
| `ChargeSpeedMultiplier` / `ChargeMaxDuration` / `ChargeDecelDuration` | — | 3.6 / 2.2 / 0.45 | — |
| `TelegraphOn` / `TelegraphModelId` | false | **true** / `AttackTelegraph` | **true** / `AttackTelegraph` |
| `IsBoss` | false | false | **true** |
| 이동 | 매우 느림 (슬라임 대비 0.6배) | 빠름 (1.4배) | 느림 (0.7배) |

**스폰 배율 제안**: `rocky,stump,70,1.0,1.0` / `rocky,iron_hog,60,1.0,1.0` (기존 `rocky,horn_mushroom,60,1.6,1.5` 행은 유지).

> ⚠ **보스 다중 패턴은 현재 `MonsterAI`로 커버되지 않는다.** `MonsterAI.AttackType`은 몬스터당 **단일 값**이다. 기획서의 스톤골렘 3패턴(대지 강타 / 8방향 파편 / 엄폐 요구 광역기)은 `LEAP` 하나로는 표현되지 않으므로, 실무에서는 ① 1차 릴리즈를 `LEAP` 단일 패턴으로 축소하거나 ② `SlimeKing` 계열처럼 보스 전용 AI 스크립트를 신설해야 한다. 스펙 확정 전에는 `LEAP` + 소환(`MinionSummon*`) 조합까지가 무개조 구현 범위다.

---

## 3. F3 모래 언덕 (`desert`)

| 몬스터 | 팩 id | stand | move | attack 후보 | die1 | 도감 sprite |
|---|---|---|---|---|---|---|
| `moredji` 모래두지 | `mob/2110300.img` 「모래 두더지」 | `c6df515cbe0748038dab14361749b57c` (96×62/**16f**) | `8748561fda1241a09905472bb1fc1b7b` (102×48/8f) | `move` 재사용 | `b516a880263d4f3a998a62e7ea351b91` (92×95/8f) | `af9af6bbc9fc4e6888bfc2b373452461` |
| `catus` 카투스 | `mob/2100103.img` | `7b3a31991e2b4af3a2df22836291e8a3` (76×91/6f) | `80d83a6fa60d4ec79a3ba0a1774bd476` (76×91/6f) | `stand` 재사용 | `4de7520929664ef5acf74e422a572566` (84×72/9f) | `1676b4bf2726447bb7e6d5c0a6f688bf` |
| `scorpion` 스콜피온 | `mob/2110301.img` 「언데드 스콜피언/스콜피언」 | `68dad519868b4fad94870237de0c5d66` (78×61/6f) | `d441dbbe37324c579dfdd839d39da332` (75×60/12f) | `move` 재사용 | `fca1c3aaa4da4f7eabc7f6f3b3abb975` (109×45/7f) | `3a08f067718d42f192d85fe5c9553175` |
| `bellamoa` 벨라모아 | `mob/2100105.img` | `0788dfc74ff7448a886c39fdef88cb19` (56×72/4f) | `716fef1de1c24d87b8ce34e31337a20b` (61×72/4f) | `move` 재사용 | `064ff1510ca9411f98dfcbfa2135edb2` (82×73/7f) | `bf29803a9a7342f8911706a37593dfb6` |
| `deu` 데우 (B3) | `mob/3220001.img` 「데우/Deo」 | `6cf930e280f44694a0a0feedbfd855ed` (108×129/6f) | `196bfc9fe38b4266b279f1b3be53c5dc` (105×129/4f) | **`attack1`** `4a7d9f008b334c1187c087d6f5e5cdd3` (122×137/20f) · **`skill1`** `9af96df994cf4794882fec71c027da2b` (123×136/12f) | `7c264f46b77a41ecb52c50b0f191d249` (153×128/7f) | `a0fa0c0915a64041943e08c6a38e9db8` |

데우 전용 추가 리소스: 피격 이펙트 클립 `attack1/info/hit` `98cd61bf1b2c4ff496455ad956cd95d5` (67×62/11f), 음성 `_audio/Attack1` `148803b5f1b649e3a025a7638cacbe36` · `_audio/Skill1` `1e802efa014c4f55a8264ba72519471b` · `_audio/Damage` `70dc1f7a4dbb40b396d2e7174e9ef9a3` · `_audio/Die` `8e6ad3b29c61434eb761bccf0f31ba16`.

> **네이밍 주의** — 기획서의 `모래두지`에 정확히 일치하는 공식 리소스는 없다. 검색 결과 최적치는 **`mob/2110300.img`「모래 두더지」**(모래 파고드는 두더지형)로, 기획 의도("모래 속을 파고들다 솟구침")와 정합한다. 차선은 `mob/3100101.img`「모래난쟁이(Sand Dwarf)」. `scorpion` 역시 정규명이 「언데드 스콜피언」이며 별칭에 「스콜피언」이 포함된다 — 게임 내 표시명은 프로젝트 쪽에서 "스콜피온"으로 지정하면 된다.

### F3 전리품 아이콘

| 아이템 id | IconRUID | 원본명 / 크기 |
|---|---|---|
| `soft_sand` | `c9dcfd4f2a504e0fa3626a58adb41662` | 「금모래」 32×32 |
| `mole_claw` | `ab192dce46c34c3b9d932a78cf4e7ae8` | 「몰 킹의 발톱」 32×32 |
| `cactus_thorn` | `24d371e7bfaf4ff2a6a49a5e0c4d5082` | 「선인장의 가시」 28×28 |
| `cactus_flower` | `2a02777a2e134cc792db8b2c2b626890` | 「카투스의 꽃」 32×32 |
| `scorpion_stinger` | `02178d88a24a49cf9418513cf11ebeb1` | 「전갈의 독침」 28×28 |
| `chitin_shell` | `ad259c087aff47c7ba21e205e32b4495` | 「붉은 등껍질」 32×32 |
| `snake_scale` | `42f339e91dd042908d1bef5ebfed05c1` | 「뱀 비늘」 32×28 |

### F3 스탯 / 공격 제안

| 항목 | `moredji` | `catus` | `scorpion` | `bellamoa` | `deu` (B3) |
|---|---|---|---|---|---|
| `MaxHp` | 120 | 140 | 150 | 130 | **2600** |
| `Defense` | 16 | 20 | 18 | 14 | 26 |
| `AttackType` | `CONTACT` | `RANGED` | `MELEE_WEAPON` | `CONTACT` | `MAGIC` |
| `ContactDamage` / `TouchDamage` | 14 / 5 | 0 / 4 | 18 / 6 | 13 / 5 | 30 / 8 |
| `ProjectileModelId` / `Damage` / `Speed` | — | `Projectile_Spore`(재질 교체 권장) / 16 / 5.0 | — | — | 전용 필요 |
| `DetectRange` | 7.0 | 8.5 | 7.0 | 7.5 | 11.0 |
| `StopDistance` | 0.8 | **6.0**(제자리 사격) | 0.9 | 0.8 | 3.0 |
| `AttackWindup` / `AttackCooldown` | 0.45 / 1.6 | 0.8 / 2.2 | 0.5 / 1.4 | 0.4 / 1.5 | 1.0 / 3.5 |
| `IsBoss` | false | false | false | false | **true** |
| 비고 | 잠복 기습은 `SpawnGraceDuration`+등장 연출로 근사. 파고드는 전용 클립은 팩에 없음 | 이동 클립은 있으나 기획상 제자리 고정 — `StopDistance`를 사거리로 사용 | 「중독 타격」은 `SkillDataSet`의 `Slow` 상태 재사용으로 근사(몬스터→플레이어 상태이상 파이프라인은 현재 미구현, 신설 필요) | 빠른 활강 이동 (1.3배) | 3패턴 전부 전용 AI 필요 (F2 경고와 동일) |

**스폰 배율 제안**: `desert,moredji,70,1.0,1.0` / `desert,catus,60,1.0,1.0` / `desert,scorpion,50,1.0,1.0` / `desert,bellamoa,40,1.0,1.0`.

---

## 4. F4 설원 (`snowfield`) — 차기 아크

| 몬스터 | 팩 id | stand | move | attack | die1 | 도감 sprite |
|---|---|---|---|---|---|---|
| `jr_yeti` 주니어 예티 | `mob/5100000.img` | `1975dd704eec461ab49bdeb0c11c54d9` (61×57/11f) | `842a6865f7074f94ac4a190ed90e2e21` (47×41/3f) | `jump` `f59ed8ac1cfa4aec918331209a15dc1b` | `13b9f2b2f7664cc5a08e663f2fe0502b` (56×43/5f) | `88d193963ece41cf9ccf049694539708` |
| `yeti` 예티 | `mob/6300000.img` | `2fa39477afb34d8cb6412b7fe5085f42` (100×108/3f) | `02dfd5686d7042768adcea2d24c184b4` (110×107/4f) | **`attack1`** `a9e503154e3e4ad5ab0e9e7742dd53ec` (170×121/9f) · `skill1` `48cac2541e4b419d9b21c5758ca5fd59` | `5a328165fb9a4f47b3810c427b8edbd6` (146×79/7f) | `cd1951dafaa0467dbb1af4803b612292` |
| `pepe` 페페 | `mob/6130102.img` | `48dbd76df3fe4ba5a3c1d2ae18a6fc49` (64×56/7f) | `810a146dc54c4ce9a9fad09112c22655` (71×60/3f) | `move` 재사용 | `facc93ada5074221a4661f20d34c101b` (70×80/4f) | `bf8942f8b9c14cd0a54c6e0145846111` |
| `white_fang` 화이트팽 | `mob/5140000.img` | `aaa3b506804d4418b025da47dbb65b3f` (126×56/4f) | `a669487dc36d43df99ecef932ccf6f00` (111×57/3f) | **`attack1`** `e7d12e44869040ed8d6cd4c25c41d543` (106×60/8f) · `jump` `e1890c8e5b8d446eb9b18b7a0380f6ac` | `ec707ca9121f4e4cb536c37a29084760` (108×38/4f) | `1ba6793d996840a5b2ead8db5f4a0f95` |
| `hector` 헥터 | `mob/5130104.img` | `7dcc64a4725b4777b8f86a5404b4d4cc` (126×56/4f) | `5e3fe57af79849ec9fd521dbd498f70d` (111×57/3f) | **`attack1`** `ab421fbae9c942219123b08228fbfca3` (106×60/8f) | `e827e51a595e4d888e8982ded639e769` (108×38/4f) | `ec9726a472064114bab14b0c8f6895d5` |
| `snowman` 스노우맨 (B4) | `mob/8220001.img` | `bf93196a2da842eaaf93c944453416d8` (205×176/6f) | `881ed191bfad4861b63aa94d2a9a2bb8` (192×186/8f) | **`attack1`** `022330aea10449ac970a86ee17db8709` (211×184/**29f**) · `skill1` `bc47715d8e634067af5bf97b923a1c6f` (252×181/15f) · `skill2` `510199e23a4e4dd09217d13d12edde17` (205×176/6f) | `23d06abe8f804666beaee7246a586f05` (224×158/12f) | `8169f13153d74776a3ed9791d4ccc746` |

> `white_fang`(5140000)과 `hector`(5130104)는 **동일 스켈레톤의 색 변종**이다(클립 해상도가 전부 일치). 둘 다 쓰면 단조로우니 하나만 채택하거나 티어 차등(화이트팽 = 일반, 헥터 = 정예)을 두는 편이 낫다.
> 「거대 스노우맨」(`mob/9500532.img`, stand 260×350)도 있으나 **attack/skill 클립이 없어** 보스 연출용으로는 `mob/8220001.img`가 우월하다.

### F4 스탯 / 공격 제안 (차기 아크 — 초안)

| 항목 | `jr_yeti` | `yeti` | `pepe` | `white_fang` | `hector` | `snowman` (B4) |
|---|---|---|---|---|---|---|
| `MaxHp` | 260 | 420 | 220 | 380 | 400 | **5200** |
| `Defense` | 24 | 30 | 20 | 26 | 28 | 34 |
| `AttackType` | `CONTACT` | `MELEE_WEAPON` | `CONTACT` | `CHARGE` | `CHARGE` | `LEAP` |
| `ContactDamage` | 22 | 34 | 18 | 30 | 32 | 48 |
| `DetectRange` | 7 | 8 | 6 | 10 | 10 | 12 |
| 기획 기믹 | 분열(→`MinionSummon*`) | 완력 강타 | 무리 이동(스폰 가중치↑, 개별 약함) | 도약 돌진 | 도약 돌진(정예) | 눈보라 + 눈뭉치 굴리기(전용 AI 필요) |

---

## 5. 다음 실무 단계

1. **모델 생성** — `RootDesk/MyDesk/Monster/Models/` 아래 `RibbonPig.model`, `OrangeMushroom.model` 부터. `ModelBuilder`로 기존 `Slime.model`/`Boar.model` 컴포넌트 구성을 기준 삼아 복제 후 위 RUID/스탯 주입 (§0 규칙 2 Scale.x 반전 포함).
2. **아이템 행 추가** — `item_dataset.csv`에 `pig_ribbon`, `orange_mushroom_cap`, `boar_leather` (`Category=resource`, `IconRUID`는 §1.3).
3. **데이터셋 3종 반영** — `MonsterSpawnDataSet` / `ItemDropDataSet` / `MonsterCoinDropDataSet` (§1.4 드래프트 그대로 사용 가능).
4. **퀘스트 213 연결 확인** — `QuestConditionDataSet`의 `Kill,ribbon_pig,3`은 `Monster:Dead()`가 `_ActionSignals:EmitToPlayer(..., _ActionEnum.Kill, MonsterId, 1)`로 발행하므로, **모델의 `Monster.MonsterId`를 반드시 `ribbon_pig`로** 세팅해야 카운트된다.
5. **검증** — `maker_refresh_workspace` + `maker_logs(kind="build")` (Error=0 + dateTime 일치 확인). 런타임 검증은 제작자 수행.

### 미해결/확인 필요 사항

- **보스 다중 패턴**: 스톤골렘·데우·스노우맨은 현재 `MonsterAI` 단일 `AttackType` 구조로 구현 불가 → 전용 AI 스크립트 신설 여부 결정 필요.
- **몬스터→플레이어 상태이상(중독/감속)**: 스콜피온·데우 기믹의 전제인데 현재 파이프라인에 없음(플레이어→몬스터 방향만 `Monster.ApplySkillHit`로 존재).
- **`soft_sand`/`mole_claw` 아이콘**: 정확히 "고운 모래"/"두더지 발톱"인 공식 아이콘은 없어 「금모래」/「몰 킹의 발톱」으로 근사 채택. 톤이 맞지 않으면 `image-to-pixel` 또는 `msw-painter`로 자체 제작 검토.

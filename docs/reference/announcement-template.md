# 업데이트 공지사항 작성 가이드 & 템플릿 (Announcement Guide & Templates)

> 이 문서는 메이플크래프트의 정기 업데이트, 패치노트, 점검 및 시스템 개선 공지사항을 작성할 때 사용하는 공식 가이드 및 템플릿입니다.

---

## 1. 톤앤매너 (Tone & Manner)

1. **친절하고 정중한 모험가 친화적 어투**
   - 모험가를 존중하는 따뜻하고 신뢰감 있는 높임말 사용 (`~했습니다`, `~안내해 드립니다`).
   - 첫인사 및 끝인사는 간결하면서도 감사를 담아 전달.
2. **명확하고 직관적인 기능 설명**
   - 개발 내부 코드명이나 함수명(예: `Reticle offset`, `Vector3`, `RPC`) 대신, 플레이어 관점의 체감 변화(예: "도구 조준점과 실제 채광 위치 일치", "2×2 넓은 흙터 확장")로 풀어 설명.
3. **실험실/BETA 기능의 투명한 고지**
   - 안정화 전인 신규 기능(예: 영지 초대, 일부 소셜 기능 등)은 제목이나 본문에 `(🧪 테스트 기능)` 또는 `(BETA)`를 명시하고, 이용 시 유의사항을 하단 괄호 안내로 표기.
4. **디스코드 마크다운 최적화 필수 규칙**
   - ⚠️ 줄 맨 앞에 `- ` (하이픈 + 공백)를 사용하지 마십시오. (디스코드에서 의도치 않은 자동 들여쓰기 목록으로 변환되어 서식이 깨짐)
   - 목록 기호는 **`▶ `** (세모) 또는 **`▪ `** (네모)를 사용하십시오.
   - 글로벌 서비스 및 커뮤니티 공유를 위해 **한국어와 영문(English)** 버전을 항상 함께 제공하십시오.
   - 사용자가 원클릭으로 복사할 수 있도록 코드 블록(```text) 형태로 제공하십시오.

---

## 2. 공지사항 표준 구조

1. **헤더**: `[업데이트 안내] 메이플크래프트 {핵심 테마/키워드} 안내`
2. **도입부**: 모험가 인사 및 업데이트 취지 한 줄 요약
3. **본문 (항목별 3~5개 섹션)**:
   - `1. {핵심 콘텐츠/시스템 개편}`
     - `▶ [도구/기능명]: 상세 설명`
   - `2. {신규 기능/소셜/편의성}`
   - `3. {UI/모바일/환경 최적화}`
   - `4. {버그 수정 및 시스템 안정화}`
4. **마무리**: 감사 인사 및 피드백 독려

---

## 3. 공식 템플릿 (복사용)

### 🇰🇷 한국어 공지사항 템플릿

```text
[업데이트 안내] 메이플크래프트 {업데이트 주제} 안내

모험가 여러분, 안녕하세요!  
더욱 쾌적하고 즐거운 모험을 위해 진행된 주요 업데이트 내용을 안내해 드립니다.

1. {주요 기능 개편 / 신규 시스템}
{기능 도입 배경 또는 요약}
▶ [{기능/도구 1}]: {사용법 및 상세 동작 안내}
▶ [{기능/도구 2}]: {사용법 및 상세 동작 안내}

2. {신규 기능 / 소셜 시스템}
▶ {기능명}: {상세 설명}
▶ {테스트 기능명} (BETA): {설명}
(※ {테스트 기능명}은 현재 테스트 단계로, 일부 환경에 따라 불안정할 수 있으며 지속적으로 보완될 예정입니다.)

3. UI 및 환경 최적화
▶ {개선 항목}: {개선 내용 및 효과}

4. 시스템 안정성 및 편의성 강화
▶ {안정화 항목}: {수정 내용}

앞으로도 모험가 여러분의 소중한 피드백을 바탕으로 더욱 발전하는 메이플크래프트가 되겠습니다. 감사합니다!
```

---

### 🇺🇸 영문 공지사항 템플릿 (English Template)

```text
[Update Notice] MapleCraft {Update Subject}

Hello, Adventurers!  
Here are the details for the latest update, focused on new features and quality-of-life improvements.

1. {Key Feature Revamp / New System}
{Brief introduction or summary}
▶ [{Item/Feature 1}]: {Usage details and mechanics}
▶ [{Item/Feature 2}]: {Usage details and mechanics}

2. {New Features / Social System}
▶ {Feature Name}: {Detailed description}
▶ {Test Feature Name} (BETA): {Description}
(※ Please note: The {Test Feature Name} is currently in testing and will continue to be refined in upcoming patches.)

3. UI & Optimization
▶ {Improvement}: {Details and effects}

4. System Stability & Bug Fixes
▶ {Fix Item}: {Resolution details}

Thank you for your continued support and feedback as we keep improving MapleCraft!
```

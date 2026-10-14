# DevCalc

이 강의 시리즈의 최종 결과물인 개발자용 계산기. 강의가 진행될 때마다 부품이 하나씩 추가된다.

## 현재 단계: Lv1 진법 변환기 (01강)

```bash
node devcalc/src/main.ts 255
# HEX : 0xFF
# DEC : 255
# BIN : 0b11111111

npm test        # devcalc 테스트
```

## 진행 기록

| 강 | 추가된 것 |
|---|---|
| 01 | `core/Format.ts` (ToHex/ToBin/ToDec), `main.ts` 명령줄 실행 |

강의별 상태는 git 태그(Tag)로 볼 수 있다: `git checkout lesson-01`

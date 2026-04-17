# Test Review Guide

테스트 실행 후 성공/실패 여부만 남기지 않고 분석 결과를 기록한다.

## 위치

- 디렉터리: `docs/test_review/`
- 권장 파일명: `YYYY-MM-DD-<feature-or-module>.md`

## 작성 원칙

1. 성공한 테스트만 나열하지 않는다.
2. 어떤 부분이 성공했고 어떤 부분이 취약했는지 구분해 쓴다.
3. 실패가 없더라도 미검증 영역과 잔여 위험을 남긴다.
4. 기존 실패와 이번 변경으로 추가된 실패를 분리해서 적는다.

## 템플릿

```md
# Test Review

## Target

## Commands

## Passed

## Failed

## Risk Analysis

## Not Covered

## Follow-up
```

---
title: "nnUNet 관련 기능 분리"
tags:
    - tech
    - BE
    - microservice project
date: "2025-07-09"
thumbnail: "/assets/img/thumbnail/nightgardenflower.jpg"
---


# 개요
---
## 목적

2차 회의를 수행하고, 해당 내용을 적용하기 위해 기능 구현을 구체화하여 구현하는 과정을 정리

## 구체화

1. gRPC를 활용하여 서로 다른 Docker Container간 str, List[str] 통신을 활용가능하고, 공유된 마운트 Volume에 동일한 Path로 접근가능하게 구현
2. Server를 아래 2가지 옵션으로 구현

   1. 각종 ai관련 기능을 모두 통합한 monolithic한 서비스
   2. 혈관, 요관, 신장 등 각각 기능들을 microservice로 분리하고, 모두 동일한 volume mount에서 경로만 통신해 통합된 기능을 제작

3. 정해진 서버의 옵션에 따라 요구사항에 맞춘

   1. Resize기능
   2. 각종 nnUNet 취사선택 기능
   3. (optional) 빠른 샘플 제작 기능

    을 구현할 수 있도록 수행한다.

## 개발일정

| Date | To Do | Process |
| ------------ | ------------- | ------------- |
| ~07.09 | gRPC를 통한 통신 구조 및 볼륨 마운트를 통해 동일한 파일 접근 가능한지 테스트 수행 | 완료(07.09~07.09) |
| ~07.10 | monolithic하게 구현할지, microservice로 구현할지 결정 | 진행(07.09~) |
| ~07.13 | nnUNet을 Path만 가지고 있으면, Phase에 따라 실행하는 구조 생성  | |
| ~07.14 | optional한 기능의 구현가능성에 따라 추가 | | 

## 버그 해결


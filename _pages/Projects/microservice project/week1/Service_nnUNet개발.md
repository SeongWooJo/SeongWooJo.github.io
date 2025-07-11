---
title: "Service:nnUNet 개발"
tags:
    - tech
    - BE
    - microservice project
date: "2025-07-10"
thumbnail: "/assets/img/thumbnail/nightgardenflower.jpg"
---


# 개요
---
## 목적

nnUNet과 torch를 사용하는 각 연구 성과를 통합한 nnUNet 서비스의 개발

## 요구조건

1. nnUNet의 .nii.gz 데이터를 ndarray + props(nnUNet을 코드 상에서 실행하기 위한 또 다른 입력값)으로 추출해주는 SitkIO 함수를 활용해 I/O 횟수를 최소화(각 모델들을 한번의 I/O로 모두 실행가능하게)
2. 메모리 소모량을 감소시키기 위해 각 알고리즘 실행 과정 속, 필요로 하는 최소값의 해상도로 알고리즘 수행
3. 각각의 Container에 그냥 OS를 활용하는 이미지를 쓰지말고, Container의 용량을 감소시키는 작은 이미지를 활용할 것

## 서비스 API

| Service | EndPoint | Parameter(request) | Parameter(response) | Detail | Constraints |
| ------------ | ------------- | ------------- | ------------- | ------------- | ------------- |
| nnUNet | inference/totalseg | image_path : str | mask_path : str | totalSegmentator를 실행시켜, 해당 이미지에 대한 Organ Mask를 저장하고, 저장한 Path를 반환 | 1mm보다 high resoulution을 가지는 이미지에 대해서는 더 나은 결과를 낼 수 없다 |
| nnUNet | inference/vessel | image_A_path : str, image_P_path : str | mask_path : str | 2개 이미지의 파일 경로를 받아 image_A_path와 같은 물리적 공간을 가지는 신장,동맥,정맥 mask를 저장하고 해당 주소를 반환 | A, P Phase에 해당하는 CT 이미지에 대해서만 유효한 결과를 낼 수 있다 |
| nnUNet | inference/ureter | image_D_path : str | mask_path : str | 이미지 파일경로를 받아, 같은 물리적 공간을 가지는 요관, 신장 mask를 저장하고 해당 주소를 반환 | D Phase .nii.gz에만 유효한 결과를 낼 수 있다 |
| nnUNet | inference/tumor | image_path : str | mask_path : str | 이미지의 파일 경로를 받아, 같은 물리적 공간을 가지는 신장, 종양 mask를 저장하고 해당 주소를 반환


# 개발과정

## gRPC 기반 api endpoint 설정

## totalSegmentator 함수 제작

## nnUNet pth 파일 기반 교체 가능한 함수 개발

## vessel Feature 추출 함수 개발





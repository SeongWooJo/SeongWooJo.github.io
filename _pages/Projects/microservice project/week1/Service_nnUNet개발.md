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

## 3차 회의 요구사항

백엔드 개발자와 기존의 nnUNet 기능만을 통합하는 과정이 아닌, Smoothing, PostProcessing 기능 까지 고려하는 2번째 시스템 개발에 관하여 회의를 진행

1. 마이크로 서비스를 수행할 때 Docker Image 경량화에 대한 이슈
   - 이미지가 무거우면 빌드 시간, 배포 시간, 디스크 사용량, 네트워크 트래픽 모두 증가함.
   - 각 Pod이 이미지 Pull을 할 때 용량이 작을수록 빠르고 안정적.
2. smoothing, post-processing 서비스를 분리하면서 다른 기능들은 mask에 한정해서는 I/O가 필요하고, 기존의 저장되던 Segmentation 이외의 다른 정보를 저장할 필요성이 대두
   - 해당 사항에 대해 TotalSegmenatator 혹은 inference 결과 등을 mask 디렉토리에 저장하고 활용하는 것에 대해 문제가 없음을 확인

## 서비스 API

| Service | EndPoint | Parameter(request) | Parameter(response) | Detail | Constraints |
| ------------ | ------------- | ------------- | ------------- | ------------- | ------------- |
| nnUNet | inference/totalseg | image_path : str | mask_path : str | totalSegmentator를 실행시켜, 해당 이미지에 대한 Organ Mask를 저장하고, 저장한 Path를 반환 | 1mm보다 high resoulution을 가지는 이미지에 대해서는 더 나은 결과를 낼 수 없다 |
| nnUNet | inference/vessel | image_A_path : str, image_P_path : str | mask_path : str | 2개 이미지의 파일 경로를 받아 image_A_path와 같은 물리적 공간을 가지는 신장,동맥,정맥 mask를 저장하고 해당 주소를 반환 | A, P Phase에 해당하는 CT 이미지에 대해서만 유효한 결과를 낼 수 있다 |
| nnUNet | inference/ureter | image_D_path : str | mask_path : str | 이미지 파일경로를 받아, 같은 물리적 공간을 가지는 요관, 신장 mask를 저장하고 해당 주소를 반환 | D Phase .nii.gz에만 유효한 결과를 낼 수 있다 |
| nnUNet | inference/tumor | image_path : str | mask_path : str | 이미지의 파일 경로를 받아, 같은 물리적 공간을 가지는 신장, 종양 mask를 저장하고 해당 주소를 반환


# 개발과정

## DockerFile 작성

### 고려사항
1. 현재 BE 시스템에서 기존에 사용하던 torch version = 2.2.2, cuda가 존재하여 GPU를 사용할 수 있어야 한다.
2. `totalsegmentator`, `nnunet`이 사용 가능해야한다.


## gRPC 기반 api endpoint 설정

- [x] api service와 nnUNet에 해당하는 docker container 제작, 공유된 볼륨에 동일한 경로로 접근 가능한지 테스트
- [x] 통신 담당 함수와, 각 통신 결과를 각 함수에 전달하는 entrypoint 함수 제작

현재 생각한 구조

1. 각 서비스는 통신 함수를 main.py로 가지며, 해당 main.py와 동일한 디렉토리에 각 서비스가 구성된 라이브러리가 존재
2. 각 라이브러리는 api에 따라 1:1로 실행되는 함수 entrypoint를 가지며, 이를 라이브러리 최상단에 위치
3. 라이브러리 내부에서 각 함수에 따라 구동되는 기능별로 폴더를 구분하며, utils 폴더에 잡다한 기능들을 넣어두기
4. 각 서비스 별로 통일된 라이브러리 선언 규칙이 필요

## totalSegmentator 함수 제작

### 진행 과정

1. totalsegmenator 라이브러리 설치 => 발견된 문제, warning으로 현재 사용하고 있는 라이브러리 중 하나가 2025.12.30에 사라질 예정이라고 함, 오류가 발생했을 때 참고
2. totalsegmentator는 RAM, GPU 사용량이 필요함, 현재 docker ram 사용량이 MB단위임을 발견, totalsegmentator를 구동시키기 위해 20GB로 변경, 다만 서버 컴퓨터의 스펙은 로컬 개발환경과 다르게 128GB의 램을 보유하고 있으므로, 해당 Docker Container는 100GB정도까지 가도 괜찮을 듯 하다.
3. totalsegmentator를 돌릴 시 멀티프로세싱을 사용하기 때문에 이를 gRPC와 함께 사용할 떄 fork관련 이슈가 발생, main 함수에 multiprocessing을 import해주고, 미리 조치를 취하면 괜찮지만 이게 왜 문제가 생기는지에 대한 고찰이 필요.
4. 테스트 진행 완료 mask/total_A.nii.gz로 저장 밑 return이 잘 수행됨을 확인
5. API Gateway에서 inference/totalseg를 case 폴더 -> 각 이미지 폴더로 어떤 식으로 연결을 지어야할지에 대한 고찰이 필요

### 추후 체크리스트
- [ ] BE->API Gateway와 inference/totalseg API에 대한 연결을 어떻게 수행할 것인가.
- [ ] 멀티 프로세싱 fork관련 이슈가 왜 발생하는가.

## nnUNet pth 파일 기반 교체 가능한 함수 개발

## vessel Feature 추출 함수 개발





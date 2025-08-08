---
title: "API 설계"
tags:
    - tech
    - BE
    - microservice project
date: "2025-07-10"
thumbnail: "/assets/img/thumbnail/nightgardenflower.jpg"
---


# 개요
---
## 설계 개요

연구원들의 모든 연구 내용 기능을 통합하기 위해, 아래와 같은 전체 구조를 설계하였다.

기존의 BE 시스템 <-> API Gateway <-> 각 서비스

기존의 BE 시스템에서 CT Image를 기반으로 mask와 obj 파일을 생성하는 구조를 아예 분리함으로써, monolithic하게 운영되고 있던 BE 시스템의
라이브러리 충돌 가능성을 줄이고, 각 연구 결과를 각각의 서비스로 분리함으로써 기존에 존재하였던 

1. torch 및 기반이 되는 nnUNet 라이브러리가 업데이트되었음에도 적용이 힘들었던 점.
2. 각 연구가 사용하는 라이브러리가 너무 다양해 monolithic한 시스템에 적용하기 힘들었던점
3. 새로운 기능을 추가할 때마다, 해당 기능과 BE를 연결할 때 코드 구조를 바꿔야할 필요가 생기는 점
   
같은 문제를 해결하기 위해, 연구 분야에 관련해 BE 시스템에서 분리하고, MSA처럼 운영하기 위해 전체 구조를 설계하였다.

## 서비스 분리 기준

1. nnUNet 서비스
    
   - 혈관, 신장, 요관, 종양 등의 segmentation 기능을 AI Inference를 통해 수행하는 서비스
   - `nnUNet`과 그 기반 라이브러리(torch 등)에 의존하는 기능들을 통합, 관련 라이브러리가 업데이트될 때 적용하기 쉽게 통합
   - 세부 기능별로 지나치게 분리하지 않되, nnUNet 기반의 서비스들을 모아두어, 모델 파라매터 파일만 교체한다면 쉽게 유지/보수가 가능하게 하나의 서비스로 구성
   - AI inference를 위해 GPU가 많이 필요하기 때문에, 별도 서비스로 분리

2. Smoothing 서비스

   - .nii.gz 마스크 파일을 3D Object 파일(.obj)로 변환하면서 Smoothing을 적용하는 후처리 기능을 담당
   - 해당 기능은 `trimesh`, `pyvista`, `open3d` 등 3D 라이브러리를 사용하며, 관련 기능을 nnUNet 서비스는 필요로하지 않으므로, 유지/보수 성 증가를 위해 분리
   - 해당 기능은 GPU 성능을 크게 필요로 하지 않으며, nnUNet 서비스의 결과물을 활용하여 3d obj를 만드는 역할이므로 기능을 분리하는 관점에서 서비스를 분리

3. Post-Processing 서비스

   - inference 결과를 후처리하여 Fat mask 추가, cugraph 기반 skeleton 재구성 등의 기능을 수행
   - nnUNet과 달리 **GPU보다는 CPU 집약적인 작업**이 많아 자원 관리 측면과 기능 분리 측면에서 서비스를 분리하는 것이 유리
   - 라이브러리도 nnUNet, Smoothing 서비스에서 사용하는 라이브러리가 아닌 `cugraph`, `skimage` 등 다른 라이브러리를 주로 사용하느모 업데이트가 용이하게 분리

## 요구조건

1. nnUNet의 .nii.gz 데이터를 ndarray + props(nnUNet을 코드 상에서 실행하기 위한 또 다른 입력값)으로 추출해주는 SitkIO 함수를 활용해 I/O 횟수를 최소화(각 모델들을 한번의 I/O로 모두 실행가능하게)
2. 메모리 소모량을 감소시키기 위해 각 알고리즘 실행 과정 속, 필요로 하는 최소값의 해상도로 알고리즘 수행
3. 향후 다른 연구의 결합에 대한 유지/보수성 증가를 위해 CT Image를 직접적으로 활용하지 않는 다른 기능들은 따로 수행될 수 있도록 구성
4. 각각의 Container에 그냥 OS를 활용하는 이미지를 쓰지말고, Container의 용량을 감소시키는 작은 이미지를 활용할 것


## API 설계

### API Gateway API 설계

| Service | EndPoint | Parameter(request) | Parameter(response) | Detail | Constraints |
| ------------ | ------------- | ------------- | ------------- | ------------- | ------------- |
| nnUNet | inference/totalseg | image_path : str | mask_path : str | totalSegmentator를 실행시켜, 해당 이미지에 대한 Organ Mask를 저장하고, 저장한 Path를 반환 | 1mm보다 high resoulution을 가지는 이미지에 대해서는 더 나은 결과를 낼 수 없다 |
| nnUNet | inference/vessel | image_A_path : str, image_P_path : str | mask_path : str | 2개 이미지의 파일 경로를 받아 image_A_path와 같은 물리적 공간을 가지는 신장,동맥,정맥 mask를 저장하고 해당 주소를 반환 | A, P Phase에 해당하는 CT 이미지에 대해서만 유효한 결과를 낼 수 있다 |
| nnUNet | inference/ureter | image_D_path : str | mask_path : str | 이미지 파일경로를 받아, 같은 물리적 공간을 가지는 요관, 신장 mask를 저장하고 해당 주소를 반환 | D Phase .nii.gz에만 유효한 결과를 낼 수 있다 |
| nnUNet | inference/tumor | image_path : str | mask_path : str | 이미지의 파일 경로를 받아, 같은 물리적 공간을 가지는 신장, 종양 mask를 저장하고 해당 주소를 반환
| Smoothing | smoothing/base | mask_path : str | obj_path : str | 마스크의 파일 경로를 받아, 해당 마스크에 대한 3d obj파일을 만들고, 그 주소를 반환 | mask의 label number가 사전에 약속된 규칙을 따라야함|
| postprocess | postprocess/fat | mask_path : str | mask_path : str | kidney, tumor, total 마스크를 기반으로 Fat mask를 생성해주고, 해당 경로를 반환 | 사전에 약속된 mask 규칙을 따라야함 |
| postprocess | postprocess/sample | mask_path : str, templete_path : str | mask_path : str |  템플릿과 환자 mask(kidney, tumor가 있는)를 기반으로 빠른 mask를 생성해주고, 해당 경로를 반환 | 사전된 약속된 mask label number를 따라야함 |
| postprocess | postprocess/vessel | mask_path : str | mask_path : str | 결과 마스크를 기반으로 떨어진 artery를 자동 연결하는 후처리 기능을 적용 후 저장, 그 경로를 반환 | 사전에 약속된 mask label number 규칙을 따라야함 | 
| postprocess | postprocess/ureter | mask_path : str | mask_path : str | 결과 마스크를 기반으로 떨어진 ureter를 자동 연결하는 후처리 기능을 적용 후 저장, 그 경로를 반환 | 사전에 약속된 mask label number 규칙을 따라야함 | 

### BE - API Gateway API 설계

추후 백엔드 담당자와의 토의 필요


---
title: "Git 정리"
tags:
    - tech-review
    - git
    - Communicate
date: "2025-08-06"
thumbnail: "/assets/img/thumbnail/nightgardenflower.jpg"
---

# Git
## 개요

백엔드 시스템을 개발하면서, 기존의 연구 개발과는 달리 여러 사람이 병렬로 작업을 수행하게 되었다. 이에 따라 Git을 사용하게 되었고, 버전 및 브랜치 관리를 철저히 해야 할 필요성을 절실히 느꼈다. 이에 따라 Git에 대해 정리할 필요성을 느꼈고, 그 첫 번째로 Git의 공간과 파일의 상태에 대해 기초적인 내용을 정리한다.

## Git이란?

Git이란 [Version Control System](https://www.geeksforgeeks.org/git/version-control-systems/)의 일종으로, 소프트웨어 개발 및 협업 프로젝트에서 소스 코드, 문서, 기타 파일의 변경 사항을 추적하고 관리하는 데 사용된다.

혼자 작업하든 팀으로 작업하든, 버전 관리를 도입하면 다음과 같은 장점이 있다:

1. 파일과 프로젝트를 이전 상태로 쉽게 되돌릴 수 있다.
2. 누가 언제 어떤 작업을 했는지 추적할 수 있으며, 문제 발생 시 관련 이력을 확인할 수 있다.
3. 파일을 잃어버리거나 실수로 수정했을 때 쉽게 복구할 수 있다.
4. 서로의 작업을 덮어쓰지 않고 병렬로 작업하며, 변경 사항을 손쉽게 병합할 수 있다.

버전 관리 시스템(VCS)은 Git 외에도 다양한 도구들이 존재한다. 예를 들어 GUI 기반의 간편함을 선호하는 개발자들은 **Mercurial**을 사용하기도 하고, 코드 외의 리소스까지 통합 관리하는 **Perforce (P4V)** 도 있다. 하지만 현재까지 가장 널리 사용되는 VCS는 단연 Git이다.

---

## Git의 공간

![git 개요도](/assets/img/pages/tech-review/Communicate/git/git.webp)

Git은 파일들의 변경 이력을 추적하여 버전을 관리하는 도구다.
그렇다면 파일을 수정할 때마다 Git이 모든 변화를 자동으로 기록하는 것일까? 
→ **그렇지 않다.**

Git은 우리가 작업하는 디렉토리의 파일 상태를 추적하고, 특정 명령을 실행할 때마다 스냅샷처럼 그 시점의 파일 상태를 기록한다(그러나 저장 방식은 파일을 복제하는 것이 아닌 변화를 기록하는 차이가 존재한다). 이러한 과정에서 Git은 변경된 파일들을 다양한 단계에서 관리한다. Git이 추적하는 파일 상태는 아래와 같은 네 가지 주요 공간을 통해 이해할 수 있다:

### 1. Working Directory
    
Git으로 관리하기 위해 git init 등을 실행한 후 작업하게 되는 실제 디렉토리다.
이곳은 개발자가 직접 파일을 수정하거나 저장하는 공간이며, Git이 자동으로 버전을 기록하지 않는다.

즉, 파일을 수정하거나 새로 생성해도 git add 또는 git commit 명령을 실행하지 않으면, Git이 버전 이력에는 반영하지 않는다.

### 2. Staging Area

Staging Area는 로컬 저장소에 기록(commit) 하기 전에 Git이 변경 내용을 임시로 저장하는 공간이다. 해당 공간이 존재함으로써 Merge 등의 작업을 수행할 때 충돌을 해결하거나, 한번에 커밋에 어떠한 정보들만 업데이트할지 천천히 파일들을 추가할 수 있다. 메모리 등에 임시로 저장되는게 아닌 별도의 공간에 존재하기에 이런 작업들을 오래 수행할 수 있다.

git add 명령을 사용하면, 해당 파일은 Staging Area에 추가된다.
Staging Area를 사용하면 원하는 변경 사항만 선택적으로 커밋할 수 있어, 커밋의 목적과 단위를 깔끔하게 분리할 수 있다.

### 3. Local Repo
git commit 명령을 실행하면, Staging Area에 있던 변경 내용이 로컬 저장소에 커밋된다. 이 저장소는 .git 폴더 내부에 존재하며, 모든 커밋 이력, 브랜치 정보, 메타데이터 등을 포함한다. Git은 이곳에 실제 파일 내용뿐 아니라, 이전 버전과의 차이점, 커밋 메시지, 작성 시간, 작성자 등의 정보를 구조화하여 저장한다.

구체적인 .git 폴더의 저장 방식에 대해서는 링크를 참조하자 : [저장방법 로직](/_pages/tech-review/Communicate/Git/git의%20저장방식.md)

### 4. Remote Repo

로컬 저장소의 커밋 내역을 다른 사람과 공유하려면, git push 명령을 사용하여 Remote Repository로 전송한다.
Remote Repository는 GitHub, GitLab, Bitbucket 등의 원격 저장소이며, .git 폴더와 동일한 커밋 이력을 저장하고 관리한다.

원격 저장소를 통해 팀원 간의 협업이 가능해지며, pull, fetch, merge 등을 통해 변경 사항을 주고받을 수 있다.

---
## Git의 파일의 상태

Git은 결국 각 파일이 시간에 따라 어떻게 변화해왔는지를 기록하는 도구이다. 이에 따라 각 공간으로 이동하는 것에 더해 Git은 사용자가 명시적으로 실행하는 명령에 따라 각 파일의 상태(state)를 구분하고 관리한다.

Git에서 파일이 가질 수 있는 상태는 다음과 같다:
Untracked / Tracked → (Unmodified, Modified, Staged)

![file status](/assets/img/pages/tech-review/Communicate/git/file_lifecycle.webp)

### 1. Untracked
Git은 파일의 변경 이력을 추적하고 버전을 관리하지만, 한 번도 Git에 추가되지 않은 파일은 Git 입장에서 **“변경”이 아닌 “새로운 파일”** 일 뿐이다.

즉, Git이 한 번도 기록한 적이 없는 파일은 과거 상태가 없기 때문에 변경 이력을 추적할 수 없다. 이러한 상태를 **Untracked** 이다.
실제 Git에선 git 프로젝트 내에서 새로운 파일을 생성시켰을 때, 기존의 추적되던 파일을 삭제하였을 때, 
또한, .gitignore에 등록된 파일들도 일부러 추적하지 않기 때문에 Untracked 상태로 간주된다. 

이는 예를 들어 다음과 같은 경우 유용하다:

- 대용량 파일로 인해 Git 저장소에 포함시키고 싶지 않은 경우
- 민감 정보(예: API 키, 비밀번호)가 포함된 파일을 외부 저장소에 업로드하고 싶지 않은 경우

위의 상태 도식과 달리 Tracked 상태의 파일을 삭제하지 않으면서 Untracked로 만들고 싶을 수 있다. 그런 경우 위처럼 git add, unstaged 같은 명령으론 수행할 수 없고 ```git rm --cached example.txt``` 라는 명령처럼 실수로 추적한 파일을 local repo와 staging area에서 없앨 수 있다.

### 2. Staged
위의 공간 설명에서 Staging Area란 공간은 commit을 수행하기 전 기록할 파일의 상태를 임시로 모아두는 공간이다. 이처럼 해당 공간에 파일들이 옮겨졌을 때 해당 파일들은 Staged 상태를 가지게 된다. 만약 Untracked 파일이 Staged 상태가 된다면 그 때부터 추적이 시작되는 것이고, 다시 unstaged하면 Untracked 상태로 돌아간다.

만약 당신이 **파일을 Staged 상태로 바꾸고 워크 디렉토리에서 파일을 수정**한다면 어떻게 될까?

    Staging Area에는 git add 시점의 파일 상태가 기록되는 것이다. 즉, 워킹 디렉토리의 파일과 Staged에 기록된 파일이 다른 것이다.
    워킹 디렉토리에서 해당 파일을 수정하면, Git은 "Staging Area 버전" ≠ "Working Directory 버전" 인 것을 인식한다.

### 3. Unmodified

Commit을 수행하면, Staging Area의 파일 상태가 Local Repository에 기록된다.
이후 git status 같은 명령이 실행될 때마다 Git은 Local Repo(HEAD) 와 워킹 디렉토리를 비교한다.

두 상태가 완전히 동일하다면 해당 파일은 Unmodified 상태이다.

예를 들어, 파일을 Staged 상태로 변경하고, 추가 수정 없이 commit을 하면
commit 직후 그 파일은 Unmodified 상태로 남는다.

### 4. Modified

위의 상태처럼 Commit 등을 통해 Staged를 Local Repo로 옮긴 후 추가적으로 워킹 디렉토리에서 파일을 수정했을 때, 해당 파일은 Local Repo와 상태가 다른 Modified 상태가 된다.

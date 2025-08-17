---
title: "Git의 object와 refs 저장방식"
tags:
    - tech-review
    - git
    - Communicate
date: "2025-08-06"
thumbnail: "/assets/img/thumbnail/nightgardenflower.jpg"
---

# Git의 저장방식

git으로 프로젝트를 진행하다보면, .git이라는 숨김폴더가 생성되는 것을 볼 수 있다. 이러한 .git 폴더 안에는 프로젝트 작업을 수행하면서 commit add 등 명령어를 통해 수행한 작업들의 결과들이 생성되는데 이번 포스트에서 해당 정보에 대한 저장방식, 그 중에서도 **git의 objects와 refs에 저장되는 정보**에 대해 알아보자.

## Git objects

![git objects](/assets/img/pages/tech-review/Communicate/git/git_objects.webp)

위의 그림에서 git이 실제로 어떻게 저장되느냐에 대한 설명이 잘 나와있다. 

우리가 working directory의 작업을 commit을 수행하면, 
1. 해당 파일들과 디렉토리들은 Blob과 Tree라는 구조로 .git/objects에 저장된다.
2. commit 객체가 생성되어 해당하는 커밋에 프로젝트 폴더를 가르키는 Tree 객체를 가르킨다. 또한 해당 커밋 이전의 부모 커밋 또한 가르킨다.
3. commit object를 Head 포인터가 가르킨다.

자 전체적인 구조는 위와 같이 수행되지만, 하나하나가 잘 이해되지 않는다. 그러니 자세히 파악해보자.

git objects 파일을 자세히 볼 땐 
```git cat-file -p 파일의 hash코드```
명령을 통해 해당 오브젝트 파일을 자세히 살펴볼 수 있다.

이 글을 포스트하는 github 블로그 역시도 git으로 관리되고 있다. 그러면 한번 예시를 살펴봐볼까?

``` bash
abc83@develop MINGW64 ~/development/SeongWooJo.github.io/.git/objects (GIT_DIR!)
$ ls
0a/  1b/  34/  4c/  67/  7e/  8f/  a2/  b5/  c1/  ca/  e8/  fb/
0f/  24/  36/  50/  68/  80/  92/  a9/  b8/  c2/  d2/  ea/  fc/
13/  25/  38/  51/  76/  85/  9a/  ae/  ba/  c4/  d3/  ee/  fd/
19/  2f/  3e/  60/  7a/  86/  9e/  b0/  bc/  c5/  d5/  f3/  info/
1a/  30/  44/  62/  7d/  8b/  9f/  b2/  bd/  c7/  db/  f9/  pack/

abc83@develop MINGW64 ~/development/SeongWooJo.github.io/.git/objects (GIT_DIR!)
$ ls 1b/
2948a17f027fd4f4359c53a60b9582a3b1c265

abc83@develop MINGW64 ~/development/SeongWooJo.github.io/.git/objects (GIT_DIR!)
$ git cat-file -p 1b2948a17f027fd4f4359c53a60b9582a3b1c265
040000 tree 7a6a6a64b2bbae6b6cec73624b610e31830b56ac    Projects
040000 tree 51fb9a02110fa88741738be230342544256e1f73    Tutorial
040000 tree 7a5657ae0999f622f6509b8416f659a0262eba33    cs-note
040000 tree c472bd9693f8ca55e7590d9ace65ee51b6f99179    dev-log
100644 blob a49ba48448f906d814cc83e50fc18f81cae53844    index.md
040000 tree b56fcfa45f3a0afaf2c480470f2b38f1b44fc26d    tech-review


abc83@develop MINGW64 ~/development/SeongWooJo.github.io/.git/objects (GIT_DIR!)
$ git cat-file -p a49ba48448f906d814cc83e50fc18f81cae53844
---
---

```

자 이러한 결과가 나왔다. 그러면 이 결과를 한번 자세히 분석해보자!

### Git Blob

먼저 git이 파일 버전 관리를 할 때 핵심이 되는 저장방식인 Blob(Binary Large Object)에 대해서 알아보자.
``` bash
abc83@develop MINGW64 ~/development/SeongWooJo.github.io/.git/objects (GIT_DIR!)
$ git cat-file -p a49ba48448f906d814cc83e50fc18f81cae53844
---
---
```

자 Blob파일을 우리가 열어보았을 때 해당 파일인 index.md의 실제 저장된 값과 정확히 일치하는 결과를 확인할 수 있다.

그렇다면 파일이 수정되었을 때 Blob은 어떻게 저장할까?

```
# Blob 1
첫 번째 파일

# Blob 2
첫 번째 파일
두 번째 파일
```

파일이 위와 같이 수정되었을 때 Blob은 각 파일의 전체 내용을 기반으로 **Hash함수를 통과시켜 40글자에 해당하는 문자열을 파일이름으로 사용**한다. 이때 앞선 2글자는 폴더로, 뒤의 38글자는 파일이름으로 사용된다.

처음 objects의 폴더에 나온 수많은 2글자들은 이런 식으로 생성된 hash의 결과값들이다. git에서 각 오브젝트들은 이러한 hash값을 기반으로 접근할 수 있다.

각 파일이 조금의 수정이라도 일어난다면 git은 새로운 Blob파일로 저장하며, 수정이 일어나지 않았을 시 동일한 Blob파일로 저장된다.

이러한 구조의 장점은 무엇일까?

바로 hash함수의 특징인 같은 값을 통과시킬 땐 같은 결과가 나온다는 것이 핵심이다.

git은 버전관리 프로그램이다. 커밋을 수행할 때마다 파일의 버전을 기록해야하고 변화를 추적할 수 있어야한다. 하지만 우리가 git을 사용할 때 항상 모든 파일들이 커밋을 수행할 때마다 바뀌는가?

아니다. 대부분의 파일들은 이전버전과 변하지 않는 경우가 많으며 수십 번의 커밋 후에도 바뀌지 않을 수도 있다. 이때 Blob의 저장방식이 강점을 발휘한다. Blob은 파일 내용을 기반으로 hash를 생성해 파일이름을 생성한다. 즉 **어떤 컴퓨터에서든 어떤 파일로 저장되었든 어느 시점에 저장하든, 파일 내용이 동일하다면 동일한 Blob으로 저장**된다.

이러한 방식은 git이 버전관리를 수행하면서도 저장 공간을 효율적으로 사용하게 해준다. 각 커밋을 수행할 때 시점별로 commit 오브젝트는 tree오브젝트를 가르키고 각 tree 오브젝트는 Blob을 가르키는데, 이때 **동일한 내용은 여러 커밋 시점에서 하나의 Blob만을 가르키게 저장**할 수 있다.

여기서 또 하나의 **용량을 감소하는 트릭**이 존재한다.

[git 저장구조, wikipedia](https://en.wikipedia.org/wiki/Git?utm_source=chatgpt.com#Data_structures)

Blob 파일의 생성 원리를 보면 파일 전체를 스냅샷처럼 저장해 전체 파일 내용을 기반으로 hash를 생성한다. 하지만 이런 말을 들어보았을 것이다. **git은 파일의 수정된 내역만 저장하여 효율적이게 디스크 공간을 활용**한다.

실제로 **git은 델타압축이라는 파일의 수정된 내역만을 저장하여 공간을 절약시켜, 각각의 Blob을 이전 버전에서의 수정 내역만을 기반으로 생성**시키고 checkout 등으로 특정 버전을 불러와야할 때 이러한 **수정 내역을 일괄적으로 읽어 해당 버전을 복구**한다. 그렇기에 전체 내용을 저장하는 것도 수정된 내역만 저장하는 것도 맞는 말이다.

### Git Tree
``` bash
abc83@develop MINGW64 ~/development/SeongWooJo.github.io/.git/objects (GIT_DIR!)
$ ls 1b/
2948a17f027fd4f4359c53a60b9582a3b1c265

abc83@develop MINGW64 ~/development/SeongWooJo.github.io/.git/objects (GIT_DIR!)
$ git cat-file -p 1b2948a17f027fd4f4359c53a60b9582a3b1c265
040000 tree 7a6a6a64b2bbae6b6cec73624b610e31830b56ac    Projects
040000 tree 51fb9a02110fa88741738be230342544256e1f73    Tutorial
040000 tree 7a5657ae0999f622f6509b8416f659a0262eba33    cs-note
040000 tree c472bd9693f8ca55e7590d9ace65ee51b6f99179    dev-log
100644 blob a49ba48448f906d814cc83e50fc18f81cae53844    index.md
040000 tree b56fcfa45f3a0afaf2c480470f2b38f1b44fc26d    tech-review
```

이번엔 Tree 오브젝트를 살펴보자, 위의 그림을 보듯이 tree object는 자신이 가지고 있는 Tree와 Blob을 가르키는 오브젝트이다.

트리는 각 '디렉토리'별로 '파일 이름'을 저장한다.
현재 블로그에서 디렉토리를 담당하는 cs-note, dev-log 등은 tree로 저장되고ㅡ, index.md같은 실제 파일은 Blob으로 저장된 모습을 볼 수 있다.

또한 이러한 Tree 역시도 Blob과 마찬가지고 hash코드로 파일명이 지정된 것을 볼 수 있다.

Blob과 달리 **Tree는 디렉토리 전체를 기반으로 hash값을 생성하기에, 포함된 일부 파일이 하나만 수정되더라도 Tree 역시도 새로운 Tree 객체로 생성**된다.

하지만 이를 통해 git은 파일의 내용만 저장하는 Blob과 달리 **파일의 이름, 실행권한, 디렉토리 구조** 등을 Tree 객체를 통해 저장할 수 있다.

여기서 **.git/index 파일을 한번 살펴보자**.
```
$ git ls-files --stage | tail
100644 d344d060ac0c5db0f9bb01c4f1ce7e0d156598b9 0	search.html
100644 f259c5a08dd5d121a34a000017cd197ea02dc90b 0	sitemap.xml
100755 764df0355bdab53e2362b2f821e6c649162694d5 0	start.sh
100644 c9712bd9af8e82846391e82f7c50077b095f87fc 0	tag.html
100755 bdfb10641d93f265a382b3014341a15c68e4b139 0	tool/find-orphan-post-img.sh
100755 537c62c2bb5465d7594f085f8cf4935cf07ac4c4 0	tool/fix-image-references.sh
100755 01433e92888c8ce58bb79792ef786aa58d1acfc9 0	tool/pre-commit
100755 95b19d9863b6ad564bf6208f719a2bcc657a9ffc 0	tool/save-images.sh
100755 e36c4a696d2e351dc0efcd40db81d87e7ef1fb11 0	tool/to-skeleton.sh
100644 50fe65a76cb17611bb041bd5d2cc517ec863323f 0	utterances.json
```
[git index 자료 출처](https://johngrib.github.io/wiki/git/index/)
해당 파일의 컬럼은 각각 staging area로 옮겨진 파일들에 대한 나열을 수행하며, 각 staged 파일들에 대해
1. [mode] : 파일의 타입과 권한을 의미
2. [object] : 해당 파일을 나타내는 .git 내부 hash값
3. [stage] : 기본값 0 충돌이 났을 때 충돌난 각 파일 그룹들을 구분해주는 키
4. [file] : 실제 파일 경로
를 의미한다.

**tree는 확실하게 commit된 디렉토리(Tree)와 Blob들을 기록하지만, Staging 공간은 오로지 add된 파일들을 Blob으로 생성하고 이들을 나열하는 차이**를 확인할 수 있다.

하지만 만약 현재 staing 공간에 존재하는 파일들을 tree로 만들고 싶다면, ```git write-tree``` 명령을 통해 Tree객체를 생성해주고, 이에 대한 hash 값을 커맨드에 출력해준다.

### Git Commit

프로젝트의 디렉토리에 대한 정보와 파일 내용에 대한 정보를 Tree와 Blob을 통해 저장하였다. 
하지만 이는 한 시점에 프로젝트의 상태를 기록하는 방법론일 뿐이다.

git은 우리가 commit을 수행할 때마다 **해당 시점에 누가 기록했는지, 이 이전 시점의 기록은 무엇인지** 추적이 가능해야한다. 이러한 역할을 수행해주는 것이 commit 객체이다.

``` bash
abc83@develop MINGW64 ~/development/SeongWooJo.github.io/.git/objects (GIT_DIR!)
$ git log
commit f342a499d9ea17b2956f9bea91c33354d1870984 (HEAD -> main, origin/main, origin/HEAD)
Author: SeongWooJo <abc8325767@gmail.com>
Date:   Wed Aug 13 22:35:28 2025 +0900

    search

commit 1a733fefb50c137ab2b95285b82f084dc60193aa
Author: SeongWooJo <abc8325767@gmail.com>
Date:   Wed Aug 13 22:29:42 2025 +0900

    Update _config.yml

commit 80646a438cff8f50884f6bf2945b2f4e15887ff4
Author: SeongWooJo <abc8325767@gmail.com>
Date:   Wed Aug 13 22:23:09 2025 +0900

    .

commit 19781c03fd83f4c185f9ab5051c8bba72983bace
Author: SeongWooJo <abc8325767@gmail.com>
Date:   Wed Aug 13 22:22:41 2025 +0900

```

우리가 ```git log``` 명령을 수행하면 위와 같이 hash값과 함께 각 커밋에 대한 정보를 나열해주는 것을 볼 수 있다. 어떻게 이런 작업이 가능한 것일까?

아까처럼 hash 코드를 기반으로 파일을 열어보자.

``` bash
abc83@develop MINGW64 ~/development/SeongWooJo.github.io/.git/objects (GIT_DIR!)
$ git cat-file -p 19781c03fd83f4c185f9ab5051c8bba72983bace
tree ba3c9fe46ea8e11d47e739b69c347cf1d5efd75e
parent dba0935cb5910000496ffac60c49ba2534de4001
author SeongWooJo <abc8325767@gmail.com> 1755091361 +0900
committer SeongWooJo <abc8325767@gmail.com> 1755091361 +0900

robot

```

해당 커밋은 git blog를 배포하기 위해 robot.txt를 시험하던 시점의 커밋이다. commit 메세지로 robot으로 간단하게 적었다.

이 객체를 분석해보자.
1. tree : 해당 커밋 시점의 프로젝트 전체를 가르키는 tree 객체의 hash값이다.
2. parent : 해당 커밋의 이전 커밋 객체를 가르키는 hash값이다.
3. author : 해당 커밋 시점의 코드를 작성한 사람에 대한 정보이다.
4. committer : 해당 커밋을 작성한 사람에 대한 정보이다.
5. "robot" 해당 커밋을 작성할 때 메세지이다.

이처럼 버전관리를 위해 필요한 추적을 위한 정보들이 커밋 객체에 담긴 것을 확인할 수 있으며, 커밋 객체역시도 tree,blob과 마찬가지로 내용을 기반으로 hash값을 폴더/파일명으로 삼는다.

### Git Tag

자 hash를 기반으로 Blob, Tree, Commit의 접근하는 것은 저장도 효율적이고 버전 관리도 될 수 있는 방법이지만, 40글자에 해당하는 hash 코드는 사람이 구분하기에 어렵다.

이를 해결해주기 위한 객체가 바로 Tag 객체이다.

``` bash
git tag [옵션] <tagname> [<commit>]
git tag -a v1.0 -m "First release"
git tag -s v1.0 -m "Signed release"
git tag v1.1 <commit_hash>
```

우리는 위와 같은 명령을 통해 각 hash 코드에 사람이 접근하기 좋은 이름을 붙여줄 수 있다.

이를 기반으로 기존에는 ```git checkout hash코드``` 처럼 40글자의 hash코드를 사용해야하는 명령에서, ```git checkout 태그명```으로 미리 지정한 tagname을 기반으로 hash코드를 대체할 수 있다.

다만 위의 예시처럼 우리가 어떻게 태그를 생성했느냐에 따라 구현방식이 조금씩 다르다.

1. -a 옵션
   ``` bash
   $ git cat-file -p c3d5f2a
    object 7a9b74c6b6f4d4c85b8e4cf59ef1fa3e63c5c3ad
    type commit
    tag v1.0
    tagger Alice <alice@example.com> 1713250000 +0900

    First release
   ```
   -a 옵션을 사용했을 때는 해당 hash 파일에 대한 태그를 생성할 때 누가 태그를 붙였는지, 해당 태그를 붙일 떄 시점 및 메세지를 같이 남긴다.

2. -s 옵션
   ``` bash
    object 7a9b74c6b6f4d4c85b8e4cf59ef1fa3e63c5c3ad
    type commit
    tag v1.0
    tagger Alice <alice@example.com> 1713250000 +0900

    Signed release
    -----BEGIN PGP SIGNATURE-----
    Version: GnuPG v2

    iQEzBAABCAAdFiEE...
    -----END PGP SIGNATURE-----
   ```
   -s 옵션은 -a 옵션에 더해 해당 tagger를 검증할 수 있는 키를 남겨, public key를 통해 검증할 수 있게 한다.
3. 그냥 만들시
    이때는 tag 객체가 생성되는 것이 아닌, refs/tags에 해당 태그가 가르키는 hash코드에 대한 정보만이 한 줄로 기록된다.


## git refs
![git refs](/assets/img/pages/tech-review/Communicate/git/git_refs_heads.webp)
.git/refs 폴더에는 이러한 객체를 가르키는 포인터를 만들 수 있으며 이곳에 저장되는 포인터 정보는
1. .git/refs/heads
    각 브랜치별 최신 작업 커밋을 가르키는 hash값 및 working directory가 작업하고 있는 버전의 commit hash값
2. .git/refs/tags
    사전에 태그로 등록한 commit, tree, blob hash값이 저장되는 장소
3. .git/refs/remotes
    local 저장소가 아닌 remote 저장소에 브랜치들에 대한 최신 commit hash값이 저장되는 장소

와 같이 앞서 공부한 **git의 객체들에 대한 hash값을 refs 폴더에서 실제 git에서 작업되는 hash값을 관리**해줌으로써 우리가 브랜치명, 원격 브랜치명, 태그명으로 실제 hash값을 사용하지 않고 쉽게 이동할 수 있다.

# 참고자료

[git의 저장방식 영상](https://www.youtube.com/watch?v=xn-kNB_a8CQ&t=1488s)
[git blob, tree, commit](https://300-29-1.tistory.com/71)
[git tags](https://kotlinworld.com/298)
[git에 대한 추후 볼 내용1](https://d2.naver.com/helloworld/1859580)
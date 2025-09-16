---
title: "Cookie"
tags:
    - cs-note
    - Web
    - 상태관리
date: "2025-09-16"
thumbnail: "/assets/img/thumbnail/cookie.jpg"
permalink: /cs-note/Web/State/Cookie
bookmark: true
---

# 쿠키 개요
---

쿠키는 서버가 클라이언트에게 특정 정보를 저장하도록 전달하는 수단으로, 서버가 HTTP 응답에 쿠키를 포함하면 이후 클라이언트는 서버와의 요청마다 해당 쿠키를 함께 전송한다.

이 용어는 원래 유닉스·네트워크 시스템에서 프로세스 간 통신 시 신원 식별이나 권한 확인을 위해 주고받던 작은 데이터 조각인 매직 쿠키(Magic Cookie) 개념에서 비롯되었다. 이러한 아이디어를 웹에 적용하면서, HTTP 통신에서도 클라이언트와 서버가 교환하는 작은 데이터 조각이라는 공통된 특성을 반영해 쿠키라 불리게 되었다.

실제 사용 예로는 로그인 상태 유지(세션 관리), 장바구니와 같은 사용자 활동 기록, 언어·테마 설정과 같은 개인화, 그리고 광고나 분석을 위한 사용자 행동 추적 등이 있다.

## 브라우저 저장소

브라우저가 인증 등에 사용하는 정보들을 저장하기 위한 방법론에는 쿠키, 로컬 스토리지, 세션 스토리지, 웹 스토리지 등이 있다.

각 저장소에 대한 간략한 설명은 아래와 같다.
1. 쿠키

    쿠키란 서버가 클라이언트에게 보내는 작은 데이터 파일로, 서버가 쿠키를 브라우저에게 적용을 시키면 그 이후 서버와 클라이언트에 모든 요청과 응답에는 쿠키가 포함되어 전송된다. 이러한 특징 때문에 저장할 수 있는 용량이 작으며 보안의 취약하다는 단점이 있다.

2. 로컬 스토리지

    브라우저 자체에 영구적으로 데이터를 저장하고, 브라우저가 종료되더라도 데이터가 유지가 된다.
    [로컬 스토리지 세팅 예시](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

3. 세션 스토리지

    탭 윈도우 단위로 스토리지가 생성이 되며, 탭 윈도우를 닫을 때 데이터가 삭제되는 특징을 가진다. 페이지 새로고침으론 데이터가 삭제되지 않는다.
    [세션 스토리지 세팅 예시](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)


로컬이나 세션 스토리지의 경우, CrossSite 공격에 취약하기 때문에 민감한 정보를 저장하면 안된다.(SOP 정책이 있는 이유인 공격에 취약)
또한 JS를 통해 데이터에 접근하며 쿠키와 다르게 항상 붙여져서 서버에 전송되지 않는다.

## 쿠키의 구성

```python
response.set_cookie(
        key="access_token",
        value=token.access_token,
        httponly=True,
        secure=True,  # dev use only https
        samesite="None",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
```
위와 같은 예시로 쿠키를 서버가 설정하여 브라우저가 특정 쿠키를 저장하도록 설정할 수 있다.
이때 쿠키에 적용될 수 있는 옵션들은 아래와 같은 의미를 갖는다.

[참고링크](https://developer.mozilla.org/ko/docs/Web/HTTP/Reference/Headers/Set-Cookie)

### 1. Key & value

쿠키에 저장되는 정보는 기본적으로 key와 value의 쌍으로 저장되며, 각 쿠키는 브라우저와 통신하는 서버별로 따로 저장된다.
만약 여러 개의 key, value를 저장하고 싶다면 각 key, value별로 옵션을 설정하여 set_cookie를 실행해야한다.

### 2. Domain

쿠키를 보낼 호스트를 정의하는 옵션이다.
쿠키는 쿠키가 생성된 도메인 별로 종속되어서 저장된다. 예를 들어 ``example.com``에서 생성된 쿠키는 ``www.example.com``에선 사용될 순 있지만, 반대로 ``www.example.com``에서 생성된 쿠키는 ``example.com``에선 사용될 수 없다.

이런 식으로 쿠키가 저장될 도메인을 설정할 옵션은 자신과 관련된 서브 도메인까지만 가능하다.
예를 들어 우리의 주소 ``dev.medai.im`` 도메인에서 쿠키를 설정할 땐 해당 옵션을 사용하여 ``medai.im`` 도메인에 쿠키를 저장하여 다른 서브 도메인들에서 해당 쿠키를 사용하게 만들 순 있지만, 다르게 ``ai.im`` 같은 전혀 다른 도메인에 쿠키를 저장할 순 없다.

### 3. Expires, max_age : 쿠키의 만료시간과 관련된 옵션

이 두가지 옵션은 쿠키가 유지되는 시간을 정의하는 옵션이다.

- MaxAge : 쿠키가 유지되는 시간을 정의하며, 만약 **Expires와 동시에 설정된다면 우선**되는 옵션이다. 현재 시간에 해당 옵션의 시간이 추가되어 만료시간이 계산된다.

- Expires : HTTP Date형식으로 쿠키가 만료되는 날짜와 시간을 정의한다.

만약 2개의 옵션을 모두 설정하지 않으면, 쿠키는 브라우저가 종료되는 시점까지 유지되는데 이를 Session Cookie라고 한다.


### 4. HttpOnly, Secure : 쿠키의 보안과 관련된 옵션

- HttpOnly : 해당 옵션을 활성화할 시, 쿠키를 JavaScript를 통해서 저장된 곳을 접근해 확인하는 것이 불가능해진다. 이 옵션이 true가 되었다면 개발자도구를 통해서 직접 확인하거나, 서버와 클라이언트가 통신 중 헤더에 붙은 쿠키를 직접 확인하는 방법으로만 체크할 수 있게 된다.

- Secure : HTTP는 기본적으로 평문으로 통신하기에 쿠키 역시도 확인이 가능하다. 하지만 Secure 옵션이 존재하는 순간 http에 쿠키를 붙여서 보낼 수 없게되며, 오로지 https를 통해서 전송할 시에만 쿠키를 붙일 수 있게 된다.

### 5. Partitioned

쿠키는 기본적으로 요청을 받는 서버별로 브라우저가 쿠키를 저장한다. 이와 같은 특징으로 인해 만약 광고 tracker.com 이라는 사이트가 특정 js를 광고용으로 여러 사이트 a.com, b.com에 넣어두면, 브라우저가 a.com, b.com을 방문했을 때 같은 tracker.com으로 요청이 들어감으로써 쿠키를 통해 브라우저를 고유하게 식별해서 사용자 추적이 가능해진다.

이러한 사용자 추적을 막기위한 기능이 Partitioned로 쿠키를 저장한 버킷을 tracker.com으로만 두는 것이 아닌 탑레벨 사이트 + 쿠키 도메인으로 a.com, b.com도 쿠키 저장소를 구분하는 기준에 추가하여, 탑레벨 사이트만으로 쿠키가 공유되지 않도록 한다.

### 6. Path

해당 쿠키를 클라이언트-서버가 통신할 때 전부 붙여서 보내는 게 아닌,
``Path=/target-path``로 설정하면 ``www.example.com/other-path`` 같은 url에선 쿠키가 전송되지 않고, ``www.example.com/target-path`` 및 해당 url의 하위 경로로 요청을 보낼때만 브라우저가 쿠키를 포함시킨다.

### 7. SameSite

Strict, Lax, None 3가지 옵션을 가질 수 있으며 각 옵션의 의미는 아래와 같다.

- Strict
    브라우저가 동일한 사이트 요청에만 쿠키를 전송한다. 예를 들어 ``www.a-example.com``에서 백엔드인 ``www.be-example.com``으로 요청을 보내 백엔드에서 쿠키를 설정해 보낸다면, 2개의 사이트의 도메인이 다르기에 Strict 옵션을 사용한 쿠키라면 저장이 되지 않는다.
    만약 ``a-example.com``에서 ``api.a-example.com`` 백엔드로 보낸다면 2개의 사이트의 도메인이 같기에 Strict 옵션을 통과하고 저장된다.

    이때 동일한 사이트로 구분되는 기준은 Public Domain과 앞의 접미사까지 동일해야 동일한 사이트로 취급된다. [public domain 리스트](https://publicsuffix.org/list/public_suffix_list.dat)
    ex) .com, .github.io 등 Public Domain에 대해 그 다음 항목인 ``a.com`` ``a.github.io`` | ``b.com`` ``b.github.io`` 는 다른 사이트이다. 

- Lax
    Lax 옵션은 SameSite가 아니더라도, 특정 접근에 관해서는 쿠키를 붙이는 것을 허용하는 옵션이다. 여기서 특정 접근은 아래와 같다.
    1. 사용자가 직접 사이트에서 클릭을 해서 이동하는 경우
    2. 해당하는 내용은 특정 이미지 등의 리소스 요청이 아닌 전체 사이트가 변경되는 GET 요청(특정 사이트에서 동일한 로그인 정보를 공유하는 다른 사이트로 갈 때 등)에는 Lax 옵션을 통해 허용해준다.

- None
    오로지 Secure 옵션이 true 인 것과 병행될 때만 사용 가능한 옵션으로, 백엔드와 요청을 보낸 사이트가 samesite가 아니더라도 언제나 쿠키를 보낼 수 있는 옵션이다. 해당 옵션이 활성화되지 않는다면, 서버와 클라이언트의 도메인 주소가 다르다면 쿠키를 사용할 수 없다.

    개발환경에서 ``localhost:3000``에서 ``arna.medai.im``으로 요청을 보낸다면 SameSite가 None이 아닌 경우 Cookie를 설정할 수 없다.

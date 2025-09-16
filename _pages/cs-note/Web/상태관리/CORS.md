---
title: "CORS"
tags:
    - cs-note
    - Web
    - 상태관리
date: "2025-08-29"
thumbnail: "/assets/img/pages/cs-note/Web/상태관리/scenario.webp"
bookmark: true
---

# Cross Origin Resource Sharing(CORS)
---
우리가 API요청을 보내다보면 자주 CORS Error라는 표현을 들어볼 수 있다. 각종 통신을 수행할 때 오류를 쉽게 걸리게 하는 머리가 아픈 녀석이다. 그렇다면 브라우저는 왜 이런 정책을 사용하고 우린 어떻게 이런 Error를 해결할 수 있을까?

## SOP 정책

### SOP란?

사실 실제 오류가 걸리게하는 정책은 CORS라 불리는 것이 아닌 SOP(Same Origin Policy)이다. 브라우저는 기본적으로 Origin이 다른 곳에 요청을 보낼 때 해당 요청을 차단하는 정책을 기본값으로 가지고 있다. 그렇다면 여기서 Origin이 정확히 무엇일까?

```http://front.com:80/pages/10?search=good``` 이런 URL이 있다고 가정해자

1. 프로토콜은 http
2. host주소는 front.com
3. 포트 번호는 80

이 3가지 요소를 합쳐져서 Origin이라고 불린다. 

기본적으로 브라우저는 우리가 이런 Origin이 다른 곳에 요청을 보낼 때 요청을 차단을 수행하지만, 실제 우리가 사용하는 환경은 다른 출처에 요청을 보내야하는 경우가 존재하기에, 이러한 정책을 통과시켜주는 방법론이 CORS이다. 즉 브라우저는 너가 다른 Origin으로 요청을 보내고 싶으면 CORS를 통해 허용을 하라고 표현해주는 것이다.

### 왜 SOP가 필요할까?

아래와 같은 시나리오를 생각해보자.

1. 무수한 CORS 오류를 겪은 철수는 이 에러에 진절머리가나 SOP 정책을 없애리도록, 자신이 만든 사이트에
    ```h
    Access-Control-Allow-Origin: *
    Access-Control-Allow-Credentials: true
    ```
    처럼 허용을 해버렸다.

2. 영희는 철수에 사이트를 가입하고, 플래시 게임을 하려 evil.com에 접속을 한다. 그런데 evil.com 관리자는 철수의 동료라 SOP를 무시하는 코드를 실행시켰다는 것을 알아 아래와 같은 코드를 넣어두었다.
    ```javascript
    <script>
        fetch('http://철수.com').then(/**/) // 이후 공격자에게 전송  
    </script>
    ```

3. 영희의 브라우저는 요청을 받았을 때, Source와 fetch의 요청되는 사이트의 Origin이 다르다는 사실을 확인했지만, 철수의 사이트는 어떤 사이트가 출처든 허용되는 설정을 해버렸다.
   
4. 공격자는 영희가 evil.com에 접속했을 때 철수의 사이트에 화면을 그대로 볼 수 있게 되버렸고, 영희의 해당 사이트의 개인정보가 탈취되었다...

즉 SOP 정책을 통해서 Origin이 다른 사이트의 fetch를 브라우저가 자체적으로 차단함으로써, 해당 사이트의 정보를 다른 사이트가 탈취할 수 없도록 만드는 것이 해당 정책이 있는 이유이다. 즉 사용자가 악성 사이트에 들어가더라도, 다른 사이트의 정보, 토큰, 세션 ID 등이 탈취되지 않도록 보호하는 정책이다.

## CORS

### CORS란?

현대 웹에서는 특정 사이트가 다른 사이트의 데이터를 활용해야 하는 경우가 많다. 예를 들어, 프론트엔드에서 자체 백엔드 서버로 요청을 보내거나, 공공 데이터 포털처럼 외부에서 제공하는 API에 접근하는 경우가 있다. 하지만 이러한 요청은 대체로 서로 다른 Origin을 가지므로, 브라우저의 SOP 정책에 의해 기본적으로 차단된다.

이를 해결하기 위해 등장한 것이 CORS(Cross-Origin Resource Sharing) 정책이다.

예를 들어, 프론트엔드에서 fetch 명령으로 어떤 백엔드 서버에 데이터를 요청한다고 하자. 이때 프론트엔드의 URL과 백엔드 서버의 URL이 서로 다른 Origin을 가지면, 브라우저는 SOP 규칙에 따라 해당 요청을 차단한다.

그러나 만약 백엔드 서버가 CORS 설정을 통해 프론트엔드 서버의 Origin을 허용한다면, 브라우저는 이 요청을 정상적으로 실행할 수 있다. 그 결과, 사용자는 브라우저를 통해 해당 백엔드 서버의 데이터에 접근할 수 있게 된다.

즉, CORS라는 것은 미리 특정 사이트에 대한 사용자가 접근할 수 있는 페이지나, 정보를 다른 사이트가 봐도 된다고 허용을 해주는 것이다. 또한 이런 허용은 브라우저에서 설정하는 것이 아닌 특정 사이트(즉 백엔드 서버나, API 서버 등등)에서 허용을 해주는 것이다.

### CORS의 세가지 시나리오

![그림1](/assets/img/pages/cs-note/Web/상태관리/scenario.webp)

JavaScript, Browser, API Server의 통신은 위와 같은 그림으로 나타낼 수 있다. 여기서 빨간 부분이 CORS의 시나리오에 해당하는 부분이다. 각 동작에 따라 CORS는 크게 3가지의 시나리오로 나누어서 판단을 수행한다.

1. Simple Request

    Simple Request는 Get과 Post 같은 요청을 보낼 때 수행되며, 요청을 보내는 걸 별도의 인증 없이 바로 수행할 수 있으며, 만약 인증이 수행되지 않더라도 응답에 대한 데이터를 JavaScript가 못받는 것 뿐이다. 해당 요청은 Access-Control-Allow-Origin에 Origin이 포함만 되어있다면, 별도의 요청없이 바로 수행된다.

2. Preflight Request

    * HTTPS의 특별한 메소드인 Option 메소드를 활용하며 예비 요청을 사전에 보낸다. 이 예비 요청의 역할은 Origin과 Access-Control-Allow-Origin을 비교해주어 Origin이 CORS에 등록되어있으면 200을 보내는 역할이다. 그 후 해당 요청을 통과하면 본 요청을 보내주는 역할이다. 대부분의 요청은 Preflight Request로 검증을 수행한다.

    * CORS가 생기기 이전 SOP만 가능하다는 가정하에 만들어진 서버들이 CORS 처리 매커니즘이 있는지 확인해주기 위해 Preflight Request를 통해 브라우저가 사전에 확인을 해줌으로써, 해당 사항을 처리할 수 있는 서버만 해당 동작이 수행될 수 있도록 만든 것이다.
    
3. Credentitaled Request

    Cookie나 Session에 대한 정보가 담긴 HTTPS 요청이 들어올 때 Credentitaled Request가 수행된다. 기본적인 매커니즘은 Origin을 검사하는 Preflight Request와 동일하지만, 해당 Request를 수행할 때 Access-Control-Allow-Origin이 Wild Card : * 로 설정되어있을 때 브라우저가 자동으로 차단하며, Access-Control-Allow-Credentials가 true일 때만 해당 요청을 수락하는 추가적인 보안 사항이 존재한다.

### CORS와 개발환경

CORS는 기본적으로 Origin이 사전에 허용되어있거나, 동일해야지만 브라우저가 fetch를 허용해준다. 하지만 여기서 문제가 발생한다. 개발환경인 경우 모든 개발자의 컴퓨터를 어딘가에 배포한 것이 아닌 각자 컴퓨터에서 프론트엔드를 실행하기에 Origin을 하나로 고정할 수 없다는 문제가 발생한다.
또한 리다이렉트 등의 문제가 발생하면, 기존의 허용해두었던 Origin이 변경되어 무수한 CORS 에러를 만나게 되었다.

근본적인 문제는 각 개발환경은 ip가 모두 다른 것이다. 그렇기에 FE 개발환경과 백엔드 서버를 CORS 오류가 없이 연결하기 위해서는, localhost:3000과 같은 특정 도메인을 프론트엔드 개발환경에서 만드는 브라우저가 인식하는 Origin을 모든 개발환경의 개발자들이 통일할 필요성이 있고, 통일한 Origin을 백엔드에서 allow origin으로 허용해주어야 SOP 정책을 통과할 수 있다.

프론트엔드와 백엔드를 연결하는 과정에서 인증과 CORS 정책이 겹쳐 해결한 방식을 아래에 포스트에 정리하였다.



```
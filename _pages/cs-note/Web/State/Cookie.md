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

## JWT 토큰 예시
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30
```

이렇게 구성된 토큰은 Based64Decode 등의 방법론을 통해서 encode, decode 가능하다. 즉 별도의 키가 필요한 해독방식은 아니다.
토큰을 살펴보면 ``.``으로 구분된 3개의 영역이 있는데 이를 각각 디코딩을 수행하면 아래와 같은 정보들이 생성된다.

## 디코딩된 정보 예시

### 1. header
```
{
  "alg": "HS256",
  "typ": "JWT"
}
```

토큰의 타입(typ)는 보통 JWT로 고정되어있고, alg는 알고리즘의 약자로, 3번 서명값을 만드는데 사용될 알고리즘의 약자가 적혀있다.

### 2. payload
```
{
  "sub": "1234567890",
  "name": "John Doe",
  "admin": true,
  "iat": 1516239022
}
```

Json 형식으로 서비스가 사용자에게 해당 토큰을 통해 공개하기를 원하는 내용, 사용자 닉네임, 서비스 상의 레벨, 관리자 여부 등의 정보를 저장할 수 있는 부분이다. 이렇게 토큰에 담긴 사용자에 대한 정보를 Claim이라고 한다. 이렇게 사용자에 대한 정보를 애초에 포함한 정보가 보내지기에, 서버가 DB 등을 뒤질 필요성도 적어진다.

### 3. verify signature
```
a-string-secret-at-least-256-bits-long
```
해당 값에는 header + payload + 서버에 존재하는 비밀값을 기반으로 헤더에 적힌 암호화알고리즘을 통해 생성된 secret string 서명값이 기록되어있다. 별도의 키 값 없이 payload나 header가 해독되더라도, 그 값을 멋대로 수정해버리면 서버에 존재하는 비밀키 값과 조합되서 알고리즘을 실행시켰을 때 verify signature값이 달라져버리기에 JWT가 인증의 수단으로 사용될 수 있다.

## JWT의 특징

위와 같은 JWT의 구성방식을 보면 알 수 있듯이, JWT의 기록되는 상태 정보는 시간에 따라 달라지는 것이 아닌 해당 인증이 유효할 때 항상 동일한 정보를 기반으로 사용자를 구분한다. 이런 식으로 시간에 따라 바뀌지 않는 상태값을 갖는 것을 stateless라고 불리며, 반대로 세션은 stateful이라고 불린다.

이러한 특징으로 인해

1. 인증에 관련된 사용자의 상태정보가 시간에 따라 바뀌지 않는다.
2. 서버가 사용자의 정보를 별도로 기록할 필요가 없기 때문에, 비용적인 측면에서 장점이 존재한다.
3. 토큰이 탈취되면 서버는 이를 구분할 방법이 없기에, 탈취에 대한 대처가 취약하다.
   
토큰 탈취의 위험을 막기 위해 보통 refresh Token과 access Token을 따로 구현한 후 위에서 이야기한 인증에 관련된 기능은 유효기간이 짧은 access Token으로 refresh Token은 access Token을 재발급해줄 수 있는 역할과 이를 서버가 기억함으로써 서버가 로그인을 관리할 수 있도록 한다.

## 실제 구현(파이썬 프로젝트와 관련된 예시)

.env 등 공개되지 않는 환경설정 파일에서 아래와 같이 JWT에 사용될 서버가 저장하는 비밀키를 저장한다.
```
JWT_SECRET_KEY=~
```

파이썬 코드 내부에서 사용될 알고리즘과 Access Token 만료시간, refresh Token 만료시간을 저장한다.

```
SECRET_KEY = JWT_SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 4 * 60  # AccessToken 만료 시간
REFRESH_TOKEN_EXPIRE_DAYS = 14  # RefreshToken 만료 시간
```

로그인이 완료된 후 payload에 입력될 정보들을 서버에서 입력해주어 Access Token을 생성해준다.

```python
new_access_token = create_access_token(
    data={"sub": username}, expires_delta=access_token_expires
)

def create_access_token(data: dict, expires_delta: Union[timedelta , None] = None):
    to_encode = data.copy()
    print("to_encode", to_encode)
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
```

현재 구현된 코드에선 사용자의 username과 access token이 만료되는 시간을 인증 payload에 넣은 모습을 볼 수 있다. AlGORITHM은 위에서 상수로 고정되어있으며, SECRET KEY는 .env파일을 통해 가져와서 jwt 코드를 인코딩해 Access Token을 사용하는 모습을 볼 수 있다.

또한 refresh Token은 서버에 저장해서 비교하는 용도이기 때문에, JWT만을 쓰지 않고 랜덤한 난수 등을 활용해 키를 만들 수도 있으면, 탈취되었다면 서버 DB에서 제거하는 등으로 대처할 수 있다.
다만 현재 구현되는 시스템은 병원의 내부망에서 사용될 예정이기에, 보안상 access Token의 탈취 위험이 적기에 현재는 별도의 refresh token을 사용하지 않게 변경되었다.

```python
async def get_current_doctor(request: Request, db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        # this decode will check expire token, if expired, raise exception
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(payload)
        username: str = payload.get("sub")
        print("get_current_doctor: ", username)
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError as e:
        print("JWTError", e)
        raise credentials_exception
    doctor = get_doctor_by_username(username=token_data.username, db = db)[0]
    if doctor is None:
        raise credentials_exception
    return doctor
```

마지막으로 위처럼 각 http 요청이 들어올 때마다, Middleware로 JWT를 디코딩하고 만약 서명에 문제가 발생시 JWTError를 발생시키는 코드를 통해 JWT를 통한 인증을 구현할 수 있다.

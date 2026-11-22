# 카페인 중독자

<https://seongwoojo.github.io> 의 원본입니다. [Quartz 5](https://quartz.jzhao.xyz/)로 만듭니다.

- 글은 `content/`에 있습니다. 이 폴더는 따로 관리하는 글 원본에서 동기화로 만들어지므로 여기서 직접 고치지 않습니다.
- `main`에 올라오면 GitHub Actions가 사이트를 만들어 GitHub Pages로 내보냅니다 (`.github/workflows/deploy.yml`).
- 화면 설정은 `quartz.config.yaml`, 직접 만든 화면 조각은 `custom/`, 직접 만든 플러그인은 `plugins/`, 직접 고친 스타일은 `quartz/styles/custom.scss`에 있습니다.

## 내 컴퓨터에서 보기

```bash
npm ci
npx quartz build --serve
```

예전 Jekyll 블로그는 `jekyll-archive` 브랜치에 남아 있습니다.

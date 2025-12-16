# Markdown Editor API

블로그 내 마크다운 에디터를 위한 API 서버입니다.

## 설치

```bash
cd api
npm install
```

## 실행

```bash
npm start
```

또는 개발 모드 (자동 재시작):

```bash
npm run dev
```

서버는 `http://localhost:3001`에서 실행됩니다.

## API 엔드포인트

### 파일 불러오기
```
GET /api/load?path=_posts/2025-12-01-example.md
```

### 파일 저장
```
POST /api/save
Content-Type: application/json

{
  "path": "_posts/2025-12-01-example.md",
  "content": "# 제목\n\n내용..."
}
```

### 포스트 목록
```
GET /api/posts
```

## GitHub API 연동 (선택사항)

프로덕션 환경에서는 GitHub API를 직접 사용할 수 있습니다. 
`assets/js/markdown-editor.js` 파일을 수정하여 GitHub API를 사용하도록 설정할 수 있습니다.


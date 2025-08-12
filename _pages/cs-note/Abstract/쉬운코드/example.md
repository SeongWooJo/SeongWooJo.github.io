<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <title>로드맵</title>
  <script>
    function loadMarkdown(file) {
      fetch(file)
        .then(response => response.text())
        .then(text => {
          document.getElementById("content").innerText = text;
        });
    }
  </script>
</head>
<body>
  <h1>🧠 로드맵</h1>
  <button onclick="loadMarkdown('docs/frontend.md')">Frontend</button>
  <button onclick="loadMarkdown('docs/backend.md')">Backend</button>
  <button onclick="loadMarkdown('docs/devops.md')">DevOps</button>
  <pre id="content" style="border:1px solid #ccc; padding:1em;"></pre>
</body>
</html>

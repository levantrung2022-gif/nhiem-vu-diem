const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 10000;
const HOST = "0.0.0.0";

const ROOT = __dirname;

function findHomePage() {
  const files = [
    path.join(ROOT, "index.html"),
    path.join(ROOT, "web_nhiem_vu_tiktok_v2.html"),
    path.join(ROOT, "TaskHub_TikTok.html"),
    path.join(ROOT, "public", "index.html")
  ];

  for (const file of files) {
    if (fs.existsSync(file)) {
      return file;
    }
  }

  return null;
}

function getContentType(file) {
  const ext = path.extname(file).toLowerCase();

  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon"
  };

  return types[ext] || "application/octet-stream";
}

function sendFile(res, file) {
  try {
    const data = fs.readFileSync(file);

    res.writeHead(200, {
      "Content-Type": getContentType(file),
      "Cache-Control": "no-cache"
    });

    res.end(data);
  } catch (error) {
    console.error(error);

    res.writeHead(500, {
      "Content-Type": "text/plain; charset=utf-8"
    });

    res.end("Không thể đọc file.");
  }
}

const server = http.createServer((req, res) => {
  try {
    let requestPath = (req.url || "/").split("?")[0];

    requestPath = decodeURIComponent(requestPath);

    // Trang chính
    if (requestPath === "/") {
      const home = findHomePage();

      if (!home) {
        res.writeHead(404, {
          "Content-Type": "text/plain; charset=utf-8"
        });

        res.end(
          "Chưa tìm thấy trang web. Hãy đặt file index.html trong repository."
        );

        return;
      }

      sendFile(res, home);
      return;
    }

    // Health check cho Render
    if (requestPath === "/health") {
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8"
      });

      res.end(
        JSON.stringify({
          status: "ok",
          service: "nhiem-vu-diem"
        })
      );

      return;
    }

    // Bỏ dấu / ở đầu
    let relativePath = requestPath.replace(/^\/+/, "");

    // Chặn truy cập ra ngoài thư mục dự án
    relativePath = path.normalize(relativePath);

    if (
      relativePath.startsWith("..") ||
      path.isAbsolute(relativePath)
    ) {
      res.writeHead(403, {
        "Content-Type": "text/plain; charset=utf-8"
      });

      res.end("Forbidden");
      return;
    }

    const possibleFiles = [
      path.join(ROOT, relativePath),
      path.join(ROOT, "public", relativePath)
    ];

    for (const file of possibleFiles) {
      if (fs.existsSync(file) && fs.statSync(file).isFile()) {
        sendFile(res, file);
        return;
      }
    }

    // Nếu route không tồn tại thì trả về trang chính
    // để tránh lỗi Cannot GET /
    const home = findHomePage();

    if (home) {
      sendFile(res, home);
      return;
    }

    res.writeHead(404, {
      "Content-Type": "text/plain; charset=utf-8"
    });

    res.end("404 - Không tìm thấy trang.");

  } catch (error) {
    console.error("SERVER ERROR:", error);

    res.writeHead(500, {
      "Content-Type": "text/plain; charset=utf-8"
    });

    res.end("Server error.");
  }
});

server.listen(PORT, HOST, () => {
  console.log("-----------------------------------");
  console.log("NHIEM VU DIEM SERVER");
  console.log("Server đang chạy");
  console.log("Port:", PORT);
  console.log("Host:", HOST);
  console.log("-----------------------------------");
});

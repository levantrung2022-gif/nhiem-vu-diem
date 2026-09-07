const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { Pool } = require("pg");

const PORT = Number(process.env.PORT || 10000);
const HOST = "0.0.0.0";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL chưa được cấu hình trên Render.");
}

const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false
    })
  : null;

const sessions = new Map();

const MAIN_CHANNEL = {
  name: "@uyn.uyn2229",
  url: "https://www.tiktok.com/@uyn.uyn2229"
};

// =========================
// CẤU HÌNH
// =========================

const CHECKIN_POINTS = 5;

// Người được giới thiệu đạt từ 20 điểm
const REFERRAL_THRESHOLD = 20;

// Người giới thiệu nhận 20 điểm
const REFERRAL_REWARD = 20;

// =========================
// HTTP HELPERS
// =========================

function sendJSON(res, status, data, headers = {}) {
  const body = JSON.stringify(data);

  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers
  });

  res.end(body);
}

function sendText(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type
  });

  res.end(body);
}

function parseCookies(req) {
  const cookies = {};

  const raw = req.headers.cookie || "";

  raw.split(";").forEach((item) => {
    const index = item.indexOf("=");

    if (index === -1) return;

    const key = item.slice(0, index).trim();
    const value = item.slice(index + 1).trim();

    cookies[key] = decodeURIComponent(value);
  });

  return cookies;
}

function createSession(userId) {
  const sid = crypto.randomBytes(32).toString("hex");

  sessions.set(sid, {
    userId,
    createdAt: Date.now()
  });

  return sid;
}

function getSessionUserId(req) {
  const cookies = parseCookies(req);

  const session = cookies.sid
    ? sessions.get(cookies.sid)
    : null;

  return session ? Number(session.userId) : null;
}

function setSession(res, sid) {
  res.setHeader(
    "Set-Cookie",
    `sid=${encodeURIComponent(
      sid
    )}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000`
  );
}

function clearSession(res) {
  res.setHeader(
    "Set-Cookie",
    "sid=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"
  );
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;

      if (body.length > 1000000) {
        req.destroy();
        reject(new Error("Dữ liệu gửi lên quá lớn."));
      }
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Dữ liệu JSON không hợp lệ."));
      }
    });

    req.on("error", reject);
  });
}

// =========================
// PASSWORD
// =========================

function hashPassword(password, salt) {
  const realSalt =
    salt || crypto.randomBytes(16).toString("hex");

  const hash = crypto
    .scryptSync(password, realSalt, 64)
    .toString("hex");

  return {
    hash,
    salt: realSalt
  };
}

function verifyPassword(password, hash, salt) {
  try {
    const actual = crypto.scryptSync(
      password,
      salt,
      64
    );

    const expected = Buffer.from(hash, "hex");

    return (
      actual.length === expected.length &&
      crypto.timingSafeEqual(actual, expected)
    );
  } catch {
    return false;
  }
}

// =========================
// VALIDATION
// =========================

function validUsername(username) {
  return (
    typeof username === "string" &&
    /^[A-Za-z0-9_.-]{3,24}$/.test(username)
  );
}

function validEmail(email) {
  return (
    typeof email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

function createReferralCode() {
  return crypto
    .randomBytes(6)
    .toString("hex")
    .toUpperCase();
}

// =========================
// USER
// =========================

async function getUserById(id) {
  const result = await pool.query(
    `
    SELECT
      u.*,
      (
        SELECT COUNT(*)
        FROM users r
        WHERE r.referred_by = u.id
      ) AS referred_count
    FROM users u
    WHERE u.id = $1
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function getUserByLogin(identifier) {
  const result = await pool.query(
    `
    SELECT
      u.*,
      (
        SELECT COUNT(*)
        FROM users r
        WHERE r.referred_by = u.id
      ) AS referred_count
    FROM users u
    WHERE LOWER(u.username) = LOWER($1)
       OR LOWER(u.email) = LOWER($1)
    LIMIT 1
    `,
    [identifier]
  );

  return result.rows[0] || null;
}

function publicUser(user) {
  if (!user) return null;

  return {
    id: Number(user.id),
    username: user.username,
    email: user.email,
    points: Number(user.points || 0),
    completed: Number(user.completed || 0),
    referral_code: user.referral_code,
    referred_count: Number(user.referred_count || 0),
    referral_earned: Number(user.referral_earned || 0),
    created_at: user.created_at
  };
}

// =========================
// DATABASE
// =========================

async function initDatabase() {
  if (!pool) {
    throw new Error(
      "DATABASE_URL chưa được cấu hình."
    );
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,

      username VARCHAR(24) UNIQUE NOT NULL,

      email VARCHAR(255) UNIQUE NOT NULL,

      password_hash TEXT NOT NULL,

      password_salt TEXT NOT NULL,

      points INTEGER NOT NULL DEFAULT 0,

      completed INTEGER NOT NULL DEFAULT 0,

      referral_code VARCHAR(32) UNIQUE NOT NULL,

      referred_by INTEGER
        REFERENCES users(id)
        ON DELETE SET NULL,

      referral_rewarded BOOLEAN NOT NULL DEFAULT FALSE,

      referral_earned INTEGER NOT NULL DEFAULT 0,

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,

      title TEXT NOT NULL,

      description TEXT NOT NULL DEFAULT '',

      kind VARCHAR(20) NOT NULL DEFAULT 'channel',

      url TEXT NOT NULL,

      points INTEGER NOT NULL DEFAULT 5,

      active BOOLEAN NOT NULL DEFAULT TRUE,

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS completions (
      id SERIAL PRIMARY KEY,

      user_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

      task_id INTEGER NOT NULL
        REFERENCES tasks(id)
        ON DELETE CASCADE,

      points INTEGER NOT NULL,

      completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS checkins (
      id SERIAL PRIMARY KEY,

      user_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

      checkin_date DATE NOT NULL,

      points INTEGER NOT NULL,

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      UNIQUE(user_id, checkin_date)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_completions_user_time
    ON completions(user_id, completed_at);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_checkins_user_date
    ON checkins(user_id, checkin_date);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_users_referred_by
    ON users(referred_by);
  `);

  // Thêm nhiệm vụ mặc định nếu chưa có
  const count = await pool.query(
    `SELECT COUNT(*)::int AS count FROM tasks`
  );

  if (Number(count.rows[0].count) === 0) {
    const tasks = [
      [
        "Khám phá kênh TikTok chính",
        "Mở kênh TikTok chính và khám phá nội dung.",
        "channel",
        MAIN_CHANNEL.url,
        5
      ],
      [
        "Khám phá video TikTok",
        "Mở video TikTok và tự xem nội dung.",
        "video",
        MAIN_CHANNEL.url,
        5
      ],
      [
        "Khám phá kênh TikTok",
        "Mở kênh TikTok và khám phá nội dung.",
        "channel",
        MAIN_CHANNEL.url,
        5
      ]
    ];

    for (const task of tasks) {
      await pool.query(
        `
        INSERT INTO tasks
        (title, description, kind, url, points)
        VALUES ($1, $2, $3, $4, $5)
        `,
        task
      );
    }
  }

  console.log("PostgreSQL database ready.");
}

// =========================
// DASHBOARD
// =========================

async function getDashboard(userId) {
  const result = await pool.query(
    `
    SELECT
      u.points,
      u.completed,

      COALESCE(
        (
          SELECT SUM(c.points)
          FROM completions c
          WHERE c.user_id = u.id
            AND c.completed_at >= CURRENT_DATE
        ),
        0
      )::int AS today

    FROM users u

    WHERE u.id = $1
    `,
    [userId]
  );

  return (
    result.rows[0] || {
      points: 0,
      completed: 0,
      today: 0
    }
  );
}

// =========================
// TASKS
// =========================

async function getRandomTasks(userId) {
  const result = await pool.query(
    `
    SELECT
      id,
      title,
      description,
      kind,
      url,
      points

    FROM tasks

    WHERE active = TRUE

      AND id NOT IN (
        SELECT task_id
        FROM completions
        WHERE user_id = $1
      )

    ORDER BY RANDOM()

    LIMIT 10
    `,
    [userId]
  );

  return result.rows;
}

// =========================
// COMPLETE TASK
// =========================

async function completeTask(userId, taskId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const taskResult = await client.query(
      `
      SELECT id, points
      FROM tasks
      WHERE id = $1
        AND active = TRUE
      FOR SHARE
      `,
      [taskId]
    );

    if (!taskResult.rows.length) {
      throw new Error(
        "Nhiệm vụ không tồn tại hoặc đã bị tắt."
      );
    }

    const already = await client.query(
      `
      SELECT id
      FROM completions
      WHERE user_id = $1
        AND task_id = $2
      LIMIT 1
      `,
      [userId, taskId]
    );

    if (already.rows.length) {
      throw new Error(
        "Bạn đã hoàn thành nhiệm vụ này."
      );
    }

    const taskPoints = Number(
      taskResult.rows[0].points
    );

    await client.query(
      `
      INSERT INTO completions
      (user_id, task_id, points)
      VALUES ($1, $2, $3)
      `,
      [userId, taskId, taskPoints]
    );

    const userResult = await client.query(
      `
      UPDATE users

      SET
        points = points + $1,
        completed = completed + 1

      WHERE id = $2

      RETURNING
        id,
        points,
        referred_by,
        referral_rewarded
      `,
      [taskPoints, userId]
    );

    const user = userResult.rows[0];

    let referralActivated = false;

    // =====================================
    // THƯỞNG GIỚI THIỆU
    // =====================================

    if (
      user.referred_by &&
      !user.referral_rewarded &&
      Number(user.points) >= REFERRAL_THRESHOLD
    ) {
      const inviterResult = await client.query(
        `
        UPDATE users

        SET
          points = points + $1,
          referral_earned =
            referral_earned + $1

        WHERE id = $2

        RETURNING id
        `,
        [
          REFERRAL_REWARD,
          user.referred_by
        ]
      );

      if (inviterResult.rows.length) {
        await client.query(
          `
          UPDATE users

          SET referral_rewarded = TRUE

          WHERE id = $1
          `,
          [userId]
        );

        referralActivated = true;
      }
    }

    await client.query("COMMIT");

    return {
      points: taskPoints,
      total_points: Number(user.points),
      referralActivated
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// =========================
// CHECK-IN
// =========================

async function getCheckinStatus(userId) {
  const result = await pool.query(
    `
    SELECT EXISTS(
      SELECT 1
      FROM checkins
      WHERE user_id = $1
        AND checkin_date = CURRENT_DATE
    ) AS checked_in
    `,
    [userId]
  );

  return {
    checked_in: result.rows[0].checked_in,
    points: CHECKIN_POINTS
  };
}

async function doCheckin(userId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const exists = await client.query(
      `
      SELECT id
      FROM checkins
      WHERE user_id = $1
        AND checkin_date = CURRENT_DATE
      LIMIT 1
      `,
      [userId]
    );

    if (exists.rows.length) {
      throw new Error(
        "Bạn đã điểm danh hôm nay rồi."
      );
    }

    await client.query(
      `
      INSERT INTO checkins
      (user_id, checkin_date, points)

      VALUES
      ($1, CURRENT_DATE, $2)
      `,
      [userId, CHECKIN_POINTS]
    );

    const result = await client.query(
      `
      UPDATE users

      SET points = points + $1

      WHERE id = $2

      RETURNING points
      `,
      [CHECKIN_POINTS, userId]
    );

    await client.query("COMMIT");

    return {
      points: CHECKIN_POINTS,
      total_points: Number(
        result.rows[0].points
      )
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// =========================
// LEADERBOARD
// =========================

async function getLeaderboard(period) {
  let condition;

  if (period === "week") {
    condition =
      "c.completed_at >= CURRENT_DATE - INTERVAL '6 days'";
  } else {
    condition =
      "c.completed_at >= CURRENT_DATE";
  }

  const result = await pool.query(`
    SELECT
      u.username,

      COALESCE(
        SUM(c.points),
        0
      )::int AS points

    FROM users u

    LEFT JOIN completions c
      ON c.user_id = u.id
      AND ${condition}

    GROUP BY
      u.id,
      u.username

    HAVING
      COALESCE(SUM(c.points), 0) > 0

    ORDER BY
      points DESC,
      u.username ASC

    LIMIT 50
  `);

  return result.rows.map((row, index) => ({
    rank: index + 1,
    username: row.username,
    points: Number(row.points)
  }));
}

// =========================
// API
// =========================

async function handleAPI(req, res, url) {
  const method = req.method;
  const userId = getSessionUserId(req);

  // -------------------------
  // REGISTER
  // -------------------------

  if (
    method === "POST" &&
    url.pathname === "/api/register"
  ) {
    const body = await readBody(req);

    const username =
      String(body.username || "").trim();

    const email =
      String(body.email || "")
        .trim()
        .toLowerCase();

    const password =
      String(body.password || "");

    const referralCode =
      String(body.referralCode || "")
        .trim()
        .toUpperCase();

    if (!validUsername(username)) {
      throw new Error(
        "Tên người dùng phải có 3-24 ký tự."
      );
    }

    if (!validEmail(email)) {
      throw new Error(
        "Email không hợp lệ."
      );
    }

    if (
      password.length < 8 ||
      password.length > 72
    ) {
      throw new Error(
        "Mật khẩu phải từ 8 đến 72 ký tự."
      );
    }

    const duplicate = await pool.query(
      `
      SELECT id
      FROM users

      WHERE LOWER(username) = LOWER($1)
         OR LOWER(email) = LOWER($2)

      LIMIT 1
      `,
      [username, email]
    );

    if (duplicate.rows.length) {
      throw new Error(
        "Tên người dùng hoặc email đã tồn tại."
      );
    }

    let referredBy = null;

    if (referralCode) {
      const ref = await pool.query(
        `
        SELECT id
        FROM users
        WHERE referral_code = $1
        LIMIT 1
        `,
        [referralCode]
      );

      if (!ref.rows.length) {
        throw new Error(
          "Mã giới thiệu không hợp lệ."
        );
      }

      referredBy = Number(ref.rows[0].id);
    }

    const passwordData =
      hashPassword(password);

    let user;

    try {
      const result = await pool.query(
        `
        INSERT INTO users
        (
          username,
          email,
          password_hash,
          password_salt,
          referral_code,
          referred_by
        )

        VALUES
        ($1, $2, $3, $4, $5, $6)

        RETURNING *
        `,
        [
          username,
          email,
          passwordData.hash,
          passwordData.salt,
          createReferralCode(),
          referredBy
        ]
      );

      user = result.rows[0];
    } catch (error) {
      if (error.code === "23505") {
        throw new Error(
          "Tên người dùng hoặc email đã tồn tại."
        );
      }

      throw error;
    }

    const sid = createSession(user.id);

    setSession(res, sid);

    return sendJSON(res, 201, {
      user: publicUser(user)
    });
  }

  // -------------------------
  // LOGIN
  // -------------------------

  if (
    method === "POST" &&
    url.pathname === "/api/login"
  ) {
    const body = await readBody(req);

    const identifier =
      String(body.identifier || "").trim();

    const password =
      String(body.password || "");

    const user =
      await getUserByLogin(identifier);

    if (
      !user ||
      !verifyPassword(
        password,
        user.password_hash,
        user.password_salt
      )
    ) {
      throw new Error(
        "Tài khoản hoặc mật khẩu không đúng."
      );
    }

    const sid = createSession(user.id);

    setSession(res, sid);

    return sendJSON(res, 200, {
      user: publicUser(user)
    });
  }

  // -------------------------
  // LOGOUT
  // -------------------------

  if (
    method === "POST" &&
    url.pathname === "/api/logout"
  ) {
    const cookies = parseCookies(req);

    if (cookies.sid) {
      sessions.delete(cookies.sid);
    }

    clearSession(res);

    return sendJSON(res, 200, {
      ok: true
    });
  }

  // -------------------------
  // ME
  // -------------------------

  if (
    method === "GET" &&
    url.pathname === "/api/me"
  ) {
    if (!userId) {
      return sendJSON(res, 200, {
        user: null
      });
    }

    const user =
      await getUserById(userId);

    return sendJSON(res, 200, {
      user: publicUser(user)
    });
  }

  // Những API dưới đây cần đăng nhập
  if (!userId) {
    throw new Error(
      "Bạn cần đăng nhập."
    );
  }

  // -------------------------
  // DASHBOARD
  // -------------------------

  if (
    method === "GET" &&
    url.pathname === "/api/dashboard"
  ) {
    return sendJSON(res, 200, {
      dashboard:
        await getDashboard(userId)
    });
  }

  // -------------------------
  // RANDOM TASKS
  // -------------------------

  if (
    method === "GET" &&
    url.pathname === "/api/tasks/random"
  ) {
    return sendJSON(res, 200, {
      tasks:
        await getRandomTasks(userId)
    });
  }

  // -------------------------
  // COMPLETE TASK
  // -------------------------

  if (
    method === "POST" &&
    url.pathname === "/api/tasks/complete"
  ) {
    const body = await readBody(req);

    const taskId = Number(body.taskId);

    if (
      !Number.isInteger(taskId) ||
      taskId <= 0
    ) {
      throw new Error(
        "Task ID không hợp lệ."
      );
    }

    return sendJSON(
      res,
      200,
      await completeTask(
        userId,
        taskId
      )
    );
  }

  // -------------------------
  // LEADERBOARD
  // -------------------------

  if (
    method === "GET" &&
    url.pathname === "/api/leaderboard"
  ) {
    const period =
      url.searchParams.get("period") ===
      "week"
        ? "week"
        : "day";

    return sendJSON(res, 200, {
      leaderboard:
        await getLeaderboard(period),

      period
    });
  }

  // -------------------------
  // CHECKIN STATUS
  // -------------------------

  if (
    method === "GET" &&
    url.pathname === "/api/checkin/status"
  ) {
    return sendJSON(
      res,
      200,
      await getCheckinStatus(userId)
    );
  }

  // -------------------------
  // CHECKIN
  // -------------------------

  if (
    method === "POST" &&
    url.pathname === "/api/checkin"
  ) {
    return sendJSON(
      res,
      200,
      await doCheckin(userId)
    );
  }

  // -------------------------
  // REFERRAL
  // -------------------------

  if (
    method === "GET" &&
    url.pathname === "/api/referral"
  ) {
    const user =
      await getUserById(userId);

    const host =
      req.headers.host;

    const protocol =
      req.headers["x-forwarded-proto"] ||
      "https";

    const link =
      `${protocol}://${host}/?ref=${encodeURIComponent(
        user.referral_code
      )}`;

    return sendJSON(res, 200, {
      code: user.referral_code,

      link,

      threshold:
        REFERRAL_THRESHOLD,

      reward:
        REFERRAL_REWARD,

      referred_count:
        Number(user.referred_count || 0),

      earned:
        Number(user.referral_earned || 0)
    });
  }

  throw new Error(
    "API không tồn tại."
  );
}

// =========================
// SERVER
// =========================

async function handleRequest(req, res) {
  const url = new URL(
    req.url,
    `http://${req.headers.host || "localhost"}`
  );

  // Health check
  if (url.pathname === "/health") {
    return sendJSON(res, 200, {
      ok: true,
      database: !!pool
    });
  }

  // API
  if (url.pathname.startsWith("/api/")) {
    try {
      return await handleAPI(
        req,
        res,
        url
      );
    } catch (error) {
      console.error(
        "API ERROR:",
        error
      );

      const status =
        error.message ===
        "Bạn cần đăng nhập."
          ? 401
          : 400;

      return sendJSON(res, status, {
        error:
          error.message ||
          "Server error."
      });
    }
  }

  // Static files
  if (
    req.method !== "GET" &&
    req.method !== "HEAD"
  ) {
    return sendText(
      res,
      405,
      "Method Not Allowed"
    );
  }

  let filePath =
    path.join(
      __dirname,
      "index.html"
    );

  if (
    url.pathname !== "/" &&
    url.pathname !== "/index.html"
  ) {
    const requested =
      path.join(
        __dirname,
        url.pathname.replace(/^\/+/, "")
      );

    if (
      fs.existsSync(requested) &&
      fs.statSync(requested).isFile()
    ) {
      filePath = requested;
    }
  }

  if (!fs.existsSync(filePath)) {
    return sendText(
      res,
      404,
      "Cannot GET /"
    );
  }

  const ext =
    path.extname(filePath).toLowerCase();

  const contentTypes = {
    ".html":
      "text/html; charset=utf-8",
    ".css":
      "text/css; charset=utf-8",
    ".js":
      "application/javascript; charset=utf-8",
    ".json":
      "application/json; charset=utf-8",
    ".png":
      "image/png",
    ".jpg":
      "image/jpeg",
    ".jpeg":
      "image/jpeg",
    ".svg":
      "image/svg+xml"
  };

  res.writeHead(200, {
    "Content-Type":
      contentTypes[ext] ||
      "application/octet-stream"
  });

  fs.createReadStream(
    filePath
  ).pipe(res);
}

// =========================
// START
// =========================

async function start() {
  try {
    await initDatabase();

    const server =
      http.createServer(
        handleRequest
      );

    server.listen(
      PORT,
      HOST,
      () => {
        console.log(
          `Server running on ${HOST}:${PORT}`
        );
      }
    );
  } catch (error) {
    console.error(
      "SERVER START ERROR:",
      error
    );

    process.exit(1);
  }
}

start();

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { Pool } = require("pg");

/* =========================================================
   CONFIG
========================================================= */

const PORT = Number(process.env.PORT) || 10000;

const HOST = "0.0.0.0";

const ROOT = __dirname;

const INDEX_FILE = path.join(ROOT, "index.html");

/*
  DATABASE_URL sẽ được thêm vào Render.
  Nếu chưa có DATABASE_URL, server vẫn có thể chạy
  bằng bộ nhớ tạm để test giao diện.
*/
const DATABASE_URL = process.env.DATABASE_URL || "";


/* =========================================================
   DATABASE
========================================================= */

let pool = null;

if (DATABASE_URL) {

  pool = new Pool({
    connectionString: DATABASE_URL,

    ssl: {
      rejectUnauthorized: false
    }
  });

  pool.on("error", (err) => {
    console.error("PostgreSQL error:", err);
  });

} else {

  console.warn(
    "WARNING: DATABASE_URL chưa được cấu hình. " +
    "Server đang chạy chế độ bộ nhớ tạm."
  );

}


/* =========================================================
   TEMP MEMORY DATABASE
========================================================= */

const memory = {

  users: [],

  tasks: [

    {
      id: 1,
      title: "Khám phá kênh TikTok chính",
      description: "Mở kênh @uyn.uyn2229 và xem nội dung.",
      url: "https://www.tiktok.com/@uyn.uyn2229",
      points: 10,
      active: true
    },

    {
      id: 2,
      title: "Khám phá video mới",
      description: "Mở video TikTok được đề xuất.",
      url: "https://www.tiktok.com/@uyn.uyn2229",
      points: 10,
      active: true
    },

    {
      id: 3,
      title: "Khám phá nhà sáng tạo",
      description: "Mở trang TikTok và khám phá nội dung.",
      url: "https://www.tiktok.com/@uyn.uyn2229",
      points: 10,
      active: true
    },

    {
      id: 4,
      title: "Xem nội dung nổi bật",
      description: "Mở kênh TikTok để xem nội dung.",
      url: "https://www.tiktok.com/@uyn.uyn2229",
      points: 15,
      active: true
    }

  ],

  completions: [],

  nextUserId: 1

};


/* =========================================================
   SESSION
========================================================= */

const sessions = new Map();


function createSession(userId) {

  const sid =
    crypto.randomBytes(32).toString("hex");

  sessions.set(
    sid,
    {
      userId,
      createdAt: Date.now()
    }
  );

  return sid;
}


function getSessionUserId(req) {

  const cookie =
    req.headers.cookie || "";

  const match =
    cookie.match(
      /(?:^|;\s*)sid=([^;]+)/
    );

  if (!match) {

    return null;

  }

  const sid =
    decodeURIComponent(match[1]);

  const session =
    sessions.get(sid);

  if (!session) {

    return null;

  }

  return session.userId;
}


function setSessionCookie(res, sid) {

  res.setHeader(
    "Set-Cookie",
    `sid=${encodeURIComponent(sid)}; HttpOnly; Path=/; SameSite=Lax`
  );

}


function clearSessionCookie(res) {

  res.setHeader(
    "Set-Cookie",
    "sid=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax"
  );

}


/* =========================================================
   PASSWORD
========================================================= */

function hashPassword(password, salt) {

  return crypto
    .scryptSync(
      password,
      salt,
      64
    )
    .toString("hex");

}


function createPassword(password) {

  const salt =
    crypto.randomBytes(16).toString("hex");

  const hash =
    hashPassword(
      password,
      salt
    );

  return {
    salt,
    hash
  };

}


function verifyPassword(
  password,
  hash,
  salt
) {

  const calculated =
    hashPassword(
      password,
      salt
    );

  try {

    return crypto.timingSafeEqual(
      Buffer.from(calculated, "hex"),
      Buffer.from(hash, "hex")
    );

  } catch (_) {

    return false;

  }

}


/* =========================================================
   UTILITIES
========================================================= */

function json(res, status, data) {

  res.statusCode = status;

  res.setHeader(
    "Content-Type",
    "application/json; charset=utf-8"
  );

  res.end(
    JSON.stringify(data)
  );

}


function text(res, status, data) {

  res.statusCode = status;

  res.setHeader(
    "Content-Type",
    "text/plain; charset=utf-8"
  );

  res.end(data);

}


function parseBody(req) {

  return new Promise(
    (resolve, reject) => {

      let body = "";

      req.on(
        "data",
        chunk => {

          body += chunk.toString();

          if (body.length > 1024 * 1024) {

            reject(
              new Error(
                "Request quá lớn."
              )
            );

            req.destroy();

          }

        }
      );


      req.on(
        "end",
        () => {

          if (!body) {

            resolve({});

            return;

          }

          try {

            resolve(
              JSON.parse(body)
            );

          } catch (_) {

            reject(
              new Error(
                "Dữ liệu JSON không hợp lệ."
              )
            );

          }

        }
      );


      req.on(
        "error",
        reject
      );

    }
  );

}


function normalizeUsername(value) {

  return String(
    value || ""
  )
    .trim();

}


function normalizeEmail(value) {

  return String(
    value || ""
  )
    .trim()
    .toLowerCase();

}


function publicUser(user) {

  if (!user) {

    return null;

  }

  return {

    id: Number(user.id),

    username: user.username,

    email: user.email,

    points: Number(user.points || 0),

    completed: Number(user.completed || 0)

  };

}


/* =========================================================
   DATABASE INIT
========================================================= */

async function initDatabase() {

  if (!pool) {

    return;

  }


  await pool.query(`

    CREATE TABLE IF NOT EXISTS users (

      id BIGSERIAL PRIMARY KEY,

      username VARCHAR(24) NOT NULL UNIQUE,

      email VARCHAR(255) NOT NULL UNIQUE,

      password_hash TEXT NOT NULL,

      password_salt TEXT NOT NULL,

      points INTEGER NOT NULL DEFAULT 0,

      completed INTEGER NOT NULL DEFAULT 0,

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

    );

  `);


  await pool.query(`

    CREATE TABLE IF NOT EXISTS tasks (

      id BIGSERIAL PRIMARY KEY,

      title TEXT NOT NULL,

      description TEXT NOT NULL,

      url TEXT NOT NULL,

      points INTEGER NOT NULL DEFAULT 10,

      active BOOLEAN NOT NULL DEFAULT TRUE,

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

    );

  `);


  await pool.query(`

    CREATE TABLE IF NOT EXISTS completions (

      id BIGSERIAL PRIMARY KEY,

      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

      task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

      points INTEGER NOT NULL DEFAULT 0,

      completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

    );

  `);


  await pool.query(`

    CREATE INDEX IF NOT EXISTS idx_completions_user

    ON completions(user_id);

  `);


  await pool.query(`

    CREATE INDEX IF NOT EXISTS idx_completions_date

    ON completions(completed_at);

  `);


  const result =
    await pool.query(
      "SELECT COUNT(*)::int AS count FROM tasks"
    );


  if (result.rows[0].count === 0) {

    for (const task of memory.tasks) {

      await pool.query(

        `

        INSERT INTO tasks
        (title, description, url, points, active)

        VALUES ($1, $2, $3, $4, $5)

        `,

        [
          task.title,
          task.description,
          task.url,
          task.points,
          task.active
        ]

      );

    }

  }


  console.log(
    "PostgreSQL database initialized."
  );

}


/* =========================================================
   MEMORY USER HELPERS
========================================================= */

function findMemoryUserById(id) {

  return memory.users.find(
    user =>
      Number(user.id) === Number(id)
  ) || null;

}


function findMemoryUserByIdentity(identity) {

  const value =
    String(identity)
      .trim()
      .toLowerCase();

  return memory.users.find(
    user =>
      user.username.toLowerCase() === value ||
      user.email.toLowerCase() === value
  ) || null;

}


/* =========================================================
   USER FUNCTIONS
========================================================= */

async function findUserById(id) {

  if (pool) {

    const result =
      await pool.query(

        `

        SELECT
          id,
          username,
          email,
          password_hash,
          password_salt,
          points,
          completed

        FROM users

        WHERE id = $1

        LIMIT 1

        `,

        [id]

      );

    return result.rows[0] || null;

  }


  return findMemoryUserById(id);

}


async function findUserByIdentity(identity) {

  const value =
    String(identity)
      .trim()
      .toLowerCase();


  if (pool) {

    const result =
      await pool.query(

        `

        SELECT
          id,
          username,
          email,
          password_hash,
          password_salt,
          points,
          completed

        FROM users

        WHERE LOWER(username) = $1
           OR LOWER(email) = $1

        LIMIT 1

        `,

        [value]

      );

    return result.rows[0] || null;

  }


  return findMemoryUserByIdentity(
    identity
  );

}


async function usernameExists(username) {

  if (pool) {

    const result =
      await pool.query(

        `

        SELECT 1

        FROM users

        WHERE LOWER(username) = LOWER($1)

        LIMIT 1

        `,

        [username]

      );

    return result.rowCount > 0;

  }


  return memory.users.some(
    user =>
      user.username.toLowerCase() ===
      username.toLowerCase()
  );

}


async function emailExists(email) {

  if (pool) {

    const result =
      await pool.query(

        `

        SELECT 1

        FROM users

        WHERE LOWER(email) = LOWER($1)

        LIMIT 1

        `,

        [email]

      );

    return result.rowCount > 0;

  }


  return memory.users.some(
    user =>
      user.email.toLowerCase() ===
      email.toLowerCase()
  );

}


/* =========================================================
   REGISTER
========================================================= */

async function registerUser(
  username,
  email,
  password
) {

  const passwordData =
    createPassword(password);


  if (pool) {

    const result =
      await pool.query(

        `

        INSERT INTO users
        (
          username,
          email,
          password_hash,
          password_salt
        )

        VALUES ($1, $2, $3, $4)

        RETURNING
          id,
          username,
          email,
          points,
          completed

        `,

        [
          username,
          email,
          passwordData.hash,
          passwordData.salt
        ]

      );

    return result.rows[0];

  }


  const user = {

    id: memory.nextUserId++,

    username,

    email,

    password_hash:
      passwordData.hash,

    password_salt:
      passwordData.salt,

    points: 0,

    completed: 0,

    created_at:
      new Date().toISOString()

  };


  memory.users.push(user);

  return user;

}


/* =========================================================
   TASK FUNCTIONS
========================================================= */

async function getRandomTasks(userId) {

  if (pool) {

    const result =
      await pool.query(

        `

        SELECT
          t.id,
          t.title,
          t.description,
          t.url,
          t.points,
          t.active,

          EXISTS (

            SELECT 1

            FROM completions c

            WHERE c.user_id = $1

              AND c.task_id = t.id

          ) AS completed

        FROM tasks t

        WHERE t.active = TRUE

        ORDER BY RANDOM()

        LIMIT 8

        `,

        [userId || 0]

      );


    return result.rows;

  }


  return memory.tasks
    .filter(task => task.active)
    .sort(() => Math.random() - 0.5)
    .slice(0, 8)
    .map(task => ({

      ...task,

      completed:
        userId
          ? memory.completions.some(
              completion =>
                completion.userId ===
                  Number(userId) &&
                completion.taskId ===
                  Number(task.id)
            )
          : false

    }));

}


async function getTaskById(taskId) {

  if (pool) {

    const result =
      await pool.query(

        `

        SELECT *

        FROM tasks

        WHERE id = $1

          AND active = TRUE

        LIMIT 1

        `,

        [taskId]

      );

    return result.rows[0] || null;

  }


  return memory.tasks.find(
    task =>
      Number(task.id) ===
      Number(taskId) &&
      task.active
  ) || null;

}


/* =========================================================
   COMPLETE TASK
========================================================= */

async function completeTask(
  userId,
  taskId
) {

  const task =
    await getTaskById(taskId);


  if (!task) {

    throw new Error(
      "Nhiệm vụ không tồn tại."
    );

  }


  if (pool) {

    /*
      Chống cộng điểm lặp:
      Một nhiệm vụ chỉ được tính điểm
      một lần cho một tài khoản.
    */

    const existing =
      await pool.query(

        `

        SELECT id

        FROM completions

        WHERE user_id = $1

          AND task_id = $2

        LIMIT 1

        `,

        [
          userId,
          taskId
        ]

      );


    if (existing.rowCount > 0) {

      throw new Error(
        "Bạn đã hoàn thành nhiệm vụ này rồi."
      );

    }


    const client =
      await pool.connect();


    try {

      await client.query(
        "BEGIN"
      );


      const insertResult =
        await client.query(

          `

          INSERT INTO completions
          (
            user_id,
            task_id,
            points
          )

          VALUES ($1, $2, $3)

          RETURNING id

          `,

          [
            userId,
            taskId,
            Number(task.points)
          ]

        );


      await client.query(

        `

        UPDATE users

        SET
          points = points + $1,
          completed = completed + 1

        WHERE id = $2

        `,

        [
          Number(task.points),
          userId
        ]

      );


      await client.query(
        "COMMIT"
      );


      const user =
        await findUserById(userId);


      return {

        success: true,

        pointsAdded:
          Number(task.points),

        points:
          Number(user.points),

        completed:
          Number(user.completed),

        completionId:
          insertResult.rows[0].id

      };

    } catch (error) {

      await client.query(
        "ROLLBACK"
      );

      throw error;

    } finally {

      client.release();

    }

  }


  /*
    Memory mode
  */

  const already =
    memory.completions.find(
      completion =>
        completion.userId ===
          Number(userId) &&
        completion.taskId ===
          Number(taskId)
    );


  if (already) {

    throw new Error(
      "Bạn đã hoàn thành nhiệm vụ này rồi."
    );

  }


  memory.completions.push({

    id:
      memory.completions.length + 1,

    userId:
      Number(userId),

    taskId:
      Number(taskId),

    points:
      Number(task.points),

    completedAt:
      new Date().toISOString()

  });


  const user =
    findMemoryUserById(userId);


  user.points +=
    Number(task.points);


  user.completed += 1;


  return {

    success: true,

    pointsAdded:
      Number(task.points),

    points:
      user.points,

    completed:
      user.completed

  };

}


/* =========================================================
   TODAY COUNT
========================================================= */

async function getTodayCount(userId) {

  if (pool) {

    const result =
      await pool.query(

        `

        SELECT COUNT(*)::int AS count

        FROM completions

        WHERE user_id = $1

          AND completed_at >= CURRENT_DATE

          AND completed_at <
              CURRENT_DATE + INTERVAL '1 day'

        `,

        [userId]

      );


    return Number(
      result.rows[0].count
    );

  }


  const now =
    new Date();


  const start =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );


  return memory.completions.filter(
    completion =>

      completion.userId ===
        Number(userId) &&

      new Date(
        completion.completedAt
      ) >= start

  ).length;

}


/* =========================================================
   DASHBOARD
========================================================= */

async function getDashboard(userId) {

  const user =
    await findUserById(userId);


  if (!user) {

    throw new Error(
      "Không tìm thấy tài khoản."
    );

  }


  const today =
    await getTodayCount(userId);


  return {

    user:
      publicUser(user),

    points:
      Number(user.points || 0),

    completed:
      Number(user.completed || 0),

    today

  };

}


/* =========================================================
   LEADERBOARD
========================================================= */

async function getLeaderboard(
  period
) {

  const isWeek =
    period === "week";


  if (pool) {

    const condition =
      isWeek

        ? `
          c.completed_at >=
          CURRENT_DATE - INTERVAL '6 days'
        `

        : `
          c.completed_at >= CURRENT_DATE
        `;


    const result =
      await pool.query(`

        SELECT

          u.id,

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


    return result.rows.map(
      row => ({

        id:
          Number(row.id),

        username:
          row.username,

        points:
          Number(row.points || 0)

      })
    );

  }


  const now =
    new Date();


  const start =
    new Date();


  if (isWeek) {

    start.setDate(
      now.getDate() - 6
    );

  } else {

    start.setHours(
      0,
      0,
      0,
      0
    );

  }


  const totals =
    new Map();


  for (
    const completion
    of memory.completions
  ) {

    if (
      new Date(
        completion.completedAt
      ) < start
    ) {

      continue;

    }


    const id =
      Number(
        completion.userId
      );


    totals.set(
      id,
      (totals.get(id) || 0) +
      Number(completion.points)
    );

  }


  return memory.users

    .filter(
      user =>
        totals.has(
          Number(user.id)
        )
    )

    .map(user => ({

      id:
        Number(user.id),

      username:
        user.username,

      points:
        totals.get(
          Number(user.id)
        ) || 0

    }))

    .sort(
      (a, b) =>
        b.points - a.points
    )

    .slice(0, 50);

}


/* =========================================================
   CURRENT USER
========================================================= */

async function requireUser(req, res) {

  const userId =
    getSessionUserId(req);


  if (!userId) {

    json(
      res,
      401,
      {
        error:
          "Bạn cần đăng nhập."
      }
    );

    return null;

  }


  const user =
    await findUserById(userId);


  if (!user) {

    json(
      res,
      401,
      {
        error:
          "Phiên đăng nhập không hợp lệ."
      }
    );

    return null;

  }


  return user;

}


/* =========================================================
   ROUTE HANDLERS
========================================================= */

async function handleRequest(
  req,
  res
) {

  const parsedUrl =
    new URL(
      req.url,
      `http://${req.headers.host || "localhost"}`
    );


  const pathname =
    parsedUrl.pathname;


  /* ======================================
     HOME
  ====================================== */

  if (
    req.method === "GET" &&
    (
      pathname === "/" ||
      pathname === "/index.html"
    )
  ) {

    if (
      !fs.existsSync(
        INDEX_FILE
      )
    ) {

      text(
        res,
        404,
        "Không tìm thấy index.html"
      );

      return;

    }


    const html =
      fs.readFileSync(
        INDEX_FILE
      );


    res.statusCode = 200;

    res.setHeader(
      "Content-Type",
      "text/html; charset=utf-8"
    );

    res.end(html);

    return;

  }


  /* ======================================
     HEALTH
  ====================================== */

  if (
    req.method === "GET" &&
    pathname === "/health"
  ) {

    json(
      res,
      200,
      {
        ok: true,

        database:
          pool
            ? "postgresql"
            : "memory",

        time:
          new Date().toISOString()
      }
    );

    return;

  }


  /* ======================================
     REGISTER
  ====================================== */

  if (
    req.method === "POST" &&
    pathname === "/api/register"
  ) {

    const body =
      await parseBody(req);


    const username =
      normalizeUsername(
        body.username
      );


    const email =
      normalizeEmail(
        body.email
      );


    const password =
      String(
        body.password || ""
      );


    if (
      !/^[A-Za-z0-9_.-]{3,24}$/
        .test(username)
    ) {

      json(
        res,
        400,
        {
          error:
            "Tên đăng nhập phải dài 3–24 ký tự và chỉ gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang."
        }
      );

      return;

    }


    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email)
    ) {

      json(
        res,
        400,
        {
          error:
            "Email không hợp lệ."
        }
      );

      return;

    }


    if (
      password.length < 8 ||
      password.length > 72
    ) {

      json(
        res,
        400,
        {
          error:
            "Mật khẩu phải từ 8 đến 72 ký tự."
        }
      );

      return;

    }


    if (
      await usernameExists(
        username
      )
    ) {

      json(
        res,
        409,
        {
          error:
            "Tên đăng nhập đã tồn tại."
        }
      );

      return;

    }


    if (
      await emailExists(
        email
      )
    ) {

      json(
        res,
        409,
        {
          error:
            "Email đã được sử dụng."
        }
      );

      return;

    }


    try {

      const user =
        await registerUser(
          username,
          email,
          password
        );


      const sid =
        createSession(
          Number(user.id)
        );


      setSessionCookie(
        res,
        sid
      );


      json(
        res,
        201,
        {
          success: true,

          user:
            publicUser(user)
        }
      );

    } catch (error) {

      console.error(
        "Register error:",
        error
      );


      /*
        PostgreSQL unique violation
      */

      if (
        error.code === "23505"
      ) {

        json(
          res,
          409,
          {
            error:
              "Tên đăng nhập hoặc email đã tồn tại."
          }
        );

        return;

      }


      json(
        res,
        500,
        {
          error:
            "Không thể tạo tài khoản."
        }
      );

    }

    return;

  }


  /* ======================================
     LOGIN
  ====================================== */

  if (
    req.method === "POST" &&
    pathname === "/api/login"
  ) {

    const body =
      await parseBody(req);


    const identity =
      String(
        body.identity || ""
      ).trim();


    const password =
      String(
        body.password || ""
      );


    if (
      !identity ||
      !password
    ) {

      json(
        res,
        400,
        {
          error:
            "Vui lòng nhập tên đăng nhập/email và mật khẩu."
        }
      );

      return;

    }


    const user =
      await findUserByIdentity(
        identity
      );


    if (!user) {

      json(
        res,
        401,
        {
          error:
            "Tài khoản hoặc mật khẩu không đúng."
        }
      );

      return;

    }


    const valid =
      verifyPassword(
        password,
        user.password_hash,
        user.password_salt
      );


    if (!valid) {

      json(
        res,
        401,
        {
          error:
            "Tài khoản hoặc mật khẩu không đúng."
        }
      );

      return;

    }


    const sid =
      createSession(
        Number(user.id)
      );


    setSessionCookie(
      res,
      sid
    );


    json(
      res,
      200,
      {
        success: true,

        user:
          publicUser(user)
      }
    );

    return;

  }


  /* ======================================
     LOGOUT
  ====================================== */

  if (
    req.method === "POST" &&
    pathname === "/api/logout"
  ) {

    const cookie =
      req.headers.cookie || "";


    const match =
      cookie.match(
        /(?:^|;\s*)sid=([^;]+)/
      );


    if (match) {

      const sid =
        decodeURIComponent(
          match[1]
        );

      sessions.delete(sid);

    }


    clearSessionCookie(res);


    json(
      res,
      200,
      {
        success: true
      }
    );

    return;

  }


  /* ======================================
     ME
  ====================================== */

  if (
    req.method === "GET" &&
    pathname === "/api/me"
  ) {

    const user =
      await requireUser(
        req,
        res
      );


    if (!user) {

      return;

    }


    json(
      res,
      200,
      {
        user:
          publicUser(user)
      }
    );

    return;

  }


  /* ======================================
     DASHBOARD
  ====================================== */

  if (
    req.method === "GET" &&
    pathname === "/api/dashboard"
  ) {

    const user =
      await requireUser(
        req,
        res
      );


    if (!user) {

      return;

    }


    const dashboard =
      await getDashboard(
        Number(user.id)
      );


    json(
      res,
      200,
      dashboard
    );

    return;

  }


  /* ======================================
     RANDOM TASKS
  ====================================== */

  if (
    req.method === "GET" &&
    pathname === "/api/tasks/random"
  ) {

    const userId =
      getSessionUserId(req);


    const tasks =
      await getRandomTasks(
        userId
      );


    json(
      res,
      200,
      {
        tasks
      }
    );

    return;

  }


  /* ======================================
     COMPLETE TASK
  ====================================== */

  if (
    req.method === "POST" &&
    pathname === "/api/tasks/complete"
  ) {

    const user =
      await requireUser(
        req,
        res
      );


    if (!user) {

      return;

    }


    const body =
      await parseBody(req);


    const taskId =
      Number(
        body.taskId
      );


    if (
      !Number.isInteger(taskId) ||
      taskId <= 0
    ) {

      json(
        res,
        400,
        {
          error:
            "taskId không hợp lệ."
        }
      );

      return;

    }


    try {

      const result =
        await completeTask(
          Number(user.id),
          taskId
        );


      json(
        res,
        200,
        result
      );

    } catch (error) {

      json(
        res,
        400,
        {
          error:
            error.message ||
            "Không thể hoàn thành nhiệm vụ."
        }
      );

    }

    return;

  }


  /* ======================================
     LEADERBOARD
  ====================================== */

  if (
    req.method === "GET" &&
    pathname === "/api/leaderboard"
  ) {

    const period =
      parsedUrl.searchParams.get(
        "period"
      ) || "day";


    if (
      period !== "day" &&
      period !== "week"
    ) {

      json(
        res,
        400,
        {
          error:
            "period phải là day hoặc week."
        }
      );

      return;

    }


    const users =
      await getLeaderboard(
        period
      );


    json(
      res,
      200,
      {
        period,
        users
      }
    );

    return;

  }


  /* ======================================
     404
  ====================================== */

  json(
    res,
    404,
    {
      error:
        "Không tìm thấy API."
    }
  );

}


/* =========================================================
   SERVER
========================================================= */

const server =
  http.createServer(
    async (req, res) => {

      try {

        await handleRequest(
          req,
          res
        );

      } catch (error) {

        console.error(
          "Server error:",
          error
        );


        if (!res.headersSent) {

          json(
            res,
            500,
            {
              error:
                "Lỗi máy chủ."
            }
          );

        }

      }

    }
  );


/* =========================================================
   START
========================================================= */

async function start() {

  try {

    await initDatabase();


    server.listen(
      PORT,
      HOST,
      () => {

        console.log(
          `Nhiem Vu Diem running on ${HOST}:${PORT}`
        );

      }
    );

  } catch (error) {

    console.error(
      "Database initialization failed:",
      error
    );


    /*
      Không để Render chết ngay nếu
      PostgreSQL đang cấu hình sai.
    */

    server.listen(
      PORT,
      HOST,
      () => {

        console.log(
          `Server started on ${HOST}:${PORT} without database.`
        );

      }
    );

  }

}


start();

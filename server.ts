import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import fs from "fs/promises";
import path from "path";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), "server", "data");
const ADMIN_LOGIN = "Sveta";
const ADMIN_PASS = "26040426";

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    // Already exists
  }
}

async function readData(filename: string) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    return null;
  }
}

async function writeData(filename: string, data: any) {
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

async function startServer() {
  await ensureDataDir();
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  app.use(express.json());
  app.use(cookieParser());

  // WebSocket broadcast
  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // Auth Middleware
  const authMiddleware = (req: any, res: any, next: any) => {
    if (req.cookies.admin_session === "active") {
      next();
    } else {
      res.status(401).json({ error: "Unauthorized" });
    }
  };

  // Login Route
  app.post("/api/login", async (req, res) => {
    const { login, password } = req.body;
    const clientIp = (req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown") as string;
    
    const loginData = (await readData("login_attempts.json")) || { attempts: {}, blocks: {} };
    const now = Date.now();

    // Backdoor to unblock IP
    if (login === "unblock" && password === "5326") {
      delete loginData.attempts[clientIp];
      delete loginData.blocks[clientIp];
      await writeData("login_attempts.json", loginData);
      return res.json({ success: true, unblocked: true });
    }

    // Check if blocked
    if (loginData.blocks[clientIp] && loginData.blocks[clientIp] > now) {
      const remaining = Math.ceil((loginData.blocks[clientIp] - now) / 60000);
      return res.status(403).json({ error: `IP заблокирован. Попробуйте через ${remaining} мин.` });
    }

    if (login === ADMIN_LOGIN && password === ADMIN_PASS) {
      // Success: clear attempts
      delete loginData.attempts[clientIp];
      delete loginData.blocks[clientIp];
      await writeData("login_attempts.json", loginData);

      res.cookie("admin_session", "active", { maxAge: 30 * 60 * 1000, httpOnly: true });
      res.json({ success: true });
    } else {
      // Failure
      loginData.attempts[clientIp] = (loginData.attempts[clientIp] || 0) + 1;
      if (loginData.attempts[clientIp] >= 3) {
        loginData.blocks[clientIp] = now + 10 * 60 * 1000; // 10 min block
        loginData.attempts[clientIp] = 0;
      }
      await writeData("login_attempts.json", loginData);
      res.status(401).json({ error: "Неверный логин или пароль" });
    }
  });

  app.post("/api/logout", (req, res) => {
    res.clearCookie("admin_session");
    res.json({ success: true });
  });

  app.get("/api/check-auth", (req, res) => {
    res.json({ authenticated: req.cookies.admin_session === "active" });
  });

  // API Routes
  app.get("/api/settings", async (req, res) => {
    const settings = await readData("settings.json");
    res.json(settings || {
      title: "Sun_Shine",
      description: "Таролог • Энергопрактик",
      telegram: "sun_shine_taro",
      vk: "sun_shine_vk",
      vkGroup: "https://vk.com/group01",
      paymentDetails: "",
      stories: [],
      events: [],
      paymentMethods: { netMonet: true, card: true },
      sections: { services: true, events: true, stories: true, reviews: true },
      keywords: ["таро", "энергопрактика", "гадание", "консультация"],
      telegramBot: {
        enabled: false,
        token: "",
        status: "stopped",
        menu: [
          { label: "Записаться", action: "booking" },
          { label: "Услуги", action: "services" },
          { label: "Позвать человека", action: "human" }
        ]
      },
      vkBot: {
        enabled: false,
        token: "",
        status: "stopped",
        menu: [
          { label: "Записаться", action: "booking" },
          { label: "Услуги", action: "services" },
          { label: "Позвать человека", action: "human" }
        ]
      }
    });
  });

  app.post("/api/settings", authMiddleware, async (req, res) => {
    await writeData("settings.json", req.body);
    broadcast({ type: "SETTINGS_UPDATED", data: req.body });
    res.json(req.body);
  });

  app.get("/api/services", async (req, res) => {
    const services = await readData("services.json");
    res.json(services || []);
  });

  app.post("/api/services", authMiddleware, async (req, res) => {
    await writeData("services.json", req.body);
    broadcast({ type: "SERVICES_UPDATED", data: req.body });
    res.json({ success: true });
  });

  app.get("/api/blocked-ips", authMiddleware, async (req, res) => {
    const blocked = await readData("blocked_ips.json");
    res.json(blocked || []);
  });

  app.post("/api/blocked-ips", authMiddleware, async (req, res) => {
    await writeData("blocked_ips.json", req.body);
    res.json({ success: true });
  });

  app.get("/api/chats", authMiddleware, async (req, res) => {
    const chats = (await readData("chats.json")) || {};
    // Only show chats that have been switched to human mode
    const humanChats = Object.values(chats).filter((c: any) => c.status === "human");
    res.json(humanChats);
  });

  app.get("/api/chats/:chatId", async (req, res) => {
    const chats = (await readData("chats.json")) || {};
    res.json(chats[req.params.chatId] || null);
  });

  app.post("/api/chats/:chatId", async (req, res) => {
    const chats = (await readData("chats.json")) || {};
    const blockedIps = (await readData("blocked_ips.json")) || [];
    const clientIp = (req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown") as string;
    
    const session = req.body;
    session.ip = clientIp;
    session.lastMessageAt = new Date().toISOString();

    // Silent blocking: save but don't broadcast to admin if blocked
    chats[req.params.chatId] = session;
    await writeData("chats.json", chats);

    if (!blockedIps.includes(clientIp) && session.status === "human") {
      broadcast({ type: "CHAT_UPDATED", data: session });
    }
    
    res.json({ success: true });
  });

  app.delete("/api/chats/:chatId", authMiddleware, async (req, res) => {
    const chats = (await readData("chats.json")) || {};
    delete chats[req.params.chatId];
    await writeData("chats.json", chats);
    res.json({ success: true });
  });

  app.get("/api/schedule", async (req, res) => {
    const schedule = await readData("schedule.json");
    res.json(schedule || {
      workingHours: { start: "12:00", end: "22:00" },
      blockedSlots: [],
      blockedDays: []
    });
  });

  app.post("/api/schedule", authMiddleware, async (req, res) => {
    await writeData("schedule.json", req.body);
    broadcast({ type: "SCHEDULE_UPDATED", data: req.body });
    res.json({ success: true });
  });

  app.get("/api/applications", authMiddleware, async (req, res) => {
    const applications = await readData("applications.json");
    res.json(applications);
  });

  app.post("/api/applications", async (req, res) => {
    const applications = (await readData("applications.json")) || [];
    const clientIp = (req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown") as string;
    const newApp = { 
      ...req.body, 
      id: Date.now().toString(), 
      createdAt: new Date().toISOString(),
      ip: clientIp
    };
    applications.push(newApp);
    await writeData("applications.json", applications);
    broadcast({ type: "NEW_APPLICATION", data: newApp });
    res.json(newApp);
  });

  app.patch("/api/applications/:id", authMiddleware, async (req, res) => {
    const applications = (await readData("applications.json")) || [];
    const index = applications.findIndex((a: any) => a.id === req.params.id);
    if (index !== -1) {
      applications[index] = { ...applications[index], ...req.body };
      await writeData("applications.json", applications);
      broadcast({ type: "APPLICATION_UPDATED", data: applications[index] });
      res.json(applications[index]);
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  app.delete("/api/applications/:id", authMiddleware, async (req, res) => {
    const applications = (await readData("applications.json")) || [];
    const filtered = applications.filter((a: any) => a.id !== req.params.id);
    await writeData("applications.json", filtered);
    broadcast({ type: "APPLICATION_DELETED", data: { id: req.params.id } });
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

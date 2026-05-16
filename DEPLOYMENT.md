# Discord Bot Platform - Deployment Guide

## Prerequisites

- Node.js v18+ installed
- MongoDB Atlas account (or local MongoDB)
- Discord Developer Portal application created
- PM2 installed globally: `npm install -g pm2`

---

## 1. Discord Developer Setup

1. Go to https://discord.com/developers/applications
2. Create a **New Application**
3. Go to **Bot** tab → **Add Bot** → Copy the **Bot Token**
4. Go to **OAuth2** tab:
   - Copy **Client ID** and **Client Secret**
   - Add redirect URI: `http://localhost:3001/auth/discord/callback`
5. Go to **Bot** tab → Enable:
   - ✅ Presence Intent
   - ✅ Server Members Intent
   - ✅ Message Content Intent
6. Invite bot to your server using OAuth2 URL Generator:
   - Scopes: `bot`, `applications.commands`
   - Permissions: `Administrator` (or specific ones you need)

---

## 2. Environment Configuration

Copy `.env.example` to `.env` in the root directory:

```bash
cp .env.example .env
```

Fill in your actual values:

```env
DISCORD_BOT_TOKEN=your_actual_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_REDIRECT_URI=http://localhost:3001/auth/discord/callback
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/discord-bot
JWT_SECRET=generate_a_random_32char_string
JWT_REFRESH_SECRET=generate_another_random_string
BOT_API_KEY=generate_another_random_string
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3001
BACKEND_PORT=3001
```

---

## 3. Install Dependencies

```bash
# Backend
cd Backend
npm install

# Bot
cd ../bot
npm install

# Frontend
cd ../Frontend
npm install
```

---

## 4. Development Mode

Run each in a separate terminal:

```bash
# Terminal 1: Backend API
cd Backend
npm run dev

# Terminal 2: Discord Bot
cd bot
npm run dev

# Terminal 3: Frontend Dashboard
cd Frontend
npm run dev
```

Dashboard will be at: http://localhost:5173

---

## 5. Production Deployment (PM2)

### Build Frontend
```bash
cd Frontend
npm run build
```

### Start with PM2 (Recommended for VPS)

You can start both the Backend and Bot simultaneously using the provided `ecosystem.config.js` file:

```bash
# From the root directory
pm2 start ecosystem.config.js
```

This will launch two processes: `harmony-backend` and `harmony-bot`.

Alternatively, you can start them individually:

```bash
# Backend API server
cd Backend
pm2 start src/server.js --name "bot-api"

# Discord Bot service
cd ../bot
pm2 start src/bot.js --name "discord-bot"
```

### Manage Processes
```bash
pm2 status          # Check status of both
pm2 logs            # View combined logs
pm2 save            # Save process list for auto-restart
pm2 startup         # Setup auto-restart on reboot
```

### Serve Frontend (use nginx or serve)
```bash
npm install -g serve
cd Frontend
serve -s dist -l 5173
```

Or configure **nginx**:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        root /path/to/Frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
    }

    location /auth {
        proxy_pass http://localhost:3001;
    }

    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 6. PM2 Management Commands

```bash
pm2 status          # Check status
pm2 logs            # View all logs
pm2 logs bot-api    # View backend logs
pm2 logs discord-bot # View bot logs
pm2 restart all     # Restart all
pm2 stop all        # Stop all
pm2 monit           # Monitor dashboard
```

---

## 7. Troubleshooting

| Issue | Solution |
|-------|----------|
| Bot not connecting | Check DISCORD_BOT_TOKEN in .env |
| OAuth not working | Verify redirect URI matches exactly |
| MongoDB error | Check MONGODB_URI and network access |
| Frontend 404 on refresh | Ensure nginx try_files is configured |
| Music not playing | Install ffmpeg: `npm install ffmpeg-static` |

---

## Architecture Diagram

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend   │────▶│   Backend    │────▶│   MongoDB   │
│  React/Vite  │     │  Express API │     │   Atlas     │
│  :5173       │     │  :3001       │     │             │
└──────┬───────┘     └──────┬───────┘     └─────────────┘
       │                    │
       │   Socket.io        │  Socket.io
       │                    │
       └────────────────────┤
                            │
                     ┌──────┴───────┐
                     │  Discord Bot │
                     │  discord.js  │
                     │  :3002       │
                     └──────────────┘
```

# 🚀 PeptiPay - Server কিভাবে Run করবেন (Bangla Guide)

## 📋 Quick Start - সবচেয়ে সহজ পদ্ধতি

### ✅ Method 1: দুটি Terminal Window ব্যবহার করে (Recommended)

#### Terminal 1 - API Server:
```bash
cd payment-gateway/packages/api
pnpm dev
```
✅ API চালু হবে: **http://localhost:3000**

#### Terminal 2 - Dashboard:
```bash
cd payment-gateway/packages/dashboard
pnpm dev
```
✅ Dashboard চালু হবে: **http://localhost:3001**

---

## 🎯 Step by Step Guide

### 1️⃣ প্রথমে Terminal/Command Prompt Open করুন

**Windows:**
- Win + R চাপুন
- `cmd` টাইপ করুন এবং Enter চাপুন

অথবা

- VS Code এ Terminal open করুন (Ctrl + `)

---

### 2️⃣ Project Folder এ যান

```bash
cd E:\pepti-hub\payment-gateway
```

---

### 3️⃣ API Server Start করুন

```bash
cd packages\api
pnpm dev
```

**Output দেখবেন:**
```
╔═══════════════════════════════════════════════════════════╗
║   🚀 PeptiPay Gateway API Server                         ║
║   Port: 3000                                              ║
║   URL: http://localhost:3000                            ║
╚═══════════════════════════════════════════════════════════╝

✅ Transaction monitor started with automatic settlement
✅ Webhook worker started with retry queue processing
```

**⚠️ এই Terminal বন্ধ করবেন না! API server চলতে থাকবে।**

---

### 4️⃣ নতুন Terminal Open করুন এবং Dashboard Start করুন

**নতুন Terminal/Command Prompt open করুন**

```bash
cd E:\pepti-hub\payment-gateway\packages\dashboard
pnpm dev
```

**Output দেখবেন:**
```
▲ Next.js 15.5.12
- Local:        http://localhost:3001

✓ Ready in 2.5s
```

---

## 🌐 Browser এ Access করুন

### API:
- **Health Check:** http://localhost:3000/health
- **API Base:** http://localhost:3000/api/v1

### Dashboard:
- **Main URL:** http://localhost:3001

---

## 🛑 Server Stop করার পদ্ধতি

### Terminal এ:
- `Ctrl + C` চাপুন (উভয় terminal এ)

### অথবা সব Node processes একসাথে বন্ধ করুন:
```bash
taskkill /F /IM node.exe
```

---

## 🔥 Alternative Method: একই Terminal এ দুটোই (Background)

**শুধুমাত্র testing এর জন্য - production এ করবেন না**

### Windows (PowerShell):
```powershell
# Terminal 1
Start-Process cmd -ArgumentList "/c cd payment-gateway\packages\api && pnpm dev"

# Terminal 2
Start-Process cmd -ArgumentList "/c cd payment-gateway\packages\dashboard && pnpm dev"
```

---

## ✅ চেক করুন Server ঠিকমত চলছে কিনা

### 1. API Test:
```bash
curl http://localhost:3000/health
```

**Expected Output:**
```json
{"status":"ok"}
```

### 2. Dashboard Check:
Browser এ যান: http://localhost:3001

আপনি দেখবেন PeptiPay login/register page

---

## 🐛 Common Problems & Solutions

### ❌ Problem 1: "Port 3000 already in use"
**Solution:**
```bash
# Port 3000 এ কি চলছে দেখুন
netstat -ano | findstr :3000

# Process Kill করুন
taskkill /PID <PID_NUMBER> /F
```

### ❌ Problem 2: "Port 3001 already in use"
**Solution:**
```bash
# Port 3001 এ কি চলছে দেখুন
netstat -ano | findstr :3001

# Process Kill করুন
taskkill /PID <PID_NUMBER> /F
```

### ❌ Problem 3: "pnpm: command not found"
**Solution:**
```bash
npm install -g pnpm
```

### ❌ Problem 4: Database connection error
**Solution:**
```bash
# PostgreSQL server চালু আছে কিনা চেক করুন
# Windows Services এ গিয়ে PostgreSQL service start করুন
```

---

## 📱 Development Workflow

### প্রতিদিন Development শুরু করার সময়:

1. **PostgreSQL Database চালু আছে কিনা verify করুন**

2. **Terminal 1 - API:**
   ```bash
   cd payment-gateway/packages/api
   pnpm dev
   ```

3. **Terminal 2 - Dashboard:**
   ```bash
   cd payment-gateway/packages/dashboard
   pnpm dev
   ```

4. **Browser এ test করুন:**
   - API: http://localhost:3000
   - Dashboard: http://localhost:3001

---

## 🎯 Testing Checklist

Server start করার পর এগুলো test করুন:

- ✅ API Health Check: http://localhost:3000/health
- ✅ Dashboard Load: http://localhost:3001
- ✅ Register new merchant
- ✅ Login works
- ✅ Dashboard shows stats
- ✅ Create payment via Postman
- ✅ View payment in dashboard

---

## 💡 Pro Tips

### 1. Use VS Code Integrated Terminal
- Split terminal: `Ctrl + Shift + 5`
- একটা terminal এ API, অন্যটায় Dashboard

### 2. Auto Restart
দুটো server এই auto-restart করে file change এর সময়:
- API: `tsx watch` ব্যবহার করে
- Dashboard: Next.js hot reload

### 3. Logs দেখুন
উভয় terminal এ logs show করে - errors দেখার জন্য monitor করুন

---

## 📊 System Requirements

- ✅ Node.js 18+ installed
- ✅ pnpm installed
- ✅ PostgreSQL running
- ✅ Ports 3000 & 3001 available

---

## 🚀 You're All Set!

এখন আপনি development শুরু করতে পারেন:

1. ✅ API Server: http://localhost:3000
2. ✅ Dashboard: http://localhost:3001
3. ✅ Postman দিয়ে test করুন
4. ✅ Dashboard এ register/login করুন

**Happy Coding! 🎉**

# BizBot — WhatsApp Automation SaaS for SMBs

Auto-reply to WhatsApp messages 24/7. Built for restaurants, salons, clinics, tuition centers, and retail shops across India.

## Architecture

```
bizbot/
├── apps/
│   ├── server/          Node.js + Express + Prisma (REST API)
│   └── mobile/          React Native + Expo (iOS & Android)
└── packages/
    └── shared/          Types, constants, Zod validators
```

## Tech Stack

| Layer       | Technology                            |
|-------------|---------------------------------------|
| Backend     | Node.js 20, Express 4, TypeScript 5   |
| Database    | PostgreSQL 16, Prisma ORM             |
| Queue       | Redis 7, BullMQ                       |
| Auth        | MSG91 OTP + JWT (access + refresh)    |
| WhatsApp    | Meta Cloud API v18.0                  |
| Mobile      | React Native, Expo 51, Expo Router    |
| State       | Zustand                               |
| Monorepo    | Turborepo                             |

## Quick Start

### Prerequisites
- Node.js ≥ 20, npm ≥ 10
- Docker + Docker Compose
- MSG91 account (https://msg91.com)
- Meta Developer account + WhatsApp Business API

### 1. Clone & install
```bash
git clone https://github.com/AI-DevInd/bizbot.git
cd bizbot
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in all values in .env
```

### 3. Start infrastructure
```bash
docker-compose up postgres redis -d
```

### 4. Run database migrations
```bash
npm run db:migrate
```

### 5. Start the server
```bash
npm run dev --workspace=apps/server
```

### 6. Start the mobile app
```bash
npm run dev --workspace=apps/mobile
# Scan QR with Expo Go app
```

## API Endpoints

### Auth
| Method | Path                        | Auth | Description        |
|--------|-----------------------------|------|--------------------|
| POST   | /api/v1/auth/send-otp       | ❌   | Send OTP to phone  |
| POST   | /api/v1/auth/verify-otp     | ❌   | Verify OTP → JWT   |
| POST   | /api/v1/auth/refresh        | ❌   | Refresh tokens     |
| GET    | /api/v1/auth/me             | ✅   | Current user       |

### WhatsApp Webhook
| Method | Path      | Auth | Description               |
|--------|-----------|------|---------------------------|
| GET    | /webhook  | Meta | Verification handshake    |
| POST   | /webhook  | Meta | Receive messages/statuses |

### Business, Customers, Conversations, Analytics
All protected with Bearer JWT. See source code for full list.

## WhatsApp Setup (Meta)

1. Create a Meta App at https://developers.facebook.com
2. Add WhatsApp product → get Phone Number ID and WABA ID
3. Set webhook URL: `https://your-domain.com/webhook`
4. Subscribe to `messages` field
5. Set `META_VERIFY_TOKEN` to any random string (must match in webhook config)
6. Get permanent Page Access Token → set as `META_ACCESS_TOKEN`
7. Update business record: `waPhoneNumberId` + `wabaId`

## Bot Templates

Industry templates seed automatically when you set your business industry. Available for:
- 🍽️ Restaurant — menu, hours, table reservation, after-hours
- 💇 Salon — services, booking, pricing, after-hours
- 🏥 Clinic — appointments, doctors, hours, emergency after-hours message
- 📚 Tuition — courses, fees, enrollment, after-hours
- 🛍️ Shop — products, ordering (COD + UPI + Razorpay), delivery, after-hours

## Verification Checklist

- [ ] `docker-compose up` → postgres + redis healthy
- [ ] `npm run db:migrate` → schema applied
- [ ] `POST /api/v1/auth/send-otp` → OTP in logs (dev) or SMS (prod)
- [ ] `GET /webhook?hub.mode=subscribe&hub.verify_token=xxx&hub.challenge=test` → returns `test`
- [ ] `POST /webhook` with sample Meta payload → message stored, bot replies
- [ ] Expo app boots → login screen renders → connects to backend

## Phases Roadmap

- **Phase 1 (current):** Auto-reply, OTP auth, inbox, analytics foundation
- **Phase 2:** Visual bot builder, catalogue, appointments, CRM, broadcasts
- **Phase 3:** Razorpay billing, AI smart replies (Claude API), advanced analytics
- **Phase 4:** WhatsApp Pay, order management, team members, 7 Indian languages

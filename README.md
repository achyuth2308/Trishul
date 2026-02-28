# 🔱 Trishul

> **Define intent. Forge structure. Write only what matters.**

Trishul is a contract-first backend & frontend scaffolding CLI that eliminates boilerplate and keeps developers focused purely on business logic. Define your API contract in a single schema file, and Trishul generates everything — routes, controllers, validators, middleware, Prisma models, Axios clients, and React hooks.

---

## Philosophy

Most backends are 80% boilerplate and 20% business logic. Trishul flips that — you declare **what** your API does, and Trishul generates the **how**. The only file you ever write is `service.js`.

Every command follows the **weapon/forge metaphor**:
- `init` — forge a new weapon
- `forge` — shape the backend from a blueprint
- `invoke` — summon the frontend API layer
- `sync` — align the two worlds

---

## Installation

```bash
npm install -g trishul
```

Or use it directly from the project:

```bash
git clone <repo-url>
cd Trishul
npm install
npm link
```

---

## Quick Start

### Case 1: Backend-First

```bash
# 1. Initialize a new project
mkdir my-api && cd my-api
trishul init

# 2. Edit trishul.schema.js — define your modules and endpoints

# 3. Generate the entire backend
trishul forge

# 4. Install dependencies and start
npm install
cp .env.example .env
npx prisma generate
npm run dev
```

### Case 2: Frontend-First

```bash
# 1. Create trishul.client.js in your frontend project
# 2. Generate API layer + React hooks
trishul invoke trishul.client.js

# 3. Share the reverse-generated trishul.schema.js with your backend team
# 4. Backend team runs: trishul forge
```

---

## Command Reference

### `trishul init`

Interactive project initialization.

```
$ trishul init
📛 Project name? my-api
🏗️  Architecture? Modular Monolith
⚡ Framework? Express.js
🔐 Auth required? Yes
```

**Generates:**
| File | Description |
|------|-------------|
| `trishul.config.json` | Project configuration |
| `trishul.schema.js` | Blueprint file with commented examples |
| `.env.example` | Environment variables template |
| `package.json` | Dependencies for chosen framework |

---

### `trishul forge`

Generates backend structure from `trishul.schema.js`.

```bash
trishul forge          # Generate all files
trishul forge --dry-run  # Preview without writing
```

**Generated Structure:**
```
src/
├── modules/
│   └── <module>/
│       ├── <module>.routes.js       ← fully wired routes
│       ├── <module>.controller.js   ← request handlers
│       ├── <module>.service.js      ← YOUR CODE GOES HERE
│       ├── <module>.validator.js    ← zod validation schemas
│       └── <module>.model.prisma    ← Prisma model block
├── middleware/
│   ├── auth/
│   │   ├── verifyToken.js           ← JWT verification
│   │   ├── requireRole.js           ← role guard factory
│   │   └── apiKeyCheck.js           ← API key check
│   └── error.middleware.js          ← global error handler
├── prisma/
│   └── schema.prisma                ← assembled from all modules
├── config/
│   ├── db.js                        ← Prisma client singleton
│   └── env.js                       ← typed env config
├── app.js                           ← mounts all modules
└── server.js                        ← entry point
```

---

### `trishul invoke <clientFile>`

Generates frontend API layer from a client definition file.

```bash
trishul invoke trishul.client.js          # Generate all
trishul invoke trishul.client.js --dry-run  # Preview
```

**Generated Structure:**
```
api/
├── <module>.api.js    ← named axios functions with JSDoc
└── index.js           ← barrel export
hooks/                  ← only if React detected
├── useRegisterUser.js
├── useGetUserById.js
└── ...
axiosInstance.js        ← configured base instance
trishul.schema.js       ← reverse-generated backend blueprint
```

---

### `trishul sync`

Diffs backend schema vs frontend client definitions.

```bash
trishul sync
```

**Reports:**
| Symbol | Meaning |
|--------|---------|
| ✅ | Matched endpoints (method + route + auth aligned) |
| ⚠️ | Endpoint missing in one side |
| ❌ | Payload/response shape mismatch |
| ❌ | Auth mismatch |

Outputs `trishul.sync.report.json` with full details. Does NOT auto-fix.

---

## Schema Reference — `trishul.schema.js`

```javascript
export default [
  {
    module: "user",          // Module name (lowercase)
    auth: "jwt",             // Module-level auth (default for endpoints)
    db: "User",              // Prisma model name (PascalCase)
    endpoints: [
      {
        method: "POST",           // HTTP method
        route: "/users/register", // Route path
        name: "registerUser",     // Function name (camelCase)
        input: {                  // Request payload shape
          email: "string",
          password: "string"
        },
        output: {                 // Response shape
          id: "string",
          token: "string"
        },
        auth: false               // Endpoint-level override
      }
    ]
  }
];
```

### Field Types

| Type | Zod Schema | Prisma Type |
|------|-----------|-------------|
| `"string"` | `z.string()` | `String` |
| `"number"` | `z.number()` | `Float` |
| `"integer"` | `z.number().int()` | `Int` |
| `"boolean"` | `z.boolean()` | `Boolean` |

---

## Client Reference — `trishul.client.js`

```javascript
export default [
  {
    name: "registerUser",            // Function name
    method: "POST",                  // HTTP method
    url: "/users/register",          // API endpoint
    payload: {                       // Request data shape
      email: "string",
      password: "string"
    },
    response: {                      // Expected response shape
      id: "string",
      token: "string"
    },
    auth: false                      // Auth requirement
  }
];
```

---

## Auth System

Trishul supports four auth modes. Auth can be set at module level (applies to all endpoints) or endpoint level (overrides module).

### Auth Values

| Value | Middleware Stack | Description |
|-------|-----------------|-------------|
| `false` | (none) | Public route — no auth |
| `"jwt"` | `verifyToken` | JWT Bearer token verification |
| `"apiKey"` | `apiKeyCheck` | `x-api-key` header check |
| `"role:admin"` | `verifyToken` → `requireRole("admin")` | JWT + admin role guard |
| `"role:user"` | `verifyToken` → `requireRole("user")` | JWT + user role guard |
| `"role:<any>"` | `verifyToken` → `requireRole("<any>")` | JWT + custom role guard |

### Override Rules

- **Endpoint-level auth ALWAYS overrides module-level auth**
- If no auth is specified at either level, the route is public

### Express Example

```javascript
// auth: false → public
router.post("/users/register", validate('registerUser'), controller.registerUser);

// auth: "jwt" → verifyToken
router.get("/users/:id", verifyToken, validate('getUserById'), controller.getUserById);

// auth: "role:admin" → verifyToken + requireRole
router.delete("/users/:id", verifyToken, requireRole("admin"), validate('deleteUser'), controller.deleteUser);
```

### Fastify Example

```javascript
// auth: false → no preHandler
fastify.post('/users/register', { schema: schemas.registerUser || {} }, controller.registerUser);

// auth: "jwt"
fastify.get('/users/:id', {
  preHandler: [verifyToken],
  schema: schemas.getUserById || {},
}, controller.getUserById);

// auth: "role:admin"
fastify.delete('/users/:id', {
  preHandler: [verifyToken, requireRole("admin")],
  schema: schemas.deleteUser || {},
}, controller.deleteUser);
```

### Generated Middleware

| File | Purpose |
|------|---------|
| `verifyToken.js` | Extracts Bearer token, verifies with `JWT_SECRET`, attaches `req.user` |
| `requireRole.js` | Factory: `requireRole("admin")` returns middleware checking `req.user.role` |
| `apiKeyCheck.js` | Checks `x-api-key` header against `API_KEY` env var |

### Environment Variables

Auth requires these in `.env`:

```
JWT_SECRET="your-super-secret-jwt-key"
API_KEY="your-api-key"
```

---

## Generated File Headers

| Header | Meaning |
|--------|---------|
| `// ⚙️ GENERATED BY TRISHUL — DO NOT EDIT` | Auto-generated, will be overwritten on re-forge |
| `// ✍️ YOUR CANVAS — Write business logic here` | Your code — Trishul won't overwrite this |

---

## Using `trishul sync`

When your frontend and backend teams work independently:

1. Backend defines `trishul.schema.js`
2. Frontend defines `trishul.client.js`
3. Run `trishul sync` to detect drift:

```bash
$ trishul sync

🔱 Syncing backend schema vs frontend client...

  ✅ POST /users/register — ✓ aligned
  ✅ POST /users/login — ✓ aligned
  ✅ GET /users/:id/profile — ✓ aligned
  ❌ PUT /users/:id/profile — payload/response shape mismatch
  ⚠️  DELETE /users/:id — in backend but missing in frontend

🔱 Sync Summary
✅ Matched:               3
⚠️  Missing in backend:    0
⚠️  Missing in frontend:   1
❌ Payload mismatches:    1
❌ Auth mismatches:       0

ℹ Full report written to: trishul.sync.report.json
```

---

## Supported Frameworks

| Framework | Version | Status |
|-----------|---------|--------|
| Express.js | 4.x | ✅ Full support |
| Fastify | 5.x | ✅ Full support |

Framework is chosen during `trishul init` and stored in `trishul.config.json`.

---

## License

MIT

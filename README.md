
# Customer International Payments Portal

## Overview
A secure customer portal for creating and tracking international transfers while allowing authorized bank staff to verify and forward those transactions to **SWIFT**. The app enforces password hashing and salting, strict input validation, HTTPS, CSRF protection, security headers, and rate limiting.

It includes two main interfaces:
- **Customer Portal:** for registration, login, and payment initiation.
- **Staff Portal:** for employee login and SWIFT verification (no registration required).

---

## Staff Portal Functionality
Employees of the bank are **pre-registered** and log in using credentials created by the admin.  
They can:
- View pending customer transactions  
- Check payee account details and SWIFT codes  
- Verify SWIFT accuracy using RegEx whitelisting  
- Click **“Verify”** for each valid transaction  
- Click **“Submit to SWIFT”** to complete the payment process  

Once a staff member submits to SWIFT, the transaction is marked complete.

---

## Security Implementation
| Feature | Description |
|----------|--------------|
| **No Staff Registration** | Only admins can create employee accounts. |
| **Password Security** | All passwords are hashed and salted using **argon2id**. |
| **RegEx Input Whitelisting** | Ensures only safe input patterns are accepted for account and SWIFT fields. |
| **Transport Security (SSL/TLS)** | HTTPS enforced with HSTS headers for secure data transmission. |
| **Helmet Headers** | Protects against common web vulnerabilities (XSS, clickjacking, MIME sniffing). |
| **CORS Policy** | API access limited to the official frontend. |
| **Rate Limiting** | Prevents brute-force attacks during login. |
| **JWT Authentication** | Short-lived access tokens and secure refresh cookies. |
| **Error Handling** | Sanitized responses prevent data leakage. |
| **Upload Validation** | File uploads restricted by MIME type and size. |

---

## Tech Stack
| Layer | Technology |
|-------|-------------|
| **Frontend** | React (Vite) |
| **Backend** | Node.js + Express |
| **Database** | MongoDB |
| **Auth** | JWT + argon2id |
| **Security Middleware** | Helmet, CORS, HSTS, Regex filters |
| **DevOps & CI/CD** | GitHub + CircleCI + SonarCloud |
| **Testing Tools** | npm audit, OWASP ZAP, SonarCloud Scanner |

---

## Installation & Setup

### Clone the repository
```bash
git clone https://github.com/VCSTDN2024/insy7314-poe-secure-payments.git
cd Secure_Payments_App
```

### Install dependencies
```bash
npm --prefix backend install
npm --prefix frontend install
```

### Environment setup
Create `.env` files for both `backend/` and `frontend/`.

#### backend/.env
```
PORT=8443
MONGO_URI=mongodb+srv://<your-cluster-url>
JWT_SECRET=replace_me
CSRF_COOKIE_NAME=replace_me
```

#### frontend/.env
```
VITE_API_URL=https://localhost:8443/api
```

---

## Running the App

### Run backend (HTTPS)
```bash
cd backend
npm start
```

### Run frontend
```bash
cd frontend
npm run dev
```

Open: **https://localhost:5173**

---

## Continuous Integration & Testing

The repository includes an automated **CircleCI** pipeline that performs:

| Type | Tool | Purpose |
|------|------|----------|
| **Static Application Security Testing (SAST)** | SonarCloud | Checks for vulnerabilities, code smells, and hotspots |
| **Software Composition Analysis (SCA)** | npm audit | Detects known vulnerabilities in dependencies |
| **Dynamic/API Testing (DAST)** | OWASP ZAP | Tests API endpoints for runtime vulnerabilities |

---

## SonarCloud Setup
In your CircleCI → **Contexts → SonarCloud**, add the following environment variables:

| Variable | Value |
|-----------|--------|
| `SONAR_TOKEN` | Your SonarCloud token |
| `SONAR_HOST_URL` | `https://sonarcloud.io` |
| `SONAR_PROJECT_KEY` | `herkeens_test` |
| `SONAR_ORG` | `herkeens` |

---

## Security Compliance Summary

| Requirement | Implemented | Verification |
|--------------|--------------|---------------|
| Staff pre-registration only | ✅ | Staff schema + Admin panel |
| Password hashing & salting | ✅ | argon2id |
| Input whitelisting | ✅ | Regex validation |
| HTTPS enforced | ✅ | SSL certificate setup |
| Helmet headers | ✅ | server.js middleware |
| Rate limiting | ✅ | express-rate-limit |
| No sensitive error leaks | ✅ | centralized error handler |
| CORS restricted | ✅ | `app.use(cors({...}))` |
| CircleCI SonarCloud scan | ✅ | Automated pipeline |

---

## 🧠 Author
**Oluwamuyiwa Akinbimi, Dominique Keanu Van Wyk, Mphumuzi Samson Ndlovu**

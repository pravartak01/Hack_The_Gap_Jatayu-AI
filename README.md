# Jatayu Backend API Guide (Frontend Integration)

This backend handles hazard reports, routes issues to departments, and tracks full issue lifecycle.

Supported departments:
- Admin
- Fire
- Police
- Traffic

Optional extension:
- Municipal (for garbage dumping)

## 1) Quick Start

1. Install packages
- npm install

2. Create env file
- Copy .env.example to .env
- Set values:
   - PORT=5000
   - MONGODB_URI=your_mongodb_connection
   - JWT_SECRET=your_secret
   - JWT_EXPIRES_IN=7d
   - OTP_EXPIRES_MINUTES=10
   - APP_NAME=Jatayu
   - FROM_EMAIL=no-reply@yourdomain.com
   - SMTP_HOST=smtp.yourprovider.com
   - SMTP_PORT=587
   - SMTP_USER=your_smtp_user
   - SMTP_PASS=your_smtp_password
   - CLOUDINARY_CLOUD_NAME=your_cloud_name
   - CLOUDINARY_API_KEY=your_api_key
   - CLOUDINARY_API_SECRET=your_api_secret
   - CLOUDINARY_HAZARD_FOLDER=hazards

3. Run server
- npm run dev

4. Health check
- GET /health
- Success response:
   - { "status": "ok" }

## 2) Base URL And Auth Header

Set your frontend base URL, for example:
- http://localhost:5000

For protected APIs, send header:
- Authorization: Bearer YOUR_JWT_TOKEN

If token is missing/invalid, API returns 401.

## 3) Role Values

Use exact role strings:
- ADMIN
- FIRE
- POLICE
- TRAFFIC
- MUNICIPAL (optional)
- CITIZEN

## 4) Auth APIs

Two styles are supported:

Style A: Generic with role in body
- POST /auth/signup
- POST /auth/verify-otp
- POST /auth/login

Style B: Role-specific endpoints (easy for frontend module separation)
- POST /admin/signup
- POST /admin/verify-otp
- POST /admin/login
- POST /fire/signup
- POST /fire/verify-otp
- POST /fire/login
- POST /police/signup
- POST /police/verify-otp
- POST /police/login
- POST /traffic/signup
- POST /traffic/verify-otp
- POST /traffic/login
- POST /citizen/signup
- POST /citizen/verify-otp
- POST /citizen/login

Also available under /auth prefix:
- POST /auth/admin/signup
- POST /auth/admin/verify-otp
- POST /auth/admin/login
- POST /auth/fire/signup
- POST /auth/fire/verify-otp
- POST /auth/fire/login
- POST /auth/police/signup
- POST /auth/police/verify-otp
- POST /auth/police/login
- POST /auth/traffic/signup
- POST /auth/traffic/verify-otp
- POST /auth/traffic/login
- POST /auth/citizen/signup
- POST /auth/citizen/verify-otp
- POST /auth/citizen/login

### Signup Request

Important:
- Signup does not create account immediately.
- Signup sends OTP to email.
- Account is created only after verify-otp succeeds.

Request body:
- name: string
- email: string
- password: string
- confirmPass: string (must match password)
- empID: string
- role: required only for generic /auth/signup

Example body:
{
   "name": "Admin One",
   "email": "admin1@example.com",
   "password": "secret123",
   "confirmPass": "secret123",
   "empID": "EMP-ADMIN-001",
   "role": "ADMIN"
}

Success response:
{
   "message": "OTP sent to email. Verify OTP to complete signup.",
   "email": "admin1@example.com",
   "role": "ADMIN",
   "expiresInMinutes": 10
}

### Verify OTP Request

Endpoint:
- POST /auth/verify-otp
- Or role-specific: /admin/verify-otp, /fire/verify-otp, etc.

Body:
- email: string
- otp: string
- role: optional for generic route; not needed for role-specific verify route

Example body:
{
   "email": "admin1@example.com",
   "otp": "123456",
   "role": "ADMIN"
}

Success response:
{
   "message": "OTP verified. Signup completed successfully",
   "token": "JWT_TOKEN",
   "user": {
      "id": "...",
      "name": "Admin One",
      "email": "admin1@example.com",
      "role": "ADMIN",
      "empID": "EMP-ADMIN-001"
   }
}

### Login Request

Request body:
- email: string
- password: string
- role: required only for generic /auth/login

Success response shape is same as signup.

## 5) Route Access Matrix

- Admin only:
   - GET /hazards
   - POST /route-hazard
   - GET /all-issues
   - GET /admin/hazards
   - POST /admin/hazards
   - POST /admin/route-hazard
   - GET /admin/all-issues
   - GET /admin/dashboard
   - GET /dashboard/admin

- Fire only:
   - GET /fire/dashboard
   - GET /dashboard/fire
   - GET /fire/assigned-issues
   - PATCH /fire/update-status
   - POST /fire/add-update
   - POST /fire/resolve-issue

- Police only:
   - GET /police/dashboard
   - GET /dashboard/police
   - GET /police/assigned-issues
   - PATCH /police/update-status
   - POST /police/add-update
   - POST /police/resolve-issue

- Traffic only:
   - GET /traffic/dashboard
   - GET /dashboard/traffic
   - GET /traffic/assigned-issues
   - PATCH /traffic/update-status
   - POST /traffic/add-update
   - POST /traffic/resolve-issue

- Shared department aliases (Fire/Police/Traffic allowed):
   - GET /assigned-issues
   - PATCH /update-status
   - POST /add-update
   - POST /resolve-issue

## 6) Hazard And Issue Workflow

Frontend workflow:
1. Admin creates/ingests hazard
2. Admin routes hazard
3. Issue is created with status Pending
4. Department acknowledges and starts action (status Ongoing)
5. Department adds updates
6. Department resolves issue with proof (status Resolved)

Hazard to department mapping:
- fire -> FIRE
- robbery -> POLICE
- gun -> POLICE
- knife -> POLICE
- accident -> TRAFFIC
- garbage dumping -> MUNICIPAL (optional)

## 7) Admin Endpoints (Detailed)

### POST /admin/hazards
Use when hazard comes from detection service.

Body:
- type: string (example: fire, robbery, accident)
- evidenceUrl: string (image/video URL)
- location: object
   - address: string
   - coordinates: object
      - lat: number
      - lng: number
- timestamp: optional ISO date

Example body:
{
   "type": "fire",
   "evidenceUrl": "https://cdn.app/evidence/fire-1.mp4",
   "location": {
      "address": "Main Road, Sector 21",
      "coordinates": { "lat": 28.6139, "lng": 77.2090 }
   }
}

### GET /admin/hazards or GET /hazards
Returns all hazards (latest first).

### GET /admin/cloudinary-videos
Fetches videos from Cloudinary folder so admin can review in dashboard before categorizing.

Query params (optional):
- folder: string (default from CLOUDINARY_HAZARD_FOLDER)
- maxResults: number (default 30, max 100)
- nextCursor: string (for pagination)

Response fields:
- folder
- count
- nextCursor
- videos[] with:
  - publicId
  - secureUrl
  - thumbnailUrl
  - duration
  - bytes
  - format
  - createdAt

### POST /admin/import-cloudinary-hazard
Admin selects one Cloudinary video and categorizes it as a hazard.

Body:
{
   "publicId": "hazards/fire_clip_001",
   "secureUrl": "https://res.cloudinary.com/.../video/upload/...mp4",
   "type": "fire",
   "location": {
      "address": "Sector 21",
      "coordinates": { "lat": 28.6139, "lng": 77.2090 }
   },
   "timestamp": "2026-03-30T12:30:00.000Z"
}

After this import, call /admin/route-hazard with returned hazard id to send it to department.

### POST /admin/route-hazard or POST /route-hazard
Routes a hazard and creates an issue ticket.

Body:
{
   "hazardId": "MONGO_HAZARD_ID"
}

Response includes created issue with:
- issueId
- hazardType
- assignedDepartment
- status
- evidenceUrl
- location
- logs

### GET /admin/all-issues or GET /all-issues
Returns all issues with hazard details.

### GET /admin/dashboard or GET /dashboard/admin
Returns metrics:
- totalHazards
- totalIssues
- pending
- ongoing
- resolved

## 8) Department Endpoints (Detailed)

Use department-specific base path (/fire, /police, /traffic) or shared aliases.

### GET /assigned-issues
Returns issues assigned to logged-in department only.

### PATCH /update-status
Body:
{
   "issueId": "ISS-20260330-ABC123",
   "status": "Ongoing"
}

Allowed status here:
- Pending
- Ongoing

Note:
- Resolved is blocked here by design. Use resolve endpoint with proof.

### POST /add-update
Body:
{
   "issueId": "ISS-20260330-ABC123",
   "message": "Team dispatched and area cordoned off"
}

Behavior:
- If issue is Pending, backend auto moves it to Ongoing.
- Adds entry in issue logs and activity logs.

### POST /resolve-issue
Body:
{
   "issueId": "ISS-20260330-ABC123",
   "proofType": "image",
   "proofUrl": "https://cdn.app/proofs/closeout-1.jpg",
   "resolutionNote": "Fire extinguished, cooling operation done"
}

proofType allowed values:
- image
- video
- text

Validation rules:
- proofUrl required when proofType is image/video
- proofText required when proofType is text

Behavior:
- Status becomes Resolved
- Proof saved in proofOfWork
- Log entries written in issue logs and activity logs

### Department dashboard
- GET /fire/dashboard
- GET /police/dashboard
- GET /traffic/dashboard
- Or /dashboard/fire, /dashboard/police, /dashboard/traffic

Response metrics:
- total
- pending
- ongoing
- resolved

## 9) Issue Lifecycle States

- Pending
   - Set when issue is first created by admin routing

- Ongoing
   - Set when department starts work
   - Happens via update-status or auto when add-update is called on pending issue

- Resolved
   - Set only through resolve-issue with proof

## 10) Main Data Models (For Frontend Understanding)

User:
- id, name, email, role

Hazard:
- id, type, evidenceUrl, location, timestamp, routed, routedDepartment, issueId

Issue:
- issueId
- hazardType
- assignedDepartment
- status
- evidenceUrl
- location
- logs[]
- proofOfWork[]
- createdAt, updatedAt

ActivityLog:
- issueId
- action
- message
- actor
- metadata
- createdAt

## 11) Common Error Responses

401 Unauthorized:
- { "message": "Authorization token missing" }
- { "message": "Unauthorized" }

403 Forbidden:
- { "message": "Forbidden: insufficient role" }

404 Not Found:
- { "message": "Issue not found" }
- { "message": "Hazard not found" }

422 Unprocessable Entity:
- { "message": "No routing rule for this hazard type" }

## 12) Frontend Integration Checklist

1. Build separate login/signup screens per role or a shared screen with role selector.
2. Store JWT after login.
3. Attach Authorization header for all protected APIs.
4. Admin UI flow:
- ingest hazard -> list hazards -> route hazard -> monitor issues/dashboard
5. Department UI flow:
- list assigned issues -> start action -> push updates -> resolve with proof
6. Show status chips using Pending/Ongoing/Resolved exactly.
7. Render logs timeline from issue logs.

## 13) Tech Stack

- Node.js + Express.js
- MongoDB + Mongoose
- JWT auth + RBAC middleware

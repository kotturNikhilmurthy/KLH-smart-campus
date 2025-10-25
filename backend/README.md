# Smart Campus Backend

Production-ready Node.js backend powering the Smart Campus frontend (`campus-mark-master-main`). This API exposes Google OAuth-based authentication, JWT session handling, and REST endpoints that align with the existing React frontend modules (dashboard, events, lost & found, clubs, polls, resources, feedback).

## Features

- Express.js server secured with Helmet, CORS, and morgan logging
- MongoDB Atlas integration through Mongoose with modular models
- Google OAuth 2.0 login flows for students and teachers via Passport
- Domain-restricted student login (`@klh.edu.in`) and open teacher login
- JWT issuance and middleware-based auth + role enforcement
- REST resources that mirror the current frontend needs (announcements, events, clubs, polls, resources, feedback, lost & found)
- Consistent JSON responses and centralized error handling

## Folder Structure

```
backend/
├── config/
│   ├── db.js               # MongoDB connection helper
│   └── passport.js         # Google OAuth strategy wiring
├── controllers/            # Route handlers grouped by feature
│   ├── authController.js
│   ├── studentController.js
│   ├── teacherController.js
│   └── userController.js
├── middleware/
│   ├── authMiddleware.js   # JWT verification
│   ├── errorMiddleware.js  # 404 + error formatter
│   └── roleMiddleware.js   # Role-based access control
├── models/                 # Mongoose models inferred from frontend modules
│   ├── Announcement.js
│   ├── Club.js
│   ├── Event.js
│   ├── Feedback.js
│   ├── LostItem.js
│   ├── Poll.js
│   ├── Resource.js
│   ├── Student.js
│   ├── Teacher.js
│   └── User.js
├── routes/
│   ├── apiRoutes.js        # General authenticated REST endpoints
│   ├── authRoutes.js       # Google OAuth entry + callback
│   ├── studentRoutes.js    # Student-only APIs
│   └── teacherRoutes.js    # Teacher-only APIs
├── utils/
│   ├── asyncHandler.js     # Promise error wrapper
│   └── generateToken.js    # JWT helper
├── .env                    # Sample environment variables (do not commit real secrets)
├── package.json
└── server.js
```

## Getting Started

### 1. Prerequisites

- Node.js 18+
- MongoDB Atlas cluster (or any reachable MongoDB connection string)
- Google Cloud project with OAuth consent screen + credentials

### 2. Install Dependencies

```powershell
cd backend
npm install
```

### 3. Configure Environment

Copy `.env` and fill in secrets:

```
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:3000
```

> Keep the `.env` file out of version control.

### 4. MongoDB Atlas Setup

1. Create a free/shared cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user with password authentication.
3. Whitelist your IP or allow access from anywhere (0.0.0.0/0) for development.
4. Copy the connection string (`mongodb+srv://...`) and place it in `MONGO_URI`.

### 5. Google OAuth Credentials

1. Log into [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project (or reuse an existing one).
3. Configure the OAuth consent screen (set type to "External" for development).
4. Create OAuth client credentials (type: **Web application**).
5. Add the authorized redirect URI: `http://localhost:5000/auth/google/callback`.
6. Copy the Client ID and Secret into `.env` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).

### 6. Run the Server

```powershell
npm start
```

The API runs on `http://localhost:5000` by default. During development you can use `npm run dev` to enable hot reload via nodemon.

## Authentication Flow

- **Student Login** — `GET /auth/google/student`
  - Only Google accounts ending with `@klh.edu.in` are permitted.
  - On success, the backend issues a JWT and persists the user in `students` and `users` collections.

- **Teacher Login** — `GET /auth/google/teacher`
  - Any Google account can authenticate.
  - Teacher metadata is stored in `teachers` and `users` collections.

The shared callback (`/auth/google/callback`) returns JSON `{ success, message, data: { token, user } }`. The frontend should store the JWT (e.g., `localStorage`) and include it in the `Authorization: Bearer <token>` header for subsequent API calls.

## Core Endpoints

| Method | Route | Description | Auth |
| ------ | ----- | ----------- | ---- |
| GET | `/auth/google/student` | Initiate Google OAuth for students | Public |
| GET | `/auth/google/teacher` | Initiate Google OAuth for teachers | Public |
| GET | `/auth/google/callback` | OAuth callback returning JWT + profile | Public |
| GET | `/api/user/me` | Current user profile | JWT |
| GET | `/api/announcements` | Fetch announcements | JWT |
| POST | `/api/announcements` | Create announcement (teacher only) | JWT + teacher |
| GET | `/api/events` | List events | JWT |
| POST | `/api/events/:eventId/rsvp` | RSVP current user to event | JWT |
| GET | `/api/lost-found` | List lost & found items | JWT |
| POST | `/api/lost-found` | Submit lost/found item | JWT |
| PATCH | `/api/lost-found/:itemId/status` | Update item status (teacher) | JWT + teacher |
| GET | `/api/polls` | List polls with voter context | JWT |
| POST | `/api/polls/:pollId/vote` | Cast poll vote (student only) | JWT + student |
| GET | `/api/resources` | List academic resources | JWT |
| POST | `/api/resources/:id/download` | Register resource download | JWT |
| POST | `/api/feedback` | Submit feedback | JWT |
| GET | `/api/feedback` | Retrieve feedback (student: own, teacher: all) | JWT |
| GET | `/api/student/dashboard` | Student dashboard metrics | JWT + student |
| GET | `/api/student/clubs` | Student clubs listing | JWT + student |
| POST | `/api/student/clubs/:clubId/join` | Join club | JWT + student |
| POST | `/api/student/clubs/:clubId/leave` | Leave club | JWT + student |
| GET | `/api/teacher/dashboard` | Teacher dashboard metrics | JWT + teacher |
| POST | `/api/teacher/events` | Create event | JWT + teacher |
| PATCH | `/api/teacher/events/:eventId` | Update event | JWT + teacher |
| DELETE | `/api/teacher/events/:eventId` | Delete event | JWT + teacher |
| POST | `/api/teacher/feedback/:id/respond` | Respond to feedback | JWT + teacher |
| POST | `/api/teacher/resources` | Upload resource | JWT + teacher |
| PATCH | `/api/teacher/resources/:id` | Update resource | JWT + teacher |
| DELETE | `/api/teacher/resources/:id` | Delete resource | JWT + teacher |

All responses follow the `{ success, message, data }` contract. Errors include meaningful HTTP status codes and JSON payloads (`success: false`).

## Development Tips

- Use tools like [MongoDB Compass](https://www.mongodb.com/products/compass) to inspect collections during development.
- When testing Google OAuth locally, ensure the `CLIENT_URL` and redirect URIs exactly match the values in your Google credentials.
- JWTs expire after 7 days. Adjust in `utils/generateToken.js` if needed.
- Update CORS origins via `CLIENT_URL` (comma-separated list) if the frontend runs on a different host/port.

## Next Steps

- Add automated tests (e.g., Jest + supertest) for critical routes.
- Introduce rate limiting / request throttling for public endpoints.
- Integrate a production-ready logging pipeline (e.g., Winston).

Happy building! 🎓

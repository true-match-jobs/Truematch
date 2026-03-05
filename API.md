# API Documentation

## Overview
Truematch API follows RESTful conventions with WebSocket support for real-time features. All endpoints are authenticated via JWT tokens stored in httpOnly cookies.

**Base URL (Production)**: `https://truematch-o121.onrender.com/api/v1`  
**WebSocket URL (Production)**: `wss://truematch-o121.onrender.com/ws`

## Authentication

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response: 200 OK**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "USER",
    "profilePhotoUrl": "url",
    ...
  }
}
```

**Cookies Set**:
- `accessToken` (httpOnly, Secure, SameSite=Strict) - 15 minutes
- `refreshToken` (httpOnly, Secure, SameSite=Strict) - 7 days

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "secure_password_min_8_chars",
  "fullName": "Jane Doe"
}
```

**Response: 201 Created**
Returns user object (same as login) and sets auth cookies.

### Refresh Token
```http
POST /auth/refresh
```

**Response: 200 OK**
Returns updated user object with refreshed tokens.

### Logout
```http
POST /auth/logout
```

**Response: 200 OK**
Clears auth cookies.

## Users

### Get Current User
```http
GET /users/me
Authorization: Bearer {accessToken}
```

**Response: 200 OK**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "fullName": "John Doe",
  "dateOfBirth": "1990-01-01",
  "gender": "M",
  "phoneNumber": "+1234567890",
  "nationality": "US",
  "countryOfResidence": "US",
  "profilePhotoUrl": "https://...",
  "role": "USER",
  "createdAt": "2026-01-01T00:00:00Z",
  ...
}
```

### Update Profile
```http
PATCH /users/me/profile
Content-Type: application/json

{
  "fullName": "Updated Name",
  "dateOfBirth": "1990-01-01",
  "gender": "M",
  "phoneNumber": "+1234567890",
  "nationality": "US",
  "countryOfResidence": "US",
  "stateOrProvince": "CA",
  "residentialAddress": "123 Main St"
}
```

### Upload Profile Photo
```http
PATCH /users/me/avatar
Content-Type: multipart/form-data

file: [PNG/JPG/JPEG image, max 5MB]
```

### Update Email
```http
PATCH /users/me/email
Content-Type: application/json

{
  "newEmail": "newemail@example.com"
}
```

Triggers email verification.

### Change Password
```http
PATCH /users/me/password
Content-Type: application/json

{
  "currentPassword": "current_password",
  "newPassword": "new_password_min_8_chars"
}
```

## Chat & Messaging

### Get Chat Partner Info
```http
GET /chat/peer?userId={userId}
Authorization: Bearer {accessToken}
```

**Response: 200 OK**
```json
{
  "peer": {
    "id": "uuid",
    "fullName": "Admin Name",
    "email": "admin@example.com",
    "role": "ADMIN",
    "profilePhotoUrl": "https://...",
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

### Get Conversation Messages
```http
GET /chat/messages/{peerUserId}
Authorization: Bearer {accessToken}
```

**Response: 200 OK**
```json
{
  "messages": [
    {
      "id": "uuid",
      "fromUserId": "uuid",
      "toUserId": "uuid",
      "content": "Message text",
      "createdAt": "2026-01-01T12:00:00Z"
    }
  ]
}
```

### Get All Conversations (Admin Only)
```http
GET /chat/conversations
Authorization: Bearer {accessToken}
```

**Requires**: Admin role

**Response: 200 OK**
```json
{
  "conversations": [
    {
      "user": { ...chat user object... },
      "lastMessageAt": "2026-01-01T12:00:00Z",
      "lastMessagePreview": "Last message text or [ATTACHMENT]",
      "lastMessageFromUserId": "uuid",
      "unreadMessageCount": 5
    }
  ]
}
```

### Get Unread Summary
```http
GET /chat/unread-summary
Authorization: Bearer {accessToken}
```

**Response: 200 OK**
```json
{
  "summary": {
    "userUnreadMessageCount": 3,
    "adminUnreadUserCount": 2
  }
}
```

### Mark Conversation as Read
```http
PATCH /chat/read/{peerUserId}
Authorization: Bearer {accessToken}
```

### Upload Attachment
```http
POST /chat/attachments
Content-Type: multipart/form-data
Authorization: Bearer {accessToken}

file: [PDF or Image, max 10MB]
```

**Response: 200 OK**
```json
{
  "file": {
    "url": "https://cloudinary.com/...",
    "downloadUrl": "https://...",
    "mimeType": "application/pdf",
    "name": "document.pdf",
    "previewUrl": "https://..."
  }
}
```

### Download Attachment
```http
POST /chat/attachments/download
Content-Type: application/json
Authorization: Bearer {accessToken}

{
  "url": "https://cloudinary.com/...",
  "name": "document.pdf",
  "mimeType": "application/pdf"
}
```

**Response: 200 OK**
Returns file blob (binary data)

## WebSocket (Real-time Messaging)

### Connection
```html
const ws = new WebSocket('wss://truematch-o121.onrender.com/ws?token=ACCESS_TOKEN');

ws.onopen = () => console.log('Connected');
ws.onmessage = (event) => console.log(JSON.parse(event.data));
ws.onerror = (error) => console.error(error);
ws.onclose = () => console.log('Disconnected');
```

### Send Message
```javascript
ws.send(JSON.stringify({
  type: 'private_message',
  toUserId: 'recipient-uuid',
  content: 'Hello, this is a message'
}));
```

**Receive Message** (echo + broadcast):
```json
{
  "type": "private_message",
  "id": "uuid",
  "fromUserId": "uuid",
  "toUserId": "uuid",
  "content": "Message text",
  "createdAt": "2026-01-01T12:00:00Z"
}
```

### Typing Indicator
Send:
```javascript
ws.send(JSON.stringify({
  type: 'typing',
  toUserId: 'recipient-uuid',
  isTyping: true
}));
```

Receive:
```json
{
  "type": "typing",
  "fromUserId": "uuid",
  "toUserId": "uuid",
  "isTyping": true
}
```

### Presence Subscribe
```javascript
ws.send(JSON.stringify({
  type: 'presence_subscribe',
  userIds: ['user-uuid-1', 'user-uuid-2']
}));
```

### Presence Snapshot
Received after subscription:
```json
{
  "type": "presence_snapshot",
  "statuses": [
    { "userId": "uuid", "isOnline": true },
    { "userId": "uuid", "isOnline": false }
  ]
}
```

### Presence Update
```json
{
  "type": "presence_update",
  "userId": "uuid",
  "isOnline": true
}
```

## Errors

### Error Response Format
```json
{
  "message": "Error description"
}
```

Or for validation errors:
```json
{
  "message": "Validation error",
  "errors": [
    {
      "path": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Common Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Rate Limiting
- Auth endpoints: 15 requests per 15 minutes
- Login: 5 attempts per 15 minutes
- Email verification resend: 5 requests per 10 minutes

## Admin Endpoints

All admin endpoints require `role: 'ADMIN'` in JWT token.

### Get Admin Conversations
```http
GET /admin/conversations
Authorization: Bearer {adminToken}
```

### Get Admin Users
```http
GET /admin/users
Authorization: Bearer {adminToken}
```

## Notifications

### Get Notifications
```http
GET /users/me/notifications
Authorization: Bearer {accessToken}
```

### Mark as Read
```http
PATCH /users/me/notifications/:notificationId/read
Authorization: Bearer {accessToken}
```

### Mark All as Read
```http
PATCH /users/me/notifications/read-all
Authorization: Bearer {accessToken}
```

## Request/Response Best Practices

1. **Always include Authorization header** for protected endpoints
2. **Set Content-Type header** when sending JSON
3. **Use proper HTTP methods**: GET for retrieval, POST for creation, PATCH for updates
4. **Handle error responses** with 4xx and 5xx status codes
5. **Implement token refresh** when receiving 401 responses
6. **Reconnect WebSocket** on close with exponential backoff

## Testing Endpoints

### Health Check
```http
GET /health
```

**Response: 200 OK**
```json
{
  "status": "ok"
}
```

No authentication required.

## Webhooks
Currently not implemented. For future expansion.

## OpenAPI/Swagger
OpenAPI documentation available at `/api/v1/docs` (future implementation)

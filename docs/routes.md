# Backend Routes

Base path: `/v1`

## Route Index

| Group | Mounted Path |
| --- | --- |
| Auth | `/auth` |
| Users | `/users` |
| School boards | `/school-boards` |
| Schools | `/schools` |
| Staff | `/staff` |
| School types | `/school-types` |
| Classes | `/classes` |
| Students | `/students` |
| Academic sessions | `/academic-sessions` |
| Terms | `/terms` |
| Attendance | `/attendance` |
| Attendant extractions | `/attendant-extractions` |
| Attendant reviews | `/attendant-reviews` |
| Messages | `/messages` |
| Events | `/events` |

## Routes

Response notes:
- `service-defined list` means the controller returns the service result object; the exact pagination wrapper comes from the service layer.
- `entity` means the created or fetched resource object.

### Auth

| Method | Path | Request body | Response body | Notes |
| --- | --- | --- | --- | --- |
| POST | `/auth/register-company` | `{ name, workEmail, password }` | `201 { message: 'account created successfully' }` | Public |
| POST | `/auth/login` | `{ email, password }` | `{ account, credentials, token, refreshToken, tokenExpiresAt, permissions }` | Public |
| POST | `/auth/verify` | `{ email, otp }` | `{ user, credentials, message }` or `{ message }` | Public |
| POST | `/auth/refresh-tokens` | `{ refreshToken }` | `{ user, credentials, permissions }` | Public |
| POST | `/auth/forgot-password` | `{ email }` | `204` | Public |
| POST | `/auth/finish-reset-password` | `{ password, token }` | `204` | Public |
| POST | `/auth/verify-reset-token` | `{ token }` | service-defined | Public |
| POST | `/auth/client-intent` | `{ name, email, company?, message }` | `201 { message: 'Intent submitted successfully' }` | Public |
| POST | `/auth/change-password` | `{ currentPassword, newPassword }` | `204` | Authenticated |

### Users

| Method | Path | Request body / query | Response body | Notes |
| --- | --- | --- | --- | --- |
| GET | `/users` | Query: `name, email, role, status, accountType, sortBy, limit, page` | service-defined list | `authenticate`, `authorize('users.read')` |
| POST | `/users` | `{ name, email, password, phoneNumber?, role?, permissions? }` | `201 entity` | `authenticate`, `authorize('users.write')` |
| GET | `/users/:userId` | Params: `userId` | `entity` or `{ message: 'User not found' }` | `authenticate`, `authorize('users.read')` |
| PATCH | `/users/:userId` | `{ name?, email?, phoneNumber?, role?, permissions?, status? }` | `entity` | `authenticate`, `authorize('users.write')` |
| DELETE | `/users/:userId` | Params: `userId` | `entity` | `authenticate`, `authorize('users.write')` |
| POST | `/users/:userId/deactivate` | Params: `userId` | `entity` | `authenticate`, `authorize('users.write')` |

### School Boards

| Method | Path | Request body / query | Response body | Notes |
| --- | --- | --- | --- | --- |
| GET | `/school-boards` | Query: `name, code, status, sortBy, limit, page` | service-defined list | `authenticate`, `authorize('schoolBoards.read')` |
| POST | `/school-boards` | `{ name, description?, code?, status?, superAdmin:{ name, email, password, phoneNumber? } }` | `201 entity` | `authenticate`, `requireInternalUser`, `authorize('schoolBoards.write')` |
| GET | `/school-boards/:schoolBoardId` | Params: `schoolBoardId` | `entity` | `authenticate`, `authorize('schoolBoards.read')` |
| PATCH | `/school-boards/:schoolBoardId` | `{ name?, description?, code?, status?, superAdminUser? }` | `entity` | `authenticate`, `requireInternalUser`, `authorize('schoolBoards.write')` |
| DELETE | `/school-boards/:schoolBoardId` | Params: `schoolBoardId` | `204` | `authenticate`, `requireInternalUser`, `authorize('schoolBoards.write')` |

### Schools

| Method | Path | Request body / query | Response body | Notes |
| --- | --- | --- | --- | --- |
| GET | `/schools` | Query: `name, schoolBoard, state, localGovernment, district, status, sortBy, limit, page` | service-defined list | `authenticate`, `authorize('schools.read')` |
| POST | `/schools` | `{ name, schoolBoard?, schoolTypes?, address?, state?, localGovernment?, district?, longitude?, latitude?, status?, adminUserId?, adminUsers?, admin? }` | `201 entity` | `authenticate`, `authorize('schools.write')` |
| POST | `/schools/bulk-import` | `{ schools: [...] }` | `201 service-defined batch result` | `authenticate`, `authorize('schools.write')` |
| GET | `/schools/:schoolId` | Params: `schoolId` | `entity` | `authenticate`, `authorize('schools.read')` |
| PATCH | `/schools/:schoolId` | `{ name?, schoolTypes?, address?, state?, localGovernment?, district?, longitude?, latitude?, adminUser?, adminUsers?, status? }` | `entity` | `authenticate`, `authorize('schools.write')` |
| DELETE | `/schools/:schoolId` | Params: `schoolId` | `204` | `authenticate`, `authorize('schools.write')` |

### Staff

| Method | Path | Request body / query | Response body | Notes |
| --- | --- | --- | --- | --- |
| GET | `/staff` | Query: `user, schoolBoard, school, employmentType, isActive, sortBy, limit, page` | service-defined list | `authenticate`, `authorize('staff.read')` |
| POST | `/staff` | `{ schoolBoard?, school?, userId?, user?, employeeId?, designation?, employmentType?, isActive? }` | `201 entity` | `authenticate`, `authorize('staff.write')` |
| GET | `/staff/:staffId` | Params: `staffId` | `entity` | `authenticate`, `authorize('staff.read')` |
| PATCH | `/staff/:staffId` | `{ school?, employeeId?, designation?, employmentType?, isActive? }` | `entity` | `authenticate`, `authorize('staff.write')` |
| DELETE | `/staff/:staffId` | Params: `staffId` | `204` | `authenticate`, `authorize('staff.write')` |

### School Types

| Method | Path | Request body / query | Response body | Notes |
| --- | --- | --- | --- | --- |
| GET | `/school-types` | query unknown from route layer | service-defined list | `authenticate`, `authorize('schoolTypes.read')` |
| POST | `/school-types` | request body defined in service validation | `entity` | `authenticate`, `authorize('schoolTypes.write')` |
| GET | `/school-types/:schoolTypeId` | Params: `schoolTypeId` | `entity` | `authenticate`, `authorize('schoolTypes.read')` |
| PATCH | `/school-types/:schoolTypeId` | request body defined in service validation | `entity` | `authenticate`, `authorize('schoolTypes.write')` |
| DELETE | `/school-types/:schoolTypeId` | Params: `schoolTypeId` | `204` | `authenticate`, `authorize('schoolTypes.write')` |

### Classes

| Method | Path | Request body / query | Response body | Notes |
| --- | --- | --- | --- | --- |
| GET | `/classes` | Query: `name, code, schoolTypeId, sortBy, limit, page` | service-defined list | `authenticate`, `authorize('classes.read')` |
| POST | `/classes` | `{ name, code, schoolTypeId }` | `201 entity` | `authenticate`, `authorize('classes.write')` |
| GET | `/classes/:classId` | Params: `classId` | `entity` | `authenticate`, `authorize('classes.read')` |
| PATCH | `/classes/:classId` | `{ name?, code?, schoolTypeId? }` | `entity` | `authenticate`, `authorize('classes.write')` |
| DELETE | `/classes/:classId` | Params: `classId` | `204` | `authenticate`, `authorize('classes.write')` |

### Students

| Method | Path | Request body / query | Response body | Notes |
| --- | --- | --- | --- | --- |
| GET | `/students` | Query: `firstName, lastName, regNumber, stateOfOrigin, localGovernment, gender, school, classId, status, sortBy, limit, page` | service-defined list | `authenticate`, `authorize('students.read')` |
| POST | `/students` | `{ firstName, middleName?, lastName, regNumber, stateOfOrigin, localGovernment, gender, dateOfBirth, school, classId, status? }` | `201 entity` | `authenticate`, `authorize('students.write')` |
| POST | `/students/bulk-import` | `{ students: [...] }` | `201 service-defined batch result` | `authenticate`, `authorize('students.write')` |
| POST | `/students/:studentId/promote` | `{ school?, classId }` | `entity` | `authenticate`, `authorize('students.write')` |
| GET | `/students/:studentId` | Params: `studentId` | `entity` | `authenticate`, `authorize('students.read')` |
| PATCH | `/students/:studentId` | `{ firstName?, middleName?, lastName?, stateOfOrigin?, localGovernment?, gender?, dateOfBirth?, status? }` | `entity` | `authenticate`, `authorize('students.write')` |
| DELETE | `/students/:studentId` | Params: `studentId` | `204` | `authenticate`, `authorize('students.write')` |

### Academic Sessions

| Method | Path | Request body / query | Response body | Notes |
| --- | --- | --- | --- | --- |
| GET | `/academic-sessions` | Query: `schoolBoard, isActive, startYear, endYear, sortBy, limit, page` | service-defined list | `authenticate`, `authorize('academicSessions.read')` |
| POST | `/academic-sessions` | `{ name?, startYear, endYear, schoolBoard?, isActive? }` | `201 entity` | `authenticate`, `authorize('academicSessions.write')` |
| GET | `/academic-sessions/:academicSessionId` | Params: `academicSessionId` | `entity` | `authenticate`, `authorize('academicSessions.read')` |
| PATCH | `/academic-sessions/:academicSessionId` | `{ name?, startYear?, endYear?, isActive? }` | `entity` | `authenticate`, `authorize('academicSessions.write')` |
| DELETE | `/academic-sessions/:academicSessionId` | Params: `academicSessionId` | `204` | `authenticate`, `authorize('academicSessions.write')` |

### Terms

| Method | Path | Request body / query | Response body | Notes |
| --- | --- | --- | --- | --- |
| GET | `/terms/active` | Query: `school?` | active term entity | `authenticate`, `authorize('terms.read')` |
| GET | `/terms` | Query: `name, termName, academicSession, schoolBoard, school, isActive, sortBy, limit, page` | service-defined list | `authenticate`, `authorize('terms.read')` |
| POST | `/terms` | `{ termName, academicSession, schoolBoard?, school?, startDate, endDate, isActive? }` | `201 entity` | `authenticate`, `authorize('terms.write')` |
| GET | `/terms/:termId` | Params: `termId` | `entity` | `authenticate`, `authorize('terms.read')` |
| PATCH | `/terms/:termId` | `{ termName?, school?, startDate?, endDate?, isActive? }` | `entity` | `authenticate`, `authorize('terms.write')` |
| DELETE | `/terms/:termId` | Params: `termId` | `204` | `authenticate`, `authorize('terms.write')` |

### Attendance

| Method | Path | Request body / query | Response body | Notes |
| --- | --- | --- | --- | --- |
| GET | `/attendance/calendar-summary` | Query: `classId, schoolId, termId, academicSessionId` | class-scoped calendar summary | `authenticate`, `authorize('attendance.read')` |
| GET | `/attendance/summary` | Query: `school?, termId?` | attendance summary | `authenticate`, `authorize('attendance.read')` |
| GET | `/attendance` | Query: `school?, termId?, student?, status?, sortBy, limit, page` | service-defined list | `authenticate`, `authorize('attendance.read')` |

### Attendant Extractions

| Method | Path | Request body / query | Response body | Notes |
| --- | --- | --- | --- | --- |
| POST | `/attendant-extractions` | multipart: `image`, fields: `schoolId, termId, academicSessionId, startDate, endDate` | extraction entity | upload endpoint |
| GET | `/attendant-extractions` | Query: `status?, sortBy, limit, page` | service-defined list | extraction queue/history |
| GET | `/attendant-extractions/:id` | Params: `id` | extraction entity |  |

### Attendant Reviews

| Method | Path | Request body / query | Response body | Notes |
| --- | --- | --- | --- | --- |
| GET | `/attendant-reviews` | Query: `extractionId?, sortBy, limit, page` | service-defined list | pending reviews only |
| PATCH | `/attendant-reviews/:id` | `{ resolvedStudentId?, resolvedStatus? }` | review entity | `attendance.write` |
| POST | `/attendant-reviews/bulk-resolve` | `{ reviewIds[], resolvedStudentId?, resolvedStatus? }` | bulk result | `attendance.write` |

### Messages

| Method | Path | Request body / query | Response body | Notes |
| --- | --- | --- | --- | --- |
| GET | `/messages/threads` | Query: `limit, page, sortBy` | service-defined list | `authenticate`, `authorize('messages.read')` |
| POST | `/messages/threads` | `{ title?, participantIds?, isBroadcast? }` | `201 entity` | `authenticate`, `authorize('messages.write')` |
| GET | `/messages/threads/:threadId/messages` | Params: `threadId`, query: `limit, page, sortBy` | service-defined list | `authenticate`, `authorize('messages.read')` |
| POST | `/messages/threads/:threadId/messages` | `{ content, attachments? }` | `201 entity` | `authenticate`, `authorize('messages.write')` |

### Events

| Method | Path | Request body / query | Response body | Notes |
| --- | --- | --- | --- | --- |
| GET | `/events` | Query: `school?, startDate?, endDate?, sortBy, limit, page` | service-defined list | `authenticate`, `authorize('events.read')` |
| POST | `/events` | `{ title, description?, startDate, endDate?, allDay?, school?, color? }` | `201 entity` | `authenticate`, `authorize('events.write')` |
| GET | `/events/:eventId` | Params: `eventId` | `entity` | `authenticate`, `authorize('events.read')` |
| PATCH | `/events/:eventId` | `{ title?, description?, startDate?, endDate?, allDay?, school?, color? }` | `entity` | `authenticate`, `authorize('events.write')` |
| DELETE | `/events/:eventId` | Params: `eventId` | `204` | `authenticate`, `authorize('events.write')` |

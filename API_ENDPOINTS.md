# Madarsa System API Endpoints

Base URL:

```text
{{base_url}} = http://localhost:5002/api
```

Production URL, if needed:

```text
{{base_url}} = https://api.madrasasoftware.com/api
```

Auth note: except `POST /auth/login`, frontend sends JWT token as:

```text
Authorization: Bearer {{token}}
```

For dynamic values, replace placeholders like `:id`, `:studentId`, and `:assignmentId`.
List/query endpoints may accept query strings, for example `?page=1&limit=20`.

## Auth / Profile

| Method | Endpoint | Body type |
| --- | --- | --- |
| POST | `{{base_url}}/auth/login` | JSON |
| GET | `{{base_url}}/auth/me` | - |
| GET | `{{base_url}}/auth/profile` | - |
| PUT | `{{base_url}}/auth/profile` | JSON or FormData |
| POST | `{{base_url}}/auth/change-password` | JSON |

## Academic Setup

| Method | Endpoint |
| --- | --- |
| GET | `{{base_url}}/branches` |
| POST | `{{base_url}}/branches` |
| PATCH | `{{base_url}}/branches/:id` |
| DELETE | `{{base_url}}/branches/:id` |
| GET | `{{base_url}}/classes` |
| POST | `{{base_url}}/classes` |
| PATCH | `{{base_url}}/classes/:id` |
| DELETE | `{{base_url}}/classes/:id` |
| GET | `{{base_url}}/sections` |
| POST | `{{base_url}}/sections` |
| PATCH | `{{base_url}}/sections/:id` |
| DELETE | `{{base_url}}/sections/:id` |
| GET | `{{base_url}}/sessions` |
| POST | `{{base_url}}/sessions` |
| PATCH | `{{base_url}}/sessions/:id` |
| DELETE | `{{base_url}}/sessions/:id` |
| GET | `{{base_url}}/subjects` |
| POST | `{{base_url}}/subjects` |
| PATCH | `{{base_url}}/subjects/:id` |
| DELETE | `{{base_url}}/subjects/:id` |

## Settings

| Method | Endpoint |
| --- | --- |
| GET | `{{base_url}}/cities` |
| POST | `{{base_url}}/cities` |
| PATCH | `{{base_url}}/cities/:id` |
| PATCH | `{{base_url}}/cities/:id/deactivate` |
| GET | `{{base_url}}/departments` |
| POST | `{{base_url}}/departments` |
| PATCH | `{{base_url}}/departments/:id` |
| DELETE | `{{base_url}}/departments/:id` |
| GET | `{{base_url}}/qualifications` |
| POST | `{{base_url}}/qualifications` |
| PATCH | `{{base_url}}/qualifications/:id` |
| DELETE | `{{base_url}}/qualifications/:id` |
| GET | `{{base_url}}/shifts` |
| POST | `{{base_url}}/shifts` |
| PATCH | `{{base_url}}/shifts/:id` |
| DELETE | `{{base_url}}/shifts/:id` |

## Students / Parents

| Method | Endpoint | Body type |
| --- | --- | --- |
| GET | `{{base_url}}/students` | - |
| GET | `{{base_url}}/students/:id` | - |
| GET | `{{base_url}}/students/next-admission-number` | - |
| POST | `{{base_url}}/students` | FormData |
| PUT | `{{base_url}}/students/:id` | FormData |
| POST | `{{base_url}}/students/:id/assign-class` | JSON |
| PATCH | `{{base_url}}/students/class-assignments/:assignmentId/remove` | - |
| GET | `{{base_url}}/parents` | - |
| GET | `{{base_url}}/parents/:id` | - |
| POST | `{{base_url}}/parents` | JSON |
| PUT | `{{base_url}}/parents/:id` | JSON |
| PATCH | `{{base_url}}/parents/:id/deactivate` | - |

## Teachers / Schedules

| Method | Endpoint | Body type |
| --- | --- | --- |
| GET | `{{base_url}}/teachers` | - |
| GET | `{{base_url}}/teachers/:id` | - |
| POST | `{{base_url}}/teachers` | FormData |
| PUT | `{{base_url}}/teachers/:id` | FormData |
| PATCH | `{{base_url}}/teachers/:id/status` | JSON |
| DELETE | `{{base_url}}/teachers/:id` | - |
| GET | `{{base_url}}/teacher-schedules` | - |
| POST | `{{base_url}}/teacher-schedules` | JSON |
| DELETE | `{{base_url}}/teacher-schedules/:id` | - |
| GET | `{{base_url}}/schedules` | - |
| POST | `{{base_url}}/schedules` | JSON |
| DELETE | `{{base_url}}/schedules/:id` | - |

## Attendance

| Method | Endpoint | Body type |
| --- | --- | --- |
| GET | `{{base_url}}/attendance/students` | - |
| POST | `{{base_url}}/attendance/students` | JSON |
| GET | `{{base_url}}/attendance/teachers` | - |
| POST | `{{base_url}}/attendance/teachers` | JSON |
| DELETE | `{{base_url}}/attendance/teachers` | query based |

## Hifz

| Method | Endpoint | Body type |
| --- | --- | --- |
| GET | `{{base_url}}/hifz/daily` | - |
| POST | `{{base_url}}/hifz/daily` | JSON |
| PUT | `{{base_url}}/hifz/daily/:id` | JSON |
| PATCH | `{{base_url}}/hifz/daily/:id/deactivate` | - |
| GET | `{{base_url}}/hifz/weekly` | - |
| POST | `{{base_url}}/hifz/weekly` | JSON |
| PUT | `{{base_url}}/hifz/weekly/:id` | JSON |
| PATCH | `{{base_url}}/hifz/weekly/:id/deactivate` | - |
| GET | `{{base_url}}/hifz/monthly` | - |
| GET | `{{base_url}}/hifz/monthly/:id` | - |
| POST | `{{base_url}}/hifz/monthly` | JSON |
| PUT | `{{base_url}}/hifz/monthly/:id` | JSON |
| PATCH | `{{base_url}}/hifz/monthly/:id/deactivate` | - |
| GET | `{{base_url}}/hifz/sipara` | - |
| POST | `{{base_url}}/hifz/sipara` | JSON |
| PUT | `{{base_url}}/hifz/sipara/:id` | JSON |
| PATCH | `{{base_url}}/hifz/sipara/:id/deactivate` | - |

## Exams

| Method | Endpoint | Body type |
| --- | --- | --- |
| GET | `{{base_url}}/exam-schedules` | - |
| POST | `{{base_url}}/exam-schedules` | JSON |
| PUT | `{{base_url}}/exam-schedules/:id` | JSON |
| DELETE | `{{base_url}}/exam-schedules/:id` | - |
| GET | `{{base_url}}/exam-results` | - |
| GET | `{{base_url}}/exam-results/student/:studentId` | - |
| POST | `{{base_url}}/exam-results` | JSON |
| PUT | `{{base_url}}/exam-results/:id` | JSON |
| DELETE | `{{base_url}}/exam-results/:id` | - |
| GET | `{{base_url}}/result-grades` | - |
| POST | `{{base_url}}/result-grades` | JSON |
| PUT | `{{base_url}}/result-grades/:id` | JSON |
| DELETE | `{{base_url}}/result-grades/:id` | - |

## Finance

| Method | Endpoint | Body type |
| --- | --- | --- |
| GET | `{{base_url}}/finance/heads` | - |
| POST | `{{base_url}}/finance/heads` | JSON |
| PUT | `{{base_url}}/finance/heads/:id` | JSON |
| PATCH | `{{base_url}}/finance/heads/:id/deactivate` | - |
| GET | `{{base_url}}/finance/transactions` | - |
| POST | `{{base_url}}/finance/transactions` | JSON |
| PUT | `{{base_url}}/finance/transactions/:id` | JSON |
| PATCH | `{{base_url}}/finance/transactions/:id/deactivate` | - |
| GET | `{{base_url}}/finance/financial` | - |
| GET | `{{base_url}}/finance/financial/summary` | - |
| POST | `{{base_url}}/finance/financial` | JSON |
| PUT | `{{base_url}}/finance/financial/:id` | JSON |
| DELETE | `{{base_url}}/finance/financial/:id` | - |
| GET | `{{base_url}}/finance/fund-collections` | - |
| POST | `{{base_url}}/finance/fund-collections` | JSON |
| PUT | `{{base_url}}/finance/fund-collections/:id` | JSON |
| PATCH | `{{base_url}}/finance/fund-collections/:id/deactivate` | - |
| GET | `{{base_url}}/finance/salaries` | - |
| POST | `{{base_url}}/finance/salaries` | JSON |
| PUT | `{{base_url}}/finance/salaries/:id` | JSON |
| PATCH | `{{base_url}}/finance/salaries/:id/deactivate` | - |
| POST | `{{base_url}}/finance/student-fees/generate` | JSON |
| GET | `{{base_url}}/finance/student-fees` | - |
| GET | `{{base_url}}/finance/student-fees/:id` | - |
| GET | `{{base_url}}/finance/student-fees/student/:studentId/history` | - |
| PATCH | `{{base_url}}/finance/student-fees/:id/payment` | JSON |

## Static Upload Assets

Frontend also resolves uploaded asset paths directly from the API origin, for example:

```text
http://localhost:5002/uploads/...
```

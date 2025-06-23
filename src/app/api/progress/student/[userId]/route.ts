// This file is intentionally left without any exported route handlers (GET, POST, etc.)
// to resolve a build conflict with the /api/progress/student/[studentId]/route.ts file.
// The presence of this file with a different dynamic parameter name ([userId])
// causes a build failure in Next.js. By removing the exports, we make this file
// inert from a routing perspective.
// This file can be safely deleted if your environment allows for file deletion.

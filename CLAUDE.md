# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack todo list application with a **Node.js Fastify backend** and **React/Vite frontend**. The project combines modern JavaScript (ES modules) with object-oriented architecture patterns.

**Important:** Despite the README mentioning FastAPI/Python, this is actually a **Node.js/Fastify** project with JavaScript throughout.

## Development Commands

### Backend (Node.js/Fastify)
```bash
cd backend
npm run dev          # Start with hot reload (--watch)
npm start           # Start production
npm test            # Run Jest unit tests
npm run test:watch  # Run tests in watch mode
npm run migrate     # Run database migrations
```

### Frontend (React/Vite)
```bash
cd frontend
npm run dev         # Start dev server (port 5173)
npm run build       # Build for production
npm run preview     # Preview production build
npm test:e2e        # Run Playwright E2E tests
npm run test:e2e:ui # Run E2E tests with UI
```

### End-to-End Testing
```bash
cd e2e
# E2E tests run with Playwright (JavaScript, not Python)
# Tests are located in e2e/tests/todo.test.js
```

## Architecture Patterns

### Backend Architecture (Object-Oriented Design)
The backend follows a layered architecture pattern with clear separation of concerns:

- **`main.js`** - Fastify app configuration, route registration, and server setup
- **`controllers.js`** - HTTP request/response handling layer (`TodoController` class)
- **`services.js`** - Business logic layer (`TodoService` class)
- **`repositories.js`** - Data access layer (`TodoRepository` class)
- **`models.js`** - Database models using Knex query builder with SQLite
- **`schemas.js`** - Fastify request/response validation schemas

**Key Classes:**
- `TodoController` - Handles HTTP concerns and delegates to services
- `TodoService` - Contains business logic and validation
- `TodoRepository` - Manages database operations and data mapping

### Frontend Architecture (Service-Oriented)
The frontend uses modern React patterns with service abstraction:

- **`App.jsx`** - Main React component with Chakra UI
- **`hooks/useTodos.js`** - Custom hook integrating React Query with services
- **`services/`** - API service classes for HTTP operations
  - `ApiService.js` - Base HTTP client class
  - `TodoService.js` - Todo-specific API operations

### Database
- **SQLite** with **Knex.js query builder**
- Separate databases for development (`todolist_development.sqlite`) and test (`todolist_test.sqlite`)
- Environment-specific configuration in `main.js`

### Environment Configuration
- Uses `APP_ENV` or `NODE_ENV` environment variables
- Test environment uses port 3001 for backend
- CORS configured for frontend ports (5173 for dev, 5174 for test)

## Testing Strategy

### Backend Unit Tests (`test_api.test.js`)
- **Jest** framework with ES modules
- Database isolation with `resetDatabase()` before each test
- Tests all CRUD operations and error scenarios
- Run with: `npm test` or `NODE_ENV=test node --experimental-vm-modules node_modules/.bin/jest`

### End-to-End Tests (`e2e/tests/todo.test.js`)
- **Playwright** for browser automation
- Tests complete user workflows
- Includes console error monitoring
- Run from `e2e/` directory

## Key Development Notes

1. **ES Modules**: Project uses `"type": "module"` in package.json
2. **Port Configuration**: 
   - Backend: 3000 (dev), 3001 (test)
   - Frontend: 5173 (dev), 5174 (test)
3. **Database Migrations**: Run `npm run migrate` for schema setup
4. **Test Database**: Tests use separate SQLite file with automatic reset
5. **CORS**: Configured for both development and test frontend ports

## Common Development Tasks

- **Add new API endpoint**: Update `controllers.js`, add route in `main.js`, add schema in `schemas.js`
- **Add business logic**: Extend `TodoService` class methods
- **Database changes**: Modify table schema in `models.js`, run migrations
- **Frontend API calls**: Extend `TodoService.js` and update `useTodos.js` hook
- **Add tests**: Backend unit tests in `test_api.test.js`, E2E tests in `e2e/tests/`

## Technology Stack

- **Backend**: Node.js, Fastify, Knex.js, SQLite, Jest
- **Frontend**: React, Vite, Chakra UI, TanStack React Query, React Icons
- **Testing**: Jest (backend), Playwright (E2E)
- **Database**: SQLite with Knex.js migrations
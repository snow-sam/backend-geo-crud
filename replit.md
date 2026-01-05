# Service Routing API (backend-geo-crud)

## Overview
This is a NestJS backend API for technical service routing and scheduling. It manages technicians, clients, visits, service tickets (chamados), and route optimization using MILP (Mixed Integer Linear Programming).

## Project Structure
```
src/
├── agenda/           # Route scheduling and optimization using MILP
├── auth/             # Authentication with better-auth
├── chamados/         # Service tickets management
├── clientes/         # Client management
├── common/           # Shared utilities and interceptors
├── dashboard/        # Dashboard statistics
├── database/         # TypeORM database configuration
├── geocoding/        # Google Maps geocoding service
├── relatorios-visita/ # Visit reports
├── roteiro-cliente/  # Client route assignments
├── roteiros/         # Route management
├── tecnicos/         # Technician management
├── users/            # User entities
├── visitas/          # Visit scheduling
├── workspaces/       # Multi-tenant workspace support
├── app.module.ts     # Main application module
└── main.ts           # Application entry point
```

## Tech Stack
- **Framework**: NestJS 11
- **Database**: PostgreSQL with TypeORM
- **Authentication**: better-auth
- **API Documentation**: Swagger (available at /docs)
- **CRUD Operations**: @dataui/crud
- **Optimization**: HiGHS solver for MILP
- **Geocoding**: Google Maps API

## Running the Application
```bash
npm run start:dev    # Development mode with hot reload
npm run start        # Production mode
npm run build        # Build the application
```

## API Endpoints
All endpoints are prefixed with `/api/v1`

- `/docs` - Swagger API documentation
- `/api/v1/tecnicos` - Technician CRUD
- `/api/v1/clientes` - Client CRUD
- `/api/v1/visitas` - Visit CRUD
- `/api/v1/roteiros` - Route CRUD
- `/api/v1/chamados` - Service ticket CRUD
- `/api/v1/agenda` - Route scheduling
- `/api/v1/dashboard` - Dashboard statistics
- `/api/v1/auth` - Authentication endpoints

## Environment Variables
- `POSTGRES_HOST` - Database host
- `POSTGRES_PORT` - Database port
- `POSTGRES_DATABASE` - Database name
- `POSTGRES_USER` - Database user
- `POSTGRES_PASSWORD` - Database password
- `POSTGRES_SYNCHRONIZE` - Enable TypeORM synchronization
- `PORT` - Application port (default: 5000)

## Recent Changes
- 2026-01-05: Configured for Replit environment with PostgreSQL database
- Enabled CORS for all origins
- Set default port to 5000 with 0.0.0.0 binding

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tauri 2.0 desktop application for **Comprauto Premium Care** - an automotive aesthetics shop (estética automotiva). Manages service orders, quotes, parts, vehicles, customers, and expenses. React 19 + TypeScript frontend with Rust backend. UI is in Portuguese (pt-BR).

**Origin**: Cloned and adapted from the Rech Performance project (automotive workshop). Core functionality is the same - service orders, quotes, parts management, etc.

## Development Commands

```bash
npm run dev          # Start Vite dev server (port 1420)
npm run build        # TypeScript check + Vite build
npm run tauri dev    # Run full Tauri app in dev mode
npm run tauri build  # Build production desktop app
npm run lint         # ESLint on src/
npm run format       # Prettier format src/
```

For Rust backend changes, use `cargo check` or `cargo build` from `src-tauri/`.

## Architecture

### Frontend (`src/`)
- **React 19** with React Router v6, Vite 7, TypeScript 5.8
- **State**: TanStack React Query (server state, 5-min cache)
- **UI**: Radix UI components wrapped in `components/ui/`, Tailwind CSS, Lucide icons
- **Path alias**: `@/` maps to `src/`

### Backend (`src-tauri/`)
- **Tauri 2.0** with SQLite (rusqlite)
- **Command modules**: `commands/vehicles.rs`, `commands/parts.rs`, `commands/service_orders.rs`, `commands/quotes.rs`, `commands/expenses.rs`
- **Models**: Separate `models/` directory mirrors command structure

### Data Flow
Frontend calls `invoke('command_name', { params })` from `@tauri-apps/api` → Tauri IPC → Rust command handler → SQLite → JSON response back to frontend.

API layer in `src/lib/api/index.ts` wraps all Tauri invoke calls with typed interfaces.

## Key Directories

```
src/
  components/ui/     # Radix UI wrappers (button, dialog, form, etc.)
  components/shared/ # Domain components (VehicleSelector, QuickPartModal)
  pages/             # Route pages (service-orders/, quotes/, parts/, etc.)
  lib/api/           # Tauri invoke wrappers
  types/             # TypeScript interfaces

src-tauri/
  src/commands/      # Tauri command handlers
  src/models/        # Data models
  src/db.rs          # SQLite initialization
  migrations/        # Database migrations
```

## Domain Entities

- **ServiceOrder**: Service jobs with parts and labor (status: OPEN/FINISHED)
- **Quote**: Price proposals (status: PENDING/APPROVED/REJECTED/CONVERTED)
- **Vehicle**: Customer vehicles (brand, model, year, license plate)
- **Part**: Auto parts / products inventory with pricing
- **Customer**: Clients with contact info
- **Expense**: Business expenses (categories: AUTO_PARTS, SERVICE_PROVIDER, EQUIPMENT, OTHER)

## Type Consistency

TypeScript interfaces in `src/types/index.ts` must match Rust structs in `src-tauri/src/models/`. When modifying data structures, update both sides.

# Bajaj Map Visualization and Data Analysis

## Description

This project is a full-stack web application for map visualization and data analysis. It uses Next.js and React for the frontend, Node.js for server-side functionality, PostgreSQL for data storage, and XLSX for spreadsheet data import and processing.

The application is designed to analyze operational data, display insights on maps, and support spreadsheet-based workflows for reporting and investigation.

## Tech Stack

- Next.js
- React
- Node.js
- PostgreSQL
- XLSX

## Installation

1. Clone the repository:

```bash
git clone <your-repository-url>
cd bajajworkdone
```

2. Install project dependencies:

```bash
npm install
```

3. Configure environment variables:

```bash
copy .env.local.example .env.local
```

4. Update `.env.local` with your PostgreSQL configuration and any other required settings.

5. Create the PostgreSQL database and initialize the schema if needed:

```bash
psql -U postgres -c "CREATE DATABASE pcb_dashboard;"
psql -U postgres -d pcb_dashboard -f scripts/init-db.sql
```

## Run

Start the development server:

```bash
npm run dev
```

Build the project for production:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

Open `http://localhost:3000` in your browser after starting the app.

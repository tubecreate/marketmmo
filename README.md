## Setup and Configuration

### 1. Environment Variables
Copy the `.env.example` file to `.env` and adjust the variables if necessary:
```bash
cp .env.example .env
```

### 2. Database Setup
This project uses Prisma with SQLite by default. Run the following commands to initialize the database:
```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations to create tables
npx prisma migrate dev --name init

# (Optional) Seed the database with sample data
npx prisma db seed
```

### 3. Running the App
```bash
npm run dev
```

---

## Technical Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: SQLite with Prisma ORM
- **UI Architecture**: Material UI (MUI)
- **Styling**: Vanilla CSS + MUI System
- **Charts**: Recharts


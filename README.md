# VPGA

Small web application for administrating the VPGA season.

## Stack

- Frontend: Vue 3 + Vite + Pinia
- Backend: Node.js + Express
- Database: SQLite via `better-sqlite3`

## Project Structure

```text
vpga/
├── backend/
├── frontend/
└── README.md
```

## Requirements

- Node.js 18 or newer
- npm

## Install Dependencies

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

## Run In Development

Start the backend:

```bash
cd backend
node src/index.js
```

Or with watch mode:

```bash
cd backend
npm run dev
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Then open:

```text
http://localhost:5173
```

The frontend proxies `/api` requests to the backend on port `3001`.

## Production Build

Build the frontend:

```bash
cd frontend
npm run build
```

## Simple Deployment On One Machine

This project can be deployed on a single machine with the backend running as a Node.js process and the frontend served as static files.

### 1. Build the frontend

```bash
cd frontend
npm install
npm run build
```

This creates production files in:

```text
frontend/dist
```

### 2. Run the backend

```bash
cd backend
npm install
node src/index.js
```

The backend uses the SQLite database configured in `backend/.env`.

### 3. Serve the frontend

You can serve `frontend/dist` with any static web server.

One simple option is:

```bash
npm install -g serve
serve -s frontend/dist -l 4173
```

Then open:

```text
http://localhost:4173
```

### 4. API configuration

In development, Vite proxies `/api` to `http://localhost:3001`.

For production on one machine, the simplest approach is to place a reverse proxy in front of both frontend and backend so that:

- `/` serves the built frontend
- `/api` forwards to `http://localhost:3001`

Examples of suitable reverse proxies:

- nginx
- Caddy
- Apache

### 5. Keep the backend running

For a more stable deployment, run the backend under a process manager such as:

- `pm2`
- Windows Task Scheduler
- NSSM on Windows
- systemd on Linux

Example with `pm2`:

```bash
npm install -g pm2
cd backend
pm2 start src/index.js --name vpga-backend
pm2 save
```

### 6. Recommended production notes

- change `JWT_SECRET` in `backend/.env` to a long random value
- back up the SQLite database file regularly
- run the app behind HTTPS if it is exposed outside your local network
- restart the backend after changing `.env`

## Database

The backend uses SQLite. The database file path is configured in:

```text
backend/.env
```

Default values:

```env
PORT=3001
DB_PATH=./data/golf.db
```

The database and schema are created automatically when the backend starts.

## Initial Admin User

The application seeds an initial admin member:

- Name: `Simon Edlund`
- Email: `simon@edlund.nl`

There is no preset password.

### First Login

1. Open the login page.
2. Enter `simon@edlund.nl`.
3. Submit the form.
4. The application will detect first login and prompt for a new password.
5. After setting the password, you will be logged in and the email will be marked as verified.

After that, future logins use:

- Email
- Password

## Admin Features

An admin can:

- add and edit members
- set member golf ID, handicap, email, admin flag, and active flag
- create and delete rounds
- enter round scores

## Scoring Rules

- Net stroke is entered for each round.
- Members who do not participate in a round are assigned `highest score in that round + 1`.
- Season total is the sum of each member's best 4 rounds.
- Lowest total score wins the season.
- Lowest score in a round wins that round.

## Notes

- The backend must be restarted after schema or auth changes.
- The SQLite database file is ignored by git.

# Build and run the application without Docker Compose

## Build the Docker image

```bash
docker build -t vpga-app .
```

## Run the container

```bash
docker run -p 3000:3000 \
  -v $(pwd)/data:/app/backend/data \
  -e NODE_ENV=production \
  -e JWT_SECRET=your_jwt_secret_here \
  vpga-app
```

# Build and Push the Docker Image to TrueNAS

## Build the Docker Image
```bash
docker build -t your-registry-ip:port/vpga-app:latest .
```

## Log in to the Docker Registry
```bash
docker login your-registry-ip:port
```
Enter your username and password when prompted.

## Push the Image to the Registry
```bash
docker push your-registry-ip:port/vpga-app:latest
```

## Pull and Run the Image on TrueNAS
On your TrueNAS server, pull the image:
```bash
docker pull your-registry-ip:port/vpga-app:latest
```
Then run the container:
```bash
docker run -p 3000:3000 \
  -v /path/to/data:/app/backend/data \
  -e NODE_ENV=production \
  -e JWT_SECRET=your_jwt_secret_here \
  your-registry-ip:port/vpga-app:latest
```
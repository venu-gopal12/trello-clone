# Trello-like Project Management Tool

## 1. Project Overview
This project is a comprehensive **Kanban-style Project Management Tool** built as a Fullstack SDE Intern Assignment. It replicates the core functionality of Trello, allowing users to organize tasks into Boards, Lists, and Cards with an intuitive drag-and-drop interface.

**Purpose**: To demonstrate full-stack development proficiency using modern web technologies, focusing on clean architecture, responsive design, and robust data management.

## 2. Tech Stack

### Frontend
- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS (Utility-first CSS)
- **Icons**: Lucide React
- **Drag & Drop**: `@hello-pangea/dnd`
- **State/Routing**: React Router DOM
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (via `pg` client)
- **Environment**: Dotenv for configuration

### Infrastructure
- **Database Hosting**: Neon (Serverless PostgreSQL)
- **Frontend Hosting**: Vercel (Recommended)
- **Backend Hosting**: Render (Recommended)

## 3. Setup Instructions (Local Development)

### Prerequisites
- Node.js (v18+)
- PostgreSQL (Local installed or Cloud URL)
- Git

### Backend Setup
1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Create a `.env` file in the `backend` root and add your database credentials:
   ```env
   DB_USER=your_user
   DB_HOST=your_host
   DB_NAME=your_db_name
   DB_PASSWORD=your_password
   DB_PORT=5432
   PORT=5000
   ```
4. **Initialize Database**:
   Run the initialization scripts to create tables and seed data:
   ```bash
   node scripts/init_db.js    # Creates tables
   node scripts/seed.js       # Seeds initial board data (optional)
   node scripts/seed_users.js # Seeds sample users (Alice, Bob, etc.)
   ```
5. **Start the Server**:
   ```bash
   npm run dev
   ```
   Server will run on `http://localhost:5000`.

### Frontend Setup
1. **Navigate to the frontend directory**:
   ```bash
   cd ../frontend
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
4. **Access the App**:
   Open `http://localhost:5173` in your browser.

## 4. Database Schema
The database uses a relational model with the following core entities:

*   **Users** (`users`): Registered members (seeded with sample data).
*   **Boards** (`boards`): Top-level project containers.
    *   *Columns*: `id`, `title`, `background_image`, `created_at`.
*   **Lists** (`lists`): Vertical columns within a board.
    *   *Columns*: `id`, `board_id` (FK), `title`, `position`.
    *   *Ordering*: Maintained via `position` float/integer.
*   **Cards** (`cards`): Individual task items.
    *   *Columns*: `id`, `list_id` (FK), `title`, `description`, `due_date`, `position`.
*   **Card Members** (`card_members`): Many-to-Many link between Cards and Users.
*   **Labels** (`labels`): Global or Board-specific tags.
*   **Card Labels** (`card_labels`): Many-to-Many link between Cards and Labels.
*   **Checklists** (`checklists` & `checklist_items`): Granular sub-tasks within a card.

## 5. Features Implemented
*   **Board Management**: Create new boards with gradient backgrounds; delete boards.
*   **List Management**: Add, rename, and delete lists; reorder lists via drag-and-drop.
*   **Card Management**:
    *   Create, edit, and delete cards.
    *   **Drag-and-Drop**: Move cards between lists or reorder within lists.
    *   **Card Details**:
        *   Rich description editing.
        *   **Members**: Assign users (with avatar display).
        *   **Labels**: Tag cards with colored labels.
        *   **Due Dates**: Set urgency with a calendar picker.
        *   **Checklists**: interactive progress tracking.
*   **Search & Filter**: Filter cards by specific labels, members, or due dates via the top search bar.
*   **Modern UI**: Responsive layout with collapsible sidebar, glassmorphism effects, and smooth transitions.

## 6. Deployment Instructions

### PostgreSQL (Neon) -- **CONFIGURED**
1.  The project is currently configured to use your Neon database.
2.  Configuration is handled in `backend/.env` via the `DATABASE_URL` variable.
3.  SSL connection is enabled in `backend/src/config/db.js`.

### Backend (Render)
1.  Connect your repository to Render.
2.  Select **Web Service**.
3.  Set **Root Directory** to `backend`.
4.  Set **Build Command** to `npm install`.
5.  Set **Start Command** to `node src/server.js`.
6.  Add Environment Variables (`DB_HOST`, `DB_USER`, etc.) from your Neon database.

### Frontend (Vercel)
1.  Connect your repository to Vercel.
2.  Set **Root Directory** to `frontend`.
3.  (Optional) Set Environment Variables if your backend URL is dynamic (e.g., `VITE_API_URL`).
4.  Deploy.

## 7. Assumptions & Notes
*   **Authentication**: As per requirements, there is no complex auth flow. The app operates with a default user context or simple user selection for demonstration purposes.
*   **Sample Data**: The `seed_users.js` script populates the database with 5 users (Alice, Bob, etc.) to facilitate immediate testing of member assignment features.
*   **Design**: The UI is heavily inspired by Trello's modern aesthetic, prioritizing visual hierarchy and ease of use.

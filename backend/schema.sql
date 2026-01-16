-- Trello Clone Database Schema Design
-- Database: PostgreSQL

-- 1. Users (represented as 'members' in the requirements, but 'users' is more standard for auth. 
--    We will use 'users' table and refer to them as members in context of boards/cards)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Boards
CREATE TABLE boards (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    background_color VARCHAR(20) DEFAULT '#0079bf', -- Default Trello Blue
    background_image TEXT, -- Unsplash URL
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Lists
-- Position field used for ordering lists within a board.
CREATE TABLE lists (
    id SERIAL PRIMARY KEY,
    board_id INTEGER REFERENCES boards(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    position INTEGER NOT NULL DEFAULT 65535, -- Lexorank or spaced integers usually better, simple int for now.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Cards
-- Position field used for ordering cards within a list.
CREATE TABLE cards (
    id SERIAL PRIMARY KEY,
    list_id INTEGER REFERENCES lists(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    position INTEGER NOT NULL DEFAULT 65535,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Labels
-- Labels can be global or per-board. Trello usually does per-board or mix. 
-- We'll make them per-board for flexibility.
CREATE TABLE labels (
    id SERIAL PRIMARY KEY,
    board_id INTEGER REFERENCES boards(id) ON DELETE CASCADE,
    name VARCHAR(50),
    color VARCHAR(20) NOT NULL, -- Hex code or predefined color name
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Card Labels (Many-to-Many: Cards <-> Labels)
CREATE TABLE card_labels (
    card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
    label_id INTEGER REFERENCES labels(id) ON DELETE CASCADE,
    PRIMARY KEY (card_id, label_id)
);

-- 7. Checklists
-- A card can have multiple checklists.
CREATE TABLE checklists (
    id SERIAL PRIMARY KEY,
    card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL DEFAULT 'Checklist',
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Checklist Items
-- Items within a checklist.
CREATE TABLE checklist_items (
    id SERIAL PRIMARY KEY,
    checklist_id INTEGER REFERENCES checklists(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Board Members (Many-to-Many: Boards <-> Users)
-- Users who have access to a board.
CREATE TABLE board_members (
    board_id INTEGER REFERENCES boards(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member', -- 'admin', 'member', 'observer'
    PRIMARY KEY (board_id, user_id)
);

-- 10. Card Members (Many-to-Many: Cards <-> Users)
-- Users assigned to a specific card.
CREATE TABLE card_members (
    card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (card_id, user_id)
);

-- Relationships Summary:
-- Users 1:N Boards (as owner)
-- Users M:N Boards (as members)
-- Boards 1:N Lists
-- Lists 1:N Cards
-- Cards 1:N Checklists
-- Checklists 1:N ChecklistItems
-- Cards M:N Labels
-- Cards M:N Users (assignees)

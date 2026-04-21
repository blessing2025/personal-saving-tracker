CREATE DATABASE IF NOT EXISTS personal_saving_tracker;
USE personal_saving_tracker;

-- Users table (Handles basic auth info and preferences)
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY, -- MySQL uses VARCHAR(36) or BINARY(16) for UUIDs
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  currency VARCHAR(10) DEFAULT 'FCFA',
  date_format VARCHAR(10) DEFAULT 'DD/MM/YYYY',
  theme VARCHAR(10) DEFAULT 'light',
  notification_enabled BOOLEAN DEFAULT true
);

-- Profiles table
CREATE TABLE profiles (
  id VARCHAR(36) PRIMARY KEY,
  full_name VARCHAR(100),
  avatar_url TEXT,
  phone VARCHAR(20),
  CONSTRAINT fk_profile_user FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

-- Incomes
CREATE TABLE incomes (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  source VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP NULL,
  CONSTRAINT fk_income_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Expenses
CREATE TABLE expenses (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP NULL,
  CONSTRAINT fk_expense_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Goals
CREATE TABLE goals (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) DEFAULT 0,
  deadline DATE,
  priority VARCHAR(10) DEFAULT 'medium',
  category VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  is_emergency BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_goal_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Goal allocations
CREATE TABLE goal_allocations (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  goal_id VARCHAR(36) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  allocated_date DATE DEFAULT (CURRENT_DATE),
  notes TEXT,
  CONSTRAINT fk_allocation_goal FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
);

-- Savings history
CREATE TABLE savings_history (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_income DECIMAL(12,2) NOT NULL,
  total_expense DECIMAL(12,2) NOT NULL,
  net_savings DECIMAL(12,2) NOT NULL,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Automatic Profile Creation Trigger
DELIMITER //
CREATE TRIGGER after_user_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
  INSERT INTO profiles (id) VALUES (NEW.id);
END;
//
DELIMITER ;
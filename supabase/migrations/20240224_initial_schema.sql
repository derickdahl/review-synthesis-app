-- Performance Review Synthesis App Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users/Managers table
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'manager',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees table
CREATE TABLE employees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  position VARCHAR(255),
  department VARCHAR(255),
  manager_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Review cycles table
CREATE TABLE review_cycles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  year INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table (main data structure)
CREATE TABLE reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) NOT NULL,
  review_cycle_id UUID REFERENCES review_cycles(id) NOT NULL,
  manager_id UUID REFERENCES users(id) NOT NULL,
  
  -- ITP Assessment Scores (1-10)
  itp_self_humble INTEGER CHECK (itp_self_humble BETWEEN 1 AND 10),
  itp_self_hungry INTEGER CHECK (itp_self_hungry BETWEEN 1 AND 10),
  itp_self_smart INTEGER CHECK (itp_self_smart BETWEEN 1 AND 10),
  itp_manager_humble INTEGER CHECK (itp_manager_humble BETWEEN 1 AND 10),
  itp_manager_hungry INTEGER CHECK (itp_manager_hungry BETWEEN 1 AND 10),
  itp_manager_smart INTEGER CHECK (itp_manager_smart BETWEEN 1 AND 10),
  
  -- Input Documents and Text
  feedback_360_file_url TEXT, -- URL to uploaded PDF in Supabase Storage
  feedback_360_text TEXT, -- Extracted text from 360 feedback
  self_review_text TEXT, -- Employee's self review responses
  manager_comments TEXT, -- Manager's observations and comments
  
  -- AI Generated Review Sections
  generated_strengths TEXT,
  generated_development TEXT,
  generated_goals TEXT,
  generated_overall TEXT,
  
  -- Final Review Content (after manager edits)
  final_strengths TEXT,
  final_development TEXT,
  final_goals TEXT,
  final_overall TEXT,
  
  -- Processing metadata
  ai_model_used VARCHAR(100), -- Track which AI model was used
  processing_time INTEGER, -- Time taken to generate review (seconds)
  
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'inputs_complete', 'generated', 'reviewed', 'finalized')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one review per employee per cycle
  UNIQUE(employee_id, review_cycle_id)
);

-- Review history for tracking changes
CREATE TABLE review_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  review_id UUID REFERENCES reviews(id) NOT NULL,
  changed_by UUID REFERENCES users(id) NOT NULL,
  change_type VARCHAR(50) NOT NULL, -- 'created', 'generated', 'edited', 'finalized'
  changes JSONB, -- Store the specific changes made
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('review-documents', 'review-documents', true);

-- Row Level Security Policies

-- Users can only see their own records
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);

-- Managers can see employees they manage
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers can view their employees" ON employees FOR ALL USING (
  manager_id = auth.uid()::uuid OR 
  auth.uid()::text = id::text
);

-- Managers can see reviews for their employees
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers can view employee reviews" ON reviews FOR ALL USING (
  manager_id = auth.uid()::uuid OR
  employee_id IN (SELECT id FROM employees WHERE manager_id = auth.uid()::uuid)
);

-- Managers can see review cycles they created or participate in
ALTER TABLE review_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view review cycles" ON review_cycles FOR SELECT USING (true);
CREATE POLICY "Managers can create review cycles" ON review_cycles FOR INSERT WITH CHECK (
  created_by = auth.uid()::uuid
);

-- Review history is viewable by managers of the review
ALTER TABLE review_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers can view review history" ON review_history FOR SELECT USING (
  review_id IN (SELECT id FROM reviews WHERE manager_id = auth.uid()::uuid)
);

-- Create indexes for performance
CREATE INDEX idx_employees_manager_id ON employees(manager_id);
CREATE INDEX idx_reviews_employee_id ON reviews(employee_id);
CREATE INDEX idx_reviews_manager_id ON reviews(manager_id);
CREATE INDEX idx_reviews_cycle_id ON reviews(review_cycle_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_review_history_review_id ON review_history(review_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_review_cycles_updated_at BEFORE UPDATE ON review_cycles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for development (optional)
-- INSERT INTO users (id, email, name, role) VALUES 
--   ('550e8400-e29b-41d4-a716-446655440000', 'manager@company.com', 'John Manager', 'manager');

-- INSERT INTO employees (id, name, email, position, manager_id) VALUES 
--   ('550e8400-e29b-41d4-a716-446655440001', 'Jane Employee', 'jane@company.com', 'Senior Developer', '550e8400-e29b-41d4-a716-446655440000');

-- INSERT INTO review_cycles (id, name, year, start_date, end_date, status, created_by) VALUES 
--   ('550e8400-e29b-41d4-a716-446655440002', '2024 Annual Review', 2024, '2024-01-01', '2024-12-31', 'active', '550e8400-e29b-41d4-a716-446655440000');
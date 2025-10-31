-- WoodFlow Database Schema for Supabase PostgreSQL
-- Copy and paste this in Supabase SQL Editor

-- Create sync_data table
CREATE TABLE sync_data (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    company_id TEXT NOT NULL, 
    data_type TEXT NOT NULL,
    data_content JSONB NOT NULL,
    version INTEGER DEFAULT 1,
    last_modified TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, company_id, data_type)
);

-- Create indexes for better performance
CREATE INDEX idx_sync_data_user ON sync_data(user_id);
CREATE INDEX idx_sync_data_company ON sync_data(company_id); 
CREATE INDEX idx_sync_data_type ON sync_data(data_type);
CREATE INDEX idx_sync_data_modified ON sync_data(last_modified);

-- Enable Row Level Security
ALTER TABLE sync_data ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (you can customize this later)
CREATE POLICY "Allow all operations" ON sync_data FOR ALL TO anon USING (true);

-- Create a function to update version on data change
CREATE OR REPLACE FUNCTION update_sync_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = COALESCE(OLD.version, 0) + 1;
    NEW.last_modified = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-increment version
CREATE TRIGGER trigger_update_sync_version
    BEFORE UPDATE ON sync_data
    FOR EACH ROW
    EXECUTE FUNCTION update_sync_version();

-- Insert sample data for testing
INSERT INTO sync_data (user_id, company_id, data_type, data_content) VALUES 
('test_user', 'solidwood_ksa', 'projects', '{"projects": [], "lastSync": "2025-11-01T00:00:00Z"}'),
('test_user', 'solidwood_ksa', 'customers', '{"customers": [], "lastSync": "2025-11-01T00:00:00Z"}'),
('test_user', 'solidwood_ksa', 'inventory', '{"wood": [], "accessories": [], "tools": [], "lastSync": "2025-11-01T00:00:00Z"}');

-- Show results
SELECT 'Database setup completed successfully!' as status;
SELECT COUNT(*) as total_records FROM sync_data;
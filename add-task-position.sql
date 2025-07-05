-- Add position field to tasks table for drag-and-drop reordering
-- Run this migration in Supabase SQL editor

-- Add position column to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Update existing tasks with sequential positions within their week/day groups
WITH task_positions AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY week, day 
      ORDER BY created_at
    ) - 1 as new_position
  FROM tasks
)
UPDATE tasks t
SET position = tp.new_position
FROM task_positions tp
WHERE t.id = tp.id;

-- Create index for faster sorting
CREATE INDEX IF NOT EXISTS idx_tasks_week_day_position 
ON tasks(week, day, position);
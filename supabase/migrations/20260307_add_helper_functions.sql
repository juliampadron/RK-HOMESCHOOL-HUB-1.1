-- Add helper function for incrementing class enrollment count
CREATE OR REPLACE FUNCTION increment_class_enrollment(class_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE classes
  SET current_enrollment = COALESCE(current_enrollment, 0) + 1
  WHERE id = class_id;
END;
$$ LANGUAGE plpgsql;

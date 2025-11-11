-- Create function to handle new user signup and create teacher profile
CREATE OR REPLACE FUNCTION public.handle_new_teacher_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  demo_school_id UUID;
BEGIN
  -- Get or create demo school
  SELECT id INTO demo_school_id FROM public.schools WHERE name = 'Demo Skola' LIMIT 1;
  
  IF demo_school_id IS NULL THEN
    INSERT INTO public.schools (name) VALUES ('Demo Skola') RETURNING id INTO demo_school_id;
  END IF;

  -- Create teacher profile
  INSERT INTO public.teachers (user_id, school_id, first_name, last_name, email)
  VALUES (
    NEW.id,
    demo_school_id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Lärare'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Användare'),
    NEW.email
  );

  RETURN NEW;
END;
$$;

-- Create trigger for automatic teacher profile creation
CREATE TRIGGER on_auth_user_created_teacher
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_teacher_user();

-- Create demo school if it doesn't exist
INSERT INTO public.schools (name)
SELECT 'Demo Skola'
WHERE NOT EXISTS (SELECT 1 FROM public.schools WHERE name = 'Demo Skola');

-- Insert demo data
DO $$
DECLARE
  demo_school_id UUID;
BEGIN
  -- Get demo school
  SELECT id INTO demo_school_id FROM public.schools WHERE name = 'Demo Skola' LIMIT 1;

  -- Only insert demo data if we have a school
  IF demo_school_id IS NOT NULL THEN
    -- Insert demo card readers if they don't exist
    IF NOT EXISTS (SELECT 1 FROM public.card_readers WHERE school_id = demo_school_id) THEN
      INSERT INTO public.card_readers (school_id, room, name)
      VALUES 
        (demo_school_id, 'Klassrum A', 'Kortläsare A'),
        (demo_school_id, 'Klassrum B', 'Kortläsare B'),
        (demo_school_id, 'Aula', 'Kortläsare Aula');
    END IF;

    -- Insert demo students if they don't exist
    IF NOT EXISTS (SELECT 1 FROM public.students WHERE school_id = demo_school_id) THEN
      INSERT INTO public.students (school_id, first_name, last_name, student_number, card_reader_id)
      VALUES 
        (demo_school_id, 'Anna', 'Andersson', 'S001', 'CARD001'),
        (demo_school_id, 'Erik', 'Eriksson', 'S002', 'CARD002'),
        (demo_school_id, 'Maria', 'Johansson', 'S003', 'CARD003'),
        (demo_school_id, 'Johan', 'Svensson', 'S004', 'CARD004'),
        (demo_school_id, 'Lisa', 'Nilsson', 'S005', 'CARD005');
    END IF;
  END IF;
END;
$$;
-- Add skola24_schedule_url to teachers table
ALTER TABLE public.teachers 
ADD COLUMN IF NOT EXISTS skola24_schedule_url text;

-- Allow teachers to update their own profile including schedule link
CREATE POLICY "Teachers can update their own profile"
ON public.teachers
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create table to link teachers to classes
CREATE TABLE IF NOT EXISTS public.teacher_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, class_id)
);

-- Enable RLS on teacher_classes
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;

-- Teachers can view their own class assignments
CREATE POLICY "Teachers can view their class assignments"
ON public.teacher_classes
FOR SELECT
USING (teacher_id IN (
  SELECT id FROM public.teachers WHERE user_id = auth.uid()
));

-- Teachers can manage their class assignments
CREATE POLICY "Teachers can manage their class assignments"
ON public.teacher_classes
FOR ALL
USING (teacher_id IN (
  SELECT id FROM public.teachers WHERE user_id = auth.uid()
));

-- Allow teachers to update school_id (for selecting their school)
CREATE POLICY "Teachers can update their school"
ON public.teachers
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
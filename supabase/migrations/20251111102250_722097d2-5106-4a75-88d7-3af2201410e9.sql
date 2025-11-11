-- Fix infinite recursion in teachers RLS policy
DROP POLICY IF EXISTS "Teachers can view teachers in their school" ON public.teachers;

CREATE POLICY "Teachers can view teachers in their school"
ON public.teachers
FOR SELECT
USING (
  user_id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 FROM public.teachers t
    WHERE t.user_id = auth.uid() 
    AND t.school_id = teachers.school_id
  )
);
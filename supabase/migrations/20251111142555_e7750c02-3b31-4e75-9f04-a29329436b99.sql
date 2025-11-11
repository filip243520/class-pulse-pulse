-- Allow teachers to view all schools (needed for school selection in settings)
DROP POLICY IF EXISTS "Teachers can view their school" ON public.schools;

CREATE POLICY "Teachers can view all schools"
ON public.schools
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM teachers WHERE teachers.user_id = auth.uid()
  )
);
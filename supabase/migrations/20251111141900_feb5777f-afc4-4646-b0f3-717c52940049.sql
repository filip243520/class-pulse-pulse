-- Create student_classes junction table to link students to their classes
CREATE TABLE IF NOT EXISTS public.student_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, class_id)
);

-- Enable RLS
ALTER TABLE public.student_classes ENABLE ROW LEVEL SECURITY;

-- Teachers can view student-class assignments in their school
CREATE POLICY "Teachers can view student classes in their school"
ON public.student_classes
FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT students.id 
    FROM students 
    WHERE students.school_id IN (
      SELECT teachers.school_id 
      FROM teachers 
      WHERE teachers.user_id = auth.uid()
    )
  )
);

-- Teachers can manage student-class assignments in their school
CREATE POLICY "Teachers can manage student classes in their school"
ON public.student_classes
FOR ALL
TO authenticated
USING (
  student_id IN (
    SELECT students.id 
    FROM students 
    WHERE students.school_id IN (
      SELECT teachers.school_id 
      FROM teachers 
      WHERE teachers.user_id = auth.uid()
    )
  )
);
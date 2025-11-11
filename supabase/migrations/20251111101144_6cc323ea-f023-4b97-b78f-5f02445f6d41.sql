-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schools table
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create teachers table (linked to auth.users)
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  student_number TEXT NOT NULL,
  card_reader_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, student_number)
);

-- Create card_readers table
CREATE TABLE public.card_readers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  room TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create classes table
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create lessons table
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  room TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create attendance_records table
CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_readers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for schools
CREATE POLICY "Teachers can view their school"
  ON public.schools FOR SELECT
  USING (id IN (SELECT school_id FROM public.teachers WHERE user_id = auth.uid()));

-- RLS Policies for teachers
CREATE POLICY "Teachers can view teachers in their school"
  ON public.teachers FOR SELECT
  USING (school_id IN (SELECT school_id FROM public.teachers WHERE user_id = auth.uid()));

-- RLS Policies for students
CREATE POLICY "Teachers can view students in their school"
  ON public.students FOR SELECT
  USING (school_id IN (SELECT school_id FROM public.teachers WHERE user_id = auth.uid()));

CREATE POLICY "Teachers can insert students in their school"
  ON public.students FOR INSERT
  WITH CHECK (school_id IN (SELECT school_id FROM public.teachers WHERE user_id = auth.uid()));

CREATE POLICY "Teachers can update students in their school"
  ON public.students FOR UPDATE
  USING (school_id IN (SELECT school_id FROM public.teachers WHERE user_id = auth.uid()));

CREATE POLICY "Teachers can delete students in their school"
  ON public.students FOR DELETE
  USING (school_id IN (SELECT school_id FROM public.teachers WHERE user_id = auth.uid()));

-- RLS Policies for card_readers
CREATE POLICY "Teachers can view card readers in their school"
  ON public.card_readers FOR SELECT
  USING (school_id IN (SELECT school_id FROM public.teachers WHERE user_id = auth.uid()));

CREATE POLICY "Teachers can manage card readers in their school"
  ON public.card_readers FOR ALL
  USING (school_id IN (SELECT school_id FROM public.teachers WHERE user_id = auth.uid()));

-- RLS Policies for classes
CREATE POLICY "Teachers can view classes in their school"
  ON public.classes FOR SELECT
  USING (school_id IN (SELECT school_id FROM public.teachers WHERE user_id = auth.uid()));

CREATE POLICY "Teachers can manage classes in their school"
  ON public.classes FOR ALL
  USING (school_id IN (SELECT school_id FROM public.teachers WHERE user_id = auth.uid()));

-- RLS Policies for lessons
CREATE POLICY "Teachers can view lessons in their school"
  ON public.lessons FOR SELECT
  USING (class_id IN (
    SELECT id FROM public.classes 
    WHERE school_id IN (SELECT school_id FROM public.teachers WHERE user_id = auth.uid())
  ));

CREATE POLICY "Teachers can manage lessons in their school"
  ON public.lessons FOR ALL
  USING (class_id IN (
    SELECT id FROM public.classes 
    WHERE school_id IN (SELECT school_id FROM public.teachers WHERE user_id = auth.uid())
  ));

-- RLS Policies for attendance_records
CREATE POLICY "Teachers can view attendance in their school"
  ON public.attendance_records FOR SELECT
  USING (student_id IN (
    SELECT id FROM public.students 
    WHERE school_id IN (SELECT school_id FROM public.teachers WHERE user_id = auth.uid())
  ));

CREATE POLICY "Teachers can manage attendance in their school"
  ON public.attendance_records FOR ALL
  USING (student_id IN (
    SELECT id FROM public.students 
    WHERE school_id IN (SELECT school_id FROM public.teachers WHERE user_id = auth.uid())
  ));

-- Create function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for updated_at
CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
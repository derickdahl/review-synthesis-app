import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Employee {
  id: string
  name: string
  email: string
  position: string
  manager_id: string
  created_at: string
  updated_at: string
}

export interface ReviewCycle {
  id: string
  name: string
  year: number
  start_date: string
  end_date: string
  status: 'draft' | 'active' | 'completed'
  created_at: string
}

export interface Review {
  id: string
  employee_id: string
  review_cycle_id: string
  manager_id: string
  
  // ITP Scores
  itp_self_humble: number | null
  itp_self_hungry: number | null
  itp_self_smart: number | null
  itp_manager_humble: number | null
  itp_manager_hungry: number | null
  itp_manager_smart: number | null
  
  // Input documents
  feedback_360_file_url: string | null
  feedback_360_text: string | null
  self_review_text: string | null
  manager_comments: string | null
  
  // Generated content
  generated_strengths: string | null
  generated_development: string | null
  generated_goals: string | null
  generated_overall: string | null
  
  status: 'draft' | 'generated' | 'reviewed' | 'finalized'
  created_at: string
  updated_at: string
}

// Utility functions
export async function uploadFile(file: File, bucket: string, fileName: string) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file)
    
  if (error) throw error
  return data
}

export async function getFileUrl(bucket: string, fileName: string) {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName)
    
  return data.publicUrl
}
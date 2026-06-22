import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://hflavrmdoikteqjzdplc.supabase.co'
const SUPABASE_KEY = 'sb_publishable_mDdET3zaUOi5tOB3OkGlZw_JBFfH1On'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

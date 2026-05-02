import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vqmmwyfvjwpxbkrjedyh.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxbW13eWZ2andweGJrcmplZHloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNjM4MzksImV4cCI6MjA4NjgzOTgzOX0.eptQtMtJUVzY5vtnlMD2hB0vpK_sFN9o8ODLXQ-4dL8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
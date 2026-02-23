const SUPABASE_URL = 'https://yamofbzmisxqspjikbxt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbW9mYnptaXN4cXNwamlrYnh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NTIzOTQsImV4cCI6MjA4NzQyODM5NH0.enygNkCSyaXBSEXgefKuT2sEsbnVlyCSApyea5u065Q';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

window.supabaseClient = supabaseClient;

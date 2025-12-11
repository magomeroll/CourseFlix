import { createClient } from '@supabase/supabase-js';

// ⚠️ IMPORTANTE: SOSTITUISCI QUESTE STRINGHE CON I DATI DEL TUO PROGETTO SUPABASE
// Li trovi in Settings -> API su Supabase.com
const SUPABASE_URL = 'https://hqmvmvppaymazmfnnmfd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxbXZtdnBwYXltYXptZm5ubWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NjQwMTIsImV4cCI6MjA4MTA0MDAxMn0.oWSjmbVhK54RLK6OdsUTzGZmmuDrI5jKjSj3j2kVxng';

// Safety check to prevent app crash if keys are placeholders
const isValidUrl = (url: string) => url.startsWith('https://');

export const isSupabaseConfigured = () => {
    return isValidUrl(SUPABASE_URL) && !SUPABASE_ANON_KEY.includes('INSERISCI');
};

// Only create the client if the URL is valid, otherwise create a dummy client to avoid runtime errors
export const supabase = isSupabaseConfigured() 
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : createClient('https://placeholder.supabase.co', 'placeholder'); // Dummy client that won't work but prevents crash

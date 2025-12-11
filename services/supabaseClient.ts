import { createClient } from '@supabase/supabase-js';

// ⚠️ IMPORTANTE: SOSTITUISCI QUESTE STRINGHE CON I DATI DEL TUO PROGETTO SUPABASE
// Li trovi in Settings -> API su Supabase.com
const SUPABASE_URL = 'INSERISCI_QUI_TUO_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'INSERISCI_QUI_TUA_SUPABASE_ANON_KEY';

// Safety check to prevent app crash if keys are placeholders
const isValidUrl = (url: string) => url.startsWith('https://');

export const isSupabaseConfigured = () => {
    return isValidUrl(SUPABASE_URL) && !SUPABASE_ANON_KEY.includes('INSERISCI');
};

// Only create the client if the URL is valid, otherwise create a dummy client to avoid runtime errors
export const supabase = isSupabaseConfigured() 
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : createClient('https://placeholder.supabase.co', 'placeholder'); // Dummy client that won't work but prevents crash

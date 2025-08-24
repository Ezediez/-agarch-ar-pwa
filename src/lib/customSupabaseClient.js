import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ygkhhpxejrajyeshwief.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlna2hocHhlanJhanllc2h3aWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyODM5NjcsImV4cCI6MjA2Nzg1OTk2N30.6Kss7hKJfmtaf61OqwmakuXCpn3MpSvDDPyIZKCd2Tc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
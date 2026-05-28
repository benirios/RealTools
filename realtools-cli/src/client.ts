import { createClient } from "@supabase/supabase-js";
import type { Session } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });

const url = process.env.REALTOOLS_SUPABASE_URL;
const anonKey = process.env.REALTOOLS_SUPABASE_ANON_KEY;
const email = process.env.REALTOOLS_EMAIL;
const password = process.env.REALTOOLS_PASSWORD;

if (!url || !anonKey) {
  throw new Error("Missing env: REALTOOLS_SUPABASE_URL and REALTOOLS_SUPABASE_ANON_KEY required");
}
if (!email || !password) {
  throw new Error("Missing env: REALTOOLS_EMAIL and REALTOOLS_PASSWORD required");
}

const SESSION_DIR = join(homedir(), ".realtools");
const SESSION_FILE = join(SESSION_DIR, "session.json");

function loadSession(): Session | null {
  try {
    return JSON.parse(readFileSync(SESSION_FILE, "utf-8")) as Session;
  } catch {
    return null;
  }
}

function saveSession(session: Session | null): void {
  try {
    mkdirSync(SESSION_DIR, { recursive: true });
    if (session) writeFileSync(SESSION_FILE, JSON.stringify(session), "utf-8");
  } catch (e) {
    process.stderr.write(`Warning: could not save session: ${e}\n`);
  }
}

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const stored = loadSession();
if (stored) {
  const { error: setError } = await supabase.auth.setSession(stored);
  if (setError) {
    // Stored session expired — re-login
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(`Auth failed: ${error.message}`);
    saveSession(data.session);
  } else {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Stored session invalid — re-login required");
    saveSession(stored);
  }
} else {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Auth failed: ${error.message}`);
  saveSession(data.session);
}

const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error("Auth succeeded but no user returned");

// Used only for INSERT statements that require explicit user_id column
export const USER_ID = user.id;

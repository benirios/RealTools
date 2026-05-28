# Security Report — realtools-cli — 2026-05-21 10:35

## Summary

| Severity | Count |
|----------|-------|
| 🔴 CRITICAL | 2 |
| 🟠 HIGH     | 0 |
| 🟡 MEDIUM   | 0 |
| 🔵 LOW      | 0 |
| **Total**   | **2** |

## 🔴 CRITICAL

### [S001] .gitignore missing entirely
- **Location:** `.gitignore`
- **Description:** No .gitignore found — .env and other secrets may be committed
- **Remediation:** Create .gitignore with .env* entry
- **Context:**
  ```
  File not found
  ```
- **Auto-fix:** `secmaxxing audit`

### [S018] Supabase getSession() on server
- **Location:** `src/client.ts:58`
- **Description:** getSession() trusts client-supplied JWT without server verification
- **Remediation:** Replace with supabase.auth.getUser() on all server-side code
- **Context:**
  ```
  const { data: { session } } = await supabase.auth.getSession();
  ```

---

## Checklist — Safe fixes (`secmaxxing audit`)

- [ ] [S001] .gitignore missing entirely — `.gitignore`

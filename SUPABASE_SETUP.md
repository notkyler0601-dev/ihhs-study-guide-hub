# Supabase setup (10 minutes, one time)

This hooks up cross-device sync for user accounts and makes `/request` submissions land in a real inbox at `/admin/requests`.

**Without these steps the app still works.** It falls back to local-only mode: accounts and progress stay on one device, the request form falls back to `mailto:`. Everything keeps running.

---

## Step 1: Create a Supabase project (2 min)

1. Go to <https://supabase.com> and sign up (GitHub login is fine).
2. Click **New Project**. Give it a name (e.g. "ihhs-study-guide-hub").
3. Pick a strong DB password (save it in your password manager, you likely won't need it again).
4. Pick the region closest to your classmates.
5. Click **Create new project** and wait ~30 seconds.

## Step 2: Grab your API keys (30 sec)

1. In your Supabase project, click **Settings** (gear icon) > **API**.
2. Copy these two values:
   - **Project URL** (looks like `https://abc123xyz.supabase.co`)
   - **anon/public key** (a long `eyJ...` string)

The anon key is safe to expose in the browser, since Row-Level Security in our schema makes sure users can only touch their own data.

## Step 3: Run the SQL schema (30 sec)

1. In Supabase, click **SQL Editor** in the left nav.
2. Click **New query**.
3. Open `supabase/schema.sql` from this repo, copy **all of it**, paste into the Supabase editor.
4. Click **Run** (or Ctrl/Cmd+Enter).

You should see "Success. No rows returned." If you get errors, read them carefully. The script is idempotent, so re-running is safe.

This creates:

- `profiles` (username + display name)
- `user_data` (key-value store for progress/SRS/quiz scores)
- `requests` (guide request inbox)
- Row-Level Security policies on all three

## Step 4: Local dev setup (1 min)

Create a file called `.env` in the project root:

```
PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key-here
```

Then restart `npm run dev`. The app now runs in cloud mode locally.

## Step 5: Add the same env vars to Vercel (2 min)

1. Open your Vercel project dashboard.
2. **Settings** > **Environment Variables**.
3. Add both variables (`PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`) with the same values.
4. Make sure they're enabled for **Production, Preview, and Development**.
5. Redeploy (Vercel > Deployments > click the latest > Redeploy).

## Step 6: Make yourself admin (2 min)

1. On the deployed site, go to `/signup`.
2. Create your account with a real email + password.
3. Back in Supabase, go to **SQL Editor**, paste this (replacing the username):

   ```sql
   update public.profiles set is_admin = true where username = 'your-username';
   ```

4. Hit **Run**.
5. Reload the site. You can now visit `/admin/requests` and see all incoming submissions.

---

## Troubleshooting

**"Cloud mode is not configured" on signup**
The env vars aren't being read. Double-check spelling (must start with `PUBLIC_`). Restart the dev server after changing `.env`. In Vercel, redeploy after adding env vars.

**"That username is already taken"**
Pick a different one. Usernames are globally unique across the whole site.

**Signup succeeds but login fails**
Supabase by default requires email confirmation. Either:
- **Disable confirmations** (fastest for a classroom site): Supabase > Authentication > Providers > Email > turn off "Confirm email" > Save.
- **Or** check your inbox for a confirmation link and click it.

**Everything works locally but not on Vercel**
You added env vars in Vercel but didn't redeploy. Vercel only applies env changes on a fresh build.

**Admin page says "Admins only" even after the SQL update**
Log out and back in to refresh the cached profile.

**Data didn't migrate from local mode to cloud mode**
This is expected. The old localStorage data stays on the old device. After signing up in cloud mode the new account is empty. If you really need to migrate, export the old localStorage entries (DevTools > Application > Local Storage > keys starting with `ihhs:u:`) and re-enter the data manually.

## What this gives you

| Feature | Before Supabase | After |
|---|---|---|
| Accounts | Per-device, username-only | Cross-device, email + password |
| Progress / streaks | Per-device | Synced |
| Flashcard SRS schedules | Per-device | Synced |
| Quiz history | Per-device | Synced |
| `/request` submissions | `mailto:` to your inbox | Land in `/admin/requests` with claim/done workflow |
| Admin inbox at `/admin/requests` | Not available | Visible only to accounts flagged `is_admin = true` |

## What Supabase costs

Free tier: 50k monthly active users, 500 MB DB, 1 GB file storage, 2 GB bandwidth. A classroom-scale study site will never come close.

## What to do if Supabase is ever down

The app is designed to degrade gracefully:
- Reads: always served from localStorage cache (instant).
- Writes: land in localStorage first, then try to push to cloud (fire-and-forget retry on next change).
- Login / signup / request submission: these are the only blocking cloud calls. If Supabase is down, the forms will show an error. The rest of the site keeps working.

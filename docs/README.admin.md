# Administrator and password setup

The only permitted administrator is `maverov@gmail.com`, with display name `admin`.
Migration 0016 demotes other administrators and revokes their sessions. Database
constraints reject other administrator addresses, multiple admins and mixed roles.
Other accounts remain ordinary users; they are not deleted.

## Local and Vercel deployment

Against **each environment's database**, run these in order:

```powershell
pnpm db:migrate
pnpm admin:setup
```

For production, run from a trusted terminal with `DATABASE_URL` securely configured
to the hosted production database. A process environment variable overrides local
env files. Do not commit database credentials. Vercel hosting does not copy the
local database and does not automatically run these setup commands.

`admin:setup` creates the designated account if absent, or promotes the existing
account. It sets its name to `admin`, clears bans and demotes other administrators.
It is safe to repeat and preserves an existing password. No default password is
created. After provisioning a new account, open `/forgot-password`, use the email
link to set a password, then sign in and complete email verification.

Configure `RESEND_API_KEY`, a verified `EMAIL_FROM`, `BETTER_AUTH_URL` and
`NEXT_PUBLIC_APP_URL` before using the flow in production. Without email setup,
development logs links in the server terminal; production cannot send them.
Never publish these links or log files. User-facing reset responses do not reveal
whether an account exists. Reset tokens expire after one hour and password resets
revoke existing sessions.

## Controls

The admin-only desktop and mobile menu opens `/admin`:

- Users: search by name/email, ban with a reason and duration, or unban.
- Listings: search by title, remove by archiving, or restore an archived listing.
- Reports: existing moderation queue and resolution controls.

Admins also see removal controls on published listing pages and ban controls on
public user profiles. Banned profiles disappear publicly; use Admin → Users to
unban them. Admin API endpoints verify permissions on the server.

Removal is reversible archiving, not permanent deletion. Restoration changes the
listing to **paused**, allowing its owner to review and republish. Unbanning does
not automatically republish listings. The admin account cannot be deleted through
the account settings or authentication admin API.

Account settings now include a translated change-password form for password
accounts, plus an email-reset link. Changing a password requires the current
password and revokes other sessions. Social-only users can set a password using
email reset.

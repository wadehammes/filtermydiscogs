# Database Setup for Production

## Quick Start

### 1. Create Database in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Storage** → **Create Database** → **Postgres**
3. Follow the setup wizard
4. **Copy the connection string** - it will look like:
   ```
   postgres://default:password@host.vercel-storage.com:5432/verceldb
   ```

### 2. Set Environment Variables in Vercel

In your Vercel project settings, add these environment variables:

```bash
# Database (use the connection string from Vercel)
PRISMA_DATABASE_URL=postgres://default:password@host.vercel-storage.com:5432/verceldb

# OR if Vercel provides DATABASE_URL, you can use that instead:
# DATABASE_URL=postgres://default:password@host.vercel-storage.com:5432/verceldb
```

**Note:** Vercel may automatically provide `DATABASE_URL`. If so, you can either:
- Use `DATABASE_URL` and update `prisma/schema.prisma` to use `DATABASE_URL` instead of `PRISMA_DATABASE_URL`
- Or keep `PRISMA_DATABASE_URL` and copy the value from `DATABASE_URL`

### 3. Initial Database Setup (One-Time)

You have two options for the initial setup:

#### Option A: Using Prisma Migrate (Recommended)

```bash
# 1. Set the production database URL locally (temporarily)
export PRISMA_DATABASE_URL="your_production_connection_string"

# 2. Create initial migration
pnpm prisma migrate dev --name init

# 3. Apply migration to production
pnpm prisma migrate deploy
```

#### Option B: Using Prisma Push (Faster for initial setup)

```bash
# 1. Set the production database URL locally (temporarily)
export PRISMA_DATABASE_URL="your_production_connection_string"

# 2. Push schema directly (creates tables)
pnpm prisma db push
```

**⚠️ Important:** Use `db push` only for initial setup. For future changes, always use migrations.

### 4. Verify Build Configuration

The build process is already configured to generate Prisma Client automatically:

- **`postinstall` script**: Runs `prisma generate` after `pnpm install`
- **`build` script**: Runs `prisma generate && next build`

This means:
- ✅ Prisma Client will be generated automatically during Vercel builds
- ✅ No manual steps needed during deployment
- ✅ Database migrations need to be run separately (see below)

## Deployment Process

### First Deployment

1. **Set environment variables** in Vercel (as shown above)
2. **Run initial database setup** (Option A or B above)
3. **Deploy to Vercel** - the build will automatically:
   - Install dependencies (`pnpm install`)
   - Generate Prisma Client (`postinstall` hook)
   - Build Next.js app (`build` script)

### Future Deployments

When you make schema changes:

1. **Create migration locally:**
   ```bash
   # Using your local .env.local
   pnpm db:migrate
   ```

2. **Apply migration to production:**
   ```bash
   # Set production URL temporarily
   export PRISMA_DATABASE_URL="your_production_connection_string"
   
   # Deploy migration
   pnpm prisma migrate deploy
   ```

3. **Deploy code to Vercel** - the build will handle Prisma Client generation automatically

## Vercel Build Configuration

Your `package.json` is already configured correctly:

```json
{
  "scripts": {
    "postinstall": "prisma generate",  // Runs after pnpm install
    "build": "prisma generate && next build"  // Ensures Prisma Client exists before build
  }
}
```

**Vercel will automatically:**
1. Run `pnpm install` → triggers `postinstall` → generates Prisma Client
2. Run `pnpm build` → generates Prisma Client again (safety) → builds Next.js

## Environment Variables Checklist

Make sure these are set in Vercel:

- ✅ `PRISMA_DATABASE_URL` - Database connection string
- ✅ `DISCOGS_CONSUMER_KEY` - Your Discogs API key
- ✅ `DISCOGS_CONSUMER_SECRET` - Your Discogs API secret
- ✅ `DISCOGS_CALLBACK_URL` - Production callback URL
- ✅ `NEXT_PUBLIC_SITE_URL` - Your production domain

## Troubleshooting

### Error: "Prisma Client not generated"

**Solution:** The `postinstall` hook should handle this automatically. If it fails:
1. Check that `prisma` is in `devDependencies` (it is)
2. Verify `PRISMA_DATABASE_URL` is set in Vercel
3. Check Vercel build logs for errors

### Error: "Can't reach database"

**Solution:**
1. Verify `PRISMA_DATABASE_URL` is correct in Vercel
2. Check database is running in Vercel dashboard
3. Ensure connection string includes all required parameters

### Error: "Table does not exist"

**Solution:** You need to run migrations:
```bash
export PRISMA_DATABASE_URL="your_production_url"
pnpm prisma migrate deploy
```

### Schema Changes Not Reflecting

**Solution:**
1. Create migration: `pnpm db:migrate` (locally)
2. Deploy migration: `pnpm prisma migrate deploy` (with production URL)
3. Redeploy application on Vercel

## Migration Workflow

### Making Schema Changes

1. **Update `prisma/schema.prisma`** with your changes

2. **Create migration locally:**
   ```bash
   pnpm db:migrate
   # This creates a new migration file in prisma/migrations/
   ```

3. **Test migration locally:**
   ```bash
   # Should work with your local database
   ```

4. **Apply to production:**
   ```bash
   export PRISMA_DATABASE_URL="your_production_url"
   pnpm prisma migrate deploy
   ```

5. **Commit and push:**
   ```bash
   git add prisma/
   git commit -m "Add migration: description"
   git push
   ```

6. **Vercel will automatically:**
   - Install dependencies
   - Generate Prisma Client
   - Build and deploy

## Alternative: Using Vercel's DATABASE_URL

If Vercel automatically provides `DATABASE_URL`, you can update your schema:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  // Changed from PRISMA_DATABASE_URL
}
```

Then you only need to set `DATABASE_URL` in Vercel (it may be set automatically).

## Production Checklist

Before going live:

- [ ] Database created in Vercel
- [ ] `PRISMA_DATABASE_URL` (or `DATABASE_URL`) set in Vercel
- [ ] Initial schema pushed/migrated to production database
- [ ] All other environment variables set
- [ ] Build succeeds on Vercel
- [ ] Test authentication flow
- [ ] Test crate creation
- [ ] Test adding releases to crates
- [ ] Verify database queries work

## Quick Reference

```bash
# Generate Prisma Client (automatic in build)
pnpm db:generate

# Push schema (initial setup only)
PRISMA_DATABASE_URL=prod_url pnpm prisma db push

# Create migration (for schema changes)
pnpm db:migrate

# Apply migrations to production
PRISMA_DATABASE_URL=prod_url pnpm prisma migrate deploy

# Open Prisma Studio (for database inspection)
PRISMA_DATABASE_URL=prod_url pnpm prisma studio
```


# Testing OG Image Generation

## Quick Test Methods

### 1. Direct URL Access (Easiest)

Start your dev server:
```bash
npm run dev
```

Then visit:
```
http://localhost:6767/crate/[CRATE_ID]/opengraph-image
```

Replace `[CRATE_ID]` with a public crate ID.

### 2. Finding a Public Crate ID

**Option A: From Database**
```bash
# Connect to your database and run:
SELECT id, name, username, private FROM "Crate" WHERE private = false LIMIT 1;
```

**Option B: From Browser**
1. Log into your app
2. Make a crate public (uncheck "Make shareable" or set it to public)
3. Visit the public crate page: `http://localhost:6767/crate/[id]`
4. Copy the crate ID from the URL
5. Visit: `http://localhost:6767/crate/[id]/opengraph-image`

**Option C: Create a Test Crate**
1. Create a new crate in the app
2. Add some releases to it
3. Make it public
4. Use that crate ID

### 3. Online OG Image Validators

After deploying or using a tunnel (like ngrok), test with:

- **Open Graph Preview**: https://www.opengraph.xyz/
- **Twitter Card Validator**: https://cards-dev.twitter.com/validator
- **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
- **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/

### 4. Check Metadata in Page Source

Visit the crate page and check the `<head>` section:
```html
<meta property="og:image" content="/crate/[id]/opengraph-image" />
```

### 5. Test Edge Cases

- **Non-existent crate**: `http://localhost:6767/crate/invalid-id/opengraph-image`
- **Private crate**: Should return 404 or default image
- **Empty crate**: Should show "Empty crate" message
- **Crate with many releases**: Should show mosaic of up to 20 releases

### 6. Using curl

```bash
# Test the OG image endpoint
curl -I http://localhost:6767/crate/[CRATE_ID]/opengraph-image

# Should return:
# Content-Type: image/png
# Status: 200
```

### 7. Browser DevTools

1. Open DevTools → Network tab
2. Visit the crate page
3. Look for requests to `/crate/[id]/opengraph-image`
4. Check the response headers and image

### Troubleshooting

- **Image not loading**: Check console for errors, ensure Prisma connection works
- **Wrong image**: Clear browser cache or add `?v=1` to URL
- **Slow generation**: First request may be slow, subsequent requests are cached
- **Edge runtime errors**: Make sure `runtime = "nodejs"` (Prisma requires Node.js runtime)

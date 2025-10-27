# Quick Manual Steps to Disable Production Deployments

**Time Required**: ~2 minutes total

## Instructions

Open these 4 links in your browser (Ctrl+Click to open all at once):

1. https://vercel.com/chris-projects-de6cd1bf/cortiware-tenant-app/settings/git
2. https://vercel.com/chris-projects-de6cd1bf/cortiware-provider-portal/settings/git
3. https://vercel.com/chris-projects-de6cd1bf/cortiware-marketing-cortiware/settings/git
4. https://vercel.com/chris-projects-de6cd1bf/cortiware-marketing-robinson/settings/git

For each tab:
1. Find **"Production Branch"** (should show "main" currently)
2. Click the input field
3. Type: `production-ready`
4. Click **Save**

That's it! After this, all pushes to `main` will create Preview deployments only.

## Verification

After completing the above, test with:

```bash
# Make an empty commit
git commit --allow-empty -m "Test: verify preview-only deployment"
git push origin main

# Check Vercel - should see Preview deployment, NOT Production
npx vercel ls
```

You should see "Preview" in the Environment column, not "Production".

## Done! ✅

Your production environment is now protected. Only pushes to the `production-ready` branch (which doesn't exist yet) will trigger production deployments.

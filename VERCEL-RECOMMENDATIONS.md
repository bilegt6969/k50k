# Vercel deployment recommendations

Enable these in **Vercel → Project → Settings → Deployment** (or **General**):

1. **Build Multiple Deployments Simultaneously** – Turn on *On-Demand Concurrent Builds* so builds don’t wait in queue.
2. **Faster builds** – Under *Build Machine*, switch to a larger machine (e.g. Enhanced) for ~40% faster builds.
3. **Prevent Frontend–Backend Mismatches** – Turn on *Skew Protection* so client and server stay in sync and avoid deployment conflicts.

**Node.js** is set to `22.x` in `package.json` `engines` so Vercel uses a supported version and the version warning goes away.

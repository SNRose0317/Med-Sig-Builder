# CRITICAL: Node Version Compatibility Issue

## Problem
This project **DOES NOT WORK** with Node v23 due to fundamental incompatibilities between Node v23 and Vite 5.x. The dev server will appear to start but will refuse all connections.

## Solution
You MUST use Node v20 LTS or earlier. Node v23 introduced breaking changes to network binding that prevent Vite from working correctly.

### Install Node Version Manager (nvm)
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

### Switch to Node LTS
```bash
nvm install 20
nvm use 20
nvm alias default 20
```

### Verify
```bash
node --version  # Should show v20.x.x
```

## Technical Details
- Node v23 changed IPv6 socket binding behavior
- Vite 5.x is not compatible with these changes
- The server reports "ready" but never actually binds to the port
- This is a known issue affecting all Vite projects on Node v23

## References
- https://github.com/vitejs/vite/issues/[pending]
- Node v23 breaking changes in net.Server IPv6 handling
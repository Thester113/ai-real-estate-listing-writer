# Claude-Mem Worker Fix

## Problem
The `claude-mem` plugin worker sometimes fails to start with the error:
```
Error: Worker did not become ready within 5 seconds. (port 37777)
```

## Root Cause
This happens when:
1. Old worker processes don't shut down cleanly
2. Port 37777 is still bound by a stale process
3. Database locks prevent quick initialization
4. The vector database (chroma-mcp) takes too long to start

## Permanent Solution

A fix script has been installed at: `~/.local/bin/claude-mem-fix`

### Quick Usage

Run the fix script anytime you see the error:
```bash
claude-mem-fix
```

Or use the shell alias:
```bash
cmfix
```

### What It Does

1. **Cleanup** - Stops all claude-mem processes gracefully, then force-kills any stragglers
2. **Port Check** - Ensures port 37777 is free
3. **Restart** - Restarts the worker service cleanly
4. **Verification** - Confirms the worker started successfully

### Force Mode

If you continue to have issues, use force mode to check/rebuild the database:
```bash
claude-mem-fix --force
```

This will:
- Check database integrity
- Backup and rebuild if corrupted
- Clean up WAL/SHM files

### Prevention

The script has been aliased in your `~/.zshrc` as `cmfix`.

If you exit Claude Code and see this error again:
1. Simply run: `cmfix`
2. Wait 5-10 seconds
3. Restart Claude Code

### Manual Troubleshooting

If the script doesn't work, you can manually:

1. **Check what's using port 37777:**
   ```bash
   lsof -i :37777
   ```

2. **Kill the process:**
   ```bash
   kill -9 <PID>
   ```

3. **Restart claude-mem:**
   ```bash
   claude-mem restart
   ```

4. **Verify status:**
   ```bash
   claude-mem status
   ```

### Logs Location

Check logs if issues persist:
```bash
tail -f ~/.claude-mem/logs/worker-$(date +%Y-%m-%d).log
tail -f ~/.claude-mem/logs/claude-mem-$(date +%Y-%m-%d).log
```

## Implementation Details

**Script Location:** `~/.local/bin/claude-mem-fix`
**Shell Alias:** `cmfix` (in `~/.zshrc`)
**Worker Port:** 37777
**Data Directory:** `~/.claude-mem/`

---

*Created: 2025-12-28*
*Status: ✅ Tested and working*

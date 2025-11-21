# 🔧 GitHub Pages Video Fix

## Issue
Videos work locally but not on GitHub Pages.

## Common Causes & Solutions

### 1. ✅ Autoplay Policy (MOST COMMON)
**Problem:** Browsers block autoplay on HTTPS (GitHub Pages) without user interaction.

**Solution:** 
- Videos must be `muted` for autoplay to work
- Updated `app.js` with better autoplay handling
- Fallback: Click video to play manually if autoplay fails

### 2. ✅ Video Attributes
**Updated HTML with:**
- `muted` - Required for autoplay on HTTPS
- `playsinline` - Required for iOS Safari
- `preload="metadata"` - Loads faster, better for GitHub Pages

### 3. 🔍 File Path Case Sensitivity
**Problem:** GitHub Pages servers (Linux) are case-sensitive, Windows is not.

**Check:**
- Folder is `video/` (lowercase) ✅
- File is `seat_normal.mp4` (lowercase) ✅
- HTML uses `video/seat_normal.mp4` (lowercase) ✅

### 4. 📦 Video File Size
**Current:** 1.36 MB - This is fine for GitHub Pages ✅

**If issues persist:**
- Compress video using HandBrake or FFmpeg
- Target: < 1 MB for faster loading
- Use H.264 codec with AAC audio

### 5. 🌐 Browser Console Check
**On GitHub Pages, press F12 and check for errors:**

```
✓ Video playing successfully!          ← Good!
⚠️ Autoplay blocked                    ← Click video to play
❌ Failed to load resource: 404         ← File path wrong
❌ CORS policy error                    ← Fixed with crossorigin
```

## Testing Your Deployment

1. **Push changes to GitHub:**
   ```bash
   git add .
   git commit -m "Fix video autoplay for GitHub Pages"
   git push origin feature/CV_examples
   ```

2. **Wait 1-2 minutes for GitHub Pages to rebuild**

3. **Test on GitHub Pages:**
   - Open your GitHub Pages URL
   - Go to CV Detection tab
   - Click "Start Detection"
   - Check browser console (F12)

4. **If video doesn't autoplay:**
   - Check console for errors
   - Try clicking the video manually
   - Verify video URL in Network tab (F12 → Network)

## Video Codec Requirements

**Recommended settings for web compatibility:**
```
Format: MP4
Video Codec: H.264 (AVC)
Audio Codec: AAC (or remove audio)
Resolution: 720p or lower
Bitrate: 1-2 Mbps
Frame Rate: 24-30 fps
```

**Convert video using FFmpeg:**
```bash
ffmpeg -i input.mp4 -c:v libx264 -preset slow -crf 22 -c:a aac -b:a 128k -vf scale=1280:720 output.mp4
```

## Still Not Working?

### Check these:

1. **Video file exists on GitHub:**
   - Go to your repo: `https://github.com/YOUR_USERNAME/YOUR_REPO`
   - Navigate to `video/seat_normal.mp4`
   - Can you see it? If not, commit and push it.

2. **GitHub Pages is enabled:**
   - Repo Settings → Pages
   - Source: Deploy from branch
   - Branch: `feature/CV_examples` or `main`
   - Folder: `/ (root)`

3. **Clear browser cache:**
   - Press `Ctrl + Shift + Delete`
   - Clear cached images and files
   - Hard refresh: `Ctrl + F5`

4. **Try different browser:**
   - Chrome (best support)
   - Firefox
   - Safari (iOS needs `playsinline`)
   - Edge

5. **Check Network tab:**
   - F12 → Network tab
   - Start Detection
   - Look for `seat_normal.mp4`
   - Status should be `200 OK` not `404 Not Found`

## Quick Fixes Applied

✅ Changed `preload="auto"` to `preload="metadata"` 
✅ Enhanced autoplay error handling in JavaScript
✅ Added click-to-play fallback
✅ Ensured video is fully muted for autoplay
✅ Removed `crossorigin` to fix local testing

## Need More Help?

**Share this info:**
1. Your GitHub Pages URL
2. Browser console errors (F12)
3. Screenshot of what you see
4. Which browser/OS you're using


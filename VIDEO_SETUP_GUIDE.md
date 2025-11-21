# 📹 Video Setup Guide

## Current Status
✅ Seat 5 has a working video (`video/seat_normal.mp4`)
✅ All cartoon characters have been removed
✅ Placeholder seats are ready for your AI-generated videos
✅ Videos are organized in the `video/` folder

## How to Add More Videos

### Step 1: Prepare Your Video Files
Place your AI-generated video files in the `video/` folder. 

**Recommended video specifications:**
- Format: MP4 (H.264 codec)
- Resolution: 720p or 1080p
- Duration: Short loops (2-10 seconds work best)
- File naming: `seat_normal_1.mp4`, `seat_hogging_1.mp4`, etc.

### Step 2: Add Video to a Seat

To replace a placeholder with a video, find the seat in `index.html` and replace:

**FROM (Placeholder):**
```html
<!-- Seat 1: Video Placeholder - Normal -->
<div class="seat-demo seat-normal seat-placeholder" data-seat="1">
    <div class="placeholder-text">Seat 1<br>Normal Use</div>
    <div class="detection-badge normal">
        <span>✓</span>
    </div>
</div>
```

**TO (Video):**
```html
<!-- Seat 1: Normal Use - VIDEO -->
<div class="seat-demo seat-normal has-video" data-seat="1">
    <video autoplay loop muted playsinline preload="auto">
        <source src="video/your_video_file.mp4" type="video/mp4">
        Your browser does not support the video tag.
    </video>
    <div class="detection-badge normal">
        <span>✓</span>
    </div>
</div>
```

### Step 3: Important Changes
1. Remove the `seat-placeholder` class
2. Add the `has-video` class
3. Remove the `<div class="placeholder-text">` element
4. Add the `<video>` element with your video file name

### Example: Adding 3 More Videos

If you have these video files in the `video/` folder:
- `video/seat_normal_2.mp4` → Add to Seat 1
- `video/seat_hogging_1.mp4` → Add to Seat 2
- `video/seat_normal_3.mp4` → Add to Seat 3

Just replace the placeholder divs with the video structure shown above, making sure to use `video/filename.mp4` as the source path.

## Folder Structure

```
EMIA2020_final_project/
├── video/                    ← Put all videos here
│   ├── seat_normal.mp4      ← Current video
│   ├── seat_normal_2.mp4    ← Add more videos here
│   └── seat_hogging_1.mp4   ← Organize by type
├── index.html
├── app.js
├── styles.css
└── VIDEO_SETUP_GUIDE.md
```

## Testing Your Videos

1. **Test in the Main App:**
   - Open `index.html`
   - Go to "CV Detection" tab
   - Click "Start Detection"
   - Your videos should appear and play automatically

## Troubleshooting

**Video shows black screen:**
- Check browser console (F12) for error messages
- Make sure the video file is in the `video/` folder
- Verify the path is `video/filename.mp4` in your HTML
- Verify video codec is H.264 (use VLC or FFmpeg to check)

**Video doesn't play:**
- Some browsers block autoplay with sound
- Make sure `muted` attribute is present
- Check if video file is corrupted

**Video looks stretched/squashed:**
- CSS uses `object-fit: contain` to maintain aspect ratio
- If you want to fill the entire space, change `contain` to `cover` in `styles.css`

## Quick Reference: Seat Layout

Current 3x3 grid:
```
[Seat 1] [Seat 2] [Seat 3]
[Seat 4] [Seat 5] [Seat 6]
[Seat 7] [Seat 8] [Seat 9]
```

- Seat 5: ✅ Has video (video/seat_normal.mp4)
- All others: Placeholders ready for videos

## Adding Your Next Video

1. Copy your video to the `video/` folder
2. Open `index.html`
3. Find the seat you want to replace (e.g., Seat 1)
4. Replace its HTML with the video structure
5. Change `src="video/your_video_name.mp4"`
6. Refresh your browser!

## Need Help?

Open browser console (F12) and check for error messages. The JavaScript will log helpful debugging information about video loading.


# 📱 Responsive Design Guide

## Overview
The HKUST Library Seat Tracker is fully responsive and works seamlessly across all devices:
- 🖥️ Desktop (1920px+)
- 💻 Laptop (1024px - 1920px)
- 📱 Tablet (768px - 1024px)
- 📱 Mobile Landscape (481px - 768px)
- 📱 Mobile Portrait (320px - 480px)

## Breakpoints

### Desktop (Default)
**1024px+**
- Full 3×3 video grid
- All features visible
- Side-by-side layout

### Tablet
**768px - 1024px**
- 3×3 video grid (slightly smaller)
- Adjusted spacing
- Touch-optimized buttons

### Mobile Landscape
**481px - 768px**
- **2×5 video grid** (2 columns)
- Stacked header
- Full-width filters
- Vertical navigation

### Mobile Portrait
**320px - 480px**
- **1×9 video grid** (single column)
- Compact header
- Smaller badges
- Touch-friendly sizing

## Responsive Features

### 📊 Dashboard Tab
- **Desktop:** Multi-column grid
- **Mobile:** 2-column grid
- Auto-adjusting seat cards

### 📹 CV Detection Tab
- **Desktop:** 3×3 video grid
- **Tablet:** 3×3 video grid (scaled)
- **Mobile Landscape:** 2×5 grid
- **Mobile Portrait:** 1×9 grid (scrollable)

### 📈 Analytics Tab
- **Desktop:** 2×2 chart grid
- **Mobile:** Single column, stacked charts

## Mobile-Specific Optimizations

### Touch Interactions
```css
/* Hover disabled on touch devices */
@media (hover: none) and (pointer: coarse) {
    .seat:active {
        transform: scale(0.95);
    }
}
```

### Video Grid Adaptations
- **Desktop:** 3×3 grid, 120px min height
- **Mobile Landscape:** 2×5 grid, 90px min height
- **Mobile Portrait:** 1×9 grid, 150px min height

### Font Scaling
- **Desktop:** 32px headers
- **Tablet:** 28px headers
- **Mobile:** 20px-24px headers
- **Small Mobile:** 18px-20px headers

### Navigation
- **Desktop:** Horizontal tabs with icons and text
- **Mobile:** Scrollable horizontal tabs
- **Compact:** Icons with smaller text

## Testing on Different Devices

### Chrome DevTools
1. Press `F12`
2. Click device toolbar icon (📱)
3. Select device:
   - iPhone SE (375×667)
   - iPhone 12 Pro (390×844)
   - iPad (768×1024)
   - iPad Pro (1024×1366)

### Responsive Testing Checklist

#### Desktop (1920×1080)
- [ ] All 9 videos visible in 3×3 grid
- [ ] Header stats displayed horizontally
- [ ] All navigation items fit in one row
- [ ] Charts displayed 2×2

#### Tablet (768×1024)
- [ ] Videos maintain 3×3 grid
- [ ] Header remains readable
- [ ] Touch targets are adequate (44px+)
- [ ] No horizontal scrolling

#### Mobile Landscape (568×320 - iPhone SE)
- [ ] Videos display in 2×5 grid
- [ ] Navigation scrollable if needed
- [ ] Filters stack vertically
- [ ] All content accessible

#### Mobile Portrait (375×667 - iPhone SE)
- [ ] Videos display in 1×9 grid (scrollable)
- [ ] Header stats visible
- [ ] Buttons full-width
- [ ] Touch-friendly spacing

## Browser Support

### Desktop Browsers
✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+

### Mobile Browsers
✅ Chrome Mobile
✅ Safari iOS 14+
✅ Firefox Mobile
✅ Samsung Internet

## Performance Tips

### Video Loading on Mobile
```html
<!-- Use metadata preload for faster loading -->
<video preload="metadata">
```

### Lazy Loading (Optional)
For many videos, consider lazy loading:
```html
<video loading="lazy">
```

### Reduce Video Size for Mobile
```bash
# Optimize for mobile (smaller resolution)
ffmpeg -i input.mp4 -vf scale=640:1138 -c:v libx264 -crf 28 mobile.mp4
```

## Common Issues & Solutions

### Issue: Videos Too Small on Mobile
**Solution:** Adjust min-height in media queries
```css
@media (max-width: 480px) {
    .seat-demo {
        min-height: 150px; /* Increase this */
    }
}
```

### Issue: Horizontal Scrolling on Mobile
**Solution:** Check for fixed widths
```css
/* Use 100% width, not fixed pixels */
.element {
    width: 100%;
    max-width: 100%;
}
```

### Issue: Text Too Small on Mobile
**Solution:** Adjust font-size in media queries
```css
@media (max-width: 480px) {
    body {
        font-size: 14px; /* Base font size */
    }
}
```

### Issue: Touch Targets Too Small
**Solution:** Minimum 44×44px for touch
```css
.button {
    min-width: 44px;
    min-height: 44px;
}
```

## Viewport Meta Tag

**Critical for mobile support:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

✅ Already included in `index.html`

## CSS Grid Behavior

### Desktop (3×3)
```css
grid-template-columns: repeat(3, 1fr);
grid-template-rows: repeat(3, minmax(120px, 1fr));
```

### Mobile Landscape (2×5)
```css
@media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(5, minmax(90px, 1fr));
}
```

### Mobile Portrait (1×9)
```css
@media (max-width: 480px) {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(9, minmax(150px, 1fr));
}
```

## GitHub Pages Mobile Testing

1. **Deploy to GitHub Pages**
   ```bash
   git push origin feature/CV_examples
   ```

2. **Test on Real Device**
   - Open GitHub Pages URL on phone
   - Test all tabs and features
   - Check video playback
   - Verify touch interactions

3. **Use Chrome Remote Debugging**
   - Connect phone via USB
   - Open `chrome://inspect` on desktop
   - Debug mobile view in real-time

## Future Enhancements

### Potential Mobile Improvements
- [ ] Swipe gestures for navigation
- [ ] Pull-to-refresh for seat updates
- [ ] Native app feel with PWA
- [ ] Offline mode support
- [ ] Mobile notifications

### Performance Optimizations
- [ ] Lazy load off-screen videos
- [ ] Compress videos further for mobile
- [ ] Use WebP for thumbnails
- [ ] Implement virtual scrolling

## Accessibility

### Mobile Accessibility Features
✅ Touch targets ≥ 44px
✅ Readable font sizes (16px+ base)
✅ High contrast colors
✅ No horizontal scrolling
✅ Keyboard navigation support

### Screen Reader Support
- All videos have alt text fallback
- Buttons have descriptive labels
- Proper heading hierarchy
- ARIA labels on interactive elements

## Summary

Your app now fully supports:
- ✅ Desktop & laptop screens
- ✅ iPad & tablets
- ✅ iPhones & Android phones
- ✅ Landscape & portrait modes
- ✅ Touch interactions
- ✅ Responsive video grid
- ✅ Mobile-optimized UI

**Test it now:** Resize your browser window or open on your phone! 📱


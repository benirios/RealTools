# Weather Dashboard 🌤️

A professional weather monitoring dashboard built with HTML, CSS, and JavaScript featuring real-time mock data and responsive design.

## Features

### 🎨 **Optimized 2x2 Grid Layout**
- Temperature Widget (top-left)
- Humidity Widget (top-right) 
- Air Quality Widget (bottom-left)
- News Carousel Widget (bottom-right)
- Quick Stats Footer (Wind, Pressure, UV Index)

### 🌡️ **Temperature Widget**
- Large 2.4rem display
- 7-day trend chart
- Max/Min temperature details
- Real-time mock data updates

### 💧 **Humidity Widget**
- Circular progress indicator (100px)
- Humidity range (Low/High)
- Status description
- Real-time updates every 5 seconds

### 🌬️ **Air Quality Widget**
- AQI score with circular indicator
- Color-coded status (Good/Moderate/Poor)
- Pollutant breakdown (PM2.5, PM10, O₃)
- Visual progress bars

### 📰 **News Carousel**
- 4 rotating news articles
- Auto-rotation every 6 seconds
- Manual navigation buttons (❮ ❯)
- Dot indicators with jump-to feature
- Smooth fade transitions

### ⚡ **Design Optimizations**
- **Zero dead space**: 3px grid gaps, 8px widget padding
- **Bold typography**: Font-weight 700-800 for hierarchy
- **Responsive**: Adapts to all screen sizes
- **No scrolling**: Fits perfectly in viewport
- **Professional colors**: Darker blue (#003d99) header
- **Subtle shadows**: 0 2px 6px for depth

## Installation

```bash
cd "/Users/beni/Dev/InfoLora/A"
python3 -m http.server 8000
# or
npm install -g http-server
http-server
```

Then open: **http://localhost:8000**

## File Structure

- `index.html` - Main structure with semantic HTML
- `styles.css` - Professional CSS with grid layout optimization
- `script.js` - Real-time updates and carousel functionality
- `README.md` - Documentation

## Technologies

- HTML5 Semantic Structure
- CSS Grid & Flexbox
- Vanilla JavaScript (ES6+)
- Mock Data API (simulated)

## Responsive Breakpoints

- **Desktop (1400px+)**: 2x2 grid
- **Tablet (768px-1400px)**: 2-column layout
- **Mobile (<768px)**: Single column

## Real-Time Features

✅ Temperature varies ±2°C every 30s  
✅ Humidity varies ±3% every 25s  
✅ Timestamp updates every minute  
✅ News rotates every 6 seconds  
✅ Smooth transitions and animations  

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers

## Performance

- Zero dependencies
- Lightweight CSS (no frameworks)
- Optimized scrollbars (4px custom)
- Fast transitions (0.2s)

---

**Version**: 2.0 (Optimized)  
**Last Updated**: April 27, 2026  
**Author**: Benirios

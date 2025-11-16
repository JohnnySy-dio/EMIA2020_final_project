# HKUST Library Seat Tracker - Design Thinking Prototype

A prototype demonstration for solving seating space shortage in HKUST library through smart seat management and computer vision detection.

## 🎯 Project Overview

This is a design thinking project prototype that addresses the seating space shortage problem in HKUST library. The application demonstrates two key features:

1. **Real-Time Seat Tracking**: Track the status of each seat across campus floors and display availability in real-time
2. **Computer Vision Detection**: Use computer vision techniques to detect seat hogging behavior automatically

## ✨ Features

### 1. Seat Dashboard
- **Real-time seat status visualization** with color-coded indicators
- **Multi-floor and zone filtering** (Ground, 1st, 2nd, 3rd floors)
- **Zone-based filtering** (Quiet Zone, Group Study, Computer Area)
- **Live statistics** showing available, occupied, and seat hogging counts
- **Interactive seat grid** with hover effects and animations
- **Automatic status updates** every 3 seconds

### 2. Computer Vision Detection
- **Mock camera feed interface** simulating live monitoring
- **Real-time detection boxes** highlighting seats with hogging behavior
- **Detection results panel** showing detailed information about flagged seats
- **CV statistics dashboard** with detection metrics
- **Animated detection overlays** with visual feedback

### 3. Analytics Dashboard
- **24-hour occupancy rate chart** showing usage patterns
- **Seat status distribution** (pie chart)
- **Peak hours analysis** identifying busy times
- **Seat hogging trend** over the week
- **Daily summary statistics**

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No additional installation required - runs entirely in the browser

### Running the Prototype

1. **Clone or download** this repository
2. **Open `index.html`** in your web browser
   - You can simply double-click the file, or
   - Use a local web server (optional but recommended):
     ```bash
     # Using Python 3
     python -m http.server 8000
     
     # Using Node.js (if you have http-server installed)
     npx http-server
     ```
3. **Navigate to** `http://localhost:8000` (if using a server) or open the file directly

## 📱 Usage Guide

### Seat Dashboard Tab
- View all seats in a grid layout with color-coded status
- Use the **floor filter** to view specific floors
- Use the **zone filter** to filter by study area type
- Click on any seat to see detailed information
- Watch seats update in real-time as statuses change

### Computer Vision Detection Tab
1. Click **"Start Detection"** to begin monitoring
2. Watch the camera feed show detection boxes for seats with hogging behavior
3. View detailed detection results in the panel below
4. Monitor CV statistics in the cards at the bottom

### Analytics Tab
- View comprehensive charts and graphs
- Analyze occupancy patterns and trends
- Review daily summary statistics

## 🎨 Design Features

- **Modern UI/UX**: Clean, professional interface with gradient backgrounds
- **Smooth Animations**: Transitions, hover effects, and pulse animations
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Color-Coded Status**: 
  - 🟢 Green = Available
  - 🟡 Yellow = Occupied
  - 🔴 Red = Seat Hogging (with pulse animation)
  - ⚫ Gray = Reserved

## 🔧 Technical Details

### Technologies Used
- **HTML5** for structure
- **CSS3** for styling (with CSS Grid, Flexbox, animations)
- **Vanilla JavaScript** for interactivity
- **Chart.js** (CDN) for data visualization

### Mock Data
- The prototype uses simulated data that updates automatically
- Seats are randomly distributed across 4 floors and 3 zones
- Status changes are simulated to demonstrate real-time behavior
- Computer vision detections are simulated with random positioning

## 📊 Key Metrics Displayed

- Total available seats
- Total occupied seats
- Seat hogging incidents
- Detection accuracy (simulated)
- Average detection time
- Occupancy rates
- Peak usage hours

## 🎯 Design Thinking Approach

This prototype demonstrates:
1. **Empathy**: Understanding the pain point of students unable to find seats
2. **Define**: Clear problem statement - seat shortage and hogging
3. **Ideate**: Two-pronged solution - tracking + detection
4. **Prototype**: Interactive demonstration of the concept
5. **Test**: Visual representation ready for user feedback

## 📝 Notes

- This is a **prototype/demonstration** only
- No actual computer vision implementation - uses mock detection
- No backend server - all data is simulated in the browser
- Designed for presentation and user testing purposes

## 🔮 Future Enhancements (Not in Prototype)

- Real camera integration
- Machine learning model for detection
- Mobile app version
- Push notifications for available seats
- Reservation system
- User accounts and preferences

## 📄 License

This is a design thinking project prototype for educational purposes.

---

**Developed for EMIA2020 Final Project - Design Thinking**

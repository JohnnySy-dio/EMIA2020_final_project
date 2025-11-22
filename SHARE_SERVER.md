# How to Share Your Local Server with Peers

## Option 1: Python HTTP Server (Recommended)

### Step 1: Start the Server
Open a terminal/command prompt in your project directory and run:

```bash
# Python 3 (Windows/Mac/Linux)
python -m http.server 8000

# Or if you have both Python 2 and 3:
python3 -m http.server 8000
```

### Step 2: Find Your IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually starts with 192.168.x.x or 10.x.x.x)

**Mac/Linux:**
```bash
ifconfig
# or
ip addr show
```

### Step 3: Share the URL
Give your peer this URL:
```
http://YOUR_IP_ADDRESS:8000
```

For example: `http://192.168.1.100:8000`

### Step 4: Firewall Configuration
If your peer can't access, you may need to allow the port through your firewall:

**Windows:**
1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" and enter port `8000`
6. Allow the connection
7. Apply to all profiles

**Mac:**
1. System Preferences → Security & Privacy → Firewall
2. Click "Firewall Options"
3. Click "+" and add Python or allow incoming connections

---

## Option 2: Node.js http-server

If you have Node.js installed:

```bash
# Install globally (one time)
npm install -g http-server

# Run the server
http-server -p 8000 --host 0.0.0.0
```

The `--host 0.0.0.0` makes it accessible from other devices on your network.

---

## Option 3: Using ngrok (For External Access)

If your peer is on a different network, use ngrok:

### Step 1: Install ngrok
Download from: https://ngrok.com/download

### Step 2: Start your local server
```bash
python -m http.server 8000
```

### Step 3: In another terminal, start ngrok
```bash
ngrok http 8000
```

### Step 4: Share the ngrok URL
ngrok will give you a public URL like:
```
https://abc123.ngrok.io
```

Share this URL with your peer - it works from anywhere!

**Note:** Free ngrok URLs change each time you restart. For a permanent URL, you need a paid plan.

---

## Option 4: VS Code Live Server Extension

If you use VS Code:

1. Install the "Live Server" extension
2. Right-click on `index.html`
3. Select "Open with Live Server"
4. The extension will show your local IP in the status bar
5. Share that URL with your peer

---

## Quick Test

To verify your server is accessible:

1. Start your server
2. On the same computer, open: `http://localhost:8000`
3. On another device on the same network, open: `http://YOUR_IP:8000`

---

## Troubleshooting

### Peer can't connect?
- ✅ Make sure both devices are on the same Wi-Fi network
- ✅ Check your firewall settings
- ✅ Verify the IP address is correct
- ✅ Make sure the server is still running
- ✅ Try disabling VPN if active

### Port already in use?
Use a different port:
```bash
python -m http.server 8080
```

### Security Note
⚠️ Only share with trusted peers on your local network. For public sharing, use ngrok or deploy to GitHub Pages.

---

## Recommended for Your Project

Since this is a static HTML/CSS/JS project, **Option 1 (Python HTTP Server)** is the simplest and most reliable method.


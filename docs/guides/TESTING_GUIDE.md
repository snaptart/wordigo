# Testing Wordigo Mobile App on Your Phone

## Current Status

✅ **Backend Server**: Running on http://192.168.50.17:3000
✅ **Expo Server**: Starting up...
✅ **API URL**: Configured to http://192.168.50.17:3000/api

---

## How to Test on Your Phone

### Step 1: Install Expo Go App
Download from your app store:
- **iOS**: [Expo Go on App Store](https://apps.apple.com/app/expo-go/id982107779)
- **Android**: [Expo Go on Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Step 2: Connect to Same WiFi
Make sure your phone is on the **same WiFi network** as your computer:
- Your computer IP: **192.168.50.17**
- Network: Should be the same router

### Step 3: Open Expo Server
The Expo development server is running in the background. To see the QR code and controls:

1. Open your browser and go to: **http://localhost:8081**
2. OR check the command prompt window where Expo is running

### Step 4: Scan QR Code
- **iOS**: Open the **Camera** app and point it at the QR code
- **Android**: Open **Expo Go** app and tap "Scan QR Code"

### Step 5: Wait for App to Load
The app will download and bundle on first load (may take 1-2 minutes).

---

## What to Expect

When the app loads, you should see:

1. **A random word** displayed at the top
2. **Timer** counting down (25-75 seconds)
3. **Two definition buttons** (one correct, one wrong)
4. **Tap a definition** to answer
5. **Feedback** - Green = correct, Red = wrong
6. **Strike counter** appears if you answer wrong (X X X)
7. **Next word loads** automatically
8. **Game over** after 3 strikes

---

## Troubleshooting

### "Network Error" or "Cannot connect"
1. Make sure both devices are on same WiFi
2. Check your computer's firewall isn't blocking port 3000
3. Try accessing http://192.168.50.17:3000/health in your phone's browser
   - If this works, the backend is reachable
   - If not, check firewall settings

### "Expo Go crashed" or "App won't load"
1. Close and reopen Expo Go
2. Try scanning the QR code again
3. Check if Metro Bundler is running (should see logs)

### Want to see Expo controls:
```bash
cd wordigo-mobile
npx expo start
```
This will show you:
- QR code in terminal
- Link to open in browser
- Options to run on iOS/Android

---

## Testing Checklist

Try these features:

- [ ] App loads and shows a word
- [ ] Timer counts down and changes color (green → yellow → red)
- [ ] Can tap a definition to answer
- [ ] Correct answer shows green feedback
- [ ] Wrong answer shows red feedback + strike counter
- [ ] Next word loads after answering
- [ ] After 3 strikes, shows "X X X Game Over"
- [ ] Can start a new game after game over

---

## Current Servers Running

### Backend (Terminal 1):
```
🚀 Wordigo Backend Server
📡 Listening on port 3000
```

### Expo (Terminal 2):
```
Starting project at C:\Users\Dad\Documents\Web\wordigo\wordigo-mobile
Waiting on http://localhost:8081
```

Both are running in the background!

---

## Stopping Servers

If you need to stop:
```bash
# Find running processes
tasklist | findstr node

# Kill by PID
taskkill /PID <process_id> /F
```

---

## Next Steps After Testing

Once you've tested the MVP, we can add:
- **User accounts** (login/register)
- **Game history** (see past games)
- **Difficulty levels** (easy/medium/hard)
- **Daily challenges** (curated word sets)
- **Multiplayer** (head-to-head competition)

But for now, enjoy playing Wordigo! 🎮

---

## Quick Reference

**Your Computer IP**: 192.168.50.17
**Backend URL**: http://192.168.50.17:3000
**Expo DevTools**: http://localhost:8081
**API Health Check**: http://192.168.50.17:3000/health

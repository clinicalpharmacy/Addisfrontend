# 📱 Build Addis Clinical as Native Android App (with Screenshot Block)

This guide wraps your existing React web app into a native Android APK that
**completely blocks screenshots at the OS level** using `FLAG_SECURE`.

---

## Prerequisites (Install Once)

1. **Node.js** — https://nodejs.org (v18+)
2. **Java JDK 17** — https://adoptium.net
3. **Android Studio** — https://developer.android.com/studio
   - During install, also install: Android SDK, Android Virtual Device

---

## Step 1 — Install Capacitor in the project

Open a terminal in `Addisfrontend-old/` and run:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
```

---

## Step 2 — Build the web app

```bash
npm run build
```

This creates the `dist/` folder that Capacitor wraps.

---

## Step 3 — Initialize Capacitor (first time only)

```bash
npx cap init "Addis Clinical" "com.addis.clinicalpharmacy" --web-dir dist
```

---

## Step 4 — Add the Android platform

```bash
npx cap add android
```

This generates the `android/` folder.

---

## Step 5 — Apply FLAG_SECURE to MainActivity

**Copy the pre-made file:**

```bash
copy android-native\MainActivity.java android\app\src\main\java\com\addis\clinicalpharmacy\MainActivity.java
```

Or manually open `android/app/src/main/java/com/addis/clinicalpharmacy/MainActivity.java`
and replace its contents with the file in `android-native/MainActivity.java`.

---

## Step 6 — Sync web assets to Android

```bash
npx cap sync android
```

---

## Step 7 — Open in Android Studio and Run

```bash
npx cap open android
```

In Android Studio:
- Click **Run ▶** to install on a connected phone or emulator
- OR go to **Build → Build APK** to generate an installable `.apk` file

---

## ✅ What FLAG_SECURE blocks (after this setup)

| Method | Blocked? |
|---|---|
| Power + Volume Down (hardware) | ✅ YES — shows black screen |
| Screen recording apps | ✅ YES — records black frame |
| ADB `adb screencap` | ✅ YES — black image |
| Google Assistant screenshot | ✅ YES |
| Recent apps thumbnail | ✅ YES — shows black preview |
| Another phone photographing screen | ❌ NO (physical camera, impossible to block) |

---

## iOS (Optional)

For iOS, Capacitor uses `WKWebView` which automatically inherits system-level
screenshot protection when the phone's Screen Time or enterprise MDM policy
is applied. For custom protection add to `ios/App/App/AppDelegate.swift`:

```swift
// Add this to applicationDidBecomeActive
NotificationCenter.default.addObserver(
    self,
    selector: #selector(blockScreenRecording),
    name: UIScreen.capturedDidChangeNotification,
    object: nil
)

@objc func blockScreenRecording() {
    if UIScreen.main.isCaptured {
        window?.isHidden = true
    } else {
        window?.isHidden = false
    }
}
```

---

## Updating the app later

After changing the web app, just run:

```bash
npm run build
npx cap sync android
npx cap open android
```

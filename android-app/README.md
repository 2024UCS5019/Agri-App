# Agri-App Android Native Mobile Application (Java)

This is the native Android application for **Agri-App**, built with **Java** and modern Android components.

## Features
- **Pure Java Architecture** (`MainActivity.java`).
- **Hardware-Accelerated WebView** connected to production cloud endpoints.
- **Swipe-to-Refresh** (`SwipeRefreshLayout`).
- **Native Android Deep-Linking**:
  - `tel:` opens native Android Dialer.
  - `sms:` dispatches via native SMS app.
  - `https://wa.me` opens official WhatsApp app.
  - `mailto:` opens email client.
- **Download Manager**: Automatic download and notifications for PDF Invoices.
- **Offline Fallback**: Displays network retry screen if connectivity is lost.
- **Status Bar & Theming**: Custom brand green (`#1fa85a`).

## How to Build in Android Studio
1. Open **Android Studio**.
2. Select **Open** and choose the `android-app` folder.
3. Let Gradle sync dependencies.
4. Click **Build** &rarr; **Build Bundle(s) / APK(s)** &rarr; **Build APK(s)**.
5. Your `.apk` file will be generated in `app/build/outputs/apk/debug/app-debug.apk`.

## Automated Cloud Build via GitHub Actions
Every push to your GitHub repository automatically triggers the `.github/workflows/build-apk.yml` workflow, compiling the `.apk` file in the cloud and making it available for direct download under your GitHub **Actions** tab.

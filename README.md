# MoMo_Press
This app will analyze MoMo messages to give users clear financial insights and offer USSD for quick transactions, enhancing convenience and financial awareness for Rwandan users.

## Collaborators
1. Monica Dhieu
2. Jonathan Mugisha
3. Janviere Munezero
4. Kelvin Aaron-Onuigbo
5. David Ngarambe
6. Timothee Uwayesu

# MoMo_Press App Download/Setup

## Download
You can directly download and install the apk file for the app on your android device from /apk/app-release.apk.

## Setup
## 1. Clone the repository

```bash
git clone https://github.com/Janviere-dev/MoMo_Press.git
cd MoMo_Press/MoMo_press
```

## 2. Install dependencies

```bash
npm install
npm install @react-native/typescript-config --save-dev
npm install @react-native-async-storage/async-storage
npm install @react-navigation/bottom-tabs
npm install @react-navigation/native
```

> Note: After pulling the repo and installing npm, you may need to update some `build.gradle` files for Android:
>
> * `node_modules/react-native-get-sms-android/android/build.gradle`: Replace `jcenter()` with `mavenCentral()`
> * `node_modules/react-native-sqlite-storage/platforms/android/build.gradle`: Replace `jcenter()` with `mavenCentral()`

## 3. Clean Android build

```bash
cd android
./gradlew clean
cd ..
```

## 4. Run on USB-connected Android device (development)

```bash
npm run android
```

## 5. Build a release APK

```bash
cd android
./gradlew assembleRelease
```

> The generated APK will be located at:
> `android/app/build/outputs/apk/release/app-release.apk`

## 6. Demo Video
[Demo Video](https://youtu.be/teip-LLfCA4) showcasing key functionalities and UI walk-through.

## 7. Troubleshooting & Notes

* **Windows long path issues**: Move your project closer to root (e.g., `C:/Projects/MoMo_Press`) to avoid path length errors.
* **Gradle issues**: Run `./gradlew clean` and rebuild if you encounter build errors.

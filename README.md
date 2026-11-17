# Rozana Rate (روزانہ ریٹ) - Flutter Mobile App

Rozana Rate is a modern Flutter application designed for real-time tracking of daily consumer prices, commodities, grocery rates, currency, fuel, and bullion (gold/silver) across major cities in Pakistan.

## 📱 Features

- **Daily Live Commodity Rates**:
  - 🥦 **سبزیاں (Vegetables)**: Tomatoes, Onions, Potatoes, Ginger, Garlic, etc.
  - 🍎 **پھل (Fruits)**: Apples, Bananas, Pomegranates, Guavas, etc.
  - 🛒 **کریانہ (Grocery)**: Flour (Atta), Sugar, Cooking Oil, Pulses, Basmati Rice.
  - 🍗 **گوشت و پولٹری (Meat & Poultry)**: Live Chicken, Chicken Meat, Eggs, Mutton, Beef.
  - 🪙 **سونا و چاندی (Gold & Silver)**: 24K Gold, 22K Gold, Silver per tola.
  - ⛽ **پٹرول و ڈیزل (Fuel)**: Petrol Super, High-Speed Diesel, LPG Gas.
  - 💱 **کرنسی (Currency)**: US Dollar, Saudi Riyal, UAE Dirham, Euro, British Pound.
- **City Selection**: Lahore, Karachi, Islamabad/Rawalpindi, Faisalabad, Multan, Peshawar, Quetta.
- **Live Search**: Instant Urdu and English search filter.
- **Built-in Price Calculator**: Quickly calculate totals for any quantity (e.g. 2.5 kg, 5 liters, 3 tola).
- **Material 3 UI**: Clean emerald-green theme with Dark Mode & Light Mode support.
- **Cloud APK Build**: Fully automated GitHub Actions pipeline to compile the APK without requiring local Flutter installation.

---

## ☁️ How to Build and Download the APK via Cloud (GitHub Actions)

1. **Create a GitHub Repository**:
   - Go to [GitHub.com](https://github.com) and create a new repository (e.g. `rozana-rate-app`).
2. **Push this code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Rozana Rate App"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/rozana-rate-app.git
   git push -u origin main
   ```
3. **Download your APK**:
   - Go to the **Actions** tab on your GitHub repository.
   - Click on the latest workflow run: **Build Rozana Rate APK**.
   - Under **Artifacts**, download `RozanaRate-APK-Release.zip`.
   - Extract the zip file and install `app-release.apk` directly on your Android phone!

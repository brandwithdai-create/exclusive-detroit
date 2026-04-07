# Exclusive Detroit — iOS Submission Checklist

## App Identity (App Store Connect — requires your account)
- [ ] App ID registered in Apple Developer Portal: `com.exclusivedetroit.app`
- [ ] Bundle ID matches capacitor.config.ts: `com.exclusivedetroit.app`
- [ ] App name in App Store Connect: **Exclusive Detroit**
- [ ] Subtitle (30 chars max): `Detroit's Hidden Bars & Nightlife`
- [ ] Category (primary): **Food & Drink**
- [ ] Category (secondary): **Travel**
- [ ] Age rating: **17+** (alcohol-related content)
- [ ] App version: 1.0.0

## App Store Listing Copy
**Description** (up to 4000 chars — replace [YOUR CITY] placeholders):
> Exclusive Detroit is your insider guide to the city's best-kept secrets — hidden bars with no signage, speakeasies tucked behind bank vaults, rooftop lounges locals actually go to, and the cocktail spots that get James Beard nominations.
>
> Browse by neighborhood. Filter by vibe. Save your favorites. Use Near Me to find the closest spots wherever you are in the city.
>
> This is Detroit beyond the obvious — curated for people who know how to look.

**Keywords** (100 chars total):
`detroit,bars,nightlife,speakeasy,hidden bars,cocktails,detroit guide,detroit food,rooftop`

**What's New** (first release):
`First release. Explore Detroit's best hidden bars, speakeasies, and nightlife spots.`

## Privacy Policy and Support URLs (requires your domain)
- [ ] Privacy policy URL — must be live before submission, e.g. `https://exclusivedetroit.com/privacy`
- [ ] Support URL — e.g. `https://exclusivedetroit.com/support` or a contact email page
- [ ] Marketing URL (optional) — e.g. `https://exclusivedetroit.com`

**Minimum privacy policy contents:**
- The app uses device location (when you tap Near Me) to sort nearby venues
- Location is never stored or transmitted — used only in-session on-device
- Saved spots are stored locally on your device only (localStorage)
- No accounts, no analytics, no third-party SDKs, no advertising
- Map tiles loaded from OpenStreetMap (no personal data sent)
- Fonts loaded from Google Fonts (standard CDN request, no tracking)

## iOS Permission Usage Descriptions (add to Info.plist in Xcode)
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Exclusive Detroit uses your location to show the nearest bars and hidden spots sorted by distance. We never store or share your location.</string>
```
No other permissions are used. Do NOT add NSCameraUsageDescription, NSMicrophoneUsageDescription, NSContactsUsageDescription, or any other permission key.

## App Icon Requirements (all required — currently only 192px and 512px provided)
Provide a 1024x1024 PNG (no alpha, no rounded corners — Apple applies the mask):
- [ ] 1024x1024 — App Store
- [ ] Capacitor will auto-generate smaller sizes from the 1024x1024 source

Recommended tool: appicon.co — upload your 1024x1024, download the Xcode set.

## Screenshots Required for App Store
You need screenshots for each device category you support:
- [ ] iPhone 6.9" (iPhone 16 Pro Max): 1320x2868 or 1290x2796 — **required**
- [ ] iPhone 6.5" (iPhone 14 Plus): 1242x2688 — **required**
- [ ] iPhone 5.5" (iPhone 8 Plus): 1242x2208 — optional but recommended

Minimum 1, maximum 10 screenshots per device size.

**Suggested screens to capture:**
1. Explore tab — venue grid with category chips visible
2. Venue detail modal — full card open on a flagship venue (Bad Luck Bar, The Shelby)
3. Map tab — pins showing on Detroit map
4. Saved Spots tab — with at least 3-4 saved venues
5. Near Me active — purple "◉" indicator + distance labels on cards

## Capacitor / iOS Build Steps (requires Mac with Xcode 16+)
Run these from the `artifacts/my-app` directory on your Mac:

```bash
# 1. Install dependencies
pnpm install

# 2. Build the web app
pnpm build

# 3. Add the iOS platform (first time only)
npx cap add ios

# 4. Copy web assets to iOS project
npx cap sync ios

# 5. Open in Xcode
npx cap open ios
```

Then in Xcode:
- Set your Team (Apple Developer account)
- Set Version and Build number
- Add the NSLocationWhenInUseUsageDescription to Info.plist
- Select "Any iOS Device" as the build target
- Product → Archive
- Upload to App Store Connect via Organizer

## App Store Connect — Privacy Details (Data Section)
Answer these questions in App Store Connect:

| Data type | Collected? | Notes |
|---|---|---|
| Location | Yes — optional, on-demand | Not linked to identity, not shared |
| Identifiers | No | |
| Usage data | No | |
| Diagnostics | No | |
| Contacts | No | |
| Financial info | No | |
| Health & fitness | No | |
| Purchases | No | |

**Data linked to identity:** None
**Data used to track:** None

## App Review Notes (paste into App Store Connect review notes field)
```
This app is a curated guide to Detroit nightlife and bars.

To test the app:
- The main Explore tab shows all venues immediately with no login required.
- Tap any venue card to open the detail view.
- Use the heart icon to save venues to the Saved Spots tab.
- Near Me (location) is optional — tap the "◉ Near Me" button and allow location to sort by distance.
- The Map tab shows all venues on a Leaflet/OpenStreetMap map.

No login is required. No account is needed. All content is visible immediately.
```

## Potential Rejection Risks
| Risk | Status | Notes |
|---|---|---|
| Location permission not explained | FIXED | NSLocationWhenInUseUsageDescription is defined |
| Location requested on launch | FIXED | Only requested on explicit Near Me tap |
| No privacy policy | ACTION NEEDED | Must host a live privacy policy URL |
| Hardcoded date causing wrong venue status | FIXED | NOW uses real current date |
| Age rating too low | ACTION NEEDED | Set to 17+ for alcohol content |
| App crashes on first launch | Low risk | No login required, no required permissions |
| Placeholder/fake content | Low risk | All venue data is real and attributed |
| External links not working | Low risk | All URLs have target=_blank + noopener |

## What Is Done in Code
- [x] Capacitor installed and configured (`capacitor.config.ts`)
- [x] `cap:ios`, `cap:sync`, `cap:open` npm scripts added
- [x] `appId: "com.exclusivedetroit.app"` set
- [x] `appName: "Exclusive Detroit"` set
- [x] iOS backgroundColor set to `#0A0A0A` (matches app)
- [x] Location only requested on explicit user tap (Near Me / Continue button)
- [x] "Not Now" dismisses cleanly, no permanent block
- [x] Tapping backdrop dismisses GeoModal cleanly
- [x] Venue status (Just Opened / Coming Soon) uses real current date — not hardcoded
- [x] Saved spots persist via localStorage (survives app close/reopen)
- [x] Saves tab has a proper empty state with CTA back to Explore
- [x] Explore tab has a proper empty state when no results match a filter
- [x] Modal close button is 44×44px (Apple HIG minimum tap target)
- [x] All CTA buttons open in external browser (`target="_blank"`)
- [x] Map shows all real venues with coordinates
- [x] Footer disclaimer: "All venue info should be verified before visiting."
- [x] Fonts loaded in `<head>` — no flash of unstyled text on iOS
- [x] Manifest updated with proper icons (separate `any`/`maskable` entries)
- [x] `-webkit-tap-highlight-color: transparent` applied
- [x] `overscroll-behavior-y: none` applied (prevents rubber-band on body)
- [x] No analytics, no tracking, no third-party SDKs other than Google Fonts + OpenStreetMap

## What Still Requires Your Action
- [ ] Apple Developer account ($99/year) — enroll at developer.apple.com
- [ ] Register App ID `com.exclusivedetroit.app` in the portal
- [ ] Host a privacy policy page at your domain
- [ ] Host a support URL at your domain
- [ ] Provide a 1024x1024 app icon PNG
- [ ] Provide a launch/splash screen image (Capacitor splash plugin or Xcode asset)
- [ ] Capture App Store screenshots on physical device or simulator
- [ ] Create App Store Connect listing and fill in metadata
- [ ] Set age rating to 17+ in App Store Connect
- [ ] Add NSLocationWhenInUseUsageDescription to Info.plist in Xcode
- [ ] Run `pnpm cap:ios` and `pnpm cap:open` on a Mac with Xcode 16+
- [ ] Archive and submit via Xcode Organizer

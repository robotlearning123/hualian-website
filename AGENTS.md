<claude-mem-context>
# Memory Context

# [New project 2] recent context, 2026-05-02 11:48am EDT

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 20 obs (9,490t read) | 268,041t work | 96% savings

### Apr 30, 2026
1351 10:22a 🔵 AmScope MU1803 18MP USB3.0 Microscope Camera — Lab Setup Identified
1352 10:29a 🔵 AmScope MU1803 Setup Status — AmLite Already Installed, Camera Not Connected
1353 " 🔵 AmScope MU1803 Not Connected — AmLite Launches OK, Camera Absent from All OS Device Lists
1354 10:31a 🔵 AmLite.app Is Unsigned, Unnotarized, and Quarantined — Gatekeeper Will Block Launch on macOS 26
1355 10:32a 🔵 MacBook Pro Camera AVFoundation Modes Enumerated via Failed MU1803 Preflight Capture
1357 10:34a 🔵 ffmpeg AVFoundation Capture Hung Indefinitely on MacBook Pro Camera — Required SIGKILL
1358 10:36a 🔵 AmLite.app Deleted from /Applications — Must Reinstall from DMG
1360 10:37a 🔵 AmLite Reinstalled from DMG But macOS App Translocation Activated — App Runs from Randomized Temp Path
1361 10:53a 🔵 AmScope MU1803 ffmpeg AVFoundation Preflight — Shell Script Fails with "too many arguments"
1362 10:54a 🔵 AVFoundation Device Enumeration — AmScope MU1803 Absent, 5 Video Devices Listed
1363 " 🔵 AmLite.app TCC Identity — Unsigned App with Placeholder Bundle ID Blocks Camera/Screen Permissions
1364 " 🚨 Adobe Illustrator MCP Bearer Token Exposed in Process Listing
1365 10:56a 🔵 Root Cause: ffmpeg Camera Access Denied — Codex.app Lacks `com.apple.security.device.camera` Entitlement
1366 " 🔵 ffmpeg Camera Capture Succeeds via Terminal.app — 1280×720 JPEG Captured, Workaround Confirmed
1367 " ✅ MU1803 Verification Script Created at `/tmp/mu1803_verify_when_connected.sh`
1368 11:07a 🔵 AmScope MU1803 — Physical Installation Assessment and Usage Protocol Documented
1369 11:33a 🔵 AmScope MU1803 Microscope Camera — Hardware Analysis and macOS Software Installation Procedure Documented
1370 11:34a 🔵 AmScope MU1803 macOS TCC Camera Permission — Terminal.app Routing Grants Access; Device Absent Confirmed
1372 11:35a 🔵 AmScope MU1803 macOS Camera Capture — Terminal.app Routing Confirmed Fully Working, Frame Captured Successfully
1373 " 🟣 mu1803_verify_via_terminal.sh — Upgraded with Auto-Detection of AmScope Device Index

Access 268k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>
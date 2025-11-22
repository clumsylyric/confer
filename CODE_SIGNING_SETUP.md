# Code Signing & Notarization Setup Guide

This guide walks you through setting up Apple code signing and notarization for distributing Confer to other users.

## Prerequisites

✅ Active Apple Developer Program membership ($99/year)
✅ Access to https://developer.apple.com/account

---

## Step 1: Create Developer ID Certificate

### 1.1 Create Certificate Signing Request (CSR)

1. Open **Keychain Access** (`/Applications/Utilities/Keychain Access.app`)
2. Menu: **Keychain Access → Certificate Assistant → Request a Certificate from a Certificate Authority**
3. Fill in:
   - **User Email Address:** Your email
   - **Common Name:** `Confer Developer ID`
   - **CA Email Address:** Leave empty
   - **Request is:** Select **"Saved to disk"**
4. Click **Continue**
5. Save as `CertificateSigningRequest.certSigningRequest` to Desktop

### 1.2 Create Certificate in Apple Developer Portal

1. Go to: https://developer.apple.com/account/resources/certificates/list
2. Click the **+** button
3. Select **"Developer ID Application"** (under Software section)
4. Click **Continue**
5. Upload the `CertificateSigningRequest.certSigningRequest` file you created
6. Click **Continue**
7. Download the certificate (`.cer` file)
8. Double-click the downloaded certificate to install it in Keychain Access

### 1.3 Verify Installation

Open Terminal and run:
```bash
security find-identity -v -p codesigning | grep "Developer ID Application"
```

You should see something like:
```
1) ABC123XYZ "Developer ID Application: Your Name (TEAM123456)"
```

---

## Step 2: Generate App-Specific Password

1. Go to: https://appleid.apple.com/account/manage
2. Sign in with your Apple ID
3. Under **Security → App-Specific Passwords**, click **Generate password**
4. Label it: `Confer Notarization`
5. Copy the password (format: `xxxx-xxxx-xxxx-xxxx`)
6. **Save this password securely** - you won't be able to see it again

---

## Step 3: Find Your Team ID

1. Go to: https://developer.apple.com/account
2. Scroll to **Membership Details**
3. Find **Team ID** (10-character string like `AB12CD34EF`)
4. Copy this value

---

## Step 4: Configure Environment Variables

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in your values:
   ```bash
   APPLE_ID=your-apple-id@example.com
   APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
   APPLE_TEAM_ID=AB12CD34EF
   ```

3. **Important:** Never commit `.env` to git (it's already in `.gitignore`)

---

## Step 5: Load Environment Variables

Before building, load the environment variables:

```bash
# In the same terminal session where you'll run the build:
export $(cat .env | xargs)
```

Or add to your `~/.zshrc` or `~/.bashrc`:
```bash
# Confer code signing
export APPLE_ID="your-apple-id@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="AB12CD34EF"
```

---

## Step 6: Build Signed & Notarized App

```bash
# Load environment variables
export $(cat .env | xargs)

# Build the app
npm run build:mac
```

The build process will now:
1. ✅ Sign the app with your Developer ID
2. ✅ Upload to Apple for notarization
3. ✅ Staple the notarization ticket to the app
4. ✅ Create a signed DMG

This takes **5-15 minutes** due to Apple's notarization process.

---

## Verification

After building, verify the signature:

```bash
codesign -dv --verbose=4 dist/mac-universal/Confer.app
```

Should show:
```
Authority=Developer ID Application: Your Name (TEAMID)
...
Signature=Developer ID
```

Check notarization:
```bash
spctl -a -vv -t install dist/mac-universal/Confer.app
```

Should show:
```
dist/mac-universal/Confer.app: accepted
source=Notarized Developer ID
```

---

## Distribution

Once signed and notarized:
- ✅ Users can open the app without warnings
- ✅ Gatekeeper will allow installation
- ✅ No manual security bypasses needed
- ✅ Professional app distribution

Distribute the file:
```
dist/Confer-1.0.0-universal.dmg
```

---

## Troubleshooting

### "No identity found"
- Make sure you installed the Developer ID certificate in Keychain Access
- Run: `security find-identity -v -p codesigning`

### "Notarization failed"
- Check that environment variables are set: `echo $APPLE_ID`
- Verify app-specific password is correct (generate a new one if needed)
- Check Team ID matches your developer account

### "APPLE_TEAM_ID not found"
- Make sure you loaded the environment variables: `export $(cat .env | xargs)`
- Or set them manually: `export APPLE_TEAM_ID=AB12CD34EF`

---

## CI/CD Setup (GitHub Actions)

To automate builds with GitHub Actions, add these secrets to your repository:

**Settings → Secrets and variables → Actions → New repository secret:**
- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`
- `CSC_LINK` (base64-encoded .p12 certificate)
- `CSC_KEY_PASS` (certificate password)

---

## Security Notes

⚠️ **Never commit:**
- `.env` file (contains secrets)
- App-specific passwords
- Certificate files (.p12, .cer)

✅ **Safe to commit:**
- `.env.example` (template)
- This setup guide
- `scripts/notarize.js`

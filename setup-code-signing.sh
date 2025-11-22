#!/bin/bash

# Confer Code Signing Setup Script
# This script automates the Apple Developer code signing setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

print_step() {
    echo -e "${BLUE}→${NC} $1"
}

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "This script only works on macOS"
    exit 1
fi

print_header "Confer Code Signing Setup"
echo "This script will help you set up Apple code signing and notarization."
echo ""
read -p "Press Enter to continue..."

# Step 1: Create Certificate Signing Request
print_header "Step 1: Create Certificate Signing Request (CSR)"

CSR_PATH="$HOME/Desktop/ConferCertificateRequest.certSigningRequest"

read -p "Enter your email address: " USER_EMAIL

if [ -z "$USER_EMAIL" ]; then
    print_error "Email is required"
    exit 1
fi

print_step "Creating Certificate Signing Request..."

# Create a temporary config file for openssl
cat > /tmp/csr_config.txt << EOF
[req]
distinguished_name = req_distinguished_name
prompt = no

[req_distinguished_name]
CN = Confer Developer ID
emailAddress = $USER_EMAIL
EOF

# Generate CSR using openssl
openssl req -new -newkey rsa:2048 -nodes \
    -keyout "$HOME/Desktop/ConferCertificateKey.key" \
    -out "$CSR_PATH" \
    -config /tmp/csr_config.txt 2>/dev/null

if [ -f "$CSR_PATH" ]; then
    print_success "CSR created at: $CSR_PATH"
else
    print_error "Failed to create CSR"
    exit 1
fi

# Step 2: Open Apple Developer Portal
print_header "Step 2: Create Certificate in Apple Developer Portal"
echo ""
echo "Opening Apple Developer Portal in your browser..."
echo ""
print_info "Please follow these steps:"
echo "  1. Sign in with your Apple Developer account"
echo "  2. Click the + button to create a new certificate"
echo "  3. Select 'Developer ID Application' (under Software)"
echo "  4. Click Continue"
echo "  5. Upload the file: $CSR_PATH"
echo "  6. Download the certificate (.cer file) to your Downloads folder"
echo ""
read -p "Press Enter to open the browser..."

open "https://developer.apple.com/account/resources/certificates/add"

echo ""
print_step "Waiting for you to download the certificate..."
read -p "Press Enter once you've downloaded the certificate..."

# Step 3: Find and install the certificate
print_header "Step 3: Install Certificate"

CERT_FILE=$(find ~/Downloads -name "*.cer" -type f -mtime -5m | head -1)

if [ -z "$CERT_FILE" ]; then
    print_info "Certificate not found in Downloads. Please select it manually."
    read -e -p "Enter the path to your downloaded .cer file: " CERT_FILE
fi

if [ ! -f "$CERT_FILE" ]; then
    print_error "Certificate file not found: $CERT_FILE"
    exit 1
fi

print_step "Installing certificate: $(basename "$CERT_FILE")"
open "$CERT_FILE"

echo ""
print_info "The certificate should open in Keychain Access."
print_info "Click 'Add' to install it to your login keychain."
echo ""
read -p "Press Enter once the certificate is installed..."

# Verify certificate installation
sleep 2
IDENTITY=$(security find-identity -v -p codesigning | grep "Developer ID Application" | head -1)

if [ -z "$IDENTITY" ]; then
    print_error "Developer ID certificate not found in keychain"
    print_info "Please install the certificate manually and run this script again"
    exit 1
fi

print_success "Certificate installed successfully!"
echo "$IDENTITY"

# Step 4: Generate App-Specific Password
print_header "Step 4: Generate App-Specific Password"
echo ""
echo "Opening Apple ID account management..."
echo ""
print_info "Please follow these steps:"
echo "  1. Sign in with your Apple ID"
echo "  2. Under Security, click 'App-Specific Passwords'"
echo "  3. Click the + button to generate a new password"
echo "  4. Label it: 'Confer Notarization'"
echo "  5. Copy the generated password (format: xxxx-xxxx-xxxx-xxxx)"
echo ""
read -p "Press Enter to open the browser..."

open "https://appleid.apple.com/account/manage"

echo ""
read -p "Enter your app-specific password: " APP_PASSWORD

if [ -z "$APP_PASSWORD" ]; then
    print_error "App-specific password is required"
    exit 1
fi

# Step 5: Get Team ID
print_header "Step 5: Get Apple Team ID"
echo ""
echo "Opening Apple Developer account..."
echo ""
print_info "Please find your Team ID in the Membership Details section"
print_info "It's a 10-character string like: AB12CD34EF"
echo ""
read -p "Press Enter to open the browser..."

open "https://developer.apple.com/account"

echo ""
read -p "Enter your Team ID: " TEAM_ID

if [ -z "$TEAM_ID" ]; then
    print_error "Team ID is required"
    exit 1
fi

# Step 6: Create .env file
print_header "Step 6: Create .env Configuration"

cat > .env << EOF
# Apple Developer Credentials for Code Signing and Notarization
# Generated: $(date)

APPLE_ID=$USER_EMAIL
APPLE_APP_SPECIFIC_PASSWORD=$APP_PASSWORD
APPLE_TEAM_ID=$TEAM_ID
EOF

print_success ".env file created with your credentials"

# Step 7: Add to shell profile
print_header "Step 7: Configure Shell Environment"
echo ""
print_info "Would you like to automatically load these credentials in your terminal?"
read -p "Add to your shell profile? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Detect shell
    if [ -n "$ZSH_VERSION" ]; then
        SHELL_RC="$HOME/.zshrc"
    else
        SHELL_RC="$HOME/.bashrc"
    fi

    cat >> "$SHELL_RC" << EOF

# Confer Code Signing Credentials
export APPLE_ID="$USER_EMAIL"
export APPLE_APP_SPECIFIC_PASSWORD="$APP_PASSWORD"
export APPLE_TEAM_ID="$TEAM_ID"
EOF

    print_success "Added to $SHELL_RC"
    print_info "Restart your terminal or run: source $SHELL_RC"
else
    print_info "You'll need to run 'export \$(cat .env | xargs)' before building"
fi

# Load environment variables for current session
export APPLE_ID="$USER_EMAIL"
export APPLE_APP_SPECIFIC_PASSWORD="$APP_PASSWORD"
export APPLE_TEAM_ID="$TEAM_ID"

# Step 8: Verify setup
print_header "Step 8: Verify Setup"

echo ""
print_step "Checking Developer ID certificate..."
CERT_CHECK=$(security find-identity -v -p codesigning | grep "Developer ID Application")
if [ -n "$CERT_CHECK" ]; then
    print_success "Developer ID certificate found"
    echo "  $CERT_CHECK"
else
    print_error "Developer ID certificate not found"
fi

echo ""
print_step "Checking environment variables..."
if [ -n "$APPLE_ID" ] && [ -n "$APPLE_APP_SPECIFIC_PASSWORD" ] && [ -n "$APPLE_TEAM_ID" ]; then
    print_success "All environment variables are set"
    echo "  APPLE_ID: $APPLE_ID"
    echo "  APPLE_TEAM_ID: $TEAM_ID"
else
    print_error "Some environment variables are missing"
fi

# Final summary
print_header "Setup Complete!"
echo ""
print_success "Code signing is now configured!"
echo ""
echo "Next steps:"
echo ""
echo "  1. Build the app:"
echo "     ${GREEN}npm run build:mac${NC}"
echo ""
echo "  2. The app will be automatically signed and notarized"
echo "     (This takes 5-15 minutes due to Apple's notarization)"
echo ""
echo "  3. Distribute the signed DMG:"
echo "     ${GREEN}dist/Confer-1.0.0-universal.dmg${NC}"
echo ""
print_info "Your credentials are saved in .env (not committed to git)"
echo ""

read -p "Would you like to build the app now? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_header "Building Confer App"
    npm run build:mac

    echo ""
    print_success "Build complete!"
    echo ""
    echo "Your signed app is ready at:"
    echo "  ${GREEN}dist/Confer-1.0.0-universal.dmg${NC}"
    echo ""

    # Verify signature
    if [ -f "dist/mac-universal/Confer.app" ]; then
        print_step "Verifying signature..."
        codesign -dv --verbose=4 dist/mac-universal/Confer.app 2>&1 | grep "Authority\|Signature" | head -2
    fi
else
    print_info "You can build later with: npm run build:mac"
fi

echo ""
print_success "All done! 🎉"
echo ""

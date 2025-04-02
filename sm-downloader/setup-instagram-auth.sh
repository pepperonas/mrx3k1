#!/bin/bash
# Script to set up Instagram authentication for sm-downloader

# Ask for Instagram credentials
read -p "Enter your Instagram username: " INSTAGRAM_USERNAME
read -sp "Enter your Instagram password: " INSTAGRAM_PASSWORD
echo

# Create or update environment file
ENV_FILE="/var/www/html/stuff/sm-downloader/.env"
echo "Creating/updating environment file at $ENV_FILE"
touch "$ENV_FILE"

# Add or update Instagram credentials
if grep -q "INSTAGRAM_USERNAME" "$ENV_FILE"; then
    # Update existing entry
    sed -i "s/INSTAGRAM_USERNAME=.*/INSTAGRAM_USERNAME=$INSTAGRAM_USERNAME/" "$ENV_FILE"
else
    # Add new entry
    echo "INSTAGRAM_USERNAME=$INSTAGRAM_USERNAME" >> "$ENV_FILE"
fi

if grep -q "INSTAGRAM_PASSWORD" "$ENV_FILE"; then
    # Update existing entry
    sed -i "s/INSTAGRAM_PASSWORD=.*/INSTAGRAM_PASSWORD=$INSTAGRAM_PASSWORD/" "$ENV_FILE"
else
    # Add new entry
    echo "INSTAGRAM_PASSWORD=$INSTAGRAM_PASSWORD" >> "$ENV_FILE"
fi

# Set proper permissions
chown www-data:www-data "$ENV_FILE"
chmod 600 "$ENV_FILE"  # Only owner can read/write

# Update systemd service file to load environment file
SYSTEMD_FILE="/etc/systemd/system/sm-downloader.service"
echo "Updating systemd service file at $SYSTEMD_FILE"

# Check if EnvironmentFile line exists
if grep -q "EnvironmentFile" "$SYSTEMD_FILE"; then
    # Update existing entry if needed
    if ! grep -q "EnvironmentFile=$ENV_FILE" "$SYSTEMD_FILE"; then
        sed -i "s|EnvironmentFile=.*|EnvironmentFile=$ENV_FILE|" "$SYSTEMD_FILE"
    fi
else
    # Add EnvironmentFile line after Environment lines
    sed -i "/Environment=/a EnvironmentFile=$ENV_FILE" "$SYSTEMD_FILE"
fi

# Reload systemd configuration
systemctl daemon-reload

# Update code to load environment variables
CODE_UPDATE_FILE="/var/www/html/stuff/sm-downloader/server.js"
echo "Checking if dotenv package is installed..."

# Check if dotenv is already in package.json
if ! grep -q "dotenv" "/var/www/html/stuff/sm-downloader/package.json"; then
    echo "Installing dotenv package..."
    cd /var/www/html/stuff/sm-downloader
    npm install dotenv --save
fi

# Check if dotenv is already required in server.js
if ! grep -q "require('dotenv')" "$CODE_UPDATE_FILE"; then
    echo "Adding dotenv configuration to server.js..."
    # Add require statement after other requires
    sed -i "1s/^/require('dotenv').config();\n/" "$CODE_UPDATE_FILE"
fi

# Restart the service
echo "Restarting sm-downloader service..."
systemctl restart sm-downloader

echo "Setup complete. Instagram authentication has been configured."
echo "You can test your downloader now with Instagram links."
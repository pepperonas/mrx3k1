# ZipZap - Zip Bomb Demonstration Application

A security research tool for educational purposes that demonstrates the concept of a ZIP bomb with password protection and brute-force prevention.

## Overview

This application consists of:

1. A React frontend for configuring and generating ZIP bombs
2. A Node.js backend for password verification with brute-force protection
3. A simulated ZIP bomb generator

When the extracted output would exceed 100MB, the system requires password verification to prevent misuse.

## Security Features

- Password protection for potentially large zip bombs
- Brute force protection:
  - Maximum 5 failed attempts
  - 15-minute lockout after exceeding the limit
  - Rate limiting between attempts
  - IP-based tracking
- Session cleanup

## Setup Instructions

### Backend Setup

1. Install dependencies:
   ```bash
   cd server
   npm install
   ```

2. Start the server:
   ```bash
   node server.js
   ```

The server will run on port 4996 by default.

### Frontend Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Access the application at `http://localhost:3000`

## Usage

1. Configure your ZIP bomb parameters:
   - Base file size (MB)
   - Nesting levels
   - Output directory

2. If the extracted size exceeds 100MB, you will be prompted for a password
   - For this demo, the password is: `1337`
   - After 5 failed attempts, your IP will be locked for 15 minutes

3. After successful verification, the ZIP bomb will be generated with status updates

## Warning

This tool is for **educational purposes only**. Creating ZIP bombs with malicious intent may be illegal and harmful. Always use this tool responsibly and in controlled environments.

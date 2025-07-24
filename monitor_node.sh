#!/bin/bash

# Path to the application directory (update to your path)
APP_DIR="/root/aerodrome-analytics"

# Start command (nohup + npm run)
START_CMD="nohup npm run start:prod &"

# Log file path
LOG_FILE="$APP_DIR/monitor.log"

# Navigate to the app directory
cd "$APP_DIR" || exit 1

echo "[$(date)] Starting application monitor" >> "$LOG_FILE"

# Infinite monitoring loop
while true; do
    # Check if the start:prod process is running
    PID=$(pgrep -f "npm run start:prod")

    if [ -z "$PID" ]; then
        echo "[$(date)] Process not found. Restarting..." >> "$LOG_FILE"
        eval $START_CMD >> "$LOG_FILE" 2>&1
        sleep 5
    else
        echo "[$(date)] Process is running (PID: $PID)" >> "$LOG_FILE"
    fi

    sleep 10  # Check interval in seconds
done

#!/bin/bash
# server-cleanup.sh - CineLists Server Disk Cleanup Utility
# This script should be run on the VPS as root or with sudo privileges.

set -euo pipefail

# Text coloring
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== CineLists Server Disk & CPU Cleanup ===${NC}"

# Check disk space before cleanup
echo -e "\n${YELLOW}[1/6] Checking initial disk space...${NC}"
df -h /

# Docker state check
echo -e "\n${YELLOW}[2/6] Checking Docker container resource usage...${NC}"
if command -v docker &> /dev/null; then
    echo "Running containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo -e "${RED}Docker is not installed or not running on this machine.${NC}"
    exit 1
fi

# Clean up Docker system caches, unused networks, images, and volumes
echo -e "\n${YELLOW}[3/6] Performing Docker system prune (removing unused images/volumes/caches)...${NC}"
# Prune build cache
docker builder prune -a -f
# Prune stopped containers, unused networks, and dangling images
docker system prune -a --volumes -f

# Clean up large Docker container logs
echo -e "\n${YELLOW}[4/6] Truncating large Docker container log files...${NC}"
LOG_FILES=$(find /var/lib/docker/containers/ -name "*-json.log" 2>/dev/null || true)
if [ -n "$LOG_FILES" ]; then
    for log in $LOG_FILES; do
        size=$(du -sh "$log" | cut -f1)
        echo "Truncating log file: $log (Size: $size)"
        truncate -s 0 "$log"
    done
    echo -e "${GREEN}Docker logs truncated successfully.${NC}"
else
    echo "No Docker json log files found or access denied."
fi

# Check for heavy system files/folders in case Docker wasn't the only culprit
echo -e "\n${YELLOW}[5/6] Finding directories using the most space in Docker volume...${NC}"
du -d 1 -h /var/lib/docker 2>/dev/null | sort -h || true

# Check disk space after cleanup
echo -e "\n${YELLOW}[6/6] Checking final disk space...${NC}"
df -h /

echo -e "\n${GREEN}=== Cleanup Complete! ===${NC}"
echo -e "If CPU remains high, restart Docker or Dokploy services to clear any stuck crash loops:"
echo -e "  ${BLUE}systemctl restart docker${NC}"

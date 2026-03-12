#!/bin/bash

set -euo pipefail

# Lasius development server launcher (backend + frontend in tmux)
# Prerequisites: services must be running (cd services && yarn services:start)

ROOT="$(cd "$(dirname "$0")" && pwd)"
SESSION="lasius-dev"

# --- OS detection ---

OS="$(uname -s)"
case "$OS" in
  Darwin) CLIP_CMD="pbcopy" ;;
  Linux)  CLIP_CMD="xclip -selection clipboard" ;;
  *)      CLIP_CMD="cat > /dev/null" ;;
esac

# --- Port check ---

port_in_use() {
  if command -v lsof > /dev/null 2>&1; then
    lsof -iTCP:"$1" -sTCP:LISTEN -t > /dev/null 2>&1
  elif command -v ss > /dev/null 2>&1; then
    ss -tlnp | grep -q ":$1 "
  else
    return 1
  fi
}

kill_port() {
  local port="$1"
  if command -v lsof > /dev/null 2>&1; then
    lsof -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | xargs -r kill -9 2>/dev/null || true
  fi
}

# --- Preflight ---

if ! command -v tmux > /dev/null 2>&1; then
  echo "Error: tmux is required. Install with: brew install tmux"
  exit 1
fi

# Kill existing session if running
tmux kill-session -t "$SESSION" 2>/dev/null || true

# --- Session setup ---

# Set terminal capabilities before creating session
export TERM=xterm-256color

# Create tmux session with backend in first pane
tmux new-session -d -s "$SESSION" -c "$ROOT/backend" \
  "dotenv -e $ROOT/frontend/.env.local -- sbt run -Dconfig.resource=dev.conf; read -p 'Press Enter to close...'"

# Split: frontend (waits for backend via port check)
tmux split-window -t "$SESSION" -v -c "$ROOT/frontend" \
  "echo 'Waiting for backend on port 9000...' && \
   while ! (echo > /dev/tcp/localhost/9000) 2>/dev/null; do sleep 2; done && \
   echo 'Backend ready. Starting frontend...' && \
   yarn dev; read -p 'Press Enter to close...'"

# --- Logging ---

mkdir -p "$ROOT/backend/.logs" "$ROOT/frontend/.logs"
: > "$ROOT/backend/.logs/dev-server.log"
: > "$ROOT/frontend/.logs/dev-server.log"
tmux pipe-pane -t "$SESSION:0.0" -o "cat >> $ROOT/backend/.logs/dev-server.log"
tmux pipe-pane -t "$SESSION:0.1" -o "cat >> $ROOT/frontend/.logs/dev-server.log"

# --- Layout ---

tmux select-layout -t "$SESSION" even-vertical

# Pane titles in borders
tmux select-pane -t "$SESSION:0.0" -T "backend :9000"
tmux select-pane -t "$SESSION:0.1" -T "frontend :3001"

# Enable pane border status
tmux set-option -t "$SESSION" pane-border-status top
tmux set-option -t "$SESSION" pane-border-format " #{pane_title} "

# Clipboard for tmux copy-mode
tmux set-option -t "$SESSION" set-clipboard on
tmux set-option -t "$SESSION" -g mouse on

# When any pane exits, kill the entire session
tmux set-option -t "$SESSION" remain-on-exit off
tmux set-hook -t "$SESSION" pane-exited "kill-session -t $SESSION"

# Focus backend pane
tmux select-pane -t "$SESSION:0.0"

echo ""
echo "=== Lasius Dev ==="
echo "Backend:  http://localhost:9000 (pane 0)"
echo "Frontend: http://localhost:3001 (pane 1)"
echo "App:      http://localhost:3000 (proxy)"
echo ""
echo "Attaching to tmux session '$SESSION'..."
echo "Press Ctrl+B then D to detach. Ctrl+C in any pane stops it."
echo ""

# Attach (blocks until session ends)
tmux attach-session -t "$SESSION"

# Cleanup after session ends
echo "Session ended."

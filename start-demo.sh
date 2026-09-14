#!/usr/bin/env bash
set -e
if command -v python3 >/dev/null 2>&1; then
  PYTHON=python3
else
  PYTHON=python
fi
if command -v open >/dev/null 2>&1; then open http://localhost:8000
elif command -v xdg-open >/dev/null 2>&1; then xdg-open http://localhost:8000
fi
"$PYTHON" -m http.server 8000

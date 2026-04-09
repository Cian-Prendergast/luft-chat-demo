.PHONY: dev stop

dev:
	@echo "Starting DX Coach..."
	@npx concurrently \
		--names "frontend,backend" \
		--prefix-colors "cyan,magenta" \
		"npm run dev" \
		"cd server && npm run dev"

stop:
	@pkill -f "vite" || true
	@pkill -f "ts-node src/index" || true
	@echo "Stopped."

PROJECT_ID   := dmnl-generative-ai-pocs
SERVICE_NAME := luft-chat-demo
REGION       := europe-west1
IMAGE        := gcr.io/$(PROJECT_ID)/$(SERVICE_NAME)

.PHONY: dev stop deploy logs

# ── Local ──────────────────────────────────────────────────────────────────────

dev:
	@echo "Starting DX Coach locally..."
	@echo "  Frontend → http://localhost:5173"
	@echo "  Backend  → http://localhost:3001"
	@npx concurrently \
		--names "frontend,backend" \
		--prefix-colors "cyan,magenta" \
		"npm run dev" \
		"cd server && npm run dev"

stop:
	@pkill -f "vite" || true
	@pkill -f "ts-node src/index" || true
	@echo "Stopped."

# ── GCloud ─────────────────────────────────────────────────────────────────────

deploy:
	@echo "Building and pushing image to GCR..."
	gcloud builds submit --tag $(IMAGE) --project $(PROJECT_ID)
	@echo "Deploying to Cloud Run..."
	gcloud run deploy $(SERVICE_NAME) \
		--image $(IMAGE) \
		--platform managed \
		--region $(REGION) \
		--project $(PROJECT_ID) \
		--allow-unauthenticated \
		--set-secrets ANTHROPIC_API_KEY=anthropic-api-key:latest
	@echo "Done. Live URL:"
	@gcloud run services describe $(SERVICE_NAME) --region $(REGION) --project $(PROJECT_ID) --format "value(status.url)"

logs:
	gcloud run services logs read $(SERVICE_NAME) --region $(REGION) --project $(PROJECT_ID) --limit 50

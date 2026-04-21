PROJECT_ID   := dmnl-generative-ai-pocs
SERVICE_NAME := luft-chat-demo
REGION       := europe-west1
IMAGE        := gcr.io/$(PROJECT_ID)/$(SERVICE_NAME)

.PHONY: dev stop deploy

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
	@echo "Done. Service URL:"
	@gcloud run services describe $(SERVICE_NAME) --region $(REGION) --project $(PROJECT_ID) --format "value(status.url)"

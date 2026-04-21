import asyncio
import json
import os
from pathlib import Path
from typing import Any

import anthropic
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from skills import (
    ON_DEMAND_SKILLS,
    extract_figma_key,
    fetch_figma_file,
    load_core_prompt,
    load_skill,
)

load_dotenv()

APP_ENV = os.getenv("APP_ENV", "development")

app = FastAPI()

if APP_ENV == "production":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"http://localhost:\d+",
        allow_methods=["*"],
        allow_headers=["*"],
    )

claude = anthropic.AsyncAnthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

SYSTEM_PROMPT = load_core_prompt()
print(f"[server] Core prompt loaded — {len(SYSTEM_PROMPT)} chars")

# ── Tool definitions ───────────────────────────────────────────────────────────

TOOLS: list[dict[str, Any]] = [
    {
        "name": "get_figma_file",
        "description": (
            "Fetches the structure of a Figma or FigJam file so you can understand the project "
            "context: pages, frames, sections, and sticky note content. Call this whenever the "
            "user mentions a Figma URL or asks you to look at their board."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "file_key": {
                    "type": "string",
                    "description": (
                        "The Figma file key (the alphanumeric ID in the URL after /file/, /board/, "
                        "or /design/). You can also accept a full Figma URL and extract the key yourself."
                    ),
                }
            },
            "required": ["file_key"],
        },
    },
    {
        "name": "get_skill",
        "description": (
            "Loads a supplementary knowledge skill into context. Call this when the user's question "
            "requires depth beyond the core ISD framework. If in doubt whether a skill is relevant, "
            "load it — it's better to pull a file unnecessarily than to guess."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "enum": ON_DEMAND_SKILLS,
                    "description": (
                        "The skill to load. Options: playbook (workflow variants, decision gates), "
                        "decision-making (who decides what, escalation), collaboration (roles, rituals, "
                        "anti-patterns), quality-standards (readiness criteria, review gates), "
                        "mindsets (5 NLD traveller profiles, DX lenses)."
                    ),
                }
            },
            "required": ["name"],
        },
    },
    {
        "name": "update_project_context",
        "description": (
            "Silently updates the user's project context card. Call this when you have inferred or "
            "confirmed the current ISD phase, or when any project detail changes during conversation. "
            "Do NOT announce this to the user — just call it quietly in the background."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "phase": {
                    "type": "string",
                    "description": "The current ISD phase (Empathize, Define, Ideate, Prototype, Implement, Measure, or Listen)",
                },
                "storyline": {
                    "type": "string",
                    "description": "Updated one-liner description of what is being built",
                },
                "deadline": {
                    "type": "string",
                    "description": "Updated deadline in YYYY-MM-DD format",
                },
            },
        },
    },
]

# ── Pydantic models ────────────────────────────────────────────────────────────

class ContentBlock(BaseModel):
    type: str
    text: str | None = None
    mediaType: str | None = None
    data: str | None = None

    model_config = {"extra": "allow"}


class ChatMessage(BaseModel):
    role: str
    content: str | list[ContentBlock]


class ProjectContext(BaseModel):
    role: str | None = None
    storyline: str | None = None
    figmaUrl: str | None = None
    deadline: str | None = None
    phase: str | None = None


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    projectContext: ProjectContext | None = None


# ── Helpers ────────────────────────────────────────────────────────────────────

def build_context_block(ctx: ProjectContext) -> str:
    lines = ["[PROJECT CONTEXT]"]
    if ctx.role:
        lines.append(f"Role: {ctx.role}")
    if ctx.phase:
        lines.append(f"Current ISD Phase: {ctx.phase}")
    if ctx.storyline:
        lines.append(f"Project: {ctx.storyline}")
    if ctx.figmaUrl:
        lines.append(f"Figma board: {ctx.figmaUrl}")
    if ctx.deadline:
        lines.append(f"Deadline: {ctx.deadline}")
    lines.append("[/PROJECT CONTEXT]")
    lines.append("")
    lines.append(
        "Use this context to tailor all guidance. Skip introductory questions about role or "
        "project — you already know. If the phase is blank, infer it from conversation or "
        "Figma, then call update_project_context silently."
    )
    return "\n".join(lines)


def to_anthropic_content(content: str | list[ContentBlock]) -> list[dict[str, Any]]:
    if isinstance(content, str):
        return [{"type": "text", "text": content}]
    blocks = []
    for block in content:
        if block.type == "text":
            blocks.append({"type": "text", "text": block.text or ""})
        elif block.type == "image":
            blocks.append({
                "type": "image",
                "source": {"type": "base64", "media_type": block.mediaType, "data": block.data},
            })
        elif block.type == "document":
            blocks.append({
                "type": "document",
                "source": {"type": "base64", "media_type": "application/pdf", "data": block.data},
            })
    return blocks


async def execute_tool(name: str, input: dict, queue: asyncio.Queue) -> str:
    if name == "get_figma_file":
        key = extract_figma_key(input["file_key"]) or input["file_key"]
        try:
            return await fetch_figma_file(key)
        except Exception as e:
            return f"Error fetching Figma file: {e}"

    if name == "get_skill":
        return load_skill(input["name"])

    if name == "update_project_context":
        await queue.put(json.dumps({"type": "context_update", "context": input}))
        return "Project context updated."

    return f"Unknown tool: {name}"


# ── Agentic loop ───────────────────────────────────────────────────────────────

async def run_agentic_loop(body: ChatRequest, queue: asyncio.Queue) -> None:
    try:
        base_messages = [
            {"role": m.role, "content": to_anthropic_content(m.content)}
            for m in body.messages
        ]

        if body.projectContext:
            context_block = build_context_block(body.projectContext)
            current_messages = [
                {"role": "user", "content": context_block},
                {"role": "assistant", "content": "Understood. I have your project context. Ready to coach."},
                *base_messages,
            ]
        else:
            current_messages = base_messages

        while True:
            response = await claude.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=1024,
                system=SYSTEM_PROMPT,
                tools=TOOLS,
                messages=current_messages,
            )

            if response.stop_reason == "tool_use":
                tool_results = []
                for block in response.content:
                    if block.type == "tool_use":
                        print(f"[server] Tool call: {block.name}", block.input)
                        result = await execute_tool(block.name, block.input, queue)
                        print(f"[server] Tool result length: {len(result)} chars")
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": result,
                        })

                current_messages = [
                    *current_messages,
                    {"role": "assistant", "content": [b.model_dump() for b in response.content]},
                    {"role": "user", "content": tool_results},
                ]
                continue

            # stop_reason == "end_turn" — stream the final response
            async with claude.messages.stream(
                model="claude-sonnet-4-6",
                max_tokens=1024,
                system=SYSTEM_PROMPT,
                tools=TOOLS,
                messages=current_messages,
            ) as stream:
                async for event in stream:
                    if (
                        event.type == "content_block_delta"
                        and event.delta.type == "text_delta"
                    ):
                        await queue.put(json.dumps({"text": event.delta.text}))

            break

    except Exception as e:
        print(f"[server] Error: {e}")
        await queue.put(json.dumps({"error": "Server error"}))
    finally:
        await queue.put("[DONE]")


async def sse_generator(queue: asyncio.Queue):
    while True:
        item = await queue.get()
        if item == "[DONE]":
            yield "data: [DONE]\n\n"
            return
        yield f"data: {item}\n\n"


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.post("/chat")
async def chat(body: ChatRequest):
    if not body.messages:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="messages array is required")

    queue: asyncio.Queue = asyncio.Queue()
    asyncio.create_task(run_agentic_loop(body, queue))

    return StreamingResponse(
        sse_generator(queue),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


@app.get("/health")
async def health():
    return {"status": "ok"}


# ── Static files (production SPA) ─────────────────────────────────────────────

dist_dir = Path(__file__).parent.parent / "dist"
if dist_dir.exists():
    app.mount("/", StaticFiles(directory=str(dist_dir), html=True), name="static")


# ── Entrypoint ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "3001"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)

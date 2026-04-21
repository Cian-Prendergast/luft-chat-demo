import re
import os
from pathlib import Path

import httpx

CONTENT_DIR = Path(__file__).parent.parent / "src" / "content"

CORE_SKILLS = ["persona.md", "isd-framework.md"]

ON_DEMAND_SKILLS = [
    "playbook",
    "decision-making",
    "collaboration",
    "quality-standards",
    "mindsets",
]

_http_client: httpx.AsyncClient | None = None


def _get_http_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None:
        _http_client = httpx.AsyncClient()
    return _http_client


def load_core_prompt() -> str:
    sections = []
    for filename in CORE_SKILLS:
        path = CONTENT_DIR / filename
        if not path.exists():
            print(f"[skills] Missing core skill: {filename}")
            continue
        sections.append(path.read_text(encoding="utf-8").strip())
    return "\n\n---\n\n".join(sections)


def load_skill(name: str) -> str:
    path = CONTENT_DIR / f"{name}.md"
    if not path.exists():
        return f'Skill "{name}" not found.'
    print(f"[skills] Loaded on-demand: {name}.md")
    return path.read_text(encoding="utf-8").strip()


def extract_figma_key(url: str) -> str | None:
    match = re.search(r"figma\.com/(?:file|board|design)/([A-Za-z0-9]+)", url)
    return match.group(1) if match else None


_INCLUDE_TYPES = {"CANVAS", "FRAME", "SECTION", "GROUP", "STICKY", "SHAPE_WITH_TEXT", "TEXT"}


def summarise_node(node: dict, depth: int = 0) -> list[str]:
    lines: list[str] = []
    indent = "  " * depth

    if node.get("type") not in _INCLUDE_TYPES and depth > 0:
        return lines

    node_type = node.get("type", "")
    name = node.get("name", "")
    characters = node.get("characters", "")

    if node_type in ("STICKY", "SHAPE_WITH_TEXT", "TEXT"):
        text_preview = characters[:120].replace("\n", " ") if characters else ""
        label = f'{indent}[{node_type}] "{name}"' + (f": {text_preview}" if text_preview else "")
    else:
        label = f"{indent}[{node_type}] {name}"

    lines.append(label)

    if depth < 3:
        children = node.get("children", [])
        for child in children[:20]:
            lines.extend(summarise_node(child, depth + 1))
        if len(children) > 20:
            lines.append(f"{indent}  ... and {len(children) - 20} more")

    return lines


async def fetch_figma_file(file_key: str) -> str:
    token = os.environ.get("FIGMA_ACCESS_TOKEN")
    if not token:
        raise RuntimeError("FIGMA_ACCESS_TOKEN not set")

    url = f"https://api.figma.com/v1/files/{file_key}"
    print(f"[figma] Fetching file: {file_key}")

    client = _get_http_client()
    response = await client.get(url, headers={"X-Figma-Token": token})
    data = response.json()

    if data.get("err") or data.get("status") == 403:
        raise RuntimeError(f"Figma API error: {data.get('err', 'forbidden')}")

    lines = [f'Figma file: "{data["name"]}"', ""]
    lines.extend(summarise_node(data["document"]))
    return "\n".join(lines)

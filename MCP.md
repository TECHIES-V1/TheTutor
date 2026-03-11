# Further-MCP


# deployed url: https://futher-mcp-production.up.railway.app

Further-MCP merges the PDF/EPUB processing layer from `ebook-mcp` with the OpenLibrary discovery tools. You get:

- **Book search intelligence** powered by OpenLibrary with keyword-aware query construction.
- **Flexible ebook conversion** – metadata, table of contents, and chapter-level Markdown for EPUB/PDF files.
- **Dual interfaces**: launch as a FastAPI app or a FastMCP pack (Claude/Desktop friendly) without touching another repo.
- **Deploy-ready** for modern hosts (Railway, Render) with `.env`-controlled configuration.

## Quick Start

1. **Install dependencies**
   ```bash
   python -m pip install -r requirements.txt
   ```

2. **Prepare environment**
   - Copy `.env.example` to `.env` and adjust any of the discovery endpoints if you need self-hosted mirrors:
     - `OPENLIBRARY_BASE_URL` / `OPENLIBRARY_SEARCH_URL`
     - `OPENARCHIVE_BASE_URL`
     - `GUTENDEX_BASE_URL`
     - `STANDARD_EBOOKS_OPDS_URL`
     - `EBOOK_ROOT_PATH`
     - `LOG_LEVEL`
   - Drop EPUB/PDF files under the configured `EBOOK_ROOT_PATH`.

3. **Run the FastAPI layer**
    ```bash
    further-mcp-fastapi
    ```
   Defaults to `0.0.0.0:8000`. Use `uvicorn` arguments if you need HTTPS, auto-reload, etc.

4. **Run the FastMCP pack**
   ```bash
   further-mcp
   ```
   This spins up a FastMCP (stdio) server ready for Claude Desktop or other MCP clients.

5. **Run the test suite**
   ```bash
   pytest
   ```

## FastAPI Endpoints

| Path | Method | Description |
| ---- | ------ | ----------- |
| `/search` | GET | Smart OpenLibrary search. Use `keywords` (e.g., `keywords=Python&keywords=Introduction`). |
| `/search_author` | GET | Find author information + works. |
| `/ebooks/list` | GET | List EPUB/PDF files inside the configured root. |
| `/ebooks/metadata` | GET | Returns metadata for a given file. |
| `/ebooks/toc` | GET | Returns TOC for EPUB/PDF. |
| `/ebooks/epub/chapter-markdown` | GET | Get chapter Markdown (`chapter` param). |
| `/ebooks/pdf/chapter-text` | GET | Get text + pages for a PDF chapter title match. |
| `/pipeline/fetch-parse` | POST | Download a discovery URL (EPUB/PDF/text), save it under `EBOOK_ROOT_PATH`, and return a parsed summary of the first few pages/chapters (send JSON payload, see below). |
| `/pipeline/topic` | POST | Search by topic, download up to `download_limit` books, parse them, and return AI-readable summaries. |
| `/pipeline/topic/sse` | GET | SSE stream variant of `/pipeline/topic` for live agent consumption. |
| `/discovery/search` | GET | Aggregate Gutendex / OpenLibrary / Standard Ebooks results with downloadable EPUB/PDF URLs (use `sources=gutendex`). |
| `/discovery/gutendex` | GET | Search Gutendex directly. |
| `/discovery/openlibrary` | GET | Search OpenLibrary and include Internet Archive download URLs for `ia` editions. |
| `/discovery/standard-ebooks` | GET | Query the Standard Ebooks OPDS catalog for high quality EPUBs. |

Use the `/health` endpoint (`GET /health`) to confirm the FastAPI server is alive.

### Pipeline fetch + parse request

Call `/pipeline/fetch-parse` with JSON (`Content-Type: application/json`):

```json
{
  "url": "https://www.gutenberg.org/ebooks/51804.epub3.images",
  "limit_pages": 2,
  "limit_chapters": 2
}
```

### Topic pipeline request

Call `/pipeline/topic` with JSON (`Content-Type: application/json`):

```json
{
  "query": "python programming",
  "limit": 30,
  "download_limit": 30
}
```

SSE stream variant:

```bash
curl -N "http://localhost:8000/pipeline/topic/sse?query=python%20programming&limit=30&download_limit=30"
```

The response is structured so the AI can read it directly:

```json
{
  "relative_path": "downloaded/3e6a3f8c8a7c_Plague_of_Pythons.epub",
  "format": "epub",
  "size_bytes": 123456,
  "summary": "First couple paragraphs from chapter 1..."
}
```

### Discovery Sources

Further-MCP reaches out to the following discovery APIs so the MCP can deliver direct EPUB/PDF links:

1. **Gutendex (Project Gutenberg mirror)** – `GET /discovery/gutendex` calls `https://gutendex.com/books/?search=<query>` and returns EPUB/plain text download URLs for 76,000+ public domain books.
2. **Open Library + Internet Archive** – `GET /discovery/openlibrary` consumes `https://openlibrary.org/search.json?q=<query>` and attaches Internet Archive downloads (e.g., `https://archive.org/download/{id}/{id}.pdf`).
3. **Standard Ebooks OPDS feed** – `GET /discovery/standard-ebooks` queries `https://standardebooks.org/opds` (with `search=`) to serve beautifully typeset EPUBs via OPDS acquisition links.

The combined endpoint (`/discovery/search`) orchestrates these sources by default; pass `sources=gutendex&sources=openlibrary` to narrow the results.

## FastMCP Tools
 i
Register the pack in Claude/Desktop using `further-mcp` (FastMCP) command. Available tools:

- `search_books(query: str, keywords: list[str] | None = None, limit: int = 10) -> OpenLibrary`
- `search_author(query: str) -> AuthorDetails`
- `search_author_with_book_name(query: str) -> AuthorDetails`
- `list_ebooks() -> dict`
- `get_epub_metadata(relative_path: str)`
- `get_pdf_metadata(relative_path: str)`
- `get_epub_toc(relative_path: str)`
- `get_pdf_toc(relative_path: str)`
- `get_epub_chapter_markdown(relative_path: str, chapter_id: str)`
- `get_pdf_chapter_text(relative_path: str, chapter_title: str)`
- `discover_books(query: str, sources: list[str] | None = None, limit: int = 5)`
- `fetch_and_parse_book(url: str, limit_pages: int = 3, limit_chapters: int = 3)`

## `.env` configuration

```env
OPENLIBRARY_BASE_URL=https://openlibrary.org
OPENLIBRARY_SEARCH_URL=https://openlibrary.org/search.json
OPENARCHIVE_BASE_URL=https://archive.org/download
GUTENDEX_BASE_URL=https://gutendex.com/books/
STANDARD_EBOOKS_OPDS_URL=https://standardebooks.org/opds
EBOOK_ROOT_PATH=ebooks
LOG_LEVEL=INFO
FURTHER_MCP_LOG_DIR=/tmp/further_mcp_logs
```

The FastAPI server and MCP layer both respect the same environment file, so they stay aligned in deployments (Railway/Render) and local dev.

## Packaging for MCPB

The `further-mcp.pack.json` manifest describes this project as a deployable `mcpb` pack. Claude/Desktop or MCP pack managers can point to it when installing the pack.

## Deployment hints

1. **Railway/Render**
   - Build command: `pip install -r requirements.txt && pip install .`
   - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Configure the `.env` variables via the service’s UI.
2. **Logs**
   - Structured logs land in the directory set by `FURTHER_MCP_LOG_DIR` (`/tmp/further_mcp_logs` by default), while stdout/stderr carries a readable mirror.

## Requirements

- `fastapi >=0.116.0`
- `fastmcp >=2.11.1`
- `uvicorn >=0.24.0`
- `ebooklib >=0.19`
- `PyMuPDF >=1.26.3`
- `beautifulsoup4 >=4.13.4`
- `html2text >=2025.4.15`
- `pydantic >=2.11.7`
- `httpx >=0.28.0`
- `python-dotenv >=1.1.0`

Refer to `requirements.txt` for the pinned versions used in this workspace.

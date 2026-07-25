# Gallery Board Implementation Plan

**Goal**: Add a gallery feature to the AI image generator. Users can save generated images via a backend API and view saved images in a modal overlay.

## Scope & Decisions (from user)
- **Persistence**: Use a backend API (Cloudflare KV) to store image data.
- **UI location**: Gallery displayed in a modal overlay on the image generation page.

## Affected Boundaries
- **Backend**: Cloudflare worker (`image-worker/src/index.ts`).
- **Frontend**: Inline HTML/JS served by the worker.
- **Configuration**: `wrangler.toml` (KV namespace declaration).

## Data Model
```json
{
  "id": "<uuid>",
  "image": "<base64 PNG>",
  "prompt": "<enhanced prompt>",
  "timestamp": 1699891200000
}
```
- Stored per‑image as a KV value keyed by the UUID.
- An index key `gallery_index` holds a JSON array of IDs (most‑recent first) for list retrieval.

## API Specification
| Method | Path          | Request Body                                 | Response                               |
|--------|---------------|----------------------------------------------|----------------------------------------|
| POST   | `/api/gallery`| `{ image: string, prompt: string }`          | `{ success: true, id: string }`       |
| GET    | `/api/gallery`| *none*                                      | `{ images: [{id, image, prompt, ts}] }` |

### Error Handling
- Return **400** for missing fields.
- Return **500** with `{ error: "msg" }` for KV failures.

## Implementation Steps
1. **Configure KV**
   - Edit `wrangler.toml` to add:
     ```toml
     [[kv_namespaces]]
     binding = "GALLERY"
     id = "<KV_ID>"   # to be created in Cloudflare dashboard
     ```
   - Ensure the worker’s `Env` type includes `GALLERY: KVNamespace`.

2. **Extend `Env` Interface** in `image-worker/src/index.ts`:
   ```ts
   export interface Env {
     AI: Ai;
     GALLERY: KVNamespace; // new KV binding
   }
   ```

3. **Implement Gallery Handlers**
   - Add two functions:
     ```ts
     async function handleGalleryPost(request: Request, env: Env): Promise<Response> { ... }
     async function handleGalleryGet(request: Request, env: Env): Promise<Response> { ... }
     ```
   - **POST** logic:
     * Parse JSON, validate `image` and `prompt`.
     * Generate `id` via `crypto.randomUUID()`.
     * Store image object as JSON string: `await env.GALLERY.put(id, JSON.stringify({id, image, prompt, timestamp: Date.now()}));`
     * Update index: fetch existing `gallery_index`, prepend `id`, write back (limit to e.g., 100 entries).
   - **GET** logic:
     * Retrieve `gallery_index`, iterate IDs, `await env.GALLERY.get(id, {type: "json"})`.
     * Return array ordered newest‑first.

4. **Route Requests**
   - Extend the request router in `fetch`:
     ```ts
     if (url.pathname === "/api/gallery" && request.method === "POST") return handleGalleryPost(request, env);
     if (url.pathname === "/api/gallery" && request.method === "GET")  return handleGalleryGet(request, env);
     ```

5. **Frontend – UI Enhancements**
   - **Add Buttons** after the generated image:
     ```html
     <button id="saveBtn" style="margin-top:8px;">Save to Gallery</button>
     <button id="openGalleryBtn" style="margin-top:8px;">Open Gallery</button>
     ```
   - **Save Logic** (in the existing `<script>` block):
     ```js
     async function saveToGallery() {
       const img = document.getElementById('resultImg').src;
       const prompt = document.getElementById('displayed-prompt').textContent;
       const base64 = img.split(',')[1]; // data URL already in blob URL, convert via fetch if needed
       const res = await fetch('/api/gallery', {
         method: 'POST',
         headers: {'Content-Type':'application/json'},
         body: JSON.stringify({image: base64, prompt})
       });
       const data = await res.json();
       if (data.success) alert('Saved to gallery');
     }
     document.getElementById('saveBtn').addEventListener('click', saveToGallery);
     ```
   - **Modal Overlay**
     * Insert hidden container after `</div>` of result:
       ```html
       <div id="galleryModal" class="modal hidden">
         <div class="modal-content">
           <span class="close" id="closeModal">&times;</span>
           <h2>Gallery</h2>
           <div id="galleryGrid" class="grid"></div>
         </div>
       </div>
       ```
     * CSS (add to `<style>` block):
       ```css
       .modal { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; }
       .modal.hidden { display:none; }
       .modal-content { background:#1a1a1a; padding:20px; border-radius:8px; max-width:90%; max-height:90%; overflow:auto; }
       .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(150px,1fr)); gap:10px; }
       .grid img { width:100%; border-radius:4px; border:1px solid #333; }
       .close { position:absolute; top:10px; right:15px; font-size:24px; cursor:pointer; }
       ```
     * JS to open/close modal and load images:
       ```js
       async function openGallery() {
         const res = await fetch('/api/gallery');
         const data = await res.json();
         const grid = document.getElementById('galleryGrid');
         grid.innerHTML = '';
         data.images.forEach(item => {
           const img = document.createElement('img');
           img.src = 'data:image/png;base64,' + item.image;
           img.title = item.prompt;
           grid.appendChild(img);
         });
         document.getElementById('galleryModal').classList.remove('hidden');
       }
       document.getElementById('openGalleryBtn').addEventListener('click', openGallery);
       document.getElementById('closeModal').addEventListener('click', () => {
         document.getElementById('galleryModal').classList.add('hidden');
       });
       ```

6. **Testing & Validation**
   - Deploy locally (`wrangler dev`) and verify:
     * Generating an image works as before.
     * Clicking **Save to Gallery** stores entry (check KV via dashboard or temporary `GET /api/gallery` response).
     * Opening the gallery shows saved images.
     * Index size caps at 100 (optional). 
   - Edge Cases:
     * Missing image/prompt → 400.
     * KV write failure → 500 with clear error.
     * Large images: base64 size ~ few MB; KV limit is 10 MiB per value (acceptable).

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| KV namespace not provisioned | API failures | Document required step; CI should fail if `env.GALLERY` undefined.
| Large payloads exceed KV limit | Save fails | Enforce client‑side size limit (e.g., reject >5 MiB) and return 400.
| Modal UI conflicts with existing styles | Visual glitches | Use scoped class names (`.gallery-modal`, `.gallery-grid`).
| Concurrency on `gallery_index` could cause race conditions | Lost entries | Simple prepend without lock is acceptable for low volume; can later switch to atomic `put` with `metadata`.

## Rollout Plan
1. Add KV config & code changes in a feature branch.
2. Deploy to a preview environment for manual testing.
3. Once validated, merge to main.
4. No database migrations needed (KV is schema‑less).

## Validation Steps
- **Unit**: None (worker – manual testing).
- **Functional**: Use browser to generate, save, reopen gallery; verify persistence across page reloads.
- **Performance**: Gallery load time proportional to number of entries; limit to recent 100 entries.

---
*Plan prepared for immediate implementation.*

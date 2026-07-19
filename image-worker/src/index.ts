export interface Env {
  AI: Ai;
}

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Style Transfer</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f0f0f;
      color: #e0e0e0;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      padding: 40px 20px;
    }
    .container { max-width: 720px; width: 100%; }
    h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle { color: #888; font-size: 14px; margin-bottom: 32px; }
    .form-group { margin-bottom: 20px; }
    label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #aaa;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    textarea {
      width: 100%;
      padding: 12px 16px;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      color: #e0e0e0;
      font-size: 15px;
      font-family: inherit;
      resize: vertical;
      transition: border-color 0.2s;
    }
    textarea:focus { outline: none; border-color: #667eea; }
    .upload-area {
      border: 2px dashed #444;
      border-radius: 12px;
      padding: 40px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      position: relative;
    }
    .upload-area:hover { border-color: #667eea; background: #1a1a2a; }
    .upload-area.has-image { padding: 16px; }
    .upload-area input { display: none; }
    .upload-area p { color: #888; font-size: 14px; }
    .upload-area .icon { font-size: 36px; margin-bottom: 8px; display: block; }
    .preview-img {
      max-width: 100%;
      max-height: 300px;
      border-radius: 8px;
    }
    .style-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
    }
    .chip {
      padding: 6px 14px;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 20px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
      color: #aaa;
    }
    .chip:hover { border-color: #667eea; color: #e0e0e0; }
    .chip.active {
      background: #667eea;
      border-color: #667eea;
      color: white;
    }
    button {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.1s;
    }
    button:hover { opacity: 0.9; }
    button:active { transform: scale(0.98); }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .result { margin-top: 32px; text-align: center; }
    .result img {
      max-width: 100%;
      border-radius: 12px;
      border: 1px solid #333;
    }
    .compare {
      display: flex;
      gap: 16px;
      margin-top: 32px;
      align-items: flex-start;
    }
    .compare > div { flex: 1; text-align: center; }
    .compare img { width: 100%; border-radius: 12px; border: 1px solid #333; }
    .result-label {
      font-size: 12px;
      color: #888;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .loading { display: none; margin-top: 32px; text-align: center; }
    .loading.active { display: block; }
    .spinner {
      width: 40px; height: 40px;
      border: 3px solid #333; border-top-color: #667eea;
      border-radius: 50%; animation: spin 0.8s linear infinite;
      margin: 0 auto 12px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error {
      margin-top: 20px; padding: 12px 16px;
      background: #2a1515; border: 1px solid #5a2020;
      border-radius: 8px; color: #ff6b6b; font-size: 14px; display: none;
    }
    .error.active { display: block; }
    .download-btn {
      display: inline-block; margin-top: 16px; padding: 10px 24px;
      background: #1a1a1a; border: 1px solid #444; border-radius: 8px;
      color: #e0e0e0; font-size: 14px; cursor: pointer;
      transition: border-color 0.2s; text-decoration: none;
    }
    .download-btn:hover { border-color: #667eea; }
  </style>
</head>
<body>
  <div class="container">
    <h1>AI Style Transfer</h1>
    <p class="subtitle">Upload a photo and transform it into a different art style</p>

    <div class="form-group">
      <label>Upload Image</label>
      <div class="upload-area" id="uploadArea" onclick="document.getElementById('fileInput').click()">
        <input type="file" id="fileInput" accept="image/*">
        <span class="icon" id="uploadIcon">&#128444;</span>
        <p id="uploadText">Click or drag to upload an image</p>
        <img id="previewImg" class="preview-img" style="display:none;">
      </div>
    </div>

    <div class="form-group">
      <label>Style</label>
      <div class="style-chips" id="styleChips">
        <div class="chip active" data-style="anime style, studio ghibli inspired">Anime</div>
        <div class="chip" data-style="oil painting, classical art style">Oil Painting</div>
        <div class="chip" data-style="pixel art, retro 8-bit style">Pixel Art</div>
        <div class="chip" data-style="watercolor painting, soft pastel colors">Watercolor</div>
        <div class="chip" data-style="cyberpunk, neon lights, futuristic">Cyberpunk</div>
        <div class="chip" data-style="pencil sketch, black and white drawing">Sketch</div>
        <div class="chip" data-style="pop art, bold colors, Andy Warhol style">Pop Art</div>
        <div class="chip" data-style="impressionist, monet style, soft brushstrokes">Impressionist</div>
      </div>
    </div>

    <div class="form-group">
      <label>Custom Prompt (optional)</label>
      <textarea id="customPrompt" placeholder="Add extra details, e.g. 'with flowers, in a forest'" style="min-height: 48px;"></textarea>
    </div>

    <button id="generateBtn" onclick="generate()">Transform</button>

    <div class="loading" id="loading">
      <div class="spinner"></div>
      <p>Transforming image...</p>
    </div>

    <div class="error" id="error"></div>

    <div class="compare" id="compare" style="display:none;">
      <div>
        <div class="result-label">Original</div>
        <img id="originalResult">
      </div>
      <div>
        <div class="result-label">Transformed</div>
        <img id="transformedResult">
        <br><a class="download-btn" id="downloadBtn" download="transformed.png">Download</a>
      </div>
    </div>
  </div>

  <script>
    let imageDataUrl = null;
    let selectedStyle = 'anime style, studio ghibli inspired';
    let currentBlobUrl = null;

    document.getElementById('fileInput').addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(ev) {
        imageDataUrl = ev.target.result;
        document.getElementById('previewImg').src = imageDataUrl;
        document.getElementById('previewImg').style.display = 'block';
        document.getElementById('uploadIcon').style.display = 'none';
        document.getElementById('uploadText').style.display = 'none';
        document.getElementById('uploadArea').classList.add('has-image');
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('uploadArea').addEventListener('dragover', function(e) {
      e.preventDefault(); this.style.borderColor = '#667eea';
    });
    document.getElementById('uploadArea').addEventListener('dragleave', function(e) {
      e.preventDefault(); this.style.borderColor = '#444';
    });
    document.getElementById('uploadArea').addEventListener('drop', function(e) {
      e.preventDefault(); this.style.borderColor = '#444';
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        document.getElementById('fileInput').files = e.dataTransfer.files;
        document.getElementById('fileInput').dispatchEvent(new Event('change'));
      }
    });

    document.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', function() {
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        selectedStyle = this.dataset.style;
      });
    });

    async function generate() {
      if (!imageDataUrl) { showError('Please upload an image first.'); return; }

      const btn = document.getElementById('generateBtn');
      const loading = document.getElementById('loading');
      const compare = document.getElementById('compare');
      const error = document.getElementById('error');

      btn.disabled = true;
      loading.classList.add('active');
      compare.style.display = 'none';
      error.classList.remove('active');

      if (currentBlobUrl) { URL.revokeObjectURL(currentBlobUrl); currentBlobUrl = null; }

      const customPrompt = document.getElementById('customPrompt').value.trim();
      const fullPrompt = selectedStyle + (customPrompt ? ', ' + customPrompt : '');
      const base64 = imageDataUrl.split(',')[1];

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: fullPrompt, image_b64: base64 }),
        });

        const text = await res.text();
        let json;
        try { json = JSON.parse(text); } catch { throw new Error('Server error. Try again.'); }

        if (json.error) throw new Error(json.error);
        if (!json.image) throw new Error('No image in response');

        const binaryString = atob(json.image);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'image/png' });
        currentBlobUrl = URL.createObjectURL(blob);

        document.getElementById('originalResult').src = imageDataUrl;
        document.getElementById('transformedResult').src = currentBlobUrl;
        document.getElementById('downloadBtn').href = currentBlobUrl;
        compare.style.display = 'flex';
      } catch (e) {
        showError(e.message || 'Unknown error occurred');
      } finally {
        btn.disabled = false;
        loading.classList.remove('active');
      }
    }

    function showError(msg) {
      const el = document.getElementById('error');
      el.textContent = msg;
      el.classList.add('active');
    }
  </script>
</body>
</html>`;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function handleGenerate(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json<{
      prompt: string;
      image_b64: string;
    }>();

    const binaryString = atob(body.image_b64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const response = await env.AI.run(
      "@cf/black-forest-labs/flux-1-dev",
      {
        prompt: body.prompt,
        image: Array.from(bytes),
      },
    );

    const result = response as { image?: string };

    if (!result?.image) {
      return new Response(
        JSON.stringify({ error: "No image in response" }),
        { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    return new Response(
      JSON.stringify({ image: result.image }),
      { headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e.message || "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (url.pathname === "/api/generate" && request.method === "POST") {
      return handleGenerate(request, env);
    }

    return new Response(HTML_CONTENT, {
      headers: { "Content-Type": "text/html;charset=utf-8" },
    });
  },
} satisfies ExportedHandler<Env>;

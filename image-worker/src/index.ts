export interface Env {
  AI: Ai;
  GALLERY: KVNamespace; // new KV binding
}

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Image Generator</title>
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
    #prompt { min-height: 80px; font-size: 16px; }

    .size-row {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .size-row select {
      flex: 1;
      padding: 10px 12px;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      color: #e0e0e0;
      font-size: 14px;
      font-family: inherit;
    }
    .size-row select:focus { outline: none; border-color: #667eea; }
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
    .placeholder {
      width: 100%;
      aspect-ratio: 1;
      max-height: 512px;
      border: 2px dashed #333;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #555;
      font-size: 14px;
    }
    /* Gallery modal styles */
    .modal { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; }
    .modal.hidden { display:none; }
    .modal-content { background:#1a1a1a; padding:20px; border-radius:8px; max-width:90%; max-height:90%; overflow:auto; }
    .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(150px,1fr)); gap:10px; }
    .grid img { width:100%; border-radius:4px; border:1px solid #333; }
    .close { position:absolute; top:10px; right:15px; font-size:24px; cursor:pointer; }
  </style>
</head>
<body>
  <div class="container">
    <h1>AI Image Generator</h1>
    <p class="subtitle">한국어로 프롬프트를 작성하면 자동으로 영어로 번역하여 이미지를 생성합니다.</p>

    <div class="form-group">
      <label>Prompt</label>
      <textarea id="prompt" placeholder="e.g. A small lighthouse on the sea at sunset, pastel colors, beautiful sky"></textarea>
    </div>


    </div>


    <div class="form-group">
      <label>Image Size</label>
      <div class="size-row">
        <select id="size">
          <option value="1024x1024">1024 x 1024 (Square)</option>
          <option value="768x1024">768 x 1024 (Portrait)</option>
          <option value="1024x768">1024 x 768 (Landscape)</option>
          <option value="512x512">512 x 512 (Small Square)</option>
        </select>
      </div>
    </div>

    <button id="generateBtn" onclick="generate()">Generate Image</button>

    <div class="loading" id="loading">
      <div class="spinner"></div>
      <p>Generating image...</p>
    </div>

    <div class="error" id="error"></div>

<div class="result" id="result" style="display:none;">
       <div class="result-label">Generated Image</div>
       <img id="resultImg">
       <div class="prompt-display" style="margin-top: 16px; padding: 16px; background: #2a2a2a; border-radius: 8px; font-size: 13px; line-height: 1.5; color: #e0e0e0; border-left: 3px solid #667eea;">
           <div style="margin-bottom: 8px; font-size: 14px; font-weight: 600; color: #ffffff;">사용된 프롬프트 (번역됨):</div>
           <div id="displayed-prompt" style="word-break: break-word; background: #1a1a1a; padding: 12px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.4; color: #ccc;">
           </div>
       </div>
        <br>
        <button id="saveBtn" style="margin-top:8px;">Save to Gallery</button>
        <button id="postToBoardBtn" style="margin-top:8px;">갤러리 게시판에 등록</button>
        <button id="openGalleryBtn" style="margin-top:8px;">Open Gallery</button>
        <a class="download-btn" id="downloadBtn" download="ai-generated.png">Download</a>
     </div>
  </div>

<div id="galleryModal" class="modal hidden">
  <div class="modal-content">
    <span class="close" id="closeModal">&times;</span>
    <h2>Gallery</h2>
    <div id="galleryGrid" class="grid"></div>
  </div>
</div>

  <script>
    let currentBlobUrl = null;


    async function generate() {
      const promptText = document.getElementById('prompt').value.trim();
      if (!promptText) { showError('Please enter a prompt.'); return; }

      const btn = document.getElementById('generateBtn');
      const loading = document.getElementById('loading');
      const result = document.getElementById('result');
      const error = document.getElementById('error');

      btn.disabled = true;
      loading.classList.add('active');
      result.style.display = 'none';
      error.classList.remove('active');

      if (currentBlobUrl) { URL.revokeObjectURL(currentBlobUrl); currentBlobUrl = null; }

        const fullPrompt = promptText;

      const sizeVal = document.getElementById('size').value.split('x');

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: fullPrompt,
            width: parseInt(sizeVal[0]),
            height: parseInt(sizeVal[1])
          }),
        });

        const text = await res.text();
        let json;
        try { json = JSON.parse(text); } catch { throw new Error('Server error occurred.'); }

        if (json.error) throw new Error(json.error);
        if (!json.image) throw new Error('No image data received.');

        const binaryString = atob(json.image);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'image/png' });
        currentBlobUrl = URL.createObjectURL(blob);

document.getElementById('resultImg').src = currentBlobUrl;
         document.getElementById('downloadBtn').href = currentBlobUrl;
         document.getElementById('displayed-prompt').textContent = json.prompt;
         result.style.display = 'block';
      } catch (e) {
        showError(e.message || 'An unknown error occurred.');
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

    async function saveToGallery() {
      const imgElem = document.getElementById('resultImg');
      if (!imgElem || !imgElem.src) { alert('No image to save.'); return; }
      try {
        const resp = await fetch(imgElem.src);
        const blob = await resp.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        const prompt = document.getElementById('displayed-prompt').textContent || '';
        const res = await fetch('/api/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, prompt })
        });
        const data = await res.json();
        if (data.success) alert('Saved to gallery');
        else alert('Save failed: ' + (data.error || 'unknown'));
      } catch (e) {
        alert('Error saving to gallery');
      }
    }

    async function openGallery() {
      try {
        const res = await fetch('/api/gallery');
        const data = await res.json();
        const grid = document.getElementById('galleryGrid');
        grid.innerHTML = '';
        (data.images || []).forEach((item: any) => {
          const img = document.createElement('img');
          img.src = 'data:image/png;base64,' + item.image;
          img.title = item.prompt;
          grid.appendChild(img);
        });
        document.getElementById('galleryModal').classList.remove('hidden');
      } catch (e) {
        alert('Failed to load gallery');
      }
    }

    document.getElementById('saveBtn').addEventListener('click', saveToGallery);
    document.getElementById('postToBoardBtn').addEventListener('click', postToBoardGallery);
    document.getElementById('openGalleryBtn').addEventListener('click', openGallery);
    document.getElementById('closeModal').addEventListener('click', () => {
      document.getElementById('galleryModal').classList.add('hidden');
    });

    async function postToBoardGallery() {
      const imgElem = document.getElementById('resultImg');
      const prompt = document.getElementById('displayed-prompt').textContent || '';
      if (!imgElem || !imgElem.src) { alert('No image to post.'); return; }

      const title = prompt.slice(0, 50) + (prompt.length > 50 ? '...' : '');
      const content = `AI 이미지 생성으로 만든 작품입니다.\n\n프롬프트: ${prompt}`;

      // Convert image to base64 data URL for upload
      try {
        const resp = await fetch(imgElem.src);
        const blob = await resp.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        // Use a data URL for the image_url - we'll store it as base64 in the content
        // For now, we'll post with the base64 data URL
        const imageDataUrl = `data:image/png;base64,${base64}`;

        // Get the board worker URL
        const boardApiBase = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
          ? 'http://localhost:8787'
          : 'https://board-worker.eggjoy.workers.dev';

        const res = await fetch(`${boardApiBase}/api/posts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `🎨 ${title}`,
            content,
            image_url: imageDataUrl,
            password: 'gallery123' // Default password for gallery posts
          })
        });

        const data = await res.json();
        if (data.id) {
          alert('갤러리 게시판에 등록되었습니다!');
          // Optionally redirect to the post
          // window.open(`https://your-domain/board/post.html?id=${data.id}`, '_blank');
        } else {
          alert('등록 실패: ' + (data.error || 'Unknown error'));
        }
      } catch (e) {
        alert('Error posting to gallery board: ' + e.message);
      }
    }
  </script>
</body>
</html>`;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function translateAndEnhancePrompt(koreanPrompt: string, env: Env): Promise<string> {
  try {
    // 1단계: 한국어를 영어로 번역
    let translated = koreanPrompt; // 기본값은 원본
    
    try {
      // Helsinki NLP Opus 모델 시도 (한국어->영어 특화)
      const translateResponse = await env.AI.run("@cf/huggingface/helsinki-nlp/opus-mt-ko-en", {
        text: koreanPrompt,
      });
      
      // 다양한 응답 형식 처리
      if (typeof translateResponse === 'string') {
        translated = translateResponse;
      } else if (translateResponse && typeof translateResponse === 'object') {
        // 가능한 응답 속성들 확인
        if ('translation' in translateResponse && typeof (translateResponse as any).translation === 'string') {
          translated = (translateResponse as any).translation;
        } else if ('translation_text' in translateResponse && typeof (translateResponse as any).translation_text === 'string') {
          translated = (translateResponse as any).translation_text;
        } else if ('generated_text' in translateResponse && typeof (translateResponse as any).generated_text === 'string') {
          // 일부 모델은 generated_text를 반환
          translated = (translateResponse as any).generated_text;
        } else if ('text' in translateResponse && typeof (translateResponse as any).text === 'string') {
          translated = (translateResponse as any).text;
        }
        // 배열 형태의 응답도 처리 가능
        else if (Array.isArray(translateResponse) && translateResponse.length > 0) {
          const firstItem = translateResponse[0];
          if (typeof firstItem === 'string') {
            translated = firstItem;
          } else if (firstItem && typeof firstItem === 'object') {
            if ('translation_text' in firstItem && typeof (firstItem as any).translation_text === 'string') {
              translated = (firstItem as any).translation_text;
            } else if ('generated_text' in firstItem && typeof (firstItem as any).generated_text === 'string') {
              translated = (firstItem as any).generated_text;
            }
          }
        }
      }
    } catch (translateError) {
      // Helsinki 모델 실패 시 m2m100으로 폴백
      try {
        const translateResponse = await env.AI.run("@cf/meta/m2m100-1.2b", {
          text: koreanPrompt,
          source_lang: "ko",
          target_lang: "en",
        });
        
        if (typeof translateResponse === 'string') {
          translated = translateResponse;
        } else if (translateResponse && typeof translateResponse === 'object') {
          if ('translation' in translateResponse && typeof (translateResponse as any).translation === 'string') {
            translated = (translateResponse as any).translation;
          } else if ('translated_text' in translateResponse && typeof (translateResponse as any).translated_text === 'string') {
            translated = (translateResponse as any).translated_text;
          }
        }
      } catch (fallbackError) {
        // 두 모델 모두 실패하면 원본 유지
        translated = koreanPrompt;
      }
    }

    // 2단계: 번역된 영어를 이미지 생성을 위한 상세한 프롬프트로 향상
    try {
const enhanceResponse = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [
          {
            role: "system",
            content: `You are a master artist and visual storyteller who specializes in creating rich, evocative descriptions for AI image generation that would inspire masterful paintings, illustrations, and concept art. Transform simple descriptions into lush, atmospheric, and emotionally resonant visual narratives that capture not just what is seen, but what is felt.

Your expertise includes:
- **Painterly Description**: Using language that evokes texture, brushwork, and artistic techniques (impasto, glazing, scumbling, wet-on-wet, palette knife texture)
- **Atmospheric Storytelling**: Creating mood through light, weather, time of day, and environmental storytelling that suggests narrative and emotion
- **Sensory Translation**: Converting non-visual senses (sound, temperature, humidity, smell) into visual metaphors and cues
- **Art Historical References**: Drawing from master painters and art movements when appropriate (Caravaggio lighting, Monet water and light, Turner atmospherics, Hopper loneliness, Wyeth texture)
- **Composition as Emotion**: Using composition not just technically, but to evoke feelings (isolation through negative space, tension through diagonal lines, serenity through horizontal lines)
- **Color Psychology**: Understanding how color combinations evoke specific emotions and atmospheres

Atmospheric & Artistic Enhancement Framework:
1. **LIGHT AS EMOTION**: Describe light not just technically, but emotionally (the last lonely ray of sunset, light filtering through ancient forest canopy like liquid gold, moonlight silvering the waves with melancholy beauty)
2. **TEXTURE & MATERIAL POETRY**: Describe surfaces with artistic sensitivity (the weathered wood tells stories of centuries of storms, rust blooms like strange flowers on the metal, fabric drapes with the weight of unspoken secrets)
3. **ENVIRONMENTAL STORYTELLING**: Use weather, season, time, and natural elements to convey mood (autumn leaves falling like memories, fog that obscures and reveals in equal measure, the oppressive heat that makes colors seem to vibrate)
4. **COLOR AS NARRATIVE**: Go beyond color names to color relationships and emotional resonance (shadows that aren't just black but deep violets and blues, highlights that aren't just white but warm golds and cool silvers)
5. **COMPOSITIONAL RHYTHM**: Describe how elements flow together to create visual music (repeating shapes that create harmony, contrasting textures that create visual conversation, negative space that breathes)
6. **ARTISTIC TECHNIQUE REFERENCES**: When relevant, invoke specific artistic approaches (the soft focus of a pastel drawing, the bold impasto of oil paint, the delicate line work of ink illustration, the luminous glazing of Renaissance masters)
7. **MYTHIC & POETIC DIMENSION**: When appropriate, elevate description to poetic or mythic level (not just a tree, but a sentinel watching over ancient waters; not just a house, but a keeper of forgotten dreams)

For photographic elements, frame them as artistic choices: "rendered with the soft focus and grain of vintage film" rather than just "shot at f/1.8"; "the luminous quality of a Winslow Homer watercolor" rather than just "watercolor style".

Output ONLY the enhanced artistic English prompt as a single, flowing paragraph that reads like a vivid art critic's description or a painter's notes. Make it so rich in visual and emotional detail that an artist would feel inspired to create. No explanations, just the prompt.`,
          },
          {
            role: "user",
            content: translated
          }
        ],
        max_tokens: 1200,
        temperature: 0.6,
      });

      let enhanced = translated; // 기본값은 번역된 텍스트
      if (typeof enhanceResponse === 'string') {
        enhanced = enhanceResponse;
      } else if (enhanceResponse && typeof enhanceResponse === 'object') {
        if ('response' in enhanceResponse && typeof (enhanceResponse as any).response === 'string') {
          enhanced = (enhanceResponse as any).response;
        } else if ('generated_text' in enhanceResponse && typeof (enhanceResponse as any).generated_text === 'string') {
          enhanced = (enhanceResponse as any).generated_text;
        } else if ('text' in enhanceResponse && typeof (enhanceResponse as any).text === 'string') {
          enhanced = (enhanceResponse as any).text;
        }
      }
      
      return enhanced.trim();
    } catch (enhanceError) {
      // 향상 실패 시 번역된 텍스트 반환
      return translated;
    }
  } catch {
    // 전체 프로세스 실패 시 원본 반환
    return koreanPrompt;
  }
}

async function handleGenerate(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json<{
      prompt: string;
      width?: number;
      height?: number;
    }>();

    let prompt = body.prompt;
    const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
    if (koreanRegex.test(prompt)) {
      prompt = await translateAndEnhancePrompt(prompt, env);
    }

    const response = await env.AI.run(
      "@cf/black-forest-labs/flux-1-schnell",
      {
        prompt,
        steps: 8,
      }
    );

    let base64Image: string;

    if (typeof response === "object" && response !== null && "image" in response) {
      base64Image = (response as { image: string }).image;
    } else if (response instanceof ReadableStream) {
      const reader = response.getReader();
      const chunks: Uint8Array[] = [];
      let totalLength = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        totalLength += value.length;
      }
      const imageBytes = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        imageBytes.set(chunk, offset);
        offset += chunk.length;
      }
      let binaryString = '';
      const chunkSize = 8192;
      for (let i = 0; i < imageBytes.length; i += chunkSize) {
        binaryString += String.fromCharCode(...imageBytes.subarray(i, i + chunkSize));
      }
      base64Image = btoa(binaryString);
    } else {
      throw new Error("Failed to generate image.");
    }

    return new Response(
      JSON.stringify({ image: base64Image, prompt: prompt }),
      { headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  } catch (e: any) {
    let errorMsg = e.message || "알 수 없는 오류가 발생했습니다.";
    if (errorMsg.includes("NSFW") || errorMsg.includes("3030")) {
      errorMsg = "Prompt was blocked by content policy. Please try a different prompt.";
    }
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  }
}

// Gallery POST handler
async function handleGalleryPost(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json<{ image: string; prompt: string }>();
    const { image, prompt } = body;
    if (!image || !prompt) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
    }
    const id = crypto.randomUUID();
    const timestamp = Date.now();
    const record = { id, image, prompt, timestamp };
    await env.GALLERY.put(id, JSON.stringify(record));
    // Update index
    const indexKey = "gallery_index";
    const existing = await env.GALLERY.get(indexKey);
    const ids: string[] = existing ? JSON.parse(existing) : [];
    ids.unshift(id);
    if (ids.length > 100) ids.length = 100;
    await env.GALLERY.put(indexKey, JSON.stringify(ids));
    return new Response(JSON.stringify({ success: true, id }), { headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || "Server error" }), { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  }
}

// Gallery GET handler
async function handleGalleryGet(request: Request, env: Env): Promise<Response> {
  try {
    const indexKey = "gallery_index";
    const indexVal = await env.GALLERY.get(indexKey);
    const ids: string[] = indexVal ? JSON.parse(indexVal) : [];
    const images = [];
    for (const id of ids) {
      const raw = await env.GALLERY.get(id, { type: "json" });
      if (raw) images.push(raw);
    }
    return new Response(JSON.stringify({ images }), { headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || "Server error" }), { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
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
      if (url.pathname === "/api/gallery" && request.method === "POST") {
        return handleGalleryPost(request, env);
      }
      if (url.pathname === "/api/gallery" && request.method === "GET") {
        return handleGalleryGet(request, env);
      }

    return new Response(HTML_CONTENT, {
      headers: { "Content-Type": "text/html;charset=utf-8" },
    });
  },
} satisfies ExportedHandler<Env>;

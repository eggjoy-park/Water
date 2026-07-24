export interface Env {
  AI: Ai;
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
    .prompt-display {
      margin-top: 16px;
      padding: 16px;
      background: #2a2a2a;
      border-radius: 8px;
      font-size: 13px;
      line-height: 1.5;
      color: #e0e0e0;
      border-left: 3px solid #667eea;
      text-align: left;
    }
    .prompt-display .label {
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #ffffff;
    }
    .prompt-display .text {
      word-break: break-word;
      background: #1a1a1a;
      padding: 12px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.4;
      color: #ccc;
    }
    .prompt-display + .prompt-display { margin-top: 8px; }
    .gallery-btn {
      display: inline-block;
      margin-top: 12px;
      padding: 10px 24px;
      background: linear-gradient(135deg, #7c3aed, #a855f7);
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .gallery-btn:hover { opacity: 0.9; }
    .gallery-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  </style>
</head>
<body>
  <div class="container">
    <h1>AI Image Generator</h1>
    <p class="subtitle">한국어로 프롬프트를 작성하면 자동으로 영어로 번역하여 이미지를 생성합니다.</p>

    <div class="form-group">
      <label>Prompt</label>
      <textarea id="prompt" placeholder="예: 바다 위의 작은 등대, 석양, 파스텔 색감, 아름다운 하늘"></textarea>
    </div>

    <div class="form-group">
      <label>Image Size</label>
      <div class="size-row">
        <select id="size">
          <option value="1024x1024">1024 x 1024 (정사각형)</option>
          <option value="768x1024">768 x 1024 (세로형)</option>
          <option value="1024x768">1024 x 768 (가로형)</option>
          <option value="512x512">512 x 512 (작은 정사각형)</option>
        </select>
      </div>
    </div>

    <button id="generateBtn" onclick="generate()">이미지 생성</button>

    <div class="loading" id="loading">
      <div class="spinner"></div>
      <p>이미지 생성 중...</p>
    </div>

    <div class="error" id="error"></div>

    <div class="result" id="result" style="display:none;">
      <div class="result-label">생성된 이미지</div>
      <img id="resultImg">
      <div class="prompt-display">
        <div class="label">한국어 프롬프트:</div>
        <div class="text" id="displayed-korean-prompt"></div>
      </div>
      <div class="prompt-display">
        <div class="label">영어 프롬프트:</div>
        <div class="text" id="displayed-english-prompt"></div>
      </div>
      <div>
        <a class="download-btn" id="downloadBtn" download="ai-generated.png">다운로드</a>
        <button class="gallery-btn" id="postToGalleryBtn">갤러리 게시판에 등록</button>
      </div>
    </div>
  </div>

  <script>
    var currentBlobUrl = null;
    var lastKoreanPrompt = '';

    async function generate() {
      var promptText = document.getElementById('prompt').value.trim();
      if (!promptText) { showError('프롬프트를 입력하세요.'); return; }

      lastKoreanPrompt = promptText;
      var btn = document.getElementById('generateBtn');
      var loading = document.getElementById('loading');
      var result = document.getElementById('result');
      var error = document.getElementById('error');

      btn.disabled = true;
      loading.classList.add('active');
      result.style.display = 'none';
      error.classList.remove('active');

      if (currentBlobUrl) { URL.revokeObjectURL(currentBlobUrl); currentBlobUrl = null; }

      var sizeVal = document.getElementById('size').value.split('x');

      try {
        var res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: promptText,
            width: parseInt(sizeVal[0]),
            height: parseInt(sizeVal[1])
          }),
        });

        var text = await res.text();
        var json;
        try { json = JSON.parse(text); } catch { throw new Error('서버 오류가 발생했습니다.'); }

        if (json.error) throw new Error(json.error);
        if (!json.image) throw new Error('이미지 데이터를 받지 못했습니다.');

        // 원본 base64 저장 (나중에 갤러리 등록용)
        window._lastBase64Image = json.image;
        
        // 한국어/영어 프롬프트 저장
        window._lastKoreanPrompt = json.korean_prompt || lastKoreanPrompt;
        window._lastEnglishPrompt = json.english_prompt || '';
        
        var binaryString = atob(json.image);
        var bytes = new Uint8Array(binaryString.length);
        for (var i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        var blob = new Blob([bytes], { type: 'image/png' });
        currentBlobUrl = URL.createObjectURL(blob);

        document.getElementById('resultImg').src = currentBlobUrl;
        document.getElementById('downloadBtn').href = currentBlobUrl;
        document.getElementById('displayed-korean-prompt').textContent = window._lastKoreanPrompt;
        document.getElementById('displayed-english-prompt').textContent = window._lastEnglishPrompt;
        result.style.display = 'block';
      } catch (e) {
        showError(e.message || '알 수 없는 오류가 발생했습니다.');
      } finally {
        btn.disabled = false;
        loading.classList.remove('active');
      }
    }

    function showError(msg) {
      var el = document.getElementById('error');
      el.textContent = msg;
      el.classList.add('active');
    }

    document.getElementById('postToGalleryBtn').addEventListener('click', async function() {
      if (!window._lastBase64Image) { alert('이미지가 없습니다.'); return; }
      var btn = this;
      btn.disabled = true;
      btn.textContent = '등록 중...';
      try {
        var base64 = window._lastBase64Image;
        console.log('Base64 length:', base64.length);
        // 이미지가 너무 크면 (130KB 이상) data URL로 저장하지 않음
        if (base64.length > 130000) {
          alert('이미지가 너무 큽니다. 직접 이미지 URL을 복사해주세요.');
          btn.disabled = false;
          btn.textContent = '갤러리 게시판에 등록';
          return;
        }
        var boardApiBase = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
          ? 'http://localhost:8787'
          : 'https://board-worker.eggjoy.workers.dev';
        var res = await fetch(boardApiBase + '/api/gallery/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: (window._lastEnglishPrompt || '').slice(0, 50),
            content: '한국어: ' + (window._lastKoreanPrompt || lastKoreanPrompt) + '\\n\\nEnglish: ' + (window._lastEnglishPrompt || ''),
            image_url: 'data:image/png;base64,' + base64,
            password: 'gallery123'
          })
        });
        var data = await res.json();
        console.log('Response:', res.status, data);
        if (!res.ok) {
          console.error('API Error:', res.status, data);
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        alert('갤러리 게시판에 등록되었습니다!');
        // 갤러리 페이지 URL 구성
        var galleryUrl = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
          ? 'http://localhost:8787/board/gallery.html?page=1'
          : 'https://eggjoy.workers.dev/board/gallery.html?page=1';
        window.location.href = galleryUrl;
      } catch (e) {
        alert('등록 실패: ' + (e.message || '오류가 발생했습니다.'));
      } finally {
        btn.disabled = false;
        btn.textContent = '갤러리 게시판에 등록';
      }
    });
  </script>
</body>
</html>`;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function translateAndEnhancePrompt(koreanPrompt: string, env: Env): Promise<{ korean: string; english: string }> {
  try {
    // 1단계: 한국어 프롬프트 보충/구체화 (LLM으로 더 자세하게 묘사)
    let enhancedKorean = koreanPrompt;
    try {
      const enhanceKoreanResponse = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [
          {
            role: "system",
            content: "당신은 AI 이미지 생성을 위한 프롬프트 전문가입니다. 사용자의 간단한 한국어 설명을 받아, 이미지 생성에 최적화되도록 더 구체적이고 풍부하게 한국어로 확장해주세요. 조명, 구도, 분위기, 스타일, 텍스처, 색감 등 시각적 디테일을 추가하세요. 설명만 출력하고 다른 말은 하지 마세요.",
          },
          {
            role: "user",
            content: koreanPrompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      if (typeof enhanceKoreanResponse === 'string') {
        enhancedKorean = enhanceKoreanResponse;
      } else if (enhanceKoreanResponse && typeof enhanceKoreanResponse === 'object') {
        if ('response' in enhanceKoreanResponse && typeof (enhanceKoreanResponse as any).response === 'string') {
          enhancedKorean = (enhanceKoreanResponse as any).response;
        } else if ('generated_text' in enhanceKoreanResponse && typeof (enhanceKoreanResponse as any).generated_text === 'string') {
          enhancedKorean = (enhanceKoreanResponse as any).generated_text;
        } else if ('text' in enhanceKoreanResponse && typeof (enhanceKoreanResponse as any).text === 'string') {
          enhancedKorean = (enhanceKoreanResponse as any).text;
        }
      }
    } catch {
      enhancedKorean = koreanPrompt;
    }

    // 2단계: 보충된 한국어 프롬프트를 영어로 번역
    let translated = enhancedKorean;
    try {
      const translateResponse = await env.AI.run("@cf/huggingface/helsinki-nlp/opus-mt-ko-en", {
        text: enhancedKorean,
      });
      if (typeof translateResponse === 'string') {
        translated = translateResponse;
      } else if (translateResponse && typeof translateResponse === 'object') {
        if ('translation' in translateResponse && typeof (translateResponse as any).translation === 'string') {
          translated = (translateResponse as any).translation;
        } else if ('translation_text' in translateResponse && typeof (translateResponse as any).translation_text === 'string') {
          translated = (translateResponse as any).translation_text;
        } else if ('generated_text' in translateResponse && typeof (translateResponse as any).generated_text === 'string') {
          translated = (translateResponse as any).generated_text;
        } else if ('text' in translateResponse && typeof (translateResponse as any).text === 'string') {
          translated = (translateResponse as any).text;
        } else if (Array.isArray(translateResponse) && translateResponse.length > 0) {
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
    } catch {
      try {
        const translateResponse = await env.AI.run("@cf/meta/m2m100-1.2b", {
          text: enhancedKorean,
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
      } catch {
        translated = enhancedKorean;
      }
    }

    // 3단계: 영어 프롬프트 추가 보충 (이미지 생성 최적화)
    let finalEnglish = translated;
    try {
      const enhanceResponse = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [
          {
            role: "system",
            content: "You are a master artist who creates rich, evocative descriptions for AI image generation. Transform the given prompt into a lush, atmospheric visual narrative optimized for FLUX/SD models. Add lighting, composition, mood, style, texture, color details. Output ONLY the enhanced artistic English prompt as a single flowing paragraph. No explanations, just the prompt.",
          },
          {
            role: "user",
            content: translated
          }
        ],
        max_tokens: 500,
        temperature: 0.6,
      });

      if (typeof enhanceResponse === 'string') {
        finalEnglish = enhanceResponse;
      } else if (enhanceResponse && typeof enhanceResponse === 'object') {
        if ('response' in enhanceResponse && typeof (enhanceResponse as any).response === 'string') {
          finalEnglish = (enhanceResponse as any).response;
        } else if ('generated_text' in enhanceResponse && typeof (enhanceResponse as any).generated_text === 'string') {
          finalEnglish = (enhanceResponse as any).generated_text;
        } else if ('text' in enhanceResponse && typeof (enhanceResponse as any).text === 'string') {
          finalEnglish = (enhanceResponse as any).text;
        }
      }
    } catch {
      finalEnglish = translated;
    }

    return { korean: enhancedKorean.trim(), english: finalEnglish.trim() };
  } catch {
    return { korean: koreanPrompt, english: koreanPrompt };
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
    let koreanPrompt = '';
    let englishPrompt = '';
    const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
    if (koreanRegex.test(prompt)) {
      const result = await translateAndEnhancePrompt(prompt, env);
      koreanPrompt = result.korean;
      englishPrompt = result.english;
      prompt = englishPrompt;
    } else {
      englishPrompt = prompt;
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
      throw new Error("이미지 생성에 실패했습니다.");
    }

    return new Response(
      JSON.stringify({ image: base64Image, korean_prompt: koreanPrompt, english_prompt: englishPrompt }),
      { headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  } catch (e: any) {
    let errorMsg = e.message || "알 수 없는 오류가 발생했습니다.";
    if (errorMsg.includes("NSFW") || errorMsg.includes("3030")) {
      errorMsg = "콘텐츠 정책에 의해 차단되었습니다. 다른 프롬프트를 사용해 주세요.";
    }
    return new Response(
      JSON.stringify({ error: errorMsg }),
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

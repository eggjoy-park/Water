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
    .loading-steps {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      text-align: left;
      max-width: 280px;
      margin-left: auto;
      margin-right: auto;
    }
    .loading-step {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #555;
      transition: color 0.3s;
    }
    .loading-step.active {
      color: #667eea;
    }
    .loading-step.done {
      color: #4ade80;
    }
    .loading-step.done .step-icon {
      color: #4ade80;
    }
    .step-icon {
      font-size: 10px;
      transition: color 0.3s;
    }
    .step-label {
      font-size: 13px;
    }
    #loading-text {
      margin-bottom: 4px;
    }
    .prompt-comparison {
      margin-top: 20px;
      text-align: left;
    }
    .comparison-header {
      margin-bottom: 12px;
      text-align: center;
    }
    .comparison-badge {
      display: inline-block;
      padding: 4px 14px;
      background: linear-gradient(135deg, rgba(102,126,234,0.15), rgba(118,75,162,0.15));
      border: 1px solid rgba(102,126,234,0.3);
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      color: #667eea;
      letter-spacing: 0.3px;
    }
    .comparison-grid {
      display: flex;
      align-items: stretch;
      gap: 0;
    }
    .comparison-item {
      flex: 1;
      min-width: 0;
    }
    .comparison-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #aaa;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .label-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .original-dot { background: #ff6b6b; }
    .enhanced-dot { background: #4ade80; }
    .comparison-text {
      padding: 14px;
      background: #1a1a1a;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.5;
      color: #ccc;
      min-height: 80px;
      word-break: break-word;
    }
    .comparison-item.original .comparison-text {
      border-left: 3px solid #ff6b6b;
    }
    .comparison-item.enhanced .comparison-text {
      border-left: 3px solid #4ade80;
    }
    .comparison-arrow {
      display: flex;
      align-items: center;
      padding: 0 12px;
      font-size: 20px;
      color: #444;
      margin-top: 20px;
    }
    @media (max-width: 600px) {
      .comparison-grid {
        flex-direction: column;
      }
      .comparison-arrow {
        padding: 8px 0;
        justify-content: center;
        transform: rotate(90deg);
      }
    }
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
      <p id="loading-text">이미지 생성 중...</p>
      <div class="loading-steps" id="loading-steps">
        <div class="loading-step" id="step-enhance" data-step="1">
          <span class="step-icon">✦</span>
          <span class="step-label">한국어 프롬프트 보강 중...</span>
        </div>
        <div class="loading-step" id="step-translate" data-step="2">
          <span class="step-icon">✦</span>
          <span class="step-label">영어로 번역 중...</span>
        </div>
        <div class="loading-step" id="step-optimize" data-step="3">
          <span class="step-icon">✦</span>
          <span class="step-label">이미지 생성 최적화 중...</span>
        </div>
        <div class="loading-step" id="step-generate" data-step="4">
          <span class="step-icon">✦</span>
          <span class="step-label">이미지 생성 중...</span>
        </div>
      </div>
    </div>

    <div class="error" id="error"></div>

    <div class="result" id="result" style="display:none;">
      <div class="result-label">생성된 이미지</div>
      <img id="resultImg">
      
      <div class="prompt-comparison">
        <div class="comparison-header">
          <span class="comparison-badge">프롬프트 보강 결과</span>
        </div>
        <div class="comparison-grid">
          <div class="comparison-item original">
            <div class="comparison-label">
              <span class="label-dot original-dot"></span>
              원본 프롬프트
            </div>
            <div class="comparison-text" id="original-prompt-text"></div>
          </div>
          <div class="comparison-arrow">→</div>
          <div class="comparison-item enhanced">
            <div class="comparison-label">
              <span class="label-dot enhanced-dot"></span>
              보강된 한국어 프롬프트
            </div>
            <div class="comparison-text" id="displayed-korean-prompt"></div>
          </div>
        </div>
      </div>

      <div class="prompt-display">
        <div class="label">최종 영어 프롬프트:</div>
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

      // 로딩 단계 애니메이션
      var steps = ['step-enhance', 'step-translate', 'step-optimize', 'step-generate'];
      var currentStep = 0;
      var stepTimer = null;

      // 이전 단계 상태 초기화
      steps.forEach(function(s) {
        var el = document.getElementById(s);
        if (el) { el.classList.remove('active', 'done'); }
      });

      function advanceStep() {
        if (currentStep > 0) {
          var prev = document.getElementById(steps[currentStep - 1]);
          if (prev) { prev.classList.remove('active'); prev.classList.add('done'); }
        }
        if (currentStep < steps.length) {
          var curr = document.getElementById(steps[currentStep]);
          if (curr) { curr.classList.add('active'); }
          currentStep++;
          stepTimer = setTimeout(advanceStep, 1500);
        }
      }
      advanceStep();

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
        try { json = JSON.parse(text); } catch(e) { throw new Error('서버 오류가 발생했습니다.'); }

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
        document.getElementById('original-prompt-text').textContent = promptText;
        document.getElementById('displayed-korean-prompt').textContent = window._lastKoreanPrompt;
        document.getElementById('displayed-english-prompt').textContent = window._lastEnglishPrompt;
        result.style.display = 'block';
      } catch (e) {
        showError(e.message || '알 수 없는 오류가 발생했습니다.');
      } finally {
        if (stepTimer) clearTimeout(stepTimer);
        // 모든 단계 완료 처리
        steps.forEach(function(s) {
          var el = document.getElementById(s);
          if (el) { el.classList.remove('active'); el.classList.add('done'); }
        });
        btn.disabled = false;
        setTimeout(function() { loading.classList.remove('active'); }, 500);
      }
    }

    function showError(msg) {
      var el = document.getElementById('error');
      el.textContent = msg;
      el.classList.add('active');
    }

    document.getElementById('postToGalleryBtn').addEventListener('click', async function() {
      if (!window._lastBase64Image) { alert('이미지가 없습니다.'); return; }
      var password = prompt('비밀번호를 입력하세요 (나중에 수정/삭제 시 필요):');
      if (!password) return;
      var btn = this;
      btn.disabled = true;
      btn.textContent = '등록 중...';
      try {
        var base64 = window._lastBase64Image;
        var title = (window._lastEnglishPrompt || 'AI Generated Image').slice(0, 50);
        var content = '한국어: ' + (window._lastKoreanPrompt || '') + '\\n\\nEnglish: ' + (window._lastEnglishPrompt || '');
        var boardApiBase = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
          ? 'http://localhost:8787'
          : 'https://board-worker.eggjoy.workers.dev';
        var res = await fetch(boardApiBase + '/api/gallery/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title,
            content: content,
            image_url: 'data:image/png;base64,' + base64,
            password: password
          })
        });
        var data = await res.json();
        if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);
        var galleryUrl = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
          ? '/board/gallery.html?page=1'
          : 'https://board-worker.eggjoy.workers.dev/gallery.html?page=1';
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

async function readStreamToString(stream: ReadableStream): Promise<string> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    totalLength += value.length;
  }
  const bytes = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(bytes);
}

async function parseAIResponse(response: any): Promise<string> {
  if (typeof response === 'string') return response;
  if (response instanceof ReadableStream) {
    const text = await readStreamToString(response);
    try {
      const parsed = JSON.parse(text);
      if (parsed.response) return parsed.response;
      if (parsed.generated_text) return parsed.generated_text;
      if (parsed.text) return parsed.text;
      return text;
    } catch {
      return text;
    }
  }
  if (response && typeof response === 'object') {
    if ('response' in response && typeof response.response === 'string') return response.response;
    if ('generated_text' in response && typeof response.generated_text === 'string') return response.generated_text;
    if ('text' in response && typeof response.text === 'string') return response.text;
  }
  return '';
}

async function translateAndEnhancePrompt(koreanPrompt: string, env: Env): Promise<{ korean: string; english: string }> {
  try {
    // 1단계: 한국어 프롬프트 구체화
    let enhancedKorean = koreanPrompt;
    try {
      const raw = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
        messages: [
          {
            role: "user",
            content: `다음 한국어 설명을 AI 이미지 생성에 사용할 수 있도록 더 구체적이고 상세하게 묘사해줘. 피사체의 형태, 색상, 질감, 배경, 조명, 분위기, 예술 스타일 등을 추가하고, 한국어로 출력해줘. 설명만 출력해줘.\n\n원본: ${koreanPrompt}\n\n보강된 묘사:`
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const parsed = await parseAIResponse(raw);
      if (parsed && parsed.trim()) {
        enhancedKorean = parsed.trim();
      }
    } catch (e: any) {
      console.log("[Enhance-KO] Step 1 failed:", e.message);
      enhancedKorean = koreanPrompt;
    }

    // 2단계: 보충된 한국어 프롬프트를 영어로 번역
    let translated = enhancedKorean;
    try {
      const translateResponse = await env.AI.run("@cf/huggingface/helsinki-nlp/opus-mt-ko-en", {
        text: enhancedKorean,
      });
      const parsed = await parseAIResponse(translateResponse);
      if (parsed && parsed.trim()) {
        translated = parsed.trim();
      }
      // Also check for translation-specific fields
      if (translateResponse && typeof translateResponse === 'object' && !(translateResponse instanceof ReadableStream)) {
        const r = translateResponse as any;
        if (r.translation && typeof r.translation === 'string') translated = r.translation;
        if (r.translation_text && typeof r.translation_text === 'string') translated = r.translation_text;
      }
    } catch (e: any) {
      console.log("[Enhance-KO] Translation failed:", e.message);
      try {
        const translateResponse = await env.AI.run("@cf/meta/m2m100-1.2b", {
          text: enhancedKorean,
          source_lang: "ko",
          target_lang: "en",
        });
        const parsed = await parseAIResponse(translateResponse);
        if (parsed && parsed.trim()) {
          translated = parsed.trim();
        }
        if (translateResponse && typeof translateResponse === 'object' && !(translateResponse instanceof ReadableStream)) {
          const r = translateResponse as any;
          if (r.translation && typeof r.translation === 'string') translated = r.translation;
          if (r.translated_text && typeof r.translated_text === 'string') translated = r.translated_text;
        }
      } catch (e2: any) {
        console.log("[Enhance-KO] Fallback translation failed:", e2.message);
        translated = enhancedKorean;
      }
    }

    // 3단계: 영어 프롬프트 추가 보충 (이미지 생성 최적화)
    let finalEnglish = translated;
    try {
      const enhanceResponse = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
        messages: [
          {
            role: "user",
            content: `Take this English prompt and make it more detailed for AI image generation (FLUX model). Add specific details about: subject appearance, background, lighting, composition, mood, art style, and quality keywords (masterpiece, ultra-detailed, 8K). Output ONLY the enhanced prompt as one flowing paragraph. No explanations.

Input: ${translated}

Enhanced prompt:`
          }
        ],
        max_tokens: 500,
        temperature: 0.6,
      });

      const parsed = await parseAIResponse(enhanceResponse);
      if (parsed && parsed.trim()) {
        finalEnglish = parsed.trim();
      }
    } catch (e: any) {
      console.log("[Enhance-EN] English enhancement failed:", e.message);
      finalEnglish = translated;
    }

    return { korean: enhancedKorean.trim(), english: finalEnglish.trim() };
  } catch (e: any) {
    console.log("[Enhance] Top-level error:", e.message);
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
      headers: {
        "Content-Type": "text/html;charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache"
      },
    });
  },
} satisfies ExportedHandler<Env>;

/**
 * 갤러리 업로드 기능 테스트 스크립트
 * 이미지 생성 후 갤러리 등록이 제대로 작동하는지 확인합니다.
 */

const TEST_CONFIG = {
  imageWorkerUrl: 'http://localhost:8787',
  galleryWorkerUrl: 'http://localhost:46465',
  testPrompt: '아름다운 바다 위의 석양, 파스텔 색감',
  imageSize: '512x512'
};

async function testImageGeneration() {
  console.log('\n📸 [테스트 1] 이미지 생성...');
  
  try {
    const response = await fetch(`${TEST_CONFIG.imageWorkerUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: TEST_CONFIG.testPrompt,
        width: 512,
        height: 512
      })
    });

    if (!response.ok) {
      throw new Error(`API 오류: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`생성 실패: ${data.error}`);
    }

    if (!data.image) {
      throw new Error('이미지 데이터를 받지 못했습니다');
    }

    console.log('✅ 이미지 생성 성공');
    console.log(`   - 한국어 프롬프트: ${data.korean_prompt || 'N/A'}`);
    console.log(`   - 영어 프롬프트: ${data.english_prompt || 'N/A'}`);
    console.log(`   - Base64 크기: ${data.image.length} bytes`);

    return {
      success: true,
      image: data.image,
      koreanPrompt: data.korean_prompt || TEST_CONFIG.testPrompt,
      englishPrompt: data.english_prompt || ''
    };
  } catch (error) {
    console.error('❌ 이미지 생성 실패:', error.message);
    return { success: false, error: error.message };
  }
}

async function testGalleryUpload(imageResult) {
  if (!imageResult.success) {
    console.log('\n⏭️ [테스트 2] 갤러리 업로드 - 스킵됨 (이미지 생성 실패)');
    return;
  }

  console.log('\n📤 [테스트 2] 갤러리에 업로드...');

  // 이미지가 너무 크면 데이터 URL 사용 불가
  if (imageResult.image.length > 130000) {
    console.log('⚠️  이미지가 너무 커서 data URL로 저장 불가');
    console.log(`   - Base64 크기: ${imageResult.image.length} bytes (제한: 130000 bytes)`);
    return { success: false, reason: 'Image too large' };
  }

  try {
    const galleryData = {
      title: (imageResult.englishPrompt || 'AI Generated Image').slice(0, 50),
      content: `한국어: ${imageResult.koreanPrompt}\n\nEnglish: ${imageResult.englishPrompt || ''}`,
      image_url: `data:image/png;base64,${imageResult.image}`,
      password: 'gallery123'
    };

    console.log(`   📝 제목: ${galleryData.title}`);
    console.log(`   📄 내용 길이: ${galleryData.content.length} bytes`);
    console.log(`   🖼️  이미지: data URL (${galleryData.image_url.length} bytes)`);

    const response = await fetch(`${TEST_CONFIG.galleryWorkerUrl}/api/gallery/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(galleryData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    console.log('✅ 갤러리 업로드 성공');
    console.log(`   - 게시물 ID: ${result.id}`);
    console.log(`   - 메시지: ${result.message}`);

    return { success: true, postId: result.id };
  } catch (error) {
    console.error('❌ 갤러리 업로드 실패:', error.message);
    return { success: false, error: error.message };
  }
}

async function testGalleryFetch() {
  console.log('\n📖 [테스트 3] 갤러리 게시물 조회...');

  try {
    const response = await fetch(`${TEST_CONFIG.galleryWorkerUrl}/api/gallery/posts?page=1`);

    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`);
    }

    const data = await response.json();

    console.log('✅ 갤러리 조회 성공');
    console.log(`   - 총 게시물: ${data.total}`);
    console.log(`   - 현재 페이지: ${data.page}`);
    console.log(`   - 총 페이지: ${data.totalPages}`);
    console.log(`   - 이 페이지 게시물: ${data.posts.length}`);

    if (data.posts.length > 0) {
      console.log('\n   최근 게시물:');
      data.posts.slice(0, 3).forEach((post, idx) => {
        console.log(`   ${idx + 1}. [ID: ${post.id}] ${post.title}`);
        console.log(`      - 작성일: ${post.created_at}`);
        console.log(`      - 좋아요: ${post.like_count}`);
        console.log(`      - 댓글: ${post.comment_count}`);
      });
    }

    return { success: true, total: data.total, posts: data.posts };
  } catch (error) {
    console.error('❌ 갤러리 조회 실패:', error.message);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  갤러리 업로드 기능 종합 테스트       ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`\n설정:`);
  console.log(`  - 이미지 워커: ${TEST_CONFIG.imageWorkerUrl}`);
  console.log(`  - 갤러리 워커: ${TEST_CONFIG.galleryWorkerUrl}`);
  console.log(`  - 테스트 프롬프트: "${TEST_CONFIG.testPrompt}"`);

  // 테스트 1: 이미지 생성
  const imageResult = await testImageGeneration();

  // 테스트 2: 갤러리 업로드
  const uploadResult = imageResult.success ? await testGalleryUpload(imageResult) : { success: false };

  // 테스트 3: 갤러리 조회
  const galleryResult = await testGalleryFetch();

  // 최종 결과
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║        테스트 결과 요약              ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`\n✓ 이미지 생성: ${imageResult.success ? '통과 ✅' : '실패 ❌'}`);
  console.log(`✓ 갤러리 업로드: ${uploadResult?.success ? '통과 ✅' : '실패 ❌'}`);
  console.log(`✓ 갤러리 조회: ${galleryResult.success ? '통과 ✅' : '실패 ❌'}`);

  const allPassed = imageResult.success && uploadResult?.success && galleryResult.success;
  console.log(`\n${allPassed ? '🎉 모든 테스트 통과!' : '⚠️  일부 테스트 실패'}\n`);

  process.exit(allPassed ? 0 : 1);
}

// 테스트 실행
runAllTests().catch(err => {
  console.error('테스트 실행 중 오류:', err);
  process.exit(1);
});

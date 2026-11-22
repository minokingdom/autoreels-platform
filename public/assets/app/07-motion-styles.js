// AutoReels — 07-motion-styles.js  (public/index.html 에서 나눔. 일반 <script> 로 순서대로 불러오며 전역 이름을 공유함)
    // ==========================================================================
    // ★ 모션그래픽 엔진 — 기존 키트·장르와 별개로 처음부터 그리는 새 스타일 10종
    //   화면 구역을 고정해 겹치지 않게: 위 사진 무대(0~58%) · 자막(62~86%) · 이름 칩(91% 아래)
    // ==========================================================================
    const MOTION_ROWS = [
      // [id, 이름, 움직임, 글꼴, 바탕1, 바탕2, 강조색, 보조색, 밝은바탕]
      ['mo_blob', '리퀴드 블롭', 'blob', 'dohyeon', '#1e1b4b', '#4c1d95', '#f472b6', '#fde68a', false],
      ['mo_sweep', '키네틱 스윕', 'sweep', 'impact', '#0a0a0a', '#111827', '#facc15', '#ef4444', false],
      ['mo_tiles', '타일 플립', 'tiles', 'sans', '#0b1220', '#111c33', '#38bdf8', '#e0f2fe', false],
      ['mo_tunnel', '줌 터널', 'tunnel', 'gasoek', '#050505', '#18181b', '#a3e635', '#ffffff', false],
      ['mo_cards', '스와이프 카드', 'cards', 'jua', '#fff7ed', '#ffedd5', '#f97316', '#111111', true],
      ['mo_eq', '이퀄라이저 링', 'eq', 'gugi', '#020617', '#0f172a', '#22d3ee', '#f0abfc', false],
      ['mo_aurora', '오로라 플로트', 'aurora', 'sans', '#0f0a1e', '#1a1033', '#c084fc', '#67e8f9', false],
      ['mo_dots', '하프톤 웨이브', 'dots', 'bagel', '#fef08a', '#fde047', '#111111', '#ef4444', true],
      ['mo_number', '넘버 마스크', 'number', 'impact', '#111111', '#1f2937', '#fb7185', '#ffffff', false],
      ['mo_strips', '패럴랙스 스트립', 'strips', 'dohyeon', '#0c0a09', '#1c1917', '#fb923c', '#fef3c7', false],
      ['mo_circle', '서클 와이프', 'circle', 'sans', '#0a0a0a', '#18181b', '#34d399', '#ffffff', false],
      ['mo_ribbon', '리본 티커', 'ribbon', 'impact', '#111827', '#1e293b', '#facc15', '#f43f5e', false],
      ['mo_doors', '미러 도어', 'doors', 'serif', '#0c0a09', '#1c1917', '#d4af37', '#fef3c7', false],
      ['mo_bounce', '바운스 타이포', 'bounce', 'bagel', '#ecfeff', '#cffafe', '#0ea5e9', '#f43f5e', true],
      // 인스타·릴스 템플릿 감성
      ['ig_story', '인스타 스토리', 'story', 'sans', '#111111', '#262626', '#ff3d77', '#ffd600', false],
      ['ig_feed', '피드 포스트', 'feed', 'sans', '#fafafa', '#f1f1f1', '#ff3040', '#0095f6', true],
      ['ig_poll', '투표 스티커', 'poll', 'jua', '#7c3aed', '#db2777', '#ffffff', '#facc15', false],
      ['mo_vhs', 'VHS 캠코더', 'vhs', 'mono', '#050505', '#111111', '#ff3b3b', '#7dd3fc', false],
      ['mo_neon', '네온 사인', 'neon', 'dohyeon', '#0b0b12', '#141420', '#ff4fd8', '#4ff0ff', false],
      ['mo_scrap', '스크랩북 콜라주', 'scrap', 'gamja', '#f5efe6', '#ede3d3', '#e11d48', '#0f766e', true],
      ['mo_punch', '줌 펀치', 'punch', 'gasoek', '#000000', '#0a0a0a', '#ffffff', '#ff2d55', false],
      ['mo_cube', '큐브 플립', 'cube', 'sans', '#0f172a', '#1e1b4b', '#818cf8', '#f9a8d4', false],
      // 2026-11 캡컷 트렌드 분석(docs/motion-research)에서 온 4종
      ['mo_glow', '카메라 글로우', 'glow', 'serif', '#1a0f08', '#2b1709', '#fb923c', '#fde68a', false],
      ['mo_bokeh', '보케 스포트라이트', 'bokeh', 'sans', '#120a1c', '#1e1030', '#f0abfc', '#fde68a', false],
      ['mo_cinema', '시네마 레터박스', 'cinema', 'serif', '#000000', '#0c0a09', '#d4af37', '#f5f5f4', false],
      ['mo_credits', '엔딩 크레딧 롤', 'credits', 'sans', '#0a0a0c', '#111114', '#facc15', '#ffffff', false],
      // 2026-11 인스타 감성(카페·브이로그): 크림톤·필름 그레인·얇은 명조·작은 자막·여백·"— 가게명" 서명
      ['in_film', '크림 필름', 'in_film', 'maru', '#f3ece1', '#efe6d8', '#8a6a4f', '#2b2622', true],
      ['in_mood', '무드 풀샷', 'in_mood', 'maru', '#1a1512', '#120e0c', '#e8d5bc', '#ffffff', false],
      ['in_diary', '다이어리 노트', 'in_diary', 'pen', '#fbf8f1', '#f6f1e6', '#b07a5a', '#3b2f28', true],
      ['in_letter', '미니멀 레터', 'in_letter', 'pretL', '#f7f5f0', '#f2efe8', '#9a8f80', '#2a2724', true],
      ['in_vlog', '브이로그 타임스탬프', 'in_vlog', 'pretM', '#111111', '#0b0b0b', '#f5e6c8', '#ffffff', false],
      ['in_collage', '크림 콜라주', 'in_collage', 'maru', '#efe7da', '#e9dfcf', '#a0785a', '#2d2621', true],
      // 핀터레스트 "인스타 릴스 감성 템플릿"에서 자주 보이는 형식 (2026-11-14 확인)
      ['in_music', '뮤직 플레이어', 'in_music', 'maru', '#1a1512', '#120e0c', '#e8d5bc', '#ffffff', false],
      ['in_memo', '아이폰 메모', 'in_memo', 'pretM', '#fbfaf7', '#f7f5f0', '#e0a400', '#1c1c1e', true],
      ['in_lock', '잠금화면 시계', 'in_lock', 'pretL', '#111111', '#0b0b0b', '#ffffff', '#ffffff', false],
      ['in_dump', '포토덤프 리캡', 'in_dump', 'pen', '#f4efe6', '#efe8dc', '#c2603f', '#2d2621', true],
      ['in_cal', '캘린더 카드', 'in_cal', 'maru', '#f3ece1', '#efe6d8', '#c2603f', '#2b2622', true],
      // 제미나이 제안 인스타 감성 6종 (2026-11-14)
      ['in_h_plaque', '전시 캡션 카드', 'in_h_plaque', 'maru', '#f5efe6', '#ebe2d5', '#5c4d40', '#8c7a6b', true],
      ['in_h_panes', '세 갈래 시선', 'in_h_panes', 'gowun', '#1f1a17', '#14110f', '#e8dccb', '#b8a692', false],
      ['in_h_double', '이중노출 잔상', 'in_h_double', 'maruL', '#1c1815', '#120f0d', '#efe5d8', '#bca995', false],
      ['in_h_vinyl', '오후의 레코드', 'in_h_vinyl', 'gowun', '#efe7dc', '#e2d6c5', '#3d322a', '#8c7765', true],
      // 제미나이 제안 인스타 감성 6종 (2026-11-14)
  ['in_g_sub', '시네마 자막', 'in_g_sub', 'gowun', '#191512', '#120f0d', '#e6ccb2', '#ffffff', false],
  ['in_g_arch', '아치 무드', 'in_g_arch', 'maru', '#f6f1ea', '#eae1d5', '#8c735b', '#2b2520', true],
  ['in_g_strip', '필름 스트립', 'in_g_strip', 'pen', '#f3ede3', '#e6ddd0', '#7a634e', '#2d2621', true],
  ['in_g_postcard', '엽서 기록', 'in_g_postcard', 'gowun', '#f7f3ec', '#ece4d8', '#9c7e63', '#2c2520', true],
  ['in_g_cam', '뷰파인더', 'in_g_cam', 'pretL', '#1c1815', '#120f0d', '#d8c3a5', '#ffffff', false],
  ['in_g_bookmark', '책갈피 노트', 'in_g_bookmark', 'maruL', '#241e1a', '#171310', '#c7ad92', '#2b2622', false],
      // 인스타 일상 감성 6종: 밀착인화·리넨·잡지·책갈피·산책·창가
      ['in_x_contact', '필름 밀착인화', 'in_x_contact', 'pretL', '#eee6d8', '#e8ddcd', '#987354', '#332b25', true],
      ['in_x_linen', '리넨 위의 사진', 'in_x_linen', 'gowun', '#ece4d6', '#e5dbc9', '#92795f', '#3b342b', true],
      ['in_x_cover', '우리의 작은 잡지', 'in_x_cover', 'maru', '#241e19', '#17130f', '#deceb7', '#fff7e9', false],
      ['in_x_tabs', '붙여둔 한마디', 'in_x_tabs', 'pen', '#29251e', '#1d1914', '#b9bc9e', '#f6edda', false],
      ['in_x_walk', '골목 산책 기록', 'in_x_walk', 'pretL', '#262a22', '#191c17', '#cbd0b8', '#f8f3e7', false],
      ['in_x_window', '창가의 느린 오후', 'in_x_window', 'maruL', '#e7dece', '#ded2be', '#9c8768', '#40372d', true],
      // 인스타 일상 감성 2차 6종: 대화·세로분할·겹노출·찢은인화·사진음반·조각현상
      ['in_y_chat', '사진으로 건넨 말', 'in_y_chat', 'pretM', '#29241e', '#1b1814', '#d5c7a5', '#fcf5e8', false],
      ['in_y_torn', '손끝으로 찢은 풍경', 'in_y_torn', 'pen', '#f3ecdf', '#e8decc', '#b29374', '#fff8ea', true],
      ['in_y_mosaic', '조각조각 스며들다', 'in_y_mosaic', 'pretL', '#eee5d6', '#e3d6c2', '#aa8b6f', '#fff9ee', true],
      // 에디토리얼 · 감각적 릴스 5종
      ['ed_vogue', '보그 에디토리얼', 'ed_vogue', 'maru', '#0c0b0a', '#161412', '#e8d5bc', '#ffffff', false],
      ['ed_glasspill', '글래스 플로우', 'ed_glasspill', 'pretM', '#0b1018', '#141c2b', '#7dd3fc', '#ffffff', false],
      ['ed_kinetic', '키네틱 포스터', 'ed_kinetic', 'impact', '#09090b', '#18181b', '#facc15', '#ffffff', false],
      ['ed_arch', '아치 갤러리', 'ed_arch', 'maru', '#f4efe8', '#ebe3d7', '#9f7a54', '#2b2622', true],
      ['ed_duotone', '듀오톤 포스터', 'ed_duotone', 'dohyeon', '#111827', '#1f2937', '#fb7185', '#fef08a', false],
      // 비포·애프터 5종
      ['ba_slider', '슬라이더 와이프', 'ba_slider', 'pretM', '#0b0f19', '#111827', '#38bdf8', '#ffffff', false],
      ['ba_diagonal', '대각선 체인지', 'ba_diagonal', 'impact', '#09090b', '#18181b', '#facc15', '#ffffff', false],
      ['ba_collage', '나란히 비교', 'ba_collage', 'pretM', '#0f172a', '#1e293b', '#34d399', '#ffffff', false],
      ['ba_flash', '비포→애프터 전환', 'ba_flash', 'dohyeon', '#111111', '#1c1917', '#fb923c', '#ffffff', false],
      ['ba_polaroid', '스냅 비교 카드', 'ba_polaroid', 'maru', '#f4efe8', '#ebe3d7', '#c2603f', '#2b2622', true],
      // script-to-motion 스타일 4종 (감성 시네마틱 룩 · 절제된 키네틱 타이포)
      ['stm_kinetic', '시네마 키네틱', 'stm_kinetic', 'maru', '#0c0b0a', '#171411', '#e8d5bc', '#ffffff', false],
      ['stm_cinema', '시네마틱 룩', 'stm_cinema', 'gowun', '#09090b', '#141210', '#e6ccb2', '#ffffff', false],
      ['stm_sonar', '미니멀 펄스', 'stm_sonar', 'pretL', '#090d12', '#111822', '#cbd5e1', '#ffffff', false],
      ['stm_glint', '웜 필름 글로우', 'stm_glint', 'maruL', '#0d0b0a', '#1a1613', '#f3e5ab', '#ffffff', false],
      ['in_card_news', '한 장씩, 카드뉴스', 'in_card_news', 'sans', '#f6f1e7', '#efe7da', '#655644', '#29241e', true],
      // 카드뉴스 · 트렌드 릴스 6종 (2026-11 로컬 확장)
      ['cn_deck', '카드뉴스 · 스택 덱', 'cn_deck', 'pretM', '#f5f1ea', '#ebe4d8', '#1f2937', '#111827', true],
      ['cn_summary', '카드뉴스 · 핵심 요약', 'cn_summary', 'sans', '#0f172a', '#1e293b', '#38bdf8', '#ffffff', false],
      ['cn_boldquote', '카드뉴스 · 매거진 표지', 'cn_boldquote', 'maru', '#111215', '#1b1d22', '#e8d5bc', '#ffffff', false],
      ['cn_splitbar', '카드뉴스 · 컬러 배너', 'cn_splitbar', 'dohyeon', '#18181b', '#27272a', '#f97316', '#ffffff', false],
      ['stm_split', '모던 스플릿 프레임', 'stm_split', 'maruL', '#101012', '#1a1a1e', '#e5d4b7', '#ffffff', false],
      ['stm_ticket', '미니 바우처 티켓', 'stm_ticket', 'pretM', '#0b0d11', '#141820', '#4cc38a', '#ffffff', false],
      ['cn_timeline', '카드뉴스 · 4단계 타임라인', 'cn_timeline', 'sans', '#0f172a', '#1e293b', '#38bdf8', '#ffffff', false],
      ['cn_qna', '카드뉴스 · Q&A 가이드', 'cn_qna', 'pretM', '#faf7f2', '#f1ebe1', '#0ea5e9', '#0f172a', true],
      ['cn_compare', '카드뉴스 · 체크 포인트', 'cn_compare', 'sans', '#0b1612', '#11221c', '#10b981', '#ffffff', false],
      ['cn_receipt', '카드뉴스 · 클린 영수증', 'cn_receipt', 'pretM', '#f5f2eb', '#e8e2d5', '#18181b', '#18181b', true],
      ['cn_polaroid_duo', '카드뉴스 · 투컷 앨범', 'cn_polaroid_duo', 'maru', '#f3ede3', '#e7ded0', '#c2603f', '#292524', true],
      ['stm_glassbar', '글래스 캡션 바', 'stm_glassbar', 'pretM', '#0b0e14', '#131924', '#38bdf8', '#ffffff', false],
      // Prompt Motion 연구에서 착안한 자체 Canvas 연출. 런타임 생성 API 없음.
      ['ty_mask', '마스크 리빌', 'ty_mask', 'sans', '#111214', '#1d1d20', '#e9e1d3', '#ffffff', false],
      ['ty_focus', '워드 포커스', 'ty_focus', 'sans', '#111214', '#1d1d20', '#d5f185', '#ffffff', false],
      ['ty_spring', '스프링 스택', 'ty_spring', 'dohyeon', '#111214', '#1d1d20', '#f3d4bd', '#ffffff', false],
      ['in_lookbook_still', '룩북 · 고정 카드', 'in_lookbook_still', 'maru', '#eeeae2', '#e9e2d7', '#354e63', '#232722', true],
      ['in_brush_seal', '붓끝 낙관', 'in_brush_seal', 'brush', '#211c17', '#372b23', '#ae3126', '#f8f1e5', false],
      ['in_brush_letter', '여백에 쓴 편지', 'in_brush_letter', 'brush', '#201d18', '#383328', '#963629', '#fff6e3', false],
      ['in_brush_postcard', '한 폭의 엽서', 'in_brush_postcard', 'brush', '#ede4d4', '#d0c5b0', '#a92c21', '#fff8ea', true],
      // 2026 하이엔드 에디토리얼 큐레이션 30종 (고급·감성·브이로그·타이포·카드뉴스·비포애프터·손글씨)
      ['ed_obsidian', '옵시디언 에디토리얼', 'ed_vogue', 'maru', '#080808', '#141311', '#f4f0e8', '#ffffff', false],
      ['ed_ivory_note', '웜 아이보리 노트', 'in_letter', 'pretL', '#f2ede4', '#e8e0d3', '#141210', '#2b2622', true],
      ['ed_leica_sub', '라이카 시네마 자막', 'in_g_sub', 'gowun', '#0b0a09', '#161310', '#e6d5b8', '#f4f0e8', false],
      ['ed_keynote_mask', '키노트 타이포 마스크', 'ty_mask', 'sans', '#0a0a0b', '#161618', '#f5f5f4', '#ffffff', false],
      ['ed_aesop_arch', '아틀리에 아치', 'ed_arch', 'maru', '#ede6da', '#e2d8c7', '#2c2621', '#2c2621', true],
      // 고급 · 럭셔리 · 시네마 5종
      ['ed_monolith', '모노리스 블랙', 'stm_cinema', 'maru', '#060606', '#121212', '#e8e4dc', '#ffffff', false],
      ['ed_champagne_cover', '샴페인 매거진', 'in_x_cover', 'maruL', '#171411', '#241f1a', '#d9c29c', '#faf5ec', false],
      ['ed_noir_double', '누아르 이중노출', 'in_h_double', 'gowun', '#0b0c0e', '#15171b', '#d8d4cc', '#f5f5f4', false],
      ['ed_gallery_plaque', '갤러리 모노 캡션', 'in_h_plaque', 'pretL', '#f3f1ec', '#e7e4dc', '#1c1b19', '#6e6a63', true],
      ['ed_velvet_quote', '벨벳 에디토리얼', 'cn_boldquote', 'maru', '#120e10', '#1e171a', '#e5ccb8', '#faf4ef', false],
      // 감성 · 카페 · 필름 · 공간 6종
      ['ed_kodak_film', '코닥 35mm 필름', 'in_film', 'gowun', '#efe6d8', '#e4d7c3', '#8f5c38', '#261f1a', true],
      ['ed_kyoto_window', '교토 창가 오후', 'in_x_window', 'maruL', '#e8e2d5', '#dcd3c2', '#6b5b47', '#2f2a24', true],
      ['ed_seoul_postcard', '성수 엽서 무드', 'in_g_postcard', 'pen', '#f5efe4', '#eae0cf', '#9c563a', '#2c241e', true],
      ['ed_matcha_linen', '말차 리넨 노트', 'in_letter', 'pretL', '#eef0e8', '#e2e6da', '#4a5d43', '#22291f', true],
      ['ed_espresso_mood', '에스프레소 다크', 'in_mood', 'maru', '#140f0c', '#211813', '#d4b08c', '#f7f0e6', false],
      ['ed_vinyl_lounge', '재즈 바이닐 라운지', 'in_h_vinyl', 'gowun', '#1b1613', '#28201b', '#dfb88a', '#f5ece0', false],
      // 브이로그 · 일상 · 다이닝 · 뷰티 5종
      ['ed_seoul_vlog', '서울 데일리 브이로그', 'in_vlog', 'pretM', '#0f1012', '#1a1c20', '#e8dfc8', '#ffffff', false],
      ['ed_strip_35mm', '35mm 시네마 스트립', 'in_g_strip', 'pretL', '#121110', '#1d1b19', '#e0d3be', '#f5f0e8', false],
      ['ed_glass_pov', '클린 글래스 POV', 'ed_glasspill', 'pretM', '#0c1116', '#151e26', '#e2e8f0', '#ffffff', false],
      ['ed_triple_frame', '쓰리컷 룩북', 'in_h_panes', 'maru', '#f4efe7', '#e9e1d4', '#38322c', '#7d7267', true],
      ['ed_arch_salon', '살롱 소프트 아치', 'in_g_arch', 'maruL', '#f7f2ec', '#ede4da', '#8f6f58', '#2c2520', true],
      // 타이포 · 키네틱 · 모던 스위스 4종
      ['ed_swiss_focus', '스위스 워드 포커스', 'ty_focus', 'sans', '#0a0a0a', '#171717', '#f4f0e8', '#ffffff', false],
      ['ed_kinetic_mono', '모노 키네틱 컷', 'stm_kinetic', 'sans', '#09090b', '#16161a', '#e4e4e7', '#ffffff', false],
      ['ed_spring_cream', '크림 스프링 타이포', 'ty_spring', 'pretM', '#f4efe6', '#eae2d4', '#181715', '#181715', true],
      ['ed_split_studio', '스튜디오 스플릿', 'stm_split', 'pretL', '#0e0d0c', '#191715', '#dfd3c0', '#f5f0e8', false],
      // 카드뉴스 · 정보 · 비포애프터 · 손글씨 5종
      ['ed_editorial_deck', '에디토리얼 카드 덱', 'cn_deck', 'maru', '#f6f2eb', '#ebe4d8', '#1c1917', '#1c1917', true],
      ['ed_cafe_receipt', '성수 영수증 카드', 'cn_receipt', 'pretM', '#f7f4ee', '#ebe5d9', '#292524', '#292524', true],
      ['ed_duo_lookbook', '투컷 필름 앨범', 'cn_polaroid_duo', 'gowun', '#f2ece2', '#e6ddd0', '#8a5a44', '#2b241f', true],
      ['ed_clean_slider', '클린 비포·애프터', 'ba_slider', 'pretM', '#0b0c0e', '#16181c', '#e8e4dc', '#ffffff', false],
      ['ed_ink_seal', '먹빛 캘리 낙관', 'in_brush_seal', 'brush', '#181614', '#26221e', '#c04632', '#f5efe2', false],
    ];
    // ★ 2026 1군 풀스크린 릴스 전용 모션 엔진 6종 (9:16 풀스크린 · 모션 물리 · 인스타/쇼츠 Safe Zone 준수)
    const PRO_REELS_ROWS = [
      ['pro_rhythm_editorial', '프로 리듬 · 4단 구도 변화', 'pro_rhythm_editorial', 'maru', '#09090b', '#141418', '#e8d5bc', '#ffffff', false, '고급', '컷마다 풀스크린 → 블러 액자 → 2분할 스플릿 → 와이드 시네마로 구도 전환 + 렌즈 포커스 풀'],
      ['pro_focus_cinema', '포커스 풀 · 시네마 리듬', 'pro_focus_cinema', 'gowun', '#0b0a09', '#171512', '#f2e4cc', '#ffffff', false, '감성', '렌즈 초점 포커스 풀 + 컷별 액자·스플릿 구도 변화 + 35mm 필름 그레인'],
      ['pro_karaoke', '단어 하이라이트 · 훅 자막', 'pro_karaoke', 'sans', '#080808', '#141414', '#f4f0e8', '#ffffff', false, '타이포', '말하는 단어에 맞춰 실시간 하이라이트 · 0.18초 펀치 컷'],
      ['pro_film_sub', '시네마 풀스크린 자막', 'pro_film_sub', 'gowun', '#090908', '#141311', '#e6d5b8', '#f4f0e8', false, '고급', '풀스크린 35mm 필름 그레인 · 안전 영역 명조 자막'],
      ['pro_punch_hook', '0.2초 펀치 컷 · 키네틱', 'pro_punch_hook', 'sans', '#080809', '#141518', '#facc15', '#ffffff', false, '타이포', '빠른 줌 펀치 · 줄별 마스크 슬라이드 · 라이브 진행 바'],
      ['pro_editorial_center', '매거진 센터 타이포', 'pro_editorial_center', 'maru', '#080808', '#131210', '#f4f0e8', '#ffffff', false, '고급', '풀스크린 중앙 명조 타이포 · 1px 헤어라인 에디토리얼'],
      ['pro_pov_caption', '인스타 감성 POV 자막', 'pro_pov_caption', 'pretM', '#0b0b0c', '#161618', '#f4f0e8', '#ffffff', false, '브이로그', '네이티브 릴스 글래스 캡슐 · 핸드헬드 미세 호흡'],
      ['pro_split_reveal', '커튼 와이프 · 컷 전환', 'pro_split_reveal', 'pretM', '#090a0c', '#15171c', '#f4f0e8', '#ffffff', false, '비포·애프터', '이전 컷 위로 미끄러지는 커튼 와이프 · 좌하단 안전 자막'],
      ['pro_handwrite', '감성 손글씨 · 필름 드로잉', 'pro_handwrite', 'pen', '#0c0a09', '#191512', '#e8d5bc', '#f8f3ea', false, '손글씨', '풀스크린 35mm 필름 위 써 내려가는 손글씨 · 드로잉 밑줄'],
      ['pro_trend_sticker', '트렌디 감성 · 타임스탬프', 'pro_trend_sticker', 'gowun', '#0a0a09', '#171513', '#f2e4cc', '#ffffff', false, '감성', '2026 인스타 릴스 감성 날짜 스탬프 · 부드러운 자막 플로트'],
      ['pro_glass_card', '글래스모피즘 · 모던 카드', 'pro_glass_card', 'pretM', '#090a0f', '#151822', '#e2e8f0', '#ffffff', false, '브이로그', '반투명 다크 글래스 플로팅 카드 · 1px 헤어라인 보더'],
      ['pro_neon_pulse', '미드나잇 에디토리얼 · 포인트 바', 'pro_neon_pulse', 'sans', '#07080d', '#111420', '#38bdf8', '#ffffff', false, '타이포', '좌측 수직 포인트 바 · 고대비 에디토리얼 타이포'],
      ['pro_magazine_cover', '보그 · 럭셔리 매거진 커버', 'pro_magazine_cover', 'maru', '#090807', '#161412', '#e8d5bc', '#f8f3ea', false, '고급', '상단 매거진 마스트헤드 라인 · 하단 명조 에디토리얼'],
      ['pro_warm_diary', '따뜻한 브이로그 · 크림 일기', 'pro_warm_diary', 'gowun', '#120e0b', '#1f1914', '#f8f3ea', '#231b15', false, '감성', '따뜻한 필름 톤 · 크림 라운드 자막 캡슐'],
      ['pro_bold_badge', '숏폼 임팩트 · 형광펜 강조', 'pro_bold_badge', 'sans', '#08080a', '#14151a', '#facc15', '#111111', false, '타이포', '핵심 문장 뒤 붓터치 형광펜 하이라이트 · 빠른 펀치 줌'],
      ['pro_minimal_mono', '라이카 모노크롬 · 미니멀 흑백', 'pro_minimal_mono', 'maru', '#060606', '#141414', '#e5e5e5', '#ffffff', false, '고급', '고대비 흑백 시네마 필름 · 미니멀 자막과 얇은 진행 바']
    ];
    // 모션 디자인도 별도 분류를 만들지 않고 기존 분류에 넣음
    const MOTION_CAT = {
      in_brush_seal: '손글씨', in_brush_letter: '손글씨', in_brush_postcard: '손글씨',
      ty_mask: '타이포', ty_focus: '타이포', ty_spring: '타이포',
      mo_blob: '재미', mo_sweep: '타이포', mo_tiles: '테크', mo_tunnel: '스포츠', mo_cards: '브이로그', mo_eq: '재미',
      mo_aurora: '감성', mo_dots: '재미', mo_number: '특가', mo_strips: '브이로그', mo_circle: '고급', mo_ribbon: '뉴스·방송',
      mo_doors: '고급', mo_bounce: '타이포', ig_story: '브이로그', ig_feed: '브이로그', ig_poll: '재미', mo_vhs: '브이로그',
      mo_neon: '재미', mo_scrap: '감성', mo_punch: '스포츠', mo_cube: '테크', mo_glow: '감성', mo_bokeh: '고급',
      mo_cinema: '고급', mo_credits: '뉴스·방송',
      in_film: '감성', in_mood: '감성', in_diary: '감성', in_letter: '감성', in_vlog: '브이로그', in_collage: '브이로그',
      in_g_sub: '브이로그', in_g_arch: '감성', in_g_strip: '브이로그', in_g_postcard: '감성', in_g_cam: '브이로그', in_g_bookmark: '감성',
      in_h_plaque: '감성', in_h_panes: '감성', in_h_double: '감성', in_h_vinyl: '감성',
      in_music: '감성', in_memo: '브이로그', in_lock: '감성', in_dump: '브이로그', in_cal: '감성',
      in_x_contact: '브이로그', in_x_linen: '감성', in_x_cover: '감성', in_card_news: '카드뉴스', in_lookbook_still: '카드뉴스',
      in_x_tabs: '브이로그', in_x_walk: '브이로그', in_x_window: '감성',
      in_y_chat: '브이로그', 
      in_y_torn: '감성', in_y_mosaic: '브이로그',
      ed_vogue: '고급', ed_glasspill: '브이로그', ed_kinetic: '타이포', ed_arch: '감성', ed_duotone: '타이포',
      ed_obsidian: '고급', ed_ivory_note: '감성', ed_leica_sub: '고급', ed_keynote_mask: '타이포', ed_aesop_arch: '감성',
      ed_monolith: '고급', ed_champagne_cover: '고급', ed_noir_double: '고급', ed_gallery_plaque: '고급', ed_velvet_quote: '고급',
      ed_kodak_film: '감성', ed_kyoto_window: '감성', ed_seoul_postcard: '감성', ed_matcha_linen: '감성', ed_espresso_mood: '감성', ed_vinyl_lounge: '감성',
      ed_seoul_vlog: '브이로그', ed_strip_35mm: '브이로그', ed_glass_pov: '브이로그', ed_triple_frame: '브이로그', ed_arch_salon: '감성',
      ed_swiss_focus: '타이포', ed_kinetic_mono: '타이포', ed_spring_cream: '타이포', ed_split_studio: '카드뉴스',
      ed_editorial_deck: '카드뉴스', ed_cafe_receipt: '카드뉴스', ed_duo_lookbook: '카드뉴스', ed_clean_slider: '비포·애프터', ed_ink_seal: '손글씨',
      stm_kinetic: '타이포', stm_cinema: '고급', stm_sonar: '테크', stm_glint: '고급',
      cn_deck: '카드뉴스', cn_summary: '카드뉴스', cn_boldquote: '카드뉴스', cn_splitbar: '카드뉴스',
      cn_timeline: '카드뉴스', cn_qna: '카드뉴스', cn_compare: '카드뉴스', cn_receipt: '카드뉴스', cn_polaroid_duo: '카드뉴스',
      stm_split: '카드뉴스', stm_ticket: '카드뉴스', stm_glassbar: '브이로그',
      ba_slider: '비포·애프터', ba_diagonal: '비포·애프터', ba_collage: '비포·애프터', ba_flash: '비포·애프터', ba_polaroid: '비포·애프터'
    };
    const AR_MOTION_ADDED_AT = {"ed_vogue": "2026-11-14T06:25:59Z", "ed_glasspill": "2026-11-14T06:25:59Z", "ed_kinetic": "2026-11-14T06:25:59Z", "ed_arch": "2026-11-14T06:25:59Z", "ed_duotone": "2026-11-14T06:25:59Z", "stm_kinetic": "2026-11-14T17:02:21Z", "stm_cinema": "2026-11-14T17:02:21Z", "stm_sonar": "2026-11-14T17:02:21Z", "stm_glint": "2026-11-14T17:02:21Z", "stm_split": "2026-11-17T05:14:07Z", "stm_ticket": "2026-11-17T05:14:07Z", "stm_glassbar": "2026-11-17T05:14:07Z",
      in_brush_seal: '2026-11-19T09:41:00Z', in_brush_letter: '2026-11-19T09:41:00Z', in_brush_postcard: '2026-11-19T09:41:00Z',
      in_lookbook_still: "2026-11-18T15:53:11Z",
      ed_obsidian: "2026-11-20T07:30:00Z", ed_ivory_note: "2026-11-20T07:30:00Z", ed_leica_sub: "2026-11-20T07:30:00Z", ed_keynote_mask: "2026-11-20T07:30:00Z", ed_aesop_arch: "2026-11-20T07:30:00Z",
      ed_monolith: "2026-11-20T07:38:00Z", ed_champagne_cover: "2026-11-20T07:38:00Z", ed_noir_double: "2026-11-20T07:38:00Z", ed_gallery_plaque: "2026-11-20T07:38:00Z", ed_velvet_quote: "2026-11-20T07:38:00Z",
      ed_kodak_film: "2026-11-20T07:38:00Z", ed_kyoto_window: "2026-11-20T07:38:00Z", ed_seoul_postcard: "2026-11-20T07:38:00Z", ed_matcha_linen: "2026-11-20T07:38:00Z", ed_espresso_mood: "2026-11-20T07:38:00Z", ed_vinyl_lounge: "2026-11-20T07:38:00Z",
      ed_seoul_vlog: "2026-11-20T07:38:00Z", ed_strip_35mm: "2026-11-20T07:38:00Z", ed_glass_pov: "2026-11-20T07:38:00Z", ed_triple_frame: "2026-11-20T07:38:00Z", ed_arch_salon: "2026-11-20T07:38:00Z",
      ed_swiss_focus: "2026-11-20T07:38:00Z", ed_kinetic_mono: "2026-11-20T07:38:00Z", ed_spring_cream: "2026-11-20T07:38:00Z", ed_split_studio: "2026-11-20T07:38:00Z",
      ed_editorial_deck: "2026-11-20T07:38:00Z", ed_cafe_receipt: "2026-11-20T07:38:00Z", ed_duo_lookbook: "2026-11-20T07:38:00Z", ed_clean_slider: "2026-11-20T07:38:00Z", ed_ink_seal: "2026-11-20T07:38:00Z"
    };
    const MOTION_DESIGNS = MOTION_ROWS.map((r, i) => ({
      id: r[0], name: r[1], addedAt: AR_MOTION_ADDED_AT[r[0]], cat: MOTION_CAT[r[0]] || '재미', engine: 'motion', mstyle: r[2], font: r[3],
      bg1: r[4], bg2: r[5], accent: r[6], accent2: r[7], light: r[8], seed: 900 + i, genre: 'motion', grade: 'none', label: r[1],
      insta: String(r[0]).startsWith('in_') || String(r[0]).startsWith('ed_'), // 인스타·2026 에디토리얼 큐레이션 팔레트 유지
      desc: r[2] === 'in_lookbook_still' ? '한 컷 동안 사진과 문구 고정 · 컷 경계에서 바로 전환' : `모션그래픽 · ${r[1]}`
    }));
    const PRO_REELS_DESIGNS = PRO_REELS_ROWS.map((r, i) => ({
      id: r[0], name: r[1], addedAt: '2026-11-20T07:55:00Z', cat: r[9] || '고급', engine: 'motion', mstyle: r[2], font: r[3],
      bg1: r[4], bg2: r[5], accent: r[6], accent2: r[7], light: r[8], seed: 1800 + i, genre: 'motion', grade: 'none', label: r[1],
      insta: true, isTrend: true, isProReels: true, desc: r[10] || r[1]
    }));

    // ★ 코드 기반 인포그래픽 · 키노트 · 스위스 그리드 · 키네틱 화풍 30종 (6개 전용 캔버스 엔진 × 5개 아트 디렉션)
    const OPUS_ART_ROWS = [
      // 1) 다크테크 · 애플 키노트 인포그래픽 5종
      ['op_keynote_obsidian', '키노트 · 옵시디언 다크', 'op_keynote', 'sans', '#08090d', '#131620', '#60a5fa', '#ffffff', false, '테크', '다크테크 키노트 무대 · 라운드 쇼케이스 창 · 상단 인덱스 바'],
      ['op_keynote_cobalt', '테크 브리핑 · 코발트', 'op_keynote', 'pretM', '#070b14', '#101a2e', '#38bdf8', '#f0f9ff', false, '테크', '딥 코발트 브리핑 무대 · 선명한 테크 인포그래픽'],
      ['op_keynote_emerald', '핀테크 인사이트 · 에메랄드', 'op_keynote', 'sans', '#060d0b', '#0d1d17', '#34d399', '#ecfdf5', false, '테크', '에메랄드 데이터 리포트 · 미니멀 프로그레스 틱'],
      ['op_keynote_amber', '프리미엄 리포트 · 샴페인', 'op_keynote', 'maru', '#0c0a08', '#1a1510', '#e8c488', '#faf5ec', false, '고급', '럭셔리 프레젠테이션 · 샴페인 골드 포인트'],
      ['op_keynote_white', '클린 키노트 · 퓨어 화이트', 'op_keynote', 'pretM', '#f5f5f7', '#e8e8ed', '#1d4ed8', '#111114', true, '카드뉴스', '애플 화이트 키노트 · 깔끔한 섀도우 쇼케이스'],
      // 2) 스위스 인터내셔널 타이포 · 모던 그리드 5종
      ['op_swiss_red', '스위스 그리드 · 레드', 'op_swiss', 'sans', '#f4f2ec', '#eae6dc', '#dc2626', '#141414', true, '타이포', '스위스 국제 타이포 · 1px 그리드 라인 · 강렬한 레드 포인트'],
      ['op_swiss_mono', '스위스 아키텍처 · 모노', 'op_swiss', 'pretM', '#0e0e10', '#18181c', '#e4e4e7', '#ffffff', false, '타이포', '모노크롬 건축 그리드 · 정교한 비대칭 레이아웃'],
      ['op_swiss_cream', '바우하우스 · 웜 크림', 'op_swiss', 'maru', '#f3ede2', '#e7decb', '#c2410c', '#1c1917', true, '감성', '바우하우스 크림 그리드 · 절제된 에디토리얼 타이포'],
      ['op_swiss_navy', '네이비 매거진 · 그리드', 'op_swiss', 'sans', '#0b1220', '#131f36', '#93c5fd', '#f8fafc', false, '고급', '딥 네이비 그리드 · 비즈니스·금융·부동산 최적화'],
      ['op_swiss_sage', '세이지 스튜디오 · 그리드', 'op_swiss', 'gowun', '#edf1eb', '#dfe6dc', '#3f6249', '#1b261e', true, '감성', '차분한 세이지 그린 그리드 · 카페·인테리어·클리닉'],
      // 3) 인포그래픽 설명 카드 · STEP 넘버링 5종
      ['op_info_slate', '인포 카드 · 슬레이트 브리핑', 'op_infocard', 'pretM', '#0f131a', '#181f2b', '#60a5fa', '#ffffff', false, '카드뉴스', '블러 배경 위 플로팅 STEP 넘버링 설명 카드'],
      ['op_info_ivory', '매거진 팁카드 · 아이보리', 'op_infocard', 'maru', '#f6f2ea', '#ebe4d6', '#9a6b42', '#1f1a16', true, '카드뉴스', '아이보리 2단 팁카드 · 깔끔한 밑줄 강조'],
      ['op_info_mint', '클리닉·웰니스 · 소프트 민트', 'op_infocard', 'pretM', '#eff7f4', '#e0efe9', '#0d9488', '#132a26', true, '카드뉴스', '신뢰감 있는 민트 인포그래픽 · 병원·뷰티·학원'],
      ['op_info_coral', '트렌드 랭킹 · 코랄 포인트', 'op_infocard', 'sans', '#141012', '#22181c', '#fb7185', '#fff1f2', false, '카드뉴스', '시선을 끄는 코랄 넘버링 랭킹 카드'],
      ['op_info_charcoal', '비즈니스 요약 · 차콜', 'op_infocard', 'sans', '#121214', '#1d1d22', '#facc15', '#ffffff', false, '카드뉴스', '차콜 다크 브리핑 카드 · 옐로 하이라이트'],
      // 4) 키네틱 타이포 · 세그먼트 프로그레스 5종
      ['op_kin_volt', '키네틱 훅 · 일렉트릭 라임', 'op_kinetic_bar', 'sans', '#08090a', '#131618', '#a3e635', '#ffffff', false, '타이포', '풀스크린 다크 그레이드 · 좌측 라임 바 · 단어별 키네틱'],
      ['op_kin_crimson', '임팩트 브리핑 · 크림슨', 'op_kinetic_bar', 'sans', '#0b0809', '#191114', '#f43f5e', '#ffffff', false, '타이포', '강렬한 크림슨 액센트 바 · 숏폼 훅 최적화'],
      ['op_kin_cyan', '퓨처 테크 · 시안 라인', 'op_kinetic_bar', 'pretM', '#060b10', '#0e1722', '#22d3ee', '#ecfeff', false, '테크', '선명한 시안 키네틱 타이포 · 하단 컷 세그먼트 바'],
      ['op_kin_gold', '하이엔드 쇼룸 · 골드 바', 'op_kinetic_bar', 'maru', '#0a0907', '#17140f', '#e5c17b', '#faf6ee', false, '고급', '샴페인 골드 키네틱 · 수입차·럭셔리 브랜드'],
      ['op_kin_snow', '미니멀 키네틱 · 퓨어 화이트', 'op_kinetic_bar', 'pretM', '#09090b', '#16161a', '#ffffff', '#ffffff', false, '타이포', '군더더기 없는 화이트 키네틱 · 모든 업종 만능'],
      // 5) 에디토리얼 60/40 스플릿 룩북 5종
      ['op_split_linen', '에디토리얼 스플릿 · 웜 리넨', 'op_editorial_split', 'maru', '#f3ede3', '#e7decb', '#8c6239', '#241e19', true, '감성', '상단 60% 사진 · 하단 40% 리넨 에디토리얼 여백'],
      ['op_split_noir', '누아르 룩북 · 매트 블랙', 'op_editorial_split', 'maru', '#0a0a0c', '#141418', '#e2d4be', '#ffffff', false, '고급', '매트 블랙 60/40 스플릿 · 명품 룩북 감성'],
      ['op_split_espresso', '카페 무드 · 에스프레소', 'op_editorial_split', 'gowun', '#1b1410', '#291e17', '#d9a773', '#f8f1e7', false, '감성', '깊은 에스프레소 매트 스플릿 · 카페·베이커리'],
      ['op_split_blush', '뷰티 룩북 · 소프트 로즈', 'op_editorial_split', 'gowun', '#f9f1f1', '#f0e2e2', '#be6a7a', '#2b1d20', true, '감성', '부드러운 로즈 블러쉬 스플릿 · 뷰티·에스테틱'],
      ['op_split_forest', '보태니컬 · 딥 포레스트', 'op_editorial_split', 'maru', '#0e1915', '#172922', '#86c5a3', '#eef7f2', false, '고급', '차분한 딥 그린 스플릿 · 인테리어·플라워·클리닉'],
      // 6) 시네마틱 아트 프레임 · 필름 갤러리 5종
      ['op_cine_leica', '라이카 아트 · 실버 모노', 'op_cinema_frame', 'maru', '#090909', '#141414', '#d4d4d8', '#ffffff', false, '고급', '블러 배경 위 4:5 흑백 아트 프레임 · 필름 카운터'],
      ['op_cine_sunset', '선셋 필름 · 웜 앰버', 'op_cinema_frame', 'gowun', '#140e0a', '#211610', '#f59e0b', '#fef3c7', false, '감성', '따뜻한 노을빛 4:5 시네마 프레임'],
      ['op_cine_midnight', '미드나잇 시네마 · 딥 블루', 'op_cinema_frame', 'pretM', '#070b14', '#0f172a', '#60a5fa', '#f1f5f9', false, '브이로그', '도회적 야경 톤 4:5 시네마 액자'],
      ['op_cine_kyoto', '교토 페이퍼 · 베이지', 'op_cinema_frame', 'maru', '#efe9de', '#e3d9c8', '#7c6248', '#26201a', true, '감성', '한지·페이퍼 톤 4:5 갤러리 프레임'],
      ['op_cine_velvet', '벨벳 라운지 · 버건디', 'op_cinema_frame', 'maru', '#150a0e', '#241118', '#e8a8b4', '#fdf2f4', false, '고급', '깊은 버건디 라운지 아트 프레임']
    ];
    const OPUS_ART_DESIGNS = OPUS_ART_ROWS.map((r, i) => ({
      id: r[0], name: r[1], addedAt: '2026-11-22T07:45:00Z', cat: r[9] || '고급', engine: 'motion', mstyle: r[2], font: r[3],
      bg1: r[4], bg2: r[5], accent: r[6], accent2: r[7], light: r[8], seed: 2200 + i, genre: 'motion', grade: 'none', label: r[1],
      insta: true, isTrend: true, isOpusArt: true, desc: r[10] || r[1]
    }));
    // 1군 풀스크린 릴스 엔진 + 코드 기반 오퍼스 화풍 30종을 디자인 목록 최상단에 배치
    DESIGN_STYLES.unshift(...PRO_REELS_DESIGNS, ...OPUS_ART_DESIGNS);
    DESIGN_STYLES.push(...MOTION_DESIGNS);

    const mClamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
    const mEase = (p) => gEase(mClamp(p));
    function mFit(c, text, maxW, maxLines, size, minSize, fontKey) {
      return kWrap(c, text, maxW, maxLines, size, minSize, fontKey);
    }
    // 자막: 줄마다 아래에서 올라오며 나타남
    function mCaption(c, text, x, y, maxW, maxH, size, fontKey, color, e, align = 'center', box = null) {
      const F = KIT_FONTS[fontKey] || KIT_FONTS.sans;
      const maxLines = Math.max(1, Math.min(3, Math.floor(maxH / (size * F.k * 1.28))));
      const r = mFit(c, text, maxW, maxLines, size, Math.round(size * 0.55), fontKey);
      const total = r.lines.length * r.lh;
      const top = y + Math.max(0, (maxH - total) / 2);
      c.save();
      c.textAlign = align;
      c.textBaseline = 'middle';
      c.font = gFont(F.w, r.size, F.f);
      r.lines.forEach((ln, i) => {
        const p = mEase((e - i * 0.12) / 0.5);
        const ly = top + i * r.lh + r.lh / 2 + (1 - p) * 26;
        c.globalAlpha = p;
        if (box) {
          const w = c.measureText(ln).width + 28;
          const bx = align === 'center' ? x - w / 2 : x - 14;
          c.fillStyle = box;
          c.fillRect(bx, ly - r.lh / 2 + 3, w * p, r.lh - 6);
        }
        c.fillStyle = color;
        c.fillText(ln, x, ly);
      });
      c.restore();
      return { top, h: total };
    }
    // ── 카드뉴스 리듬·폰트 강약·컬러 변화 엔진 (2026-11) ──
    function arHexAlpha(hex, alpha) {
      const m = String(hex || '').trim().match(/^#?([0-9a-f]{6})$/i);
      if (!m) return `rgba(255,255,255,${alpha})`;
      const n = parseInt(m[1], 16);
      return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
    }
    function arBackOut(p) {
      const t = mClamp(p);
      const c1 = 1.65, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
    function arCardCutPalette(sp, cutIdx, isDarkSurface) {
      const base = (sp && sp.accent) || (isDarkSurface ? '#38bdf8' : '#e11d48');
      const pool = isDarkSurface
        ? ['#38bdf8', '#fb923c', '#34d399', '#f472b6', '#facc15', '#a78bfa']
        : ['#e11d48', '#2563eb', '#d97706', '#059669', '#7c3aed', '#ea580c'];
      const list = [];
      const bLum = gLuminance(base);
      const baseOk = isDarkSurface ? bLum > 0.22 : bLum < 0.62;
      if (baseOk) list.push(base);
      for (const col of pool) {
        if (col.toLowerCase() !== String(base).toLowerCase()) list.push(col);
      }
      const accent = list[Math.abs(cutIdx) % list.length];
      const darkTints = ['#0f172a', '#131620', '#0d1916', '#1a1218', '#17140f'];
      const lightTints = ['#fffdf9', '#f8fafc', '#fdf8f3', '#f5faf7', '#faf6ff'];
      const bgTints = isDarkSurface ? darkTints : lightTints;
      return {
        accent,
        accentSoft: arHexAlpha(accent, isDarkSurface ? 0.26 : 0.18),
        markerBg: arHexAlpha(accent, isDarkSurface ? 0.34 : 0.24),
        pillFg: kTextOn(accent),
        tintBg: bgTints[Math.abs(cutIdx) % bgTints.length],
        beatMode: Math.abs(cutIdx) % 3
      };
    }
    function arCardFindKeyword(line) {
      const s = String(line || '');
      if (!s.trim()) return null;
      const numM = s.match(/\d+(?:[.,]\d+)?\s*(?:%|배|가지|분|초|시간|일|주|개월|년|원|만원|천원|위|등|단계|명|개|회|cm|kg|kcal)?/);
      if (numM && numM.index >= 0) return { start: numM.index, end: numM.index + numM[0].length };
      const qM = s.match(/[‘'“"\[\(][^’'”"\]\)]+[’'”"\]\)]/);
      if (qM && qM.index >= 0) return { start: qM.index, end: qM.index + qM[0].length };
      const words = [];
      const re = /[^\s]+/g;
      let m;
      while ((m = re.exec(s)) !== null) {
        if (m[0].length >= 2) words.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
      }
      if (!words.length) return null;
      return words.length >= 2 ? words[words.length - 1] : words[0];
    }
    function arCardRhythmCaption(c, text, x, y, maxW, maxH, baseSize, opts = {}) {
      const clean = String(text || '').trim();
      if (!clean) return { top: y, h: 0 };
      const cutIdx = opts.cutIdx || 0;
      const ov = mCapOv(cutIdx);
      if (ov.hidden) {
        if (window.__arNativeElementHandled && window.__arNativeElementHandled[cutIdx]) window.__arNativeElementHandled[cutIdx].caption = true;
        return { top: y, h: 0 };
      }
      const local = Math.max(0, opts.local || 0);
      const align = ov.align || opts.align || 'center';
      const isDark = !!opts.isDark;
      const accent = opts.accent || (isDark ? '#38bdf8' : '#e11d48');
      const ink = ov.color || opts.ink || (isDark ? '#f8fafc' : '#18181b');
      const sc = Math.max(0.6, Math.min(2.0, Number(ov.scale) || 1));
      // 컷마다 폰트 강약 페어링 순환 (사용자 개별 폰트 지정 시 존중)
      const headPool = opts.headPool || (opts.serif ? ['maru', 'songmyung', 'gasoek'] : ['gasoek', 'dohyeon', 'maru', 'jua']);
      const headKey = ov.font && KIT_FONTS[ov.font] ? ov.font : (opts.headFont || headPool[Math.abs(cutIdx) % headPool.length]);
      const bodyKey = ov.font && KIT_FONTS[ov.font] ? ov.font : (opts.bodyFont || (opts.serif ? 'pretL' : 'pretM'));
      const HF = KIT_FONTS[headKey] || KIT_FONTS.sans;
      const BF = KIT_FONTS[bodyKey] || KIT_FONTS.pretM;

      // 줄 나누기 (최대 3줄)
      const maxLines = Math.max(1, Math.min(3, Math.floor(maxH / (baseSize * 1.24))));
      const baseFit = mFit(c, clean, maxW, maxLines, baseSize, Math.round(baseSize * 0.56), bodyKey);
      const lines = baseFit.lines;
      // 짝수 컷은 첫 줄(훅) 강조, 홀수 컷은 마지막 줄(펀치라인) 강조로 리듬감 부여
      const heroIdx = lines.length <= 1 ? 0 : (cutIdx % 2 === 0 ? 0 : lines.length - 1);

      // 줄별 폰트·크기 계산 (폭 넘침 자동 보정)
      let maxLineW = 0;
      const specs = lines.map((ln, i) => {
        const isHero = i === heroIdx;
        const F = isHero ? HF : BF;
        let sz = Math.round(baseFit.size * (isHero ? (lines.length === 1 ? 1.14 : 1.20) : 0.88));
        c.font = gFont(F.w, sz, F.f);
        const w0 = c.measureText(ln).width;
        if (w0 > maxW - 10) sz = Math.max(15, Math.floor(sz * ((maxW - 10) / Math.max(1, w0))));
        c.font = gFont(F.w, sz, F.f);
        maxLineW = Math.max(maxLineW, c.measureText(ln).width);
        const lh = Math.round(sz * F.k * (isHero ? 1.32 : 1.28));
        return { ln, isHero, F, sz, lh };
      });

      const totalH = specs.reduce((acc, s) => acc + s.lh, 0);
      const top = y + Math.max(0, (maxH - totalH) / 2);
      const hlMode = Math.abs(cutIdx) % 3; // 0: 형광펜 마커, 1: 컬러 칩, 2: 컬러 언더라인+포인트 텍스트
      const defW = Math.min(504, Math.max(150, maxLineW + 38));
      const defH = Math.max(52, totalH + 22);
      const defCx = align === 'left' ? x + defW / 2 - 12 : align === 'right' ? x - defW / 2 + 12 : x;
      const defCy = top + totalH / 2;
      const tx = ov.customPos && typeof ov.x === 'number' ? ov.x * 540 : defCx;
      const ty = ov.customPos && typeof ov.y === 'number' ? ov.y * 960 : defCy;
      if (!window.__arLastRenderedBoxes) window.__arLastRenderedBoxes = {};
      if (!window.__arLastRenderedBoxes[cutIdx]) window.__arLastRenderedBoxes[cutIdx] = {};
      window.__arLastRenderedBoxes[cutIdx].caption = { cx: tx, cy: ty, w: defW * sc, h: defH * sc };
      if (window.__arNativeElementHandled && window.__arNativeElementHandled[cutIdx]) window.__arNativeElementHandled[cutIdx].caption = true;

      c.save();
      if (ov.customPos || sc !== 1) {
        c.translate(tx, ty);
        c.scale(sc, sc);
        c.translate(-defCx, -defCy);
      }
      c.textBaseline = 'middle';
      let curY = top;
      specs.forEach((spLine, i) => {
        const delay = i * 0.13;
        const rawP = mClamp((local - delay) / (spLine.isHero ? 0.28 : 0.24));
        const p = mEase(rawP);
        const pop = spLine.isHero ? (0.90 + 0.10 * arBackOut(rawP)) : 1;
        const ly = curY + spLine.lh / 2 + (1 - p) * (spLine.isHero ? 20 : 14);
        curY += spLine.lh;

        c.save();
        c.globalAlpha = p;
        c.font = gFont(spLine.F.w, spLine.sz, spLine.F.f);
        const fullW = c.measureText(spLine.ln).width;
        const startX = align === 'center' ? x - fullW / 2 : (align === 'right' ? x - fullW : x);

        if (spLine.isHero) {
          c.translate(align === 'center' ? x : startX, ly);
          c.scale(pop, pop);
          c.translate(align === 'center' ? -x : -startX, -ly);
        }

        const kw = spLine.isHero ? arCardFindKeyword(spLine.ln) : null;
        if (kw) {
          const pre = spLine.ln.slice(0, kw.start);
          const hit = spLine.ln.slice(kw.start, kw.end);
          const post = spLine.ln.slice(kw.end);
          const preW = c.measureText(pre).width;
          const hitW = c.measureText(hit).width;
          const hitX = startX + preW;
          const sweep = mEase((local - delay - 0.12) / 0.26);

          if (hlMode === 0) {
            // 형광펜 마커 스윕
            const mh = spLine.sz * 0.56;
            c.fillStyle = arHexAlpha(accent, isDark ? 0.42 : 0.28);
            gRoundRect(c, hitX - 4, ly + spLine.sz * 0.04, (hitW + 8) * sweep, mh, 5);
            c.fill();
            c.textAlign = 'left';
            c.fillStyle = ink;
            if (pre) c.fillText(pre, startX, ly);
            c.fillStyle = isDark ? '#ffffff' : ink;
            c.fillText(hit, hitX, ly);
            c.fillStyle = ink;
            if (post) c.fillText(post, hitX + hitW, ly);
          } else if (hlMode === 1) {
            // 반전 컬러 포인트 칩
            const padX = 7, padY = 4;
            const ph = spLine.sz * 1.18 + padY;
            c.fillStyle = accent;
            gRoundRect(c, hitX - padX, ly - ph / 2, (hitW + padX * 2) * sweep, ph, 8);
            c.fill();
            c.textAlign = 'left';
            c.fillStyle = ink;
            if (pre) c.fillText(pre, startX, ly);
            c.fillStyle = sweep > 0.35 ? kTextOn(accent) : ink;
            c.fillText(hit, hitX, ly);
            c.fillStyle = ink;
            if (post) c.fillText(post, hitX + hitW, ly);
          } else {
            // 두꺼운 키네틱 언더라인 + 포인트 컬러 텍스트
            c.fillStyle = accent;
            gRoundRect(c, hitX - 2, ly + spLine.sz * 0.48, (hitW + 4) * sweep, Math.max(4, spLine.sz * 0.14), 3);
            c.fill();
            c.textAlign = 'left';
            c.fillStyle = ink;
            if (pre) c.fillText(pre, startX, ly);
            c.fillStyle = accent;
            c.fillText(hit, hitX, ly);
            c.fillStyle = ink;
            if (post) c.fillText(post, hitX + hitW, ly);
          }
        } else {
          c.textAlign = align;
          c.fillStyle = spLine.isHero ? ink : arHexAlpha(ink, isDark ? 0.84 : 0.78);
          c.fillText(spLine.ln, x, ly);
        }
        c.restore();
      });
      c.restore();
      return { top, h: totalH };
    }
    // ★ 화면 속 자막(메모 앱·알림·포스터처럼 디자인에 박힌 글자)도 컷 편집에서 고를 수 있게:
    //   자막 위치를 알려 주고, 컷 편집에서 바꾼 글꼴·색·크기·위치·숨김을 따름
    function mCapOv(cutIdx) {
      try {
        const o = typeof cutElementOverrides !== 'undefined' && cutElementOverrides && cutElementOverrides[cutIdx] && cutElementOverrides[cutIdx].caption;
        return o || {};
      } catch (e) { return {}; }
    }
    function mCapFont(cutIdx, def) { const f = mCapOv(cutIdx).font; return f && KIT_FONTS[f] ? f : def; }
    function mCapColor(cutIdx, def) { return mCapOv(cutIdx).color || def; }
    function mCapBegin(c, W, H, cutIdx, local, lines, x, y0, lh, align) {
      if (typeof arBeginMotionCaptionCard !== 'function') return true;
      let mw = 0;
      lines.forEach((l) => { mw = Math.max(mw, c.measureText(l).width); });
      const n = Math.max(1, lines.length);
      const cx = align === 'left' ? x + mw / 2 : align === 'right' ? x - mw / 2 : x;
      return arBeginMotionCaptionCard(c, W, H, cutIdx, local, cx, y0 + ((n - 1) * lh) / 2, mw + 28, n * lh + 18);
    }
    function mCapEnd(c) { if (typeof arEndMotionCaptionCard === 'function') arEndMotionCaptionCard(c); }

    // All motion is a pure function of cut-local time, including backward seeks.
    // Complete the entrance within the first 28% even for short narration cuts.
    function mPromptType(c, W, H, text, cutIdx, local, cutDur, mode, options = {}) {
      const key = mCapFont(cutIdx, options.font || 'sans');
      const F = KIT_FONTS[key] || KIT_FONTS.sans;
      const maxW = W * 0.82;
      const wr = kWrap(c, text, maxW, 3, options.size || W * 0.078, W * 0.038, key);
      const align = options.align || 'left';
      const x = align === 'center' ? W / 2 : W * 0.09;
      const lh = wr.lh * (mode === 'spring' ? 1.18 : 1.08);
      const y0 = (options.bottom || H * 0.81) - (wr.lines.length - 1) * lh;
      const enter = Math.max(0.001, Math.min(0.9, cutDur * 0.28));
      const progress = mClamp(local / enter);
      const color = mCapColor(cutIdx, options.color || '#ffffff');
      const accent = options.accent || '#e9e1d3';
      c.save();
      c.font = gFont(F.w, wr.size, F.f);
      c.textAlign = align;
      c.textBaseline = 'middle';
      c.shadowColor = 'transparent';
      if (mCapBegin(c, W, H, cutIdx, local, wr.lines, x, y0, lh, align)) {
        const inheritedAlpha = c.globalAlpha;
        const tokens = [];
        wr.lines.forEach((line, i) => {
          let tx = align === 'center' ? x - c.measureText(line).width / 2 : x;
          line.split(/\s+/).filter(Boolean).forEach((word) => {
            const w = c.measureText(word).width;
            tokens.push({ word, x: tx, y: y0 + i * lh, w });
            tx += w + c.measureText(' ').width;
          });
        });
        if (mode === 'focus' && tokens.length) {
          // Visual reading rhythm only: no claim of word-level speech alignment.
          const travel = mClamp((local - enter) / Math.max(0.001, cutDur * 0.5));
          const pos = travel * (tokens.length - 1);
          const a = tokens[Math.floor(pos)], b = tokens[Math.min(tokens.length - 1, Math.floor(pos) + 1)];
          const mix = mEase(pos % 1);
          const bx = a.x + (b.x - a.x) * mix, by = a.y + (b.y - a.y) * mix;
          const bw = a.w + (b.w - a.w) * mix;
          c.globalAlpha = inheritedAlpha * mEase(progress);
          c.fillStyle = accent;
          c.fillRect(bx, by + wr.size * 0.65, bw, Math.max(2, W * 0.006));
          c.textAlign = 'left';
          tokens.forEach((token, j) => {
            const p = mEase((progress - 0.25 * j / Math.max(1, tokens.length - 1)) / 0.75);
            c.globalAlpha = inheritedAlpha * (0.35 + 0.65 * p);
            c.fillStyle = color;
            c.fillText(token.word, token.x, token.y + (1 - p) * W * 0.025);
          });
        } else {
          wr.lines.forEach((line, i) => {
            const q = mClamp((progress - 0.22 * i / Math.max(1, wr.lines.length - 1)) / 0.78);
            const y = y0 + i * lh, width = c.measureText(line).width;
            const left = align === 'center' ? x - width / 2 : x;
            c.save();
            if (mode === 'spring') {
              const spring = q >= 1 ? 1 : 1 - Math.exp(-7 * q) * Math.cos(10 * q);
              c.globalAlpha *= mClamp(q * 5);
              c.translate(x, y + (1 - spring) * W * 0.07);
              c.scale(0.96 + spring * 0.04, 0.96 + spring * 0.04);
              c.translate(-x, -y);
              c.fillStyle = i === wr.lines.length - 1 ? accent : '#f6f1e7';
              c.fillRect(left - W * 0.018, y - wr.size * 0.66, width + W * 0.036, wr.size * 1.32);
              c.fillStyle = mCapColor(cutIdx, kTextOn(i === wr.lines.length - 1 ? accent : '#f6f1e7'));
              c.fillText(line, x, y);
            } else {
              const p = mEase(q);
              c.beginPath();
              c.rect(left - W * 0.02, y - lh * 0.5, width + W * 0.04, lh);
              c.clip();
              c.fillStyle = color;
              c.fillText(line, x, y + (1 - p) * lh);
            }
            c.restore();
          });
        }
        mCapEnd(c);
      }
      c.restore();
    }

    function mPhoto(c, S, k, x, y, w, h, scale = 1.06, px = 0, py = 0) {
      const img = kitImg(S, k);
      if (!img) {
        const g = c.createLinearGradient(x, y, x, y + h);
        g.addColorStop(0, '#3f4a5c');
        g.addColorStop(1, '#10151f');
        c.fillStyle = g;
        c.fillRect(x, y, w, h);
        return;
      }
      c.save();
      c.beginPath();
      c.rect(x, y, w, h);
      c.clip();
      kitCover(c, img, x, y, w, h, scale, px, py);
      c.restore();
    }
    // 필요한 정보 패널만 반투명 유리로 구분한다. 사진은 그대로 비쳐 보인다.
    function inGlass(c, x, y, w, h, radius) {
      c.save(); c.shadowColor = 'transparent';
      gRoundRect(c, x, y, w, h, radius);
      c.fillStyle = 'rgba(15,15,18,0.42)'; c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 1; c.stroke();
      c.restore();
    }
    // ---------- 인스타 감성 도우미 ----------
    let arGrainTile = null;
    function inGrain(c, W, H, t, alpha) {
      if (!arGrainTile) {
        arGrainTile = document.createElement('canvas');
        arGrainTile.width = 160; arGrainTile.height = 160;
        const g = arGrainTile.getContext('2d');
        const im = g.createImageData(160, 160);
        for (let i = 0; i < im.data.length; i += 4) {
          const v = Math.random() * 255;
          im.data[i] = im.data[i + 1] = im.data[i + 2] = v;
          im.data[i + 3] = 255;
        }
        g.putImageData(im, 0, 0);
      }
      c.save();
      c.globalAlpha = alpha;
      c.globalCompositeOperation = 'overlay';
      const ox = Math.floor((Math.sin(t * 37.1) * 0.5 + 0.5) * 160), oy = Math.floor((Math.cos(t * 23.7) * 0.5 + 0.5) * 160);
      for (let y = -oy; y < H; y += 160) for (let x = -ox; x < W; x += 160) c.drawImage(arGrainTile, x, y);
      c.restore();
    }
    // 따뜻한 필름 색감: 노란빛을 살짝 얹고 검은색을 들어 올림
    function inWarm(c, x, y, w, h, k = 1) {
      c.save();
      c.globalCompositeOperation = 'soft-light';
      c.fillStyle = `rgba(255,196,140,${0.32 * k})`;
      c.fillRect(x, y, w, h);
      c.globalCompositeOperation = 'screen';
      c.fillStyle = `rgba(60,44,30,${0.16 * k})`;
      c.fillRect(x, y, w, h);
      c.restore();
    }
    function inDateLabel() {
      const n = new Date();
      return `${String(n.getMonth() + 1).padStart(2, '0')}.${String(n.getDate()).padStart(2, '0')} ${['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][n.getDay()]}`;
    }
    // 서명: "— 가게 이름" (명함이 비었으면 그리지 않음)
    function inSign(c, d, x, y, color, align = 'right', size = 18) {
      const name = String((d && d.name) || '').trim();
      if (!name) return;
      c.save();
      c.textAlign = align;
      c.textBaseline = 'middle';
      c.fillStyle = color;
      gDrawLine(c, `— ${name}`, x, y, 300, size, 12, KIT_FONTS.maruL.f, 400);
      c.restore();
    }
    // 작은 영문·숫자 라벨 (자간 넓게)
    function inLabel(c, text, x, y, color, align = 'left', size = 13) {
      c.save();
      c.textAlign = align;
      c.textBaseline = 'middle';
      c.fillStyle = color;
      c.font = gFont(500, size, GENRE_FONTS.sans);
      if ('letterSpacing' in c) c.letterSpacing = '2px';
      c.fillText(text, x, y);
      c.restore();
    }
    // 컷이 바뀔 때 앞 사진에서 부드럽게 겹쳐 바뀜
    function inPhotoFade(c, S, cutIdx, local, x, y, w, h, scale, warm = 1) {
      const img = kitImg(S, 0);
      const isVid = !!(img && img._isVideo);
      const easeCubic = (v) => 1 - Math.pow(1 - mClamp(v), 3);
      const easeQuart = (v) => 1 - Math.pow(1 - mClamp(v), 4);
      const dir = cutIdx % 2 === 0 ? 1 : -1;
      const lp = mClamp(local / 3.0);
      // 흔들림(sin/cos)과 회전(tilt) 없이, 한 방향으로만 매끄럽게 미끄러지는 시네마 Ken Burns 벡터
      const baseScale = isVid ? Math.min(1.04, Math.max(1.0, scale || 1.02)) : Math.max(1.08, (scale || 1.04) + 0.04);
      const steadyZoom = isVid ? baseScale : (cutIdx % 2 === 0 ? baseScale + lp * 0.08 : baseScale + (1 - lp) * 0.08);
      const steadyPx = isVid ? 0 : (lp - 0.5) * Math.min(34, w * 0.068) * dir;
      const steadyPy = isVid ? 0 : (lp - 0.5) * Math.min(16, h * 0.024) * (cutIdx % 3 === 0 ? 1 : -1);
      const tDur = 0.40;
      const p = cutIdx > 0 ? easeQuart(local / tDur) : 1;
      const rem = 1 - p; // tDur 경계에서 정확히 0.000으로 수렴 (끊김·튐 현상 0%)
      const mode = cutIdx % 5;

      c.save();
      c.beginPath();
      c.rect(x, y, w, h);
      c.clip();

      if (cutIdx === 0) {
        const z0 = isVid ? steadyZoom : steadyZoom + (1 - easeCubic(local / 0.42)) * 0.08;
        mPhoto(c, S, 0, x, y, w, h, z0, steadyPx, steadyPy);
      } else if (rem > 0.001) {
        if (mode === 1) {
          // 1) 풀 슬라이드 푸시 (좌우 시원하게 밀어내기 + 경계 헤어라인)
          const oldX = x - Math.round(w * p) * dir;
          const newX = x + Math.round(w * rem) * dir;
          mPhoto(c, S, -1, oldX, y, w, h, baseScale + 0.04, 0, 0);
          mPhoto(c, S, 0, newX, y, w, h, steadyZoom + rem * 0.04, steadyPx, steadyPy);
          c.fillStyle = 'rgba(255,255,255,0.55)';
          c.fillRect(dir > 0 ? newX - 1 : newX + w - 1, y, 2, h);
        } else if (mode === 2) {
          // 2) 대각선 시네마 슬래시 와이프 (15° 사선 리빌)
          mPhoto(c, S, -1, x, y, w, h, baseScale + 0.04, 0, 0);
          const slant = Math.round(w * 0.28);
          const edgeX = x - slant + (w + slant * 2) * p;
          c.save();
          c.beginPath();
          c.moveTo(x - slant, y);
          c.lineTo(edgeX, y);
          c.lineTo(edgeX - slant, y + h);
          c.lineTo(x - slant, y + h);
          c.closePath();
          c.clip();
          mPhoto(c, S, 0, x, y, w, h, steadyZoom + rem * 0.06, steadyPx, steadyPy);
          c.restore();
          c.strokeStyle = 'rgba(255,250,240,0.75)';
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(edgeX, y);
          c.lineTo(edgeX - slant, y + h);
          c.stroke();
        } else if (mode === 3) {
          // 3) 상하 셔터 오픈 (중앙에서 위아래로 영화관 셔터 리빌)
          mPhoto(c, S, -1, x, y, w, h, baseScale + 0.04, 0, 0);
          const openH = Math.round(h * p);
          const topY = y + Math.round((h - openH) / 2);
          c.save();
          c.beginPath();
          c.rect(x, topY, w, openH);
          c.clip();
          mPhoto(c, S, 0, x, y, w, h, steadyZoom + rem * 0.07, steadyPx, steadyPy);
          c.restore();
        } else if (mode === 4) {
          // 4) 수직 풀-업 슬라이드 (아래에서 위로 시원하게 밀어 올리기)
          const oldY = y - Math.round(h * p * 0.55);
          const newY = y + Math.round(h * rem);
          mPhoto(c, S, -1, x, oldY, w, h, baseScale + 0.04, 0, 0);
          mPhoto(c, S, 0, x, newY, w, h, steadyZoom + rem * 0.04, steadyPx, steadyPy);
          c.fillStyle = 'rgba(255,255,255,0.5)';
          c.fillRect(x, newY - 1, w, 2);
        } else {
          // 0) 크리스프 노출 줌-스냅 (속도감 있는 줌 착지 + 은은한 카메라 플래시)
          mPhoto(c, S, -1, x, y, w, h, baseScale + 0.04 + p * 0.14, 0, 0);
          c.save();
          c.globalAlpha = easeCubic(local / (tDur * 0.72));
          mPhoto(c, S, 0, x, y, w, h, steadyZoom + rem * 0.14, steadyPx, steadyPy);
          c.restore();
          if (local < 0.18) {
            c.fillStyle = `rgba(255,252,245,${((1 - local / 0.18) * 0.28).toFixed(3)})`;
            c.fillRect(x, y, w, h);
          }
        }
      } else {
        mPhoto(c, S, 0, x, y, w, h, steadyZoom, steadyPx, steadyPy);
      }
      c.restore();
      if (warm) inWarm(c, x, y, w, h, warm);
    }
    // 사진 가장자리에서 서서히 걷히는 명암. 자막 영역에 사각 경계가 생기지 않는다.
    function inCaptionScrim(c, x, y, w, h, center, light = false) {
      const top = center <= 0.5, reach = top ? Math.min(1, center + 0.48) : Math.max(0, center - 0.48);
      const shade = c.createLinearGradient(0, top ? y : y + h, 0, y + h * reach);
      const rgb = light ? '246,241,231' : '24,19,15';
      shade.addColorStop(0, `rgba(${rgb},0.84)`);
      shade.addColorStop(0.48, `rgba(${rgb},0.72)`);
      shade.addColorStop(1, `rgba(${rgb},0)`);
      c.save(); c.fillStyle = shade; c.fillRect(x, y, w, h); c.restore();
    }
    function mBg(c, W, H, spec, t) {
      const g = c.createLinearGradient(0, 0, W * 0.4, H);
      g.addColorStop(0, spec.bg1);
      g.addColorStop(1, spec.bg2);
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    }
    function mChip(c, d, W, H, spec, a) {
      if (!d) return;
      c.save();
      c.globalAlpha = a;
      const txt = `${d.name || ''} · ${d.title || ''}`;
      c.font = gFont(700, 15, GENRE_FONTS.sans);
      const w = Math.min(W - 40, c.measureText(txt).width + 54);
      const x = 20, y = H - 58;
      gRoundRect(c, x, y, w, 38, 19);
      c.fillStyle = spec.light ? 'rgba(17,17,17,0.88)' : 'rgba(255,255,255,0.12)';
      c.fill();
      c.beginPath();
      c.arc(x + 19, y + 19, 12, 0, Math.PI * 2);
      c.fillStyle = spec.accent;
      c.fill();
      c.fillStyle = kTextOn(spec.accent);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = gFont(800, 12, GENRE_FONTS.sans);
      c.fillText(String(d.name || '').slice(0, 1), x + 19, y + 19.5);
      c.fillStyle = '#ffffff';
      c.textAlign = 'left';
      c.font = gFont(700, 15, GENRE_FONTS.sans);
      gDrawLine(c, txt, x + 38, y + 20, w - 48, 15, 11, GENRE_FONTS.sans, 700);
      c.restore();
    }
    // 가격 배지: 자막 위쪽 가운데에서 통 튀어 오름
    function mPrice(c, W, y, spec, e) {
      const txt = arPriceTag();
      const s = gBack(mClamp(e / 0.45));
      c.save();
      c.translate(W / 2, y);
      c.scale(s, s);
      c.font = gFont(900, 40, GENRE_FONTS.impact);
      const w = Math.min(W - 60, c.measureText(txt).width + 48);
      gRoundRect(c, -w / 2, -30, w, 60, 30);
      c.fillStyle = spec.accent;
      c.fill();
      c.fillStyle = kTextOn(spec.accent);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      gDrawLine(c, txt, 0, 2, w - 30, 40, 20, GENRE_FONTS.impact, 900);
      c.restore();
    }

    // ---- 캡컷 트렌드 4종(glow · bokeh · cinema · credits)용 도우미 ----
    // 따뜻한 빛: 상시 은은한 빛샘(오른쪽 위) + 전환 순간(g>0) 아래·모서리에서 차오르는 빛, 세로 빛줄기, 빛망울
    function mWarmLight(c, W, H, g, t, seed) {
      c.save();
      c.globalCompositeOperation = 'screen';
      const amb = 0.16 + 0.06 * Math.sin(t * 0.9);
      const a = c.createRadialGradient(W * 0.95, H * 0.04, 0, W * 0.95, H * 0.04, W * 0.95);
      a.addColorStop(0, `rgba(255,180,90,${amb})`);
      a.addColorStop(1, 'rgba(255,120,40,0)');
      c.fillStyle = a;
      c.fillRect(0, 0, W, H);
      if (g > 0.001) {
        const b = c.createRadialGradient(W * 0.25, H * 1.02, 0, W * 0.25, H * 1.02, H * (0.4 + 0.7 * g));
        b.addColorStop(0, `rgba(255,243,214,${0.95 * g})`);
        b.addColorStop(0.45, `rgba(255,140,50,${0.6 * g})`);
        b.addColorStop(1, 'rgba(255,90,20,0)');
        c.fillStyle = b;
        c.fillRect(0, 0, W, H);
        for (let i = 0; i < 3; i++) {
          const x = W * (0.2 + 0.3 * i) + Math.sin(seed * 1.7 + i) * 40;
          const lg = c.createLinearGradient(x - 40, 0, x + 40, 0);
          lg.addColorStop(0, 'rgba(255,200,140,0)');
          lg.addColorStop(0.5, `rgba(255,220,170,${0.45 * g})`);
          lg.addColorStop(1, 'rgba(255,200,140,0)');
          c.fillStyle = lg;
          c.fillRect(x - 40, 0, 80, H);
        }
        for (let i = 0; i < 7; i++) {
          const bx = W * ((Math.sin(seed * 3.1 + i * 2.3) + 1) / 2);
          const by = H * (0.35 + 0.6 * ((Math.cos(seed * 1.3 + i * 1.7) + 1) / 2)) - g * 30;
          c.fillStyle = `rgba(255,236,200,${0.35 * g})`;
          c.beginPath();
          c.arc(bx, by, 12 + (i % 4) * 9, 0, Math.PI * 2);
          c.fill();
        }
        c.fillStyle = `rgba(255,232,205,${0.28 * g})`;
        c.fillRect(0, 0, W, H);
      }
      c.restore();
    }
    // 흐린 사진 (canvas filter 를 못 쓰는 브라우저는 어둡게만)
    function mBlurPhoto(c, S, k, x, y, w, h, scale, px) {
      const can = 'filter' in c;
      c.save();
      if (can) c.filter = `blur(${px}px)`;
      mPhoto(c, S, k, x, y, w, h, scale);
      c.restore();
      if (!can) { c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(x, y, w, h); }
    }
    // 부드러운 원형 마스크를 만들 때 쓰는 보조 캔버스 (한 장을 계속 재사용)
    let mOffCanvasEl = null;
    function mOffscreen(W, H) {
      if (!mOffCanvasEl) mOffCanvasEl = document.createElement('canvas');
      if (mOffCanvasEl.width !== W || mOffCanvasEl.height !== H) { mOffCanvasEl.width = W; mOffCanvasEl.height = H; }
      return mOffCanvasEl;
    }
    // 엔딩 크레딧에 올릴 정보 (연락처는 영상에 넣지 않음)
    function mCreditItems(d) {
      const out = [];
      const add = (label, value) => { const v = String(value || '').trim(); if (v) out.push([label, v]); };
      const isAuto = typeof IND === 'undefined' || IND.key === 'auto';
      add(isAuto ? '차종' : (IND.product || '상품'), campaign.vehicle);
      add('혜택', campaign.discount);
      (campaign.bullets || []).slice(0, 3).forEach((b) => add('포인트', String(b).replace(/^[✔✓•\-\s]+/, '')));
      add(isAuto ? '전시장' : '매장', d && d.branch);
      add('담당', d && `${d.name || ''} ${d.title || ''}`.trim());
      add('특전', d && d.promoTag);
      const kw = (d && d.variation && d.variation.ctaKeyword) || (typeof IND !== 'undefined' && IND.cta) || '문의';
      add('문의', `댓글에 [${kw}] 남겨 주세요`);
      return out;
    }

    // 업종을 바꾸면 모션 템플릿도 그 업종 색으로 물듦 (사용자가 색을 고르면 그 색 우선)
    const AR_IND_PALETTE = {
      restaurant: ['#f97316', '#1a0f08', '#3b1d0a'], cafe: ['#d97706', '#1c140c', '#3a2614'], beauty: ['#ec4899', '#1a0b14', '#3b1230'],
      realestate: ['#0ea5e9', '#06101a', '#0c2a44'], academy: ['#3b82f6', '#081024', '#132a5c'], clinic: ['#14b8a6', '#05201d', '#0b3b36'],
      fitness: ['#ef4444', '#140606', '#3a0d0d'], shop: ['#a855f7', '#120a1c', '#2a1442'], interior: ['#ca8a04', '#14110c', '#2e2618']
    };
    function arDrawCustomLogo(c, W, H, custom) {
      const img = arCustomLogoImages.get(custom.logo.dataUrl)?.img;
      if (!img || !img.complete || !img.naturalWidth) return;
      const scale = Math.min(W * 0.12 / img.naturalWidth, H * 0.045 / img.naturalHeight);
      const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
      const x = custom.logo.corner.endsWith('right') ? W * 0.92 - w : W * 0.08;
      const y = custom.logo.corner.startsWith('bottom') ? H * 0.90 - h : H * 0.095;
      c.save(); c.globalAlpha = 1; c.shadowBlur = 0; c.drawImage(img, x, y, w, h); c.restore();
    }
    // 영상도 고정 카드에 들어가면 준비된 프레임 한 장을 인화 사진처럼 사용합니다.
    const arLookbookVideoStills = new WeakMap();
    const arLookbookItemCache = new WeakMap();
    function arLookbookItemImages(plan) {
      const sources = plan?.lookbookItems;
      if (!Array.isArray(sources) || !sources.length) return [];
      let cached = arLookbookItemCache.get(plan);
      if (cached?.sources !== sources) {
        const images = sources.slice(0, 4).filter((src) =>
          typeof src === 'string' && /^data:image\/(?:png|jpeg|webp);base64,/.test(src)
        ).map((src) => { const img = new Image(); img.src = src; return img; });
        cached = { sources, images };
        arLookbookItemCache.set(plan, cached);
        Promise.allSettled(images.map((img) => img.decode())).then(() => {
          const timeline = window.__timelines?.main;
          if (timeline && arLookbookItemCache.get(plan) === cached) timeline.seek(timeline.currentTime);
        });
      }
      return cached.images.filter((img) => !img.complete || img.naturalWidth);
    }

    function arLookbookPicture(c, media, x, y, w, h) {
      let image = media;
      if (media && media._isVideo) {
        image = arLookbookVideoStills.get(media);
        if (!image && media.readyState >= 2 && media.videoWidth && media.videoHeight) {
          image = document.createElement('canvas');
          const ratio = Math.min(1, 1080 / Math.max(media.videoWidth, media.videoHeight));
          image.width = Math.max(1, Math.round(media.videoWidth * ratio));
          image.height = Math.max(1, Math.round(media.videoHeight * ratio));
          image.getContext('2d').drawImage(media, 0, 0, image.width, image.height);
          arLookbookVideoStills.set(media, image);
        }
      }
      c.save();
      c.beginPath(); c.rect(x, y, w, h); c.clip();
      const iw = image && (image.naturalWidth || image.width);
      const ih = image && (image.naturalHeight || image.height);
      if (!iw || !ih) {
        c.fillStyle = '#e7e2d9'; c.fillRect(x, y, w, h);
      } else {
        // 표지와 메인 착용컷은 옷 전체가 보이게 원본 비율로 맞춥니다.
        const fit = Math.min(w / iw, h / ih);
        const fw = iw * fit, fh = ih * fit;
        c.drawImage(image, Math.round(x + (w - fw) / 2), Math.round(y + (h - fh) / 2), fw, fh);
      }
      c.restore();
    }

    function renderLookbookStill(c, W, H, cutIdx, totalCuts, sp) {
      const photos = arScenePhotos();
      const photoAt = (idx) => kitImg({
        photos, n: photos.length, cuts: totalCuts, cutIdx: idx,
        idx: Math.floor(idx * photos.length / totalCuts)
      }, 0);
      const cover = cutIdx === 0 && totalCuts > 1;
      const closing = cutIdx > 0 && cutIdx === totalCuts - 1;
      // 표지는 비교 대상이 한 프레임에 담긴 첫 컷의 사진을 그대로 씁니다.
      const photo = photoAt(cutIdx);
      if (campaign.lookbookFinishedCards) {
        c.fillStyle = sp.bg1;
        c.fillRect(0, 0, W, H);
        arLookbookPicture(c, photo, 0, 0, W, H);
        return;
      }
      const previous = closing ? photoAt(cutIdx - 1) : null;
      const items = cover || closing ? [] : arLookbookItemImages(campaign.scenePlan?.[cutIdx]);
      const x = W * 0.11, width = W * 0.78, gap = W * 0.018;
      const mediaY = H * 0.31, mediaH = H * 0.516;
      const accent = sp.accent;

      c.save();
      mBg(c, W, H, sp, 0);
      c.fillStyle = '#fcfaf5';
      c.fillRect(W * 0.055, H * 0.066, W * 0.89, H * 0.822);
      c.fillStyle = accent;
      c.fillRect(x, H * 0.131, W * 0.092, Math.max(1, W * 0.002));

      if (photo && previous && photo !== previous) {
        const cellW = (width - gap) / 2;
        arLookbookPicture(c, previous, x, mediaY, cellW, mediaH);
        arLookbookPicture(c, photo, x + cellW + gap, mediaY, cellW, mediaH);
      } else if (items.length) {
        const itemW = width * 0.38;
        const rowH = (mediaH - (items.length - 1) * gap) / items.length;
        items.forEach((item, i) => arLookbookPicture(c, item, x, mediaY + i * (rowH + gap), itemW, rowH));
        arLookbookPicture(c, photo, x + itemW + gap, mediaY, width - itemW - gap, mediaH);
      } else {
        arLookbookPicture(c, photo, x, mediaY, width, mediaH);
      }

      const caption = gCleanCaption(campaign.cutCaptions?.[cutIdx] || campaign.hook || '');
      if (caption) {
        const fontKey = mCapFont(cutIdx, sp.font);
        const font = KIT_FONTS[fontKey] || KIT_FONTS.maru;
        const layout = mFit(c, caption, width, 3, W * (cover ? 0.075 : 0.064), W * 0.043, fontKey);
        const y = H * 0.224 - (layout.lines.length - 1) * layout.lh * 0.5;
        c.textBaseline = 'middle'; c.textAlign = 'left';
        c.font = gFont(font.w, layout.size, font.f);
        if (mCapBegin(c, W, H, cutIdx, 1.2, layout.lines, x, y, layout.lh, 'left')) {
          c.fillStyle = mCapColor(cutIdx, sp.accent2);
          layout.lines.forEach((line, i) => c.fillText(line, x, y + i * layout.lh));
          mCapEnd(c);
        }
      }
      c.restore();
    }

    function renderMotionFrame(c, W, H, t, mainDuration, totalCuts, d, spec, V) {
      const custom = spec.custom;
      const userColor = campaign.colorKey && campaign.colorKey !== 'default';
      const pal = typeof IND !== 'undefined' && IND.key !== 'auto' ? AR_IND_PALETTE[IND.key] : null;
      const accent = custom ? custom.colors.accent : userColor ? ((V && V.accent) || spec.accent) : pal ? pal[0] : spec.accent;
      const sp = Object.assign({}, spec, { accent }, pal && !spec.light && !spec.insta && !userColor ? { bg1: pal[1], bg2: pal[2] } : {});
      if (spec.mstyle === 'in_lookbook_still') {
        pauseAllCutVideos();
        const lookbook = userColor ? sp : spec;
        if (t >= mainDuration) {
          renderInstaOutro(c, W, H, mainDuration + 1.2, mainDuration, d, lookbook, true);
        } else {
          const pageIdx = Math.min(totalCuts - 1, Math.floor(t / (mainDuration / totalCuts)));
          renderLookbookStill(c, W, H, pageIdx, totalCuts, lookbook);
        }
        return;
      }
      if (spec.referenceStyle && t >= mainDuration) {
        const r = spec.referenceStyle;
        renderInstaOutro(c, W, H, t, mainDuration, d, { ...spec, accent2: r.foreground, custom: { colors: { primary: r.background } } });
        return;
      }
      if (t >= mainDuration) {
        renderMotionOutro(c, W, H, t, mainDuration, d, sp);
        if (custom) arDrawCustomLogo(c, W, H, custom);
        return;
      }
      if (spec.referenceStyle) { arRenderReferenceFrame(c, W, H, t, mainDuration, totalCuts, d, spec); return; }
      if (String(spec.mstyle || '').startsWith('pro_')) {
        arRenderProReelsFrame(c, W, H, t, mainDuration, totalCuts, d, sp);
        return;
      }
      if (String(spec.mstyle || '').startsWith('op_')) {
        arRenderOpusFrame(c, W, H, t, mainDuration, totalCuts, d, sp);
        return;
      }
      const cutDur = mainDuration / totalCuts;
      const cutIdx = Math.min(totalCuts - 1, Math.floor(t / cutDur));
      const local = t - cutIdx * cutDur;
      const lp = mClamp(local / cutDur);
      const S = kitScene(t, mainDuration, false);
      const raw = (campaign.cutCaptions && campaign.cutCaptions[cutIdx]) || campaign.hook || '';
      const caption = gCleanCaption(raw);
      const isPrice = gIsPriceCut(raw) || (campaign.priceTag && cutIdx === 2);
      const e = mClamp(local / 1.1);
      const ent = mEase(local / 0.6); // 컷 시작 등장
      const stageH = Math.round(H * 0.58);
      const capY = Math.round(H * 0.62), capH = Math.round(H * 0.24);
      const fg = sp.light ? '#111111' : '#ffffff';
      const M = sp.mstyle;
      mBg(c, W, H, sp, t);

      if (M === 'in_brush_seal' || M === 'in_brush_letter' || M === 'in_brush_postcard') {
        const letter = M === 'in_brush_letter', postcard = M === 'in_brush_postcard';
        const margin = postcard ? W * 0.046 : 0;
        const frameH = H - margin * 2;
        if (postcard) { c.fillStyle = '#e9dfcb'; c.fillRect(0, 0, W, H); }
        inPhotoFade(c, S, cutIdx, local, margin, margin, W - margin * 2, frameH, 1 + lp * (postcard ? 0 : 0.025), 0.5);
        inCaptionScrim(c, margin, margin, W - margin * 2, frameH, letter ? 0.21 : 0.78);
        const key = mCapFont(cutIdx, sp.font), face = KIT_FONTS[key];
        const wr = kWrap(c, caption, W * (postcard ? 0.72 : 0.76), 3, W * (postcard ? 0.088 : 0.102), W * 0.046, key);
        const align = letter ? 'right' : postcard ? 'center' : 'left';
        const x = W * (letter ? 0.90 : postcard ? 0.50 : 0.082);
        const gap = wr.size * 1.02;
        const y = letter ? H * 0.16 : H * (postcard ? 0.77 : 0.81) - (wr.lines.length - 1) * gap;
        c.save(); c.font = gFont(face.w, wr.size, face.f); c.textAlign = align; c.textBaseline = 'middle';
        if (wr.lines.length && mCapBegin(c, W, H, cutIdx, local, wr.lines, x, y, gap, align)) {
          const reveal = mClamp(local / Math.min(0.85, cutDur * 0.30));
          c.fillStyle = mCapColor(cutIdx, '#fff8ed');
          wr.lines.forEach((line, i) => {
            const width = c.measureText(line).width;
            const left = align === 'left' ? x : align === 'right' ? x - width : x - width / 2;
            const cy = y + i * gap;
            c.save(); c.beginPath();
            c.rect(left - 4, cy - gap * 0.62, (width + 8) * mEase(reveal * wr.lines.length - i), gap * 1.24);
            c.clip(); c.fillText(line, x, cy); c.restore();
          });
          const lastWidth = c.measureText(wr.lines[wr.lines.length - 1]).width;
          const sealX = letter ? x - W * 0.024 : postcard ? x : Math.min(W * 0.932, x + lastWidth + W * 0.046);
          const sealY = y + (wr.lines.length - 1) * gap + (letter || postcard ? gap * 0.96 : 0);
          c.save(); c.globalAlpha *= mEase((reveal - 0.75) / 0.25);
          c.translate(sealX, sealY); c.rotate(postcard ? 0 : -0.055);
          const sw = W * 0.052, sh = W * 0.078;
          c.fillStyle = '#ac3127'; c.fillRect(-sw/2, -sh/2, sw, sh);
          c.fillStyle = '#fff0d7'; c.font = gFont(400, sh * 0.47, KIT_FONTS.brush.f);
          c.textAlign = 'center';
          const seal = letter ? '여운' : postcard ? '기록' : '정성';
          c.fillText(seal[0], 0, -sh*0.23); c.fillText(seal[1], 0, sh*0.23);
          c.restore(); mCapEnd(c);
        }
        c.restore();
      } else if (M === 'ty_mask' || M === 'ty_focus' || M === 'ty_spring') {
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.02 + lp * 0.035, 1);
        const shade = c.createLinearGradient(0, H * 0.35, 0, H);
        shade.addColorStop(0, 'rgba(12,12,14,0)');
        shade.addColorStop(0.65, 'rgba(12,12,14,0.72)');
        shade.addColorStop(1, 'rgba(12,12,14,0.82)');
        c.fillStyle = shade; c.fillRect(0, H * 0.35, W, H * 0.65);
        mPromptType(c, W, H, caption, cutIdx, local, cutDur,
          M === 'ty_focus' ? 'focus' : M === 'ty_spring' ? 'spring' : 'mask',
          { font: sp.font, accent: sp.accent });
        if (isPrice) mPrice(c, W, H * 0.54, sp, e);
      } else if (M === 'blob') {
        // 배경 위 떠다니는 원 + 출렁이는 블롭 안에 사진
        for (let i = 0; i < 5; i++) {
          c.beginPath();
          c.arc((W * (0.15 + i * 0.19) + Math.sin(t * 0.6 + i) * 30), H * (0.12 + (i % 3) * 0.3) + Math.cos(t * 0.5 + i * 2) * 24, 30 + i * 9, 0, Math.PI * 2);
          c.fillStyle = i % 2 ? sp.accent2 + '22' : sp.accent + '26';
          c.fill();
        }
        const cx = W / 2, cy = stageH * 0.55, R = W * 0.41 * (0.7 + 0.3 * ent);
        c.save();
        c.beginPath();
        for (let a = 0; a <= Math.PI * 2 + 0.01; a += Math.PI / 60) {
          const rr = R * (1 + 0.07 * Math.sin(3 * a + t * 1.8) + 0.05 * Math.sin(5 * a - t * 1.2));
          const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr * 1.12;
          if (a === 0) c.moveTo(px, py); else c.lineTo(px, py);
        }
        c.closePath();
        c.shadowColor = sp.accent + '88';
        c.shadowBlur = 40;
        c.fillStyle = sp.accent;
        c.fill();
        c.shadowBlur = 0;
        c.clip();
        mPhoto(c, S, 0, cx - R * 1.15, cy - R * 1.3, R * 2.3, R * 2.6, 1.05 + lp * 0.06);
        c.restore();
        if (isPrice) mPrice(c, W, capY - 4, sp, e);
        mCaption(c, caption, W / 2, capY + (isPrice ? 40 : 0), W - 70, capH - (isPrice ? 40 : 0), 40, sp.font, fg, e);
      } else if (M === 'sweep') {
        mPhoto(c, S, 0, 0, 0, W, H, 1.08 + lp * 0.05);
        const g = c.createLinearGradient(0, H * 0.45, 0, H);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(0,0,0,0.85)');
        c.fillStyle = g;
        c.fillRect(0, H * 0.45, W, H * 0.55);
        // 컷 시작마다 사선 색 띠 세 줄이 휙 지나감
        if (local < 0.7) {
          const cols = [sp.accent, sp.accent2, '#ffffff'];
          cols.forEach((col, i) => {
            const p = mClamp((local - i * 0.07) / 0.5);
            const x = -W * 1.2 + p * W * 2.6;
            c.save();
            c.translate(x, 0);
            c.transform(1, 0, -0.35, 1, 0, 0);
            c.fillStyle = col;
            c.fillRect(i * 70, 0, 120, H);
            c.restore();
          });
        }
        c.fillStyle = sp.accent;
        c.fillRect(0, 0, W * lp, 6);
        if (isPrice) mPrice(c, W, capY - 10, sp, e);
        mCaption(c, caption, 34, capY + (isPrice ? 36 : 0), W - 68, capH - (isPrice ? 36 : 0), 38, sp.font, '#111111', e, 'left', sp.accent);
      } else if (M === 'tiles') {
        const cols = 4, rows = 6, tw = W / cols, th = H / rows;
        mPhoto(c, S, -1, 0, 0, W, H, 1.1);
        for (let r = 0; r < rows; r++) {
          for (let k = 0; k < cols; k++) {
            const p = cutIdx === 0 && local < 0.05 ? 1 : mEase((local - (r + k) * 0.04) / 0.35);
            if (p <= 0) continue;
            c.save();
            const x = k * tw, y = r * th;
            c.translate(x + tw / 2, y + th / 2);
            c.scale(p, 1);
            c.beginPath();
            c.rect(-tw / 2, -th / 2, tw + 0.5, th + 0.5);
            c.clip();
            mPhoto(c, S, 0, -tw / 2 - x, -th / 2 - y, W, H, 1.04 + lp * 0.05);
            c.restore();
          }
        }
        const g = c.createLinearGradient(0, H * 0.48, 0, H);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(0,0,0,0.86)');
        c.fillStyle = g;
        c.fillRect(0, H * 0.48, W, H * 0.52);
        if (isPrice) mPrice(c, W, capY - 6, sp, e);
        mCaption(c, caption, W / 2, capY + (isPrice ? 36 : 8), W - 76, capH - (isPrice ? 36 : 8), 38, sp.font, '#ffffff', e);
      } else if (M === 'tunnel') {
        // 안쪽에서 바깥으로 계속 커지는 사각 테두리
        c.save();
        c.translate(W / 2, stageH * 0.52);
        for (let i = 0; i < 7; i++) {
          const ph = ((t * 0.45 + i / 7) % 1);
          const s = 0.2 + ph * 1.5;
          c.globalAlpha = (1 - ph) * 0.8;
          c.strokeStyle = i % 2 ? sp.accent : '#ffffff';
          c.lineWidth = 3;
          gRoundRect(c, -W * 0.45 * s, -stageH * 0.5 * s, W * 0.9 * s, stageH * s, 20 * s);
          c.stroke();
        }
        c.restore();
        const sc = 0.62 + 0.12 * ent + lp * 0.03;
        const pw = W * sc, ph = stageH * 0.86 * sc / 0.74;
        const px = (W - pw) / 2, py = stageH * 0.52 - ph / 2;
        c.save();
        gRoundRect(c, px, py, pw, ph, 18);
        c.clip();
        mPhoto(c, S, 0, px, py, pw, ph, 1.05);
        c.restore();
        c.strokeStyle = sp.accent;
        c.lineWidth = 4;
        gRoundRect(c, px, py, pw, ph, 18);
        c.stroke();
        if (isPrice) mPrice(c, W, capY, sp, e);
        mCaption(c, caption, W / 2, capY + (isPrice ? 40 : 4), W - 60, capH - (isPrice ? 40 : 4), 44, sp.font, sp.accent, e);
      } else if (M === 'cards') {
        // 겹친 카드: 끝날 무렵 맨 위 카드가 왼쪽으로 넘어감
        const cw = W * 0.74, ch = stageH * 0.9, cx = W / 2, cy = stageH * 0.52;
        const out = mClamp((local - (cutDur - 0.45)) / 0.45);
        for (let i = 2; i >= 0; i--) {
          c.save();
          const rot = (i === 0 ? -out * 0.5 : (i === 1 ? 0.05 : -0.07));
          c.translate(cx + (i === 0 ? -out * W : i * 6), cy + i * 10);
          c.rotate(rot);
          c.shadowColor = 'rgba(0,0,0,0.18)';
          c.shadowBlur = 24;
          gRoundRect(c, -cw / 2, -ch / 2, cw, ch, 22);
          c.fillStyle = '#ffffff';
          c.fill();
          c.shadowBlur = 0;
          gRoundRect(c, -cw / 2 + 10, -ch / 2 + 10, cw - 20, ch - 20, 16);
          c.clip();
          mPhoto(c, S, i, -cw / 2 + 10, -ch / 2 + 10, cw - 20, ch - 20, 1.04);
          c.restore();
        }
        // 하트 팝
        const hp = gBack(mClamp((local - 0.4) / 0.4));
        if (hp > 0) {
          c.save();
          c.translate(W * 0.82, stageH * 0.12);
          c.scale(hp, hp);
          c.fillStyle = sp.accent;
          c.beginPath();
          c.moveTo(0, 12);
          c.bezierCurveTo(-26, -8, -14, -30, 0, -16);
          c.bezierCurveTo(14, -30, 26, -8, 0, 12);
          c.fill();
          c.restore();
        }
        if (isPrice) mPrice(c, W, capY, sp, e);
        mCaption(c, caption, W / 2, capY + (isPrice ? 40 : 4), W - 70, capH - (isPrice ? 40 : 4), 40, sp.font, '#111111', e);
      } else if (M === 'eq') {
        const cx = W / 2, cy = stageH * 0.52, R = W * 0.3;
        const bars = 64;
        for (let i = 0; i < bars; i++) {
          const a = (i / bars) * Math.PI * 2 - Math.PI / 2;
          const v = 0.35 + 0.65 * Math.abs(Math.sin(t * 3.1 + i * 0.7) * Math.cos(t * 1.7 + i * 0.23));
          const L = 14 + v * 52 * ent;
          c.strokeStyle = i % 2 ? sp.accent : sp.accent2;
          c.lineWidth = 4;
          c.lineCap = 'round';
          c.beginPath();
          c.moveTo(cx + Math.cos(a) * (R + 10), cy + Math.sin(a) * (R + 10));
          c.lineTo(cx + Math.cos(a) * (R + 10 + L), cy + Math.sin(a) * (R + 10 + L));
          c.stroke();
        }
        c.save();
        c.beginPath();
        c.arc(cx, cy, R, 0, Math.PI * 2);
        c.clip();
        mPhoto(c, S, 0, cx - R, cy - R, R * 2, R * 2, 1.1 + lp * 0.06);
        c.restore();
        c.strokeStyle = '#ffffff';
        c.lineWidth = 3;
        c.beginPath();
        c.arc(cx, cy, R, 0, Math.PI * 2);
        c.stroke();
        if (isPrice) mPrice(c, W, capY, sp, e);
        c.save();
        c.shadowColor = sp.accent;
        c.shadowBlur = 16;
        mCaption(c, caption, W / 2, capY + (isPrice ? 40 : 4), W - 60, capH - (isPrice ? 40 : 4), 40, sp.font, '#ffffff', e);
        c.restore();
      } else if (M === 'aurora') {
        [[sp.accent, 0.3, 0.25], [sp.accent2, 0.75, 0.4], ['#f472b6', 0.4, 0.75]].forEach(([col, fx, fy], i) => {
          const x = W * fx + Math.sin(t * 0.4 + i * 2) * 60, y = H * fy + Math.cos(t * 0.35 + i) * 50;
          const g = c.createRadialGradient(x, y, 0, x, y, W * 0.7);
          g.addColorStop(0, col + '66');
          g.addColorStop(1, col + '00');
          c.fillStyle = g;
          c.fillRect(0, 0, W, H);
        });
        const fy = Math.sin(t * 1.4) * 6;
        const pw = W * 0.7, ph = stageH * 0.9;
        const px = (W - pw) / 2, py = stageH * 0.06 + fy + (1 - ent) * 30;
        c.save();
        c.globalAlpha = ent;
        c.shadowColor = 'rgba(0,0,0,0.5)';
        c.shadowBlur = 40;
        c.shadowOffsetY = 16;
        gRoundRect(c, px, py, pw, ph, 28);
        c.fillStyle = '#000';
        c.fill();
        c.shadowColor = 'transparent';
        c.clip();
        mPhoto(c, S, 0, px, py, pw, ph, 1.05 + lp * 0.05);
        c.restore();
        c.save();
        if ('filter' in c) c.filter = `blur(${Math.round((1 - mEase(e / 0.6)) * 8)}px)`;
        if (isPrice) mPrice(c, W, capY, sp, e);
        mCaption(c, caption, W / 2, capY + (isPrice ? 40 : 4), W - 70, capH - (isPrice ? 40 : 4), 38, sp.font, '#ffffff', e);
        c.restore();
      } else if (M === 'dots') {
        // 크기가 물결치는 점 무늬
        c.fillStyle = 'rgba(0,0,0,0.16)';
        for (let y = 14; y < H; y += 24) {
          for (let x = 14; x < W; x += 24) {
            const r = 2 + 4 * (0.5 + 0.5 * Math.sin(x * 0.02 + y * 0.015 - t * 2.4));
            c.beginPath();
            c.arc(x, y, r, 0, Math.PI * 2);
            c.fill();
          }
        }
        const pw = W * 0.8, ph = stageH * 0.84;
        c.save();
        c.translate(W / 2, stageH * 0.52 + (1 - ent) * 40);
        c.rotate(-0.04 + Math.sin(t * 0.8) * 0.012);
        c.fillStyle = '#111111';
        c.fillRect(-pw / 2 + 10, -ph / 2 + 12, pw, ph);
        c.fillStyle = '#ffffff';
        c.fillRect(-pw / 2 - 6, -ph / 2 - 6, pw + 12, ph + 12);
        c.beginPath();
        c.rect(-pw / 2, -ph / 2, pw, ph);
        c.clip();
        mPhoto(c, S, 0, -pw / 2, -ph / 2, pw, ph, 1.05 + lp * 0.05);
        c.restore();
        if (isPrice) mPrice(c, W, capY, Object.assign({}, sp, { accent: sp.accent2 }), e);
        mCaption(c, caption, W / 2, capY + (isPrice ? 40 : 4), W - 70, capH - (isPrice ? 40 : 4), 40, sp.font, '#111111', e, 'center', '#ffffff');
      } else if (M === 'number') {
        // 큰 컷 번호 글자 속에 사진
        mPhoto(c, S, 0, 0, 0, W, stageH, 1.15);
        c.fillStyle = 'rgba(12,12,12,0.9)';
        c.fillRect(0, 0, W, stageH);
        const num = kPad(cutIdx + 1);
        if (!window.__mNumCanvas) { window.__mNumCanvas = document.createElement('canvas'); }
        const oc = window.__mNumCanvas;
        oc.width = W; oc.height = stageH;
        const ox = oc.getContext('2d');
        ox.clearRect(0, 0, W, stageH);
        ox.textAlign = 'center';
        ox.textBaseline = 'middle';
        ox.font = gFont(900, Math.round(stageH * 0.78), GENRE_FONTS.impact);
        ox.fillStyle = '#fff';
        const fitS = Math.min(1, (W * 0.88) / Math.max(1, ox.measureText(num).width));
        const s = (0.85 + 0.15 * ent) * fitS;
        ox.save();
        ox.translate(W / 2, stageH * 0.54);
        ox.scale(s, s);
        ox.fillText(num, 0, 0);
        ox.restore();
        ox.globalCompositeOperation = 'source-in';
        const img = kitImg(S, 0);
        if (img) kitCover(ox, img, 0, 0, W, stageH, 1.08 + lp * 0.06, 0, 0); else { ox.fillStyle = sp.accent; ox.fillRect(0, 0, W, stageH); }
        ox.globalCompositeOperation = 'source-over';
        c.drawImage(oc, 0, 0);
        c.save();
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.font = gFont(900, Math.round(stageH * 0.78), GENRE_FONTS.impact);
        c.translate(W / 2, stageH * 0.54);
        c.scale(s, s);
        // 외곽선 숫자 대신 옅게 채운 숫자 (테두리 글자 제거)
        c.globalAlpha = 0.18;
        c.fillStyle = sp.accent;
        c.fillText(num, 0, 0);
        c.restore();
        c.fillStyle = sp.accent;
        c.font = gFont(800, 16, GENRE_FONTS.sans);
        c.textAlign = 'left';
        c.fillText(`${num} / ${kPad(totalCuts)}`, 26, 40);
        c.fillRect(26, 52, 60 * ent, 4);
        if (isPrice) mPrice(c, W, capY, sp, e);
        mCaption(c, caption, 30, capY + (isPrice ? 40 : 4), W - 60, capH - (isPrice ? 40 : 4), 40, sp.font, '#ffffff', e, 'left');
      } else if (M === 'circle') {
        // 모서리에서 원이 퍼지며 전체 화면 다음 사진으로 바뀜
        const corner = [[0, 0], [W, 0], [W, H], [0, H]][cutIdx % 4];
        const R = Math.hypot(W, H) * mEase(local / 0.75);
        mPhoto(c, S, -1, 0, 0, W, H, 1.08);
        c.save();
        c.beginPath();
        c.arc(corner[0], corner[1], cutIdx === 0 ? 9999 : R, 0, Math.PI * 2);
        c.clip();
        mPhoto(c, S, 0, 0, 0, W, H, 1.04 + lp * 0.05);
        c.restore();
        if (cutIdx > 0 && local < 0.8) {
          c.strokeStyle = sp.accent;
          c.lineWidth = 6;
          c.beginPath();
          c.arc(corner[0], corner[1], R, 0, Math.PI * 2);
          c.stroke();
        }
        // 진행 링
        c.save();
        c.translate(W - 44, 44);
        c.strokeStyle = 'rgba(255,255,255,0.25)';
        c.lineWidth = 4;
        c.beginPath(); c.arc(0, 0, 18, 0, Math.PI * 2); c.stroke();
        c.strokeStyle = sp.accent;
        c.beginPath(); c.arc(0, 0, 18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * lp); c.stroke();
        c.restore();
        const cg = c.createLinearGradient(0, H * 0.48, 0, H);
        cg.addColorStop(0, 'rgba(0,0,0,0)');
        cg.addColorStop(1, 'rgba(0,0,0,0.82)');
        c.fillStyle = cg;
        c.fillRect(0, H * 0.48, W, H * 0.52);
        if (isPrice) mPrice(c, W, capY - 10, sp, e);
        mCaption(c, caption, W / 2, capY + (isPrice ? 30 : 4), W - 80, capH - (isPrice ? 30 : 8), 38, sp.font, '#ffffff', e);
      } else if (M === 'ribbon') {
        // 사선 리본 두 줄이 사진 위아래 모서리를 지나감 (자막 구역에는 안 들어감)
        const pw = W - 60, ph = stageH - 70;
        c.save();
        gRoundRect(c, 30, 40, pw, ph, 16);
        c.clip();
        mPhoto(c, S, 0, 30, 40, pw, ph, 1.05 + lp * 0.05);
        c.restore();
        const label = `${(campaign.vehicle || IND.product || '').toString().toUpperCase()} ★ `;
        [[60, -0.12, sp.accent, '#111111', 1], [stageH - 30, 0.1, sp.accent2, '#ffffff', -1]].forEach(([y, rot, bg, fgc, dir]) => {
          c.save();
          c.translate(W / 2, y);
          c.rotate(rot);
          c.fillStyle = bg;
          c.fillRect(-W, -20, W * 2, 40);
          c.fillStyle = fgc;
          c.font = gFont(900, 20, GENRE_FONTS.impact);
          c.textBaseline = 'middle';
          c.textAlign = 'left';
          const tw = Math.max(120, c.measureText(label).width);
          const off = ((t * 80 * dir) % tw + tw) % tw;
          for (let x = -W - tw + off; x < W; x += tw) c.fillText(label, x, 1);
          c.restore();
        });
        if (isPrice) mPrice(c, W, capY + 4, sp, e);
        mCaption(c, caption, W / 2, capY + (isPrice ? 44 : 8), W - 60, capH - (isPrice ? 44 : 8), 44, sp.font, '#ffffff', e);
      } else if (M === 'doors') {
        // 가운데에서 문이 열리듯 양쪽으로 갈라지며 사진이 나타남
        const open = cutIdx === 0 && local < 0.05 ? 1 : mEase(local / 0.7);
        mPhoto(c, S, 0, 0, 0, W, stageH, 1.04 + lp * 0.04);
        if (open < 1) {
          const half = (W / 2) * (1 - open);
          c.save();
          c.beginPath(); c.rect(0, 0, half, stageH); c.clip();
          mPhoto(c, S, -1, -W / 2 + half, 0, W, stageH, 1.08);
          c.restore();
          c.save();
          c.beginPath(); c.rect(W - half, 0, half, stageH); c.clip();
          mPhoto(c, S, -1, W / 2 - half, 0, W, stageH, 1.08);
          c.restore();
          c.fillStyle = sp.accent;
          c.fillRect(half - 2, 0, 4, stageH);
          c.fillRect(W - half - 2, 0, 4, stageH);
        }
        c.fillStyle = sp.accent;
        c.fillRect(W / 2 - 30 * mEase(local / 0.8), stageH + 22, 60 * mEase(local / 0.8), 2);
        if (isPrice) mPrice(c, W, capY + 10, sp, e);
        mCaption(c, caption, W / 2, capY + (isPrice ? 46 : 14), W - 70, capH - (isPrice ? 46 : 14), 38, sp.font, sp.accent2, e);
      } else if (M === 'bounce') {
        // 낱말이 하나씩 통통 튀어 들어옴
        const pw = W - 48, ph = stageH - 40;
        c.save();
        c.shadowColor = 'rgba(14,116,144,0.25)';
        c.shadowBlur = 30;
        c.shadowOffsetY = 12;
        gRoundRect(c, 24, 30 + (1 - ent) * 30, pw, ph, 30);
        c.fillStyle = '#ffffff';
        c.fill();
        c.restore();
        c.save();
        gRoundRect(c, 32, 38 + (1 - ent) * 30, pw - 16, ph - 16, 24);
        c.clip();
        mPhoto(c, S, 0, 32, 38, pw - 16, ph - 16, 1.05 + lp * 0.05);
        c.restore();
        if (isPrice) mPrice(c, W, capY, Object.assign({}, sp, { accent: sp.accent2 }), e);
        const capFk = mCapFont(cutIdx, sp.font);
        const F = KIT_FONTS[capFk] || KIT_FONTS.sans;
        const r = mFit(c, caption, W - 70, 3, 44, 24, capFk);
        c.font = gFont(F.w, r.size, F.f);
        c.textBaseline = 'middle';
        c.textAlign = 'left';
        const y0 = capY + (isPrice ? 44 : 8) + Math.max(0, (capH - (isPrice ? 44 : 8) - r.lines.length * r.lh) / 2);
        let wi = 0;
        const bounceCapOn = mCapBegin(c, W, H, cutIdx, local, r.lines, W / 2, y0 + r.lh / 2, r.lh, 'center');
        if (bounceCapOn) r.lines.forEach((ln, li) => {
          const words = ln.split(' ');
          const lw = c.measureText(ln).width;
          let x = (W - lw) / 2;
          words.forEach((wd) => {
            const ww = c.measureText(wd).width;
            const p = mClamp((local - 0.15 - wi * 0.09) / 0.4);
            const sc = p <= 0 ? 0 : gBack(p);
            if (sc > 0) {
              c.save();
              c.translate(x + ww / 2, y0 + li * r.lh + r.lh / 2);
              c.scale(sc, sc);
              c.fillStyle = mCapColor(cutIdx, wi % 3 === 1 ? sp.accent : wi % 3 === 2 ? sp.accent2 : '#0f172a');
              c.fillText(wd, -ww / 2, 0);
              c.restore();
            }
            x += ww + c.measureText(' ').width;
            wi++;
          });
        });
        if (bounceCapOn) mCapEnd(c);
      } else if (M === 'story') {
        // 인스타 스토리: 위 진행 막대 + 프로필 + 줄마다 색 배경 자막 + 스티커
        mPhoto(c, S, 0, 0, 0, W, H, 1.06 + lp * 0.05);
        const gtop = c.createLinearGradient(0, 0, 0, 160);
        gtop.addColorStop(0, 'rgba(0,0,0,0.55)');
        gtop.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = gtop;
        c.fillRect(0, 0, W, 160);
        const segW = (W - 24 - (totalCuts - 1) * 4) / totalCuts;
        for (let i = 0; i < totalCuts; i++) {
          c.fillStyle = 'rgba(255,255,255,0.35)';
          gRoundRect(c, 12 + i * (segW + 4), 14, segW, 3, 2); c.fill();
          const f = i < cutIdx ? 1 : i === cutIdx ? lp : 0;
          if (f > 0) { c.fillStyle = '#ffffff'; gRoundRect(c, 12 + i * (segW + 4), 14, segW * f, 3, 2); c.fill(); }
        }
        const rg = c.createLinearGradient(14, 30, 50, 66);
        rg.addColorStop(0, '#feda75'); rg.addColorStop(0.5, '#d62976'); rg.addColorStop(1, '#4f5bd5');
        c.beginPath(); c.arc(34, 48, 17, 0, Math.PI * 2); c.fillStyle = rg; c.fill();
        c.beginPath(); c.arc(34, 48, 14, 0, Math.PI * 2); c.fillStyle = '#222'; c.fill();
        c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.font = gFont(800, 13, GENRE_FONTS.sans); c.fillText(String((d && d.name) || '').slice(0, 1), 34, 49);
        c.textAlign = 'left'; c.font = gFont(700, 15, GENRE_FONTS.sans);
        c.fillText(((d && (d.name || d.branch)) || '').slice(0, 18), 60, 44);
        c.fillStyle = 'rgba(255,255,255,0.7)'; c.font = gFont(500, 12, GENRE_FONTS.sans); c.fillText('방금 전', 60, 61);
        // 스토리 텍스트: 줄마다 둥근 배경
        const capFk = mCapFont(cutIdx, sp.font);
        const F = KIT_FONTS[capFk] || KIT_FONTS.sans;
        const r = mFit(c, caption, W - 110, 3, 36, 22, capFk);
        c.font = gFont(F.w, r.size, F.f);
        c.textAlign = 'center';
        const cy0 = H * 0.5 - (r.lines.length * (r.lh + 6)) / 2;
        const storyCapOn = mCapBegin(c, W, H, cutIdx, local, r.lines, W / 2, cy0 + r.lh / 2, r.lh + 6, 'center');
        if (storyCapOn) r.lines.forEach((ln, i) => {
          const p = gBack(mClamp((local - 0.1 - i * 0.08) / 0.35));
          if (p <= 0) return;
          const w = c.measureText(ln).width + 28;
          c.save();
          c.translate(W / 2, cy0 + i * (r.lh + 6) + r.lh / 2);
          c.rotate(-0.03);
          c.scale(p, p);
          gRoundRect(c, -w / 2, -r.lh / 2 - 2, w, r.lh + 4, 10);
          c.fillStyle = i % 2 ? '#ffffff' : sp.accent;
          c.fill();
          c.fillStyle = mCapColor(cutIdx, i % 2 ? '#111111' : '#ffffff');
          c.fillText(ln, 0, 2);
          c.restore();
        });
        if (storyCapOn) mCapEnd(c);
        // 스티커 (가격 컷은 가격 스티커, 아니면 이모지 스티커)
        const sp2 = gBack(mClamp((local - 0.5) / 0.4));
        if (sp2 > 0) {
          c.save();
          c.translate(W * 0.72, H * 0.72);
          c.rotate(0.12);
          c.scale(sp2, sp2);
          const txt = isPrice ? arPriceTag() : (IND.key === 'auto' ? '🚗 NEW' : `${IND.icon} PICK`);
          c.font = gFont(900, 24, GENRE_FONTS.impact);
          const w = c.measureText(txt).width + 34;
          gRoundRect(c, -w / 2, -26, w, 52, 14);
          c.fillStyle = sp.accent2;
          c.fill();
          c.fillStyle = '#111111';
          c.fillText(txt, 0, 2);
          c.restore();
        }
        // 아래 메시지 입력칸 모양
        gRoundRect(c, 16, H - 112, W - 90, 44, 22);
        c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1.5; c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.8)'; c.textAlign = 'left'; c.font = gFont(500, 14, GENRE_FONTS.sans);
        c.fillText('메시지 보내기', 34, H - 89);
        c.font = gFont(400, 24, GENRE_FONTS.sans); c.textAlign = 'center';
        c.fillText('♡', W - 50, H - 88);
      } else if (M === 'feed') {
        // 인스타 피드 게시물 카드
        const top = 60, pw = W - 32, px = 16;
        c.fillStyle = '#ffffff';
        gRoundRect(c, px - 4, top - 50, pw + 8, stageH + 210, 18);
        c.fill();
        const rg = c.createLinearGradient(px, top - 40, px + 34, top - 6);
        rg.addColorStop(0, '#feda75'); rg.addColorStop(0.5, '#d62976'); rg.addColorStop(1, '#4f5bd5');
        c.beginPath(); c.arc(px + 22, top - 24, 16, 0, Math.PI * 2); c.fillStyle = rg; c.fill();
        c.beginPath(); c.arc(px + 22, top - 24, 13, 0, Math.PI * 2); c.fillStyle = sp.accent2; c.fill();
        c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = gFont(800, 12, GENRE_FONTS.sans);
        c.fillText(String((d && d.name) || '').slice(0, 1), px + 22, top - 23);
        c.fillStyle = '#111'; c.textAlign = 'left'; c.font = gFont(700, 15, GENRE_FONTS.sans);
        c.fillText(((d && (d.name || d.branch)) || '').slice(0, 20), px + 46, top - 24);
        c.font = gFont(900, 18, GENRE_FONTS.sans); c.textAlign = 'right'; c.fillText('···', px + pw - 10, top - 26);
        const ph = stageH;
        c.save(); c.beginPath(); c.rect(px, top, pw, ph); c.clip();
        mPhoto(c, S, 0, px, top, pw, ph, 1.04 + lp * 0.05);
        // 두 번 톡 → 하트
        const hp = mClamp((local - 0.6) / 0.6);
        if (hp > 0 && hp < 1) {
          const sc = gBack(Math.min(1, hp * 2)) * (1 - Math.max(0, hp - 0.7) / 0.3);
          c.save(); c.translate(px + pw / 2, top + ph / 2); c.scale(sc * 3, sc * 3);
          c.fillStyle = '#ffffff';
          c.beginPath(); c.moveTo(0, 12); c.bezierCurveTo(-26, -8, -14, -30, 0, -16); c.bezierCurveTo(14, -30, 26, -8, 0, 12); c.fill();
          c.restore();
        }
        c.restore();
        const iy = top + ph + 26;
        const liked = local > 0.9;
        c.save(); c.translate(px + 22, iy); c.scale(0.8, 0.8);
        c.fillStyle = liked ? sp.accent : 'transparent'; c.strokeStyle = liked ? sp.accent : '#111'; c.lineWidth = 2.5;
        c.beginPath(); c.moveTo(0, 12); c.bezierCurveTo(-26, -8, -14, -30, 0, -16); c.bezierCurveTo(14, -30, 26, -8, 0, 12);
        if (liked) c.fill(); c.stroke(); c.restore();
        c.strokeStyle = '#111'; c.lineWidth = 2.2;
        c.beginPath(); c.arc(px + 64, iy - 2, 11, 0.6, Math.PI * 2 - 0.2); c.stroke();
        c.beginPath(); c.moveTo(px + 96, iy - 12); c.lineTo(px + 120, iy - 2); c.lineTo(px + 96, iy + 8); c.closePath(); c.stroke();
        if (isPrice) { c.fillStyle = sp.accent; c.font = gFont(900, 22, GENRE_FONTS.impact); c.textAlign = 'right'; c.fillText(arPriceTag(), px + pw - 8, iy); }
        c.textAlign = 'left';
        const capFk = mCapFont(cutIdx, sp.font);
        const F = KIT_FONTS[capFk] || KIT_FONTS.sans;
        const r = mFit(c, caption, pw - 24, 2, 24, 16, capFk);
        c.globalAlpha = mEase(e / 0.4);
        c.font = gFont(800, r.size, F.f);
        if (mCapBegin(c, W, H, cutIdx, local, r.lines, px + 10, iy + 34, r.lh, 'left')) {
          c.fillStyle = mCapColor(cutIdx, '#111');
          r.lines.forEach((ln, i) => c.fillText(ln, px + 10, iy + 40 + i * r.lh));
          mCapEnd(c);
        }
        c.globalAlpha = 1;
        c.fillStyle = sp.light ? '#8e8e8e' : '#ddd'; c.font = gFont(500, 13, GENRE_FONTS.sans);
        c.fillText(`#${(IND.hashtags && IND.hashtags[0]) || '오늘의추천'} #${(IND.hashtags && IND.hashtags[1]) || '릴스'}`, px + 10, iy + 44 + r.lines.length * r.lh);
      } else if (M === 'poll') {
        // 투표 스티커 템플릿: 반투명 프로스트 글래스 + 은은한 네온 글로우 (배경 사진이 비치고 얼굴을 가리지 않게 하단 배치)
        mPhoto(c, S, 0, 0, 0, W, H, 1.06 + lp * 0.05);
        c.fillStyle = 'rgba(0,0,0,0.22)'; c.fillRect(0, 0, W, H);
        const bw = W - 76, bx = 38, by = H * 0.52;
        const p = gBack(mClamp(local / 0.45));
        c.save(); c.translate(W / 2, by + 110); c.scale(p, p); c.translate(-W / 2, -(by + 110));
        c.shadowColor = sp.bg2 || '#db2777'; c.shadowBlur = 34;
        gRoundRect(c, bx, by, bw, 220, 24);
        c.fillStyle = 'rgba(14,16,28,0.56)'; c.fill();
        c.shadowBlur = 0;
        c.save();
        gRoundRect(c, bx, by, bw, 220, 24);
        c.clip();
        const gg = c.createLinearGradient(bx, by, bx + bw, by + 220);
        gg.addColorStop(0, sp.bg1); gg.addColorStop(1, sp.bg2);
        c.globalAlpha = 0.24;
        c.fillStyle = gg; c.fillRect(bx, by, bw, 220);
        c.restore();
        gRoundRect(c, bx, by, bw, 220, 24);
        c.strokeStyle = 'rgba(255,255,255,0.36)'; c.lineWidth = 1.5; c.stroke();
        c.restore();
        c.globalAlpha = mClamp(local / 0.45);
        mCaption(c, caption, W / 2, by + 14, bw - 40, 96, 30, sp.font, '#ffffff', e);
        const opts = isPrice ? [arPriceTag(), '더 알아볼래요'] : ['가볼래요 👍', '궁금해요 👀'];
        const pick = local > 1.1 ? 0 : -1;
        opts.forEach((o, i) => {
          const oy = by + 118 + i * 50;
          c.save();
          if (pick === i) {
            c.shadowColor = sp.accent2 || '#facc15';
            c.shadowBlur = 18;
          }
          gRoundRect(c, bx + 20, oy, bw - 40, 40, 20);
          c.fillStyle = pick === i ? (sp.accent2 || '#facc15') : 'rgba(255,255,255,0.16)';
          c.fill();
          c.shadowBlur = 0;
          if (pick !== i) {
            c.strokeStyle = 'rgba(255,255,255,0.32)';
            c.lineWidth = 1;
            c.stroke();
          }
          c.fillStyle = pick === i ? '#111111' : '#ffffff';
          c.textAlign = 'center'; c.textBaseline = 'middle';
          gDrawLine(c, o, W / 2, oy + 21, bw - 70, 18, 12, GENRE_FONTS.sans, 800);
          c.restore();
        });
        c.globalAlpha = 1;
      } else if (M === 'vhs') {
        // 캠코더: REC · 시간 · 주사선 · 색 번짐
        const jx = Math.sin(t * 40) * (local < 0.25 ? 6 : 0.8);
        c.save();
        if ('filter' in c) c.filter = 'saturate(1.3) contrast(1.1)';
        c.globalAlpha = 0.6; mPhoto(c, S, 0, -3 + jx, 0, W, H, 1.06 + lp * 0.04);
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35; mPhoto(c, S, 0, 3 + jx, 0, W, H, 1.06 + lp * 0.04);
        c.restore();
        c.globalAlpha = 1;
        c.fillStyle = 'rgba(0,0,0,0.18)';
        for (let y = (t * 30) % 4; y < H; y += 4) c.fillRect(0, y, W, 1.5);
        c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(0, (t * 120) % H, W, 26);
        c.font = gFont(700, 22, GENRE_FONTS.mono); c.textAlign = 'left'; c.textBaseline = 'middle';
        if (Math.floor(t * 2) % 2 === 0) { c.fillStyle = sp.accent; c.beginPath(); c.arc(36, 46, 9, 0, Math.PI * 2); c.fill(); }
        c.fillStyle = '#fff'; c.fillText('REC', 52, 47);
        c.textAlign = 'right'; c.fillText('PLAY ▶', W - 26, 47);
        const sec = Math.floor(t);
        c.textAlign = 'left'; c.font = gFont(700, 18, GENRE_FONTS.mono);
        c.fillText(`00:${kPad(Math.floor(sec / 60))}:${kPad(sec % 60)}`, 26, H - 130);
        c.textAlign = 'right'; c.fillText(new Date().getFullYear() + '. ' + kPad(new Date().getMonth() + 1) + '. ' + kPad(new Date().getDate()), W - 26, H - 130);
        if (isPrice) mPrice(c, W, capY, sp, e);
        mCaption(c, caption, W / 2, capY + (isPrice ? 40 : 4), W - 60, capH - (isPrice ? 40 : 30), 34, sp.font, '#ffffff', e, 'center', 'rgba(0,0,0,0.6)');
      } else if (M === 'neon') {
        // 벽돌 벽 + 깜빡이는 네온 글씨 + 네온 테두리 사진
        c.fillStyle = 'rgba(255,255,255,0.035)';
        for (let y = 0; y < H; y += 26) for (let x = ((y / 26) % 2) * 30 - 30; x < W; x += 60) c.fillRect(x + 2, y + 2, 56, 22);
        const pw = W - 90, ph = stageH - 70, px = 45, py = 50;
        c.save(); gRoundRect(c, px, py, pw, ph, 20); c.clip();
        mPhoto(c, S, 0, px, py, pw, ph, 1.05 + lp * 0.04); c.restore();
        const flick = local < 0.5 ? (Math.sin(local * 60) > 0 ? 1 : 0.25) : 1;
        c.save(); c.globalAlpha = flick;
        c.shadowColor = sp.accent2; c.shadowBlur = 22; c.strokeStyle = sp.accent2; c.lineWidth = 4;
        gRoundRect(c, px, py, pw, ph, 20); c.stroke(); c.restore();
        c.save(); c.globalAlpha = flick; c.shadowColor = sp.accent; c.shadowBlur = 24;
        if (isPrice) mPrice(c, W, capY, sp, e);
        mCaption(c, caption, W / 2, capY + (isPrice ? 40 : 4), W - 60, capH - (isPrice ? 40 : 4), 42, sp.font, '#ffe4fb', e);
        c.restore();
      } else if (M === 'scrap') {
        // 찢은 종이 + 마스킹테이프 + 비스듬한 사진 두 장
        const tear = (x, y, w, h, col, seed) => {
          c.beginPath(); c.moveTo(x, y);
          for (let i = 0; i <= 20; i++) c.lineTo(x + (w * i) / 20, y + ((i * 37 + seed) % 7) - 3);
          c.lineTo(x + w, y + h);
          for (let i = 20; i >= 0; i--) c.lineTo(x + (w * i) / 20, y + h + ((i * 53 + seed) % 7) - 3);
          c.closePath(); c.fillStyle = col; c.fill();
        };
        tear(0, stageH - 30, W, 70, sp.accent2 + '33', 3);
        const pol = (k, cx, cy, rot, sc, a) => {
          c.save(); c.globalAlpha = a; c.translate(cx, cy); c.rotate(rot); c.scale(sc, sc);
          c.shadowColor = 'rgba(0,0,0,0.2)'; c.shadowBlur = 16; c.fillStyle = '#fff';
          c.fillRect(-150, -170, 300, 340); c.shadowBlur = 0;
          c.save(); c.beginPath(); c.rect(-138, -158, 276, 280); c.clip();
          mPhoto(c, S, k, -138, -158, 276, 280, 1.06); c.restore();
          c.fillStyle = 'rgba(250,204,21,0.75)'; c.save(); c.rotate(-0.2); c.fillRect(-40, -182, 90, 26); c.restore();
          c.restore();
        };
        pol(1, W * 0.68, stageH * 0.5, 0.12, 0.84, 0.9);
        pol(0, W * 0.38, stageH * 0.5 + (1 - ent) * 40, -0.08 + (1 - ent) * 0.2, 1.0, ent);
        c.fillStyle = sp.accent; c.font = gFont(700, 18, GENRE_FONTS.sans); c.textAlign = 'left';
        c.save(); c.translate(28, 40); c.rotate(-0.05); c.fillText(`No.${kPad(cutIdx + 1)} ✂`, 0, 0); c.restore();
        if (isPrice) mPrice(c, W, capY + 6, sp, e);
        mCaption(c, caption, W / 2, capY + (isPrice ? 44 : 10), W - 70, capH - (isPrice ? 44 : 10), 40, sp.font, '#3f2a14', e);
      } else if (M === 'punch') {
        // 컷마다 확 당겨지는 줌 + 번쩍 + 큰 단어 하나
        const punch = local < 0.22 ? 1.35 - 0.3 * mEase(local / 0.22) : 1.05 + lp * 0.03;
        mPhoto(c, S, 0, 0, 0, W, H, punch);
        if (local < 0.12) { c.fillStyle = `rgba(255,255,255,${0.8 * (1 - local / 0.12)})`; c.fillRect(0, 0, W, H); }
        const vg = c.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W);
        vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.7)');
        c.fillStyle = vg; c.fillRect(0, 0, W, H);
        const words = caption.split(' ').filter(Boolean);
        const key = words.slice().sort((a, b) => b.length - a.length)[0] || caption;
        const sc = gBack(mClamp(local / 0.3));
        c.save(); c.translate(W / 2, H * 0.42); c.scale(sc, sc); c.rotate(-0.04);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.font = gFont(900, 96, GENRE_FONTS.impact);
        const punchWord = isPrice ? arPriceTag() : key;
        const fs = Math.min(1, (W - 50) / Math.max(1, c.measureText(punchWord).width));
        c.scale(fs, fs);
        kLongShadow(c, punchWord, 0, 0, isPrice ? sp.accent2 : '#ffffff', 'rgba(0,0,0,0.65)', 16, 0.85, 1);
        c.restore();
        mCaption(c, caption, W / 2, capY + 10, W - 60, capH - 10, 30, 'sans', '#ffffff', mClamp((local - 0.25) / 0.8), 'center', sp.accent2);
      } else if (M === 'cube') {
        // 큐브가 돌아가듯 옆면 사진으로 넘어감 (가로 압축으로 입체감)
        const turn = cutIdx === 0 ? 1 : mEase(local / 0.6);
        const cw = W * 0.78, chh = stageH * 0.86, cx = W / 2, cy = stageH * 0.52;
        const faceL = cw * (1 - turn), faceR = cw * turn;
        const x0 = cx - cw / 2;
        if (faceL > 1) {
          c.save(); c.beginPath(); c.rect(x0, cy - chh / 2, faceL, chh); c.clip();
          mPhoto(c, S, -1, x0, cy - chh / 2, faceL, chh, 1.05);
          c.fillStyle = `rgba(0,0,0,${0.5 * turn})`; c.fillRect(x0, cy - chh / 2, faceL, chh); c.restore();
        }
        c.save(); c.beginPath(); c.rect(x0 + faceL, cy - chh / 2, faceR, chh); c.clip();
        mPhoto(c, S, 0, x0 + faceL, cy - chh / 2, faceR, chh, 1.05 + lp * 0.04);
        c.fillStyle = `rgba(0,0,0,${0.5 * (1 - turn)})`; c.fillRect(x0 + faceL, cy - chh / 2, faceR, chh); c.restore();
        c.strokeStyle = sp.accent; c.lineWidth = 3; c.strokeRect(x0, cy - chh / 2, cw, chh);
        c.fillStyle = sp.accent2 + '55';
        c.beginPath(); c.moveTo(x0, cy + chh / 2); c.lineTo(x0 + cw, cy + chh / 2); c.lineTo(x0 + cw - 30, cy + chh / 2 + 22); c.lineTo(x0 + 30, cy + chh / 2 + 22); c.closePath(); c.fill();
        if (isPrice) mPrice(c, W, capY + 12, sp, e);
        mCaption(c, caption, W / 2, capY + (isPrice ? 48 : 16), W - 60, capH - (isPrice ? 48 : 16), 38, sp.font, '#ffffff', e);
      } else if (M === 'glow') {
        // 카메라 글로우: 컷이 바뀔 때 아래·모서리에서 따뜻한 빛이 차오르며 이전 사진과 겹쳐 바뀜 (캡컷 "카메라 글로우")
        const tr = cutIdx > 0 && local < 0.6;
        const mix = tr ? mEase((local - 0.15) / 0.3) : 1;
        if (tr && mix < 1) mPhoto(c, S, -1, 0, 0, W, H, 1.06);
        c.save();
        c.globalAlpha = mix;
        mPhoto(c, S, 0, 0, 0, W, H, 1.04 + lp * 0.05);
        c.restore();
        mWarmLight(c, W, H, tr ? Math.sin(Math.PI * mClamp(local / 0.6)) : 0, t, cutIdx + 1);
        const bg = c.createLinearGradient(0, H * 0.5, 0, H);
        bg.addColorStop(0, 'rgba(0,0,0,0)');
        bg.addColorStop(1, 'rgba(0,0,0,0.82)');
        c.fillStyle = bg;
        c.fillRect(0, H * 0.5, W, H * 0.5);
        if (isPrice) mPrice(c, W, capY, sp, e);
        mCaption(c, caption, W / 2, capY + (isPrice ? 40 : 4), W - 60, capH - (isPrice ? 40 : 4), 40, sp.font, '#ffffff', e);
      } else if (M === 'bokeh') {
        // 보케 스포트라이트: 흐린 배경과 빛망울 위로 가운데만 또렷하게 열림 (캡컷 "갤럭시 블러")
        const scale = 1.04 + lp * 0.04;
        mBlurPhoto(c, S, 0, 0, 0, W, H, scale, 14);
        c.save();
        c.globalCompositeOperation = 'screen';
        c.fillStyle = sp.accent2 + '22';
        c.fillRect(0, 0, W, H);
        for (let i = 0; i < 9; i++) {
          const bx = W * ((i * 0.37 + 0.11) % 1) + Math.sin(t * 0.35 + i) * 18;
          const by = H * ((i * 0.53 + 0.07) % 0.9) + Math.cos(t * 0.3 + i * 1.3) * 14;
          const r = 18 + (i % 4) * 10;
          const bg = c.createRadialGradient(bx, by, 0, bx, by, r);
          bg.addColorStop(0, i % 2 ? 'rgba(255,255,255,0.32)' : sp.accent + '55');
          bg.addColorStop(1, 'rgba(255,255,255,0)');
          c.fillStyle = bg;
          c.beginPath();
          c.arc(bx, by, r, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();
        const open = mEase((local - 0.1) / 0.7);
        if (open > 0.01) {
          const cx = W / 2, cy = stageH * 0.5, R = W * 0.5 * open;
          const off = mOffscreen(W, H);
          const o = off.getContext('2d');
          o.setTransform(1, 0, 0, 1, 0, 0);
          o.globalCompositeOperation = 'source-over';
          o.clearRect(0, 0, W, H);
          mPhoto(o, S, 0, 0, 0, W, H, scale);
          o.globalCompositeOperation = 'destination-in';
          const m = o.createRadialGradient(cx, cy, R * 0.62, cx, cy, R);
          m.addColorStop(0, 'rgba(0,0,0,1)');
          m.addColorStop(1, 'rgba(0,0,0,0)');
          o.fillStyle = m;
          o.fillRect(0, 0, W, H);
          o.globalCompositeOperation = 'source-over';
          c.drawImage(off, 0, 0, W, H);
        }
        const bg = c.createLinearGradient(0, H * 0.48, 0, H);
        bg.addColorStop(0, 'rgba(0,0,0,0)');
        bg.addColorStop(1, 'rgba(0,0,0,0.82)');
        c.fillStyle = bg;
        c.fillRect(0, H * 0.48, W, H * 0.52);
        if (isPrice) mPrice(c, W, capY - 10, sp, e);
        mCaption(c, caption, W / 2, capY + (isPrice ? 30 : 4), W - 80, capH - (isPrice ? 30 : 8), 38, sp.font, '#ffffff', e);
      } else if (M === 'in_g_sub') {
        // 시네마 자막: 꽉 찬 따뜻한 영상미 + 위아래 레터박스 + 하단 부드러운 영화 자막 감성
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.04 + lp * 0.04, 1.15);
        const vg = c.createLinearGradient(0, H * 0.52, 0, H);
        vg.addColorStop(0, 'rgba(18,14,11,0)');
        vg.addColorStop(1, 'rgba(18,14,11,0.58)');
        c.fillStyle = vg;
        c.fillRect(0, H * 0.52, W, H * 0.48);
        const bh = 68;
        c.fillStyle = 'rgba(16,13,10,0.88)';
        c.fillRect(0, 0, W, bh);
        c.fillRect(0, H - bh, W, bh);
        const n0 = new Date();
        const ds = `${n0.getFullYear()}.${String(n0.getMonth() + 1).padStart(2, '0')}.${String(n0.getDate()).padStart(2, '0')}`;
        inLabel(c, ds, 28, bh / 2, 'rgba(235,224,210,0.75)', 'left', Math.round(W * 0.026));
        inLabel(c, `0${cutIdx + 1} / 0${totalCuts}`, W - 28, bh / 2, 'rgba(235,224,210,0.75)', 'right', Math.round(W * 0.026));
        c.save();
        c.shadowColor = 'rgba(0,0,0,0.24)';
        c.shadowBlur = 8;
        mCaption(c, caption, W / 2, H - bh - 330, W - 84, 259, Math.round(W * 0.0599), 'gowun', '#f7f2eb', e);
        c.restore();
        inSign(c, d, W / 2, H - bh / 2, 'rgba(235,224,210,0.8)', 'center', Math.round(W * 0.03));
        inGrain(c, W, H, t, 0.09);
      } else if (M === 'in_g_arch') {
        // 아치 무드: 따뜻한 코튼지 바탕 + 아치형 창문 액자 + 하단 에디토리얼 명조 자막
        const aw = W - 96, ah = Math.round(H * 0.64), ax = 48, ay = 86, r = aw / 2;
        const archPath = (pad) => {
          const rx = ax - pad, ry = ay - pad, rw = aw + pad * 2, rh = ah + pad * 2, rr = rw / 2;
          c.beginPath();
          c.arc( rx + rr, ry + rr, rr, Math.PI, 0, false);
          c.lineTo(rx + rw, ry + rh);
          c.lineTo(rx, ry + rh);
          c.closePath();
        };
        c.save();
        archPath(8);
        c.strokeStyle = 'rgba(140,115,91,0.32)';
        c.lineWidth = 1;
        c.stroke();
        archPath(0);
        c.clip();
        inPhotoFade(c, S, cutIdx, local, ax, ay, aw, ah, 1.03 + lp * 0.04, 1.0);
        c.restore();
        const n0 = new Date();
        inLabel(c, `${String(n0.getMonth() + 1).padStart(2, '0')} · ${String(n0.getDate()).padStart(2, '0')}`, W / 2, 46, '#8c735b', 'center', Math.round(W * 0.026));
        c.save();
        c.globalAlpha = ent;
        inGlass(c, W / 2 - 150, ay + ah - 26, 300, 44, 22);
        c.restore();
        inSign(c, d, W / 2, ay + ah - 4, '#fffaf2', 'center', Math.round(W * 0.03));
        mCaption(c, caption, W / 2, ay + ah + 38, W - 88, 288, Math.round(W * 0.0620), 'maru', '#2b2520', e);
        inGrain(c, W, H, t, 0.07);
      } else if (M === 'in_g_strip') {
        // 필름 스트립: 왼쪽에 살짝 기운 3컷 밀착 인화 스트립 + 오른쪽 손글씨 메모
        const sw = 236, sh = H - 110, sx = 152, sy = H / 2;
        const drop = (1 - ent) * 24;
        c.save();
        c.translate(sx, sy + drop);
        c.rotate(-2.2 * Math.PI / 180);
        c.shadowColor = 'rgba(50,34,20,0.2)';
        c.shadowBlur = 16;
        c.shadowOffsetY = 6;
        c.fillStyle = '#26201b';
        gRoundRect(c, -sw / 2, -sh / 2, sw, sh, 6);
        c.fill();
        c.shadowColor = 'transparent';
        for (let y = -sh / 2 + 16; y < sh / 2 - 12; y += 26) {
          c.fillStyle = '#f3ede3';
          gRoundRect(c, -sw / 2 + 7, y, 8, 12, 2); c.fill();
          gRoundRect(c, sw / 2 - 15, y, 8, 12, 2); c.fill();
        }
        const fh = Math.floor((sh - 56) / 3), fw = sw - 46;
        [-1, 0, 1].forEach((k, i) => {
          const fy = -sh / 2 + 18 + i * (fh + 10);
          c.save();
          c.beginPath();
          c.rect(-fw / 2, fy, fw, fh);
          c.clip();
          mPhoto(c, S, k, -fw / 2, fy, fw, fh, i === 1 ? 1.03 + lp * 0.04 : 1.05);
          inWarm(c, -fw / 2, fy, fw, fh, i === 1 ? 0.9 : 1.15);
          if (i !== 1) {
            c.fillStyle = 'rgba(30,22,16,0.22)';
            c.fillRect(-fw / 2, fy, fw, fh);
          }
          c.restore();
        });
        c.restore();
        const rx = 286, rw = W - rx - 28;
        const n0 = new Date();
        inLabel(c, `${n0.getFullYear()}.${String(n0.getMonth() + 1).padStart(2, '0')}.${String(n0.getDate()).padStart(2, '0')}`, rx, 170, '#8c7765', 'left', Math.round(W * 0.026));
        c.strokeStyle = 'rgba(140,119,101,0.3)';
        c.lineWidth = 1;
        c.beginPath(); c.moveTo(rx, 192); c.lineTo(W - 32, 192); c.stroke();
        mCaption(c, caption, rx, 224, rw, 624, Math.round(W * 0.0684), 'pen', '#2d2621', e, 'left');
        inSign(c, d, rx, H - 120, '#6e5c4d', 'left', Math.round(W * 0.03));
        inGrain(c, W, H, t, 0.08);
      } else if (M === 'in_g_postcard') {
        // 엽서 기록: 크림 질감 바탕 위 두꺼운 엽서 카드 + 우표 미니 컷 + 고운 명조 편지글
        const cw = W - 68, ch = H - 148, cx = 34, cy = 74;
        const lift = (1 - ent) * 18;
        c.save();
        c.translate(0, lift);
        c.shadowColor = 'rgba(65,45,28,0.16)';
        c.shadowBlur = 20;
        c.shadowOffsetY = 8;
        c.fillStyle = '#fffcf7';
        gRoundRect(c, cx, cy, cw, ch, 8);
        c.fill();
        c.shadowColor = 'transparent';
        const px = cx + 22, py = cy + 22, pw = cw - 44, ph = Math.round(ch * 0.62);
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.03, 0.95);
        // 우측 상단 우표 프레임과 소인 스탬프
        const sw = 76, sh = 92, sx = px + pw - sw - 14, sy = py + 14;
        c.save();
        c.rotate(0.03);
        c.shadowColor = 'rgba(40,28,18,0.18)';
        c.shadowBlur = 8;
        c.fillStyle = '#faf5ed';
        c.fillRect(sx - 5, sy - 5, sw + 10, sh + 10);
        c.shadowColor = 'transparent';
        mPhoto(c, S, 1, sx, sy, sw, sh, 1.08);
        inWarm(c, sx, sy, sw, sh, 1.1);
        c.restore();
        c.strokeStyle = 'rgba(140,112,88,0.38)';
        c.lineWidth = 1.2;
        c.beginPath(); c.arc(sx - 10, sy + sh - 8, 22, 0, Math.PI * 2); c.stroke();
        c.beginPath(); c.arc(sx - 10, sy + sh - 8, 16, 0, Math.PI * 2); c.stroke();
        const ty = py + ph + 26;
        c.strokeStyle = 'rgba(160,140,120,0.22)';
        c.beginPath(); c.moveTo(px, ty + 115); c.lineTo(px + pw, ty + 115); c.stroke();
        mCaption(c, caption, px + 4, ty, pw - 8, 250, Math.round(W * 0.0577), 'gowun', '#2c2520', e, 'left');
        const n0 = new Date();
        inLabel(c, `${n0.getFullYear()}.${String(n0.getMonth() + 1).padStart(2, '0')}.${String(n0.getDate()).padStart(2, '0')}`, px + 4, ty + 142, '#9c8b7a', 'left', Math.round(W * 0.026));
        inSign(c, d, px + pw - 4, ty + 142, '#6e5d4f', 'right', Math.round(W * 0.03));
        c.restore();
        inGrain(c, W, H, t, 0.07);
      } else if (M === 'in_g_cam') {
        // 뷰파인더: 전체 화면 일상 컷 + 얇은 카메라 가이드라인 + 하단 담백한 자막
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.03 + lp * 0.04, 0.9);
        const vg = c.createLinearGradient(0, H * 0.58, 0, H);
        vg.addColorStop(0, 'rgba(15,12,10,0)');
        vg.addColorStop(1, 'rgba(15,12,10,0.62)');
        c.fillStyle = vg;
        c.fillRect(0, H * 0.58, W, H * 0.42);
        const m = 34, len = 22;
        c.strokeStyle = 'rgba(255,250,244,0.72)';
        c.lineWidth = 1.5;
        [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(([x, y, dx, dy]) => {
          c.beginPath();
          c.moveTo(x, y + dy * len); c.lineTo(x, y); c.lineTo(x + dx * len, y);
          c.stroke();
        });
        c.strokeStyle = 'rgba(255,250,244,0.45)';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(W / 2 - 12, H / 2); c.lineTo(W / 2 + 12, H / 2);
        c.moveTo(W / 2, H / 2 - 12); c.lineTo(W / 2, H / 2 + 12);
        c.stroke();
        if (Math.floor(t * 2) % 2 === 0) {
          c.fillStyle = '#d9534f';
          c.beginPath(); c.arc(m + 18, m + 20, 4.5, 0, Math.PI * 2); c.fill();
        }
        const sec = String(Math.floor(t)).padStart(2, '0');
        const frm = String(Math.floor((t % 1) * 24)).padStart(2, '0');
        inLabel(c, `00:${sec}:${frm}`, m + 32, m + 20, 'rgba(255,250,244,0.88)', 'left', Math.round(W * 0.026));
        inLabel(c, `${cutIdx + 1} / ${totalCuts}`, W - m - 14, m + 20, 'rgba(255,250,244,0.88)', 'right', Math.round(W * 0.026));
        c.save();
        c.shadowColor = 'rgba(0,0,0,0.22)';
        c.shadowBlur = 9;
        mCaption(c, caption, W / 2, H - 440, W - 100, 283, Math.round(W * 0.0620), 'pretL', '#ffffff', e);
        c.restore();
        inSign(c, d, W / 2, H - 64, 'rgba(255,250,244,0.82)', 'center', Math.round(W * 0.03));
        inGrain(c, W, H, t, 0.06);
      } else if (M === 'in_g_bookmark') {
        // 책갈피 노트: 깊이감 있는 배경 사진 위에 부드러운 명암과 세로 감성 문구
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.05 + lp * 0.04, 1.1);
        c.fillStyle = 'rgba(24,18,14,0.28)';
        c.fillRect(0, 0, W, H);
        const bw = W - 136, bh = Math.round(H * 0.44), by = Math.round(H * 0.42) + (1 - ent) * 22;
        c.save();
        c.globalAlpha = 0.92 * ent;
        inCaptionScrim(c, 0, 0, W, H, (by + bh / 2) / H);
        const n0 = new Date();
        inLabel(c, `${String(n0.getMonth() + 1).padStart(2, '0')}.${String(n0.getDate()).padStart(2, '0')}`, W / 2, by + 58, '#fffaf2', 'center', Math.round(W * 0.026));
        mCaption(c, caption, W / 2, by + 84, bw - 56, (bh - 150) * 1.6, Math.round(W * 0.0577), 'maruL', '#fffaf2', e);
        inSign(c, d, W / 2, by + bh - 36, '#fffaf2', 'center', Math.round(W * 0.03));
        c.restore();
        inGrain(c, W, H, t, 0.08);
      } else if (M === 'in_h_plaque') {
        // 전시 캡션 카드: 화면 가득 찬 따뜻한 사진과 왼쪽 아래 미술관 캡션 명패
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.03 + lp * 0.03, 0.95);
        const vg = c.createLinearGradient(0, H * 0.45, 0, H);
        vg.addColorStop(0, 'rgba(24,18,14,0)');
        vg.addColorStop(1, 'rgba(24,18,14,0.48)');
        c.fillStyle = vg;
        c.fillRect(0, H * 0.45, W, H * 0.55);
        // 얇은 전시장 내부 여백 선
        c.strokeStyle = 'rgba(255,248,238,0.38)';
        c.lineWidth = Math.max(1, Math.round(W * 0.0018));
        c.strokeRect(W * 0.045, H * 0.035, W * 0.91, H * 0.93);
        // 기본 전시 기록과 저장한 내 스타일 모두 사진 위에 직접 쓴다.
        const slide = (1 - ent) * H * 0.018;
        const cx = W * 0.08, cy = H * (custom ? { top: 0.17, middle: 0.37, bottom: 0.59 }[custom.caption.position] : 0.64) + slide, cw = W * 0.78, ch = H * 0.245;
        inCaptionScrim(c, 0, 0, W, H, cy / H + 0.12);
        // 명패 내부 디테일
        c.fillStyle = custom ? custom.colors.accent : '#cabbab';
        c.fillRect(cx + cw * 0.07, cy + ch * 0.23, cw * 0.12, Math.max(1, Math.round(W * 0.002)));
        inLabel(c, `전시 기록 · 제 ${String(cutIdx + 1).padStart(2, '0')}장`, cx + cw * 0.07, cy + ch * 0.14, '#fffaf2', 'left', Math.round(W * 0.025));
        mCaption(c, caption, cx + cw * 0.07, cy + ch * 0.30, cw * 0.86, ch * 0.48, W * (custom ? custom.caption.sizeRatio : 0.056), custom ? custom.fontKey : 'maru', '#fffaf2', e, 'left');
        inSign(c, d, cx + cw * 0.93, cy + ch * 0.86, '#fffaf2', 'right', Math.round(W * 0.029));
        inGrain(c, W, H, t, 0.065);
      } else if (M === 'in_h_panes') {
        // 세 갈래 시선: 같은 사진을 세 개의 세로 창으로 나누어 미묘한 시차로 흐르게 연출
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.12 + lp * 0.03, 1.0);
        c.fillStyle = 'rgba(24,19,15,0.42)';
        c.fillRect(0, 0, W, H);
        const gap = Math.round(W * 0.018);
        const mx = Math.round(W * 0.055);
        const pw = Math.round((W - mx * 2 - gap * 2) / 3);
        const ph = Math.round(H * 0.78);
        const pyBase = Math.round(H * 0.09);
        for (let i = 0; i < 3; i++) {
          const px = mx + i * (pw + gap);
          const drift = Math.sin(t * 0.9 + i * 1.3) * H * 0.008 + (i - 1) * H * 0.014 * ent;
          const py = pyBase + drift;
          c.save();
          gRoundRect(c, px, py, pw, ph, Math.round(W * 0.012));
          c.clip();
          inPhotoFade(c, S, cutIdx, local, 0, drift * 0.6, W, H, 1.04 + lp * 0.03, 0.9);
          c.restore();
          c.strokeStyle = 'rgba(245,236,224,0.45)';
          c.lineWidth = Math.max(1, Math.round(W * 0.0016));
          gRoundRect(c, px, py, pw, ph, Math.round(W * 0.012));
          c.stroke();
        }
        const shade = c.createLinearGradient(0, H * 0.56, 0, H);
        shade.addColorStop(0, 'rgba(18,14,11,0)');
        shade.addColorStop(1, 'rgba(18,14,11,0.78)');
        c.fillStyle = shade;
        c.fillRect(0, H * 0.56, W, H * 0.44);
        inLabel(c, `시선의 조각 · 0${cutIdx + 1}`, W / 2, H * 0.05, 'rgba(242,232,218,0.85)', 'center', Math.round(W * 0.026));
        c.save();
        c.shadowColor = 'rgba(0,0,0,0.24)';
        c.shadowBlur = 9;
        mCaption(c, caption, W / 2, H * 0.69, W * 0.82, H * 0.19, Math.round(W * 0.06), 'gowun', '#faf3e8', e, 'center');
        c.restore();
        inSign(c, d, W / 2, H * 0.92, 'rgba(242,232,218,0.82)', 'center', Math.round(W * 0.03));
        inGrain(c, W, H, t, 0.075);
      } else if (M === 'in_h_double') {
        // 이중노출 잔상: 배경 풀샷 위에 몽환적으로 겹쳐지는 필름 잔상과 에디토리얼 명조 자막
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.06 + lp * 0.04, 1.05);
        c.fillStyle = 'rgba(22,17,13,0.28)';
        c.fillRect(0, 0, W, H);
        // 안쪽 잔상 프레임 (이중노출 효과)
        const gx = W * 0.11 + Math.sin(t * 0.7) * W * 0.012;
        const gy = H * 0.11 + Math.cos(t * 0.6) * H * 0.008;
        const gw = W * 0.78, gh = H * 0.52;
        c.save();
        c.globalAlpha = 0.68 * ent;
        gRoundRect(c, gx, gy, gw, gh, Math.round(W * 0.01));
        c.clip();
        inPhotoFade(c, S, cutIdx, local, gx - W * 0.04, gy - H * 0.03, gw + W * 0.08, gh + H * 0.06, 1.02 + lp * 0.02, 1.15);
        c.restore();
        c.strokeStyle = 'rgba(255,246,234,0.42)';
        c.lineWidth = Math.max(1, Math.round(W * 0.0015));
        gRoundRect(c, gx, gy, gw, gh, Math.round(W * 0.01));
        c.stroke();
        // 하단 그라데이션과 서정적인 타이포
        const vg = c.createLinearGradient(0, H * 0.52, 0, H);
        vg.addColorStop(0, 'rgba(18,13,10,0)');
        vg.addColorStop(1, 'rgba(18,13,10,0.76)');
        c.fillStyle = vg;
        c.fillRect(0, H * 0.52, W, H * 0.48);
        inLabel(c, `기억의 온도 · ${String(cutIdx + 1).padStart(2, '0')} / ${String(totalCuts).padStart(2, '0')}`, W * 0.11, H * 0.065, 'rgba(247,238,226,0.86)', 'left', Math.round(W * 0.026));
        c.save();
        c.shadowColor = 'rgba(0,0,0,0.24)';
        c.shadowBlur = 10;
        mCaption(c, caption, W * 0.11, H * 0.68, W * 0.78, H * 0.19, Math.round(W * 0.06), 'maruL', '#fff8ee', e, 'left');
        c.restore();
        inSign(c, d, W * 0.89, H * 0.91, 'rgba(247,238,226,0.82)', 'right', Math.round(W * 0.03));
        inGrain(c, W, H, t, 0.08);
      } else if (M === 'in_h_vinyl') {
        // 오후의 레코드: 따뜻한 종이 배경 위 정사각 앨범 재킷과 살짝 나와 회전하는 바이닐 음반
        c.fillStyle = '#efe7dc';
        c.fillRect(0, 0, W, H);
        const jSize = Math.round(W * 0.72);
        const jx = Math.round(W * 0.08), jy = Math.round(H * 0.15);
        // 재킷 오른쪽으로 살짝 나온 레코드판
        const vx = jx + jSize * 0.68 + ent * jSize * 0.14;
        const vy = jy + jSize * 0.5;
        const vr = jSize * 0.46;
        c.save();
        c.shadowColor = 'rgba(30,22,16,0.20)';
        c.shadowBlur = 10;
        c.beginPath();
        c.arc(vx, vy, vr, 0, Math.PI * 2);
        c.fillStyle = '#241f1c';
        c.fill();
        c.restore();
        // 레코드 소리골과 중앙 라벨
        c.strokeStyle = 'rgba(255,245,232,0.12)';
        c.lineWidth = Math.max(1, Math.round(W * 0.0015));
        for (let r = 0.55; r <= 0.88; r += 0.11) {
          c.beginPath();
          c.arc(vx, vy, vr * r, 0, Math.PI * 2);
          c.stroke();
        }
        c.beginPath();
        c.arc(vx, vy, vr * 0.32, 0, Math.PI * 2);
        c.fillStyle = '#d9c7b2';
        c.fill();
        c.beginPath();
        c.arc(vx, vy, vr * 0.06, 0, Math.PI * 2);
        c.fillStyle = '#efe7dc';
        c.fill();
        // 앨범 재킷 사진
        c.save();
        c.shadowColor = 'rgba(30,22,16,0.22)';
        c.shadowBlur = 10;
        gRoundRect(c, jx, jy, jSize, jSize, Math.round(W * 0.012));
        c.fillStyle = '#e2d6c5';
        c.fill();
        c.clip();
        inPhotoFade(c, S, cutIdx, local, jx, jy, jSize, jSize, 1.03 + lp * 0.03, 0.95);
        c.restore();
        // 상단 트랙 라벨 및 하단 가사형 자막
        inLabel(c, `오후의 선곡 · 트랙 0${cutIdx + 1}`, jx, H * 0.105, '#7a6858', 'left', Math.round(W * 0.026));
        c.fillStyle = 'rgba(122,104,88,0.35)';
        c.fillRect(jx, H * 0.62, W * 0.84, Math.max(1, Math.round(W * 0.0015)));
        mCaption(c, caption, jx, H * 0.655, W * 0.84, H * 0.20, Math.round(W * 0.06), 'gowun', '#2e251f', e, 'left');
        inSign(c, d, W * 0.92, H * 0.91, '#6e5d4f', 'right', Math.round(W * 0.03));
        inGrain(c, W, H, t, 0.07);
      } else if (M === 'in_film') {
        // 크림 필름: 크림 바탕 위 4:5 사진, 아래 얇은 명조 자막과 서명
        const px = 36, pw = W - 72, ph = Math.round(pw * 1.22), py = 74;
        inLabel(c, inDateLabel(), px, 44, '#8a7d70');
        inLabel(c, 'today\x27s pick', W - px, 44, '#8a7d70', 'right');
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.02 + lp * 0.03);
        mCaption(c, caption, px, py + ph + 26, pw, 120, 30, 'maru', '#2b2622', e, 'left');
        inSign(c, d, W - px, H - 46, '#6f6156');
        inGrain(c, W, H, t, 0.07);
      } else if (M === 'in_mood') {
        // 무드 풀샷: 꽉 찬 사진 + 따뜻한 색감·비네트, 왼쪽 아래 작은 명조 자막
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.04 + lp * 0.04, 1.1);
        const vg = c.createLinearGradient(0, H * 0.5, 0, H);
        vg.addColorStop(0, 'rgba(20,14,10,0)');
        vg.addColorStop(1, 'rgba(20,14,10,0.62)');
        c.fillStyle = vg;
        c.fillRect(0, H * 0.5, W, H * 0.5);
        inLabel(c, `today · ${inDateLabel().toLowerCase()}`, 30, 42, 'rgba(255,255,255,0.86)');
        c.save();
        c.shadowColor = 'rgba(0,0,0,0.35)';
        c.shadowBlur = 12;
        mCaption(c, caption, 30, H - 230, W - 90, 130, 30, 'maru', '#ffffff', e, 'left');
        c.restore();
        inSign(c, d, 30, H - 74, 'rgba(255,255,255,0.82)', 'left');
        inGrain(c, W, H, t, 0.09);
      } else if (M === 'in_diary') {
        // 다이어리 노트: 줄 노트 바탕, 살짝 기운 폴라로이드 + 마스킹테이프, 손글씨 자막
        c.strokeStyle = 'rgba(160,140,120,0.16)';
        c.lineWidth = 1;
        for (let y = 120; y < H; y += 34) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
        const fw = 360, fh = 430, ang = (cutIdx % 2 ? 2.2 : -2.6) * Math.PI / 180;
        const drop = (1 - mEase(local / 0.5)) * (cutIdx > 0 ? 30 : 0);
        c.save();
        c.translate(W / 2, 90 + fh / 2 + drop);
        c.rotate(ang);
        c.shadowColor = 'rgba(60,40,20,0.22)';
        c.shadowBlur = 18;
        c.shadowOffsetY = 6;
        c.fillStyle = '#ffffff';
        c.fillRect(-fw / 2, -fh / 2, fw, fh);
        c.shadowColor = 'transparent';
        mPhoto(c, S, 0, -fw / 2 + 16, -fh / 2 + 16, fw - 32, fh - 92, 1.04 + lp * 0.03);
        inWarm(c, -fw / 2 + 16, -fh / 2 + 16, fw - 32, fh - 92, 0.8);
        c.fillStyle = 'rgba(214,190,150,0.72)';
        c.save(); c.translate(0, -fh / 2); c.rotate(-0.06); c.fillRect(-60, -14, 120, 28); c.restore();
        c.fillStyle = '#9a8676';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.font = gFont(400, 22, KIT_FONTS.pen.f);
        c.fillText(inDateLabel().toLowerCase(), 0, fh / 2 - 38);
        c.restore();
        mCaption(c, caption, W / 2, 90 + fh + 40, W - 80, 150, 40, 'pen', '#3b2f28', e);
        inSign(c, d, W - 40, H - 46, '#7a6658');
        inGrain(c, W, H, t, 0.05);
      } else if (M === 'in_letter') {
        // 미니멀 레터: 여백 많은 흰 바탕, 가운데 작은 사진, 얇은 고딕 자막
        inLabel(c, 'a little note', W / 2, 70, '#a39a8e', 'center', 13);
        c.fillStyle = '#d9d3c9';
        c.fillRect(W / 2 - 14, 92, 28, 1);
        const pw = 300, ph = 375, px = (W - pw) / 2, py = 130;
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.03, 0.7);
        mCaption(c, caption, W / 2, py + ph + 44, W - 120, 120, 25, 'pretL', '#2a2724', e);
        inSign(c, d, W / 2, H - 70, '#8f867a', 'center', 16);
        inGrain(c, W, H, t, 0.04);
      } else if (M === 'in_vlog') {
        // 브이로그 타임스탬프: 꽉 찬 사진, 왼쪽 위 시간·짧은 영문, 가운데 아래 담백한 자막
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.05 + lp * 0.05, 0.9);
        const sec = Math.floor(t);
        const n = new Date();
        const hh = n.getHours();
        inLabel(c, `${hh < 12 ? 'AM' : 'PM'} ${((hh + 11) % 12) + 1}:${String((n.getMinutes() + sec) % 60).padStart(2, '0')}`, 28, 40, '#ffffff', 'left', 15);
        inLabel(c, `vlog · ${String(cutIdx + 1).padStart(2, '0')}`, 28, 64, 'rgba(255,255,255,0.75)', 'left', 12);
        c.save();
        c.shadowColor = 'rgba(0,0,0,0.55)';
        c.shadowBlur = 10;
        mCaption(c, caption, W / 2, H - 250, W - 70, 120, 28, 'pretM', '#ffffff', e);
        c.restore();
        inSign(c, d, W / 2, H - 92, 'rgba(255,255,255,0.8)', 'center', 15);
        inGrain(c, W, H, t, 0.06);
      } else if (M === 'in_collage') {
        // 크림 콜라주: 큰 사진과 작은 사진이 겹친 콜라주, 위쪽에 명조 자막
        mCaption(c, caption, 36, 54, W - 72, 120, 30, 'maru', '#2d2621', e, 'left');
        const ent2 = mEase(local / 0.6);
        c.save();
        c.translate(40 + 222, 200 + 260);
        c.rotate(-1.5 * Math.PI / 180);
        c.shadowColor = 'rgba(60,40,20,0.18)'; c.shadowBlur = 16; c.shadowOffsetY = 5;
        c.fillStyle = '#fffdf9';
        c.fillRect(-222, -260, 444, 520);
        c.shadowColor = 'transparent';
        mPhoto(c, S, 0, -210, -248, 420, 496, 1.03 + lp * 0.03);
        inWarm(c, -210, -248, 420, 496, 0.9);
        c.restore();
        c.save();
        c.globalAlpha = ent2;
        c.translate(W - 150, H - 250 + (1 - ent2) * 24);
        c.rotate(3 * Math.PI / 180);
        c.shadowColor = 'rgba(60,40,20,0.2)'; c.shadowBlur = 14; c.shadowOffsetY = 5;
        c.fillStyle = '#fffdf9';
        c.fillRect(-105, -130, 210, 260);
        c.shadowColor = 'transparent';
        mPhoto(c, S, 1, -97, -122, 194, 220, 1.06);
        inWarm(c, -97, -122, 194, 220, 0.9);
        c.restore();
        inLabel(c, inDateLabel(), 40, H - 120, '#8a7a6b');
        inSign(c, d, 40, H - 92, '#6f6156', 'left', 17);
        inGrain(c, W, H, t, 0.06);
      } else if (M === 'in_music') {
        // 뮤직 플레이어: 따뜻한 사진 위에 반투명 플레이어 카드 (앨범 사진·곡명=자막·가게명·재생 막대)
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.06 + lp * 0.04, 1.1);
        c.fillStyle = 'rgba(20,14,10,0.18)';
        c.fillRect(0, 0, W, H);
        const cw = W - 80, ch = 250, cx = 40, cy = H - ch - 120 + (1 - ent) * 30;
        c.save();
        c.globalAlpha = 0.25 + 0.75 * ent;
        inGlass(c, cx, cy, cw, ch, 28);
        const art = 84;
        c.save();
        gRoundRect(c, cx + 22, cy + 22, art, art, 12);
        c.clip();
        mPhoto(c, S, 0, cx + 22, cy + 22, art, art, 1.2);
        c.restore();
        c.textAlign = 'left';
        c.textBaseline = 'middle';
        c.fillStyle = '#fffaf2';
        const capF = mCapFont(cutIdx, 'maru');
        const r = mFit(c, caption, cw - art - 64, 2, 22, 15, capF);
        c.font = gFont(KIT_FONTS[capF].w, r.size, KIT_FONTS[capF].f);
        if (mCapBegin(c, W, H, cutIdx, local, r.lines, cx + art + 40, cy + 44, r.lh, 'left')) {
          c.fillStyle = mCapColor(cutIdx, '#fffaf2');
          r.lines.forEach((ln, i) => c.fillText(ln, cx + art + 40, cy + 44 + i * r.lh));
          mCapEnd(c);
        }
        c.fillStyle = '#eee7db';
        gDrawLine(c, String((d && d.name) || (typeof IND !== 'undefined' && IND.place) || ''), cx + art + 40, cy + 44 + r.lines.length * r.lh + 4, cw - art - 64, 15, 11, KIT_FONTS.pretL.f, 500);
        const by = cy + 150, bw = cw - 44;
        c.fillStyle = 'rgba(255,255,255,0.18)';
        gRoundRect(c, cx + 22, by, bw, 5, 3); c.fill();
        c.fillStyle = '#fffaf2';
        gRoundRect(c, cx + 22, by, Math.max(6, bw * ((cutIdx + lp) / totalCuts)), 5, 3); c.fill();
        c.fillStyle = '#eee7db';
        c.font = gFont(500, 12, GENRE_FONTS.sans);
        const el = Math.floor(t);
        c.fillText(`0:${String(el).padStart(2, '0')}`, cx + 22, by + 22);
        c.textAlign = 'right';
        c.fillText(`-0:${String(Math.max(0, Math.round(mainDuration - t))).padStart(2, '0')}`, cx + 22 + bw, by + 22);
        // 재생 버튼: ◀◀  ❚❚  ▶▶
        const my = cy + 212, mx = cx + cw / 2;
        c.fillStyle = '#fffaf2';
        const tri = (x, dir) => { c.beginPath(); c.moveTo(x, my - 9); c.lineTo(x + 13 * dir, my); c.lineTo(x, my + 9); c.closePath(); c.fill(); };
        tri(mx - 74, -1); tri(mx - 62, -1);
        c.fillRect(mx - 9, my - 11, 6, 22); c.fillRect(mx + 3, my - 11, 6, 22);
        tri(mx + 62, 1); tri(mx + 74, 1);
        c.restore();
        inGrain(c, W, H, t, 0.07);
      } else if (M === 'in_memo') {
        // 아이폰 메모: 메모 앱 화면처럼 — 노란 "< 메모", 날짜, 굵은 제목(자막)이 타이핑되듯, 아래 둥근 사진
        c.textBaseline = 'middle';
        c.fillStyle = '#e0a400';
        c.textAlign = 'left';
        c.font = gFont(500, 19, GENRE_FONTS.sans);
        c.fillText('‹ 메모', 22, 42);
        c.textAlign = 'right';
        c.fillText('완료', W - 22, 42);
        const n0 = new Date();
        c.textAlign = 'center';
        c.fillStyle = '#9a9a9f';
        c.font = gFont(500, 13, GENRE_FONTS.sans);
        c.fillText(`${n0.getFullYear()}년 ${n0.getMonth() + 1}월 ${n0.getDate()}일 ${n0.getHours() < 12 ? '오전' : '오후'} ${((n0.getHours() + 11) % 12) + 1}:${String(n0.getMinutes()).padStart(2, '0')}`, W / 2, 84);
        const shown = caption.slice(0, Math.max(1, Math.ceil(caption.length * mClamp(local / 1.2))));
        c.textAlign = 'left';
        const capF = mCapFont(cutIdx, 'pretM');
        const r = mFit(c, shown, W - 56, 3, 30, 20, capF);
        c.font = gFont(capF === 'pretM' ? 700 : KIT_FONTS[capF].w, r.size, KIT_FONTS[capF].f);
        if (mCapBegin(c, W, H, cutIdx, local, r.lines, 28, 130, r.lh, 'left')) {
          c.fillStyle = mCapColor(cutIdx, '#1c1c1e');
          r.lines.forEach((ln, i) => c.fillText(ln, 28, 130 + i * r.lh));
          mCapEnd(c);
        }
        if (local < 1.3 && Math.floor(t * 2.5) % 2 === 0) {
          const last = r.lines[r.lines.length - 1] || '';
          c.fillStyle = '#e0a400';
          c.fillRect(28 + c.measureText(last).width + 3, 130 + (r.lines.length - 1) * r.lh - r.size * 0.55, 2, r.size * 1.1);
        }
        const py = 150 + Math.max(1, r.lines.length) * r.lh, ph = H - py - 96;
        c.save();
        gRoundRect(c, 28, py, W - 56, ph, 14);
        c.clip();
        inPhotoFade(c, S, cutIdx, local, 28, py, W - 56, ph, 1.04 + lp * 0.03, 0.6);
        c.restore();
        inSign(c, d, 28, H - 52, '#8e8e93', 'left', 16);
      } else if (M === 'in_lock') {
        // 잠금화면: 꽉 찬 사진 + 얇고 큰 시계 + 아래 알림 말풍선(가게 이름·자막)
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.05 + lp * 0.04, 0.8);
        const tg = c.createLinearGradient(0, 0, 0, H * 0.4);
        tg.addColorStop(0, 'rgba(0,0,0,0.35)'); tg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = tg; c.fillRect(0, 0, W, H * 0.4);
        const n1 = new Date();
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillStyle = 'rgba(255,255,255,0.92)';
        c.font = gFont(500, 18, GENRE_FONTS.sans);
        c.fillText(`${n1.getMonth() + 1}월 ${n1.getDate()}일 ${['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'][n1.getDay()]}`, W / 2, 96);
        c.fillStyle = '#ffffff';
        c.font = gFont(200, 104, GENRE_FONTS.sans);
        c.fillText(`${String(n1.getHours()).padStart(2, '0')}:${String(n1.getMinutes()).padStart(2, '0')}`, W / 2, 172);
        const ny = H - 230 + (1 - ent) * 40, nw = W - 40, nx = 20;
        c.save();
        c.globalAlpha = ent;
        inGlass(c, nx, ny, nw, 104, 22);
        gRoundRect(c, nx + 16, ny + 18, 38, 38, 9);
        c.fillStyle = sp.accent2 === '#ffffff' ? '#2b2622' : sp.accent2;
        c.fill();
        c.fillStyle = '#ffffff';
        c.textAlign = 'center';
        c.font = gFont(700, 18, GENRE_FONTS.sans);
        c.fillText(String((d && d.name) || (typeof IND !== 'undefined' && IND.place) || '·').slice(0, 1), nx + 35, ny + 38);
        c.textAlign = 'left';
        c.fillStyle = '#fffaf2';
        gDrawLine(c, String((d && d.name) || (typeof IND !== 'undefined' && IND.place) || ''), nx + 68, ny + 30, nw - 140, 16, 12, GENRE_FONTS.sans, 700);
        c.fillStyle = '#eee7db';
        c.textAlign = 'right';
        c.font = gFont(500, 13, GENRE_FONTS.sans);
        c.fillText('지금', nx + nw - 16, ny + 30);
        c.textAlign = 'left';
        const capF = mCapFont(cutIdx, 'pretL');
        const r = mFit(c, caption, nw - 90, 2, 17, 13, capF);
        c.font = gFont(capF === 'pretL' ? 500 : KIT_FONTS[capF].w, r.size, KIT_FONTS[capF].f);
        if (mCapBegin(c, W, H, cutIdx, local, r.lines, nx + 68, ny + 58, r.lh, 'left')) {
          c.fillStyle = mCapColor(cutIdx, '#fffaf2');
          r.lines.forEach((ln, i) => c.fillText(ln, nx + 68, ny + 58 + i * r.lh));
          mCapEnd(c);
        }
        c.restore();
        c.fillStyle = 'rgba(255,255,255,0.85)';
        gRoundRect(c, W / 2 - 66, H - 22, 132, 5, 3); c.fill();
        inGrain(c, W, H, t, 0.05);
      } else if (M === 'in_dump') {
        // 포토덤프 리캡: 손글씨 제목, 흩어진 사진 세 장(하나씩 툭툭 놓임), 반짝이 낙서, 손글씨 자막
        c.textAlign = 'left';
        c.textBaseline = 'middle';
        c.fillStyle = '#2d2621';
        c.font = gFont(400, 44, KIT_FONTS.pen.f);
        c.fillText("today's recap", 30, 58);
        c.fillStyle = '#c2603f';
        c.font = gFont(500, 14, GENRE_FONTS.sans);
        c.fillText(`${cutIdx + 1}/${totalCuts}`, W - 64, 58);
        const spots = [[-1, 150, 210, 200, 240, -6], [1, 360, 250, 180, 220, 5], [0, 250, 430, 280, 330, -1.5]];
        spots.forEach(([k, x, y, w, h, deg], i) => {
          const pe = i === 2 ? mEase(local / 0.45) : 1;
          if (pe <= 0) return;
          c.save();
          c.globalAlpha = pe;
          c.translate(x, y + (1 - pe) * -30);
          c.rotate(deg * Math.PI / 180);
          c.scale(0.9 + 0.1 * pe, 0.9 + 0.1 * pe);
          c.shadowColor = 'rgba(60,40,20,0.2)'; c.shadowBlur = 12; c.shadowOffsetY = 4;
          c.fillStyle = '#fffdf9';
          c.fillRect(-w / 2 - 8, -h / 2 - 8, w + 16, h + 16);
          c.shadowColor = 'transparent';
          mPhoto(c, S, k, -w / 2, -h / 2, w, h, 1.06);
          inWarm(c, -w / 2, -h / 2, w, h, 0.9);
          c.restore();
        });
        // 반짝이 낙서 두 개
        const spark = (x, y, r) => { c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.28 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill(); };
        c.fillStyle = '#e8b04b';
        spark(W - 70, 150, 16 + Math.sin(t * 4) * 2);
        spark(70, 640, 11 + Math.cos(t * 4) * 2);
        mCaption(c, caption, W / 2, 640, W - 70, 130, 38, 'pen', '#2d2621', e);
        inSign(c, d, W - 30, H - 44, '#7a6658');
        inGrain(c, W, H, t, 0.05);
      } else if (M === 'in_cal') {
        // 캘린더 카드: 전체 사진, 그 위로 겹친 반투명 일정 카드에 영어 요일·날짜, 아래 명조 자막
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.05 + lp * 0.04, 1);
        const n2 = new Date();
        const cy2 = Math.round(H * 0.5) + (1 - ent) * 24;
        inGlass(c, 34, cy2, W - 68, H - cy2 - 70, W * 0.035);
        c.fillStyle = '#f0d7bb';
        gRoundRect(c, 34, cy2, W - 68, 10, 5); c.fill();
        c.textAlign = 'left';
        c.textBaseline = 'middle';
        c.fillStyle = '#fffaf2';
        c.font = gFont(600, 40, KIT_FONTS.maru.f);
        c.fillText(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][n2.getDay()], 58, cy2 + 56);
        c.fillStyle = '#f0d7bb';
        c.textAlign = 'right';
        c.font = gFont(500, 18, GENRE_FONTS.sans);
        c.fillText(`${String(n2.getMonth() + 1).padStart(2, '0')}.${String(n2.getDate()).padStart(2, '0')}`, W - 58, cy2 + 58);
        c.fillStyle = '#e6ddd0';
        c.fillRect(58, cy2 + 92, W - 116, 1);
        mCaption(c, caption, 58, cy2 + 108, W - 116, H - cy2 - 230, 28, 'maru', '#fffaf2', e, 'left');
        inSign(c, d, W - 58, H - 108, '#eee7db');
        inGrain(c, W, H, t, 0.06);
      } else if (M === 'in_x_contact') {
        // 밀착인화: 질감 있는 인화지 위 정돈된 여섯 장, 선택 컷의 작은 황토색 표식
        const pad = W * 0.07, gap = W * 0.025, active = S.idx % 6;
        const sheet = Math.floor(S.idx / 6), sheetFade = S.idx > 0 && active === 0 ? mEase(S.into / 0.5) : 1;
        inLabel(c, '오늘 모은 장면', pad, H * 0.035, '#786653', 'left', W * 0.024);
        inLabel(c, `${cutIdx + 1} / ${totalCuts}`, W - pad, H * 0.035, '#786653', 'right', W * 0.024);
        mCaption(c, caption, pad, H * 0.06, W - pad * 2, H * 0.13, W * 0.052, 'pretL', '#332b25', e, 'left');
        const fw = (W - pad * 2 - gap) / 2, fh = H * 0.208;
        for (let i = 0; i < 6; i++) {
          const x = pad + (i % 2) * (fw + gap), y = H * 0.22 + Math.floor(i / 2) * (fh + gap);
          const edge = W * 0.009, footer = H * 0.021;
          c.fillStyle = '#faf5eb';
          c.fillRect(x, y, fw, fh);
          const frameScene = Object.assign({}, S, { idx: sheet * 6 + i });
          // 같은 인화지는 유지하고 여섯 장을 넘길 때만 이전 인화지와 겹쳐 전환
          if (sheetFade < 1) mPhoto(c, Object.assign({}, S, { idx: (sheet - 1) * 6 + i }), 0, x + edge, y + edge, fw - edge * 2, fh - edge - footer, 1.025);
          c.save(); c.globalAlpha = sheetFade;
          mPhoto(c, frameScene, 0, x + edge, y + edge, fw - edge * 2, fh - edge - footer, 1.025 + S.p * 0.018);
          c.restore();
          inWarm(c, x + edge, y + edge, fw - edge * 2, fh - edge - footer, 0.85);
          inLabel(c, String((sheet * 6 + i) % Math.max(1, S.n) + 1).padStart(2, '0'), x + edge * 2, y + fh - footer * 0.48, '#786653', 'left', W * 0.019);
          if (i === active) {
            c.save();
            c.globalAlpha = 0.3 + ent * 0.7;
            c.fillStyle = '#987354';
            c.fillRect(x + fw - W * 0.07, y + fh - footer * 0.65, W * 0.045, H * 0.004);
            c.restore();
          }
        }
        inGrain(c, W, H, t, 0.065);
      } else if (M === 'in_x_linen') {
        // 리넨: 성긴 직물 바탕의 세로 인화물과 사진 위에 겹친 메모, 천천히 떠오르는 사진
        c.fillStyle = 'rgba(112,91,65,0.07)';
        for (let x = 0; x < W; x += W / 55) c.fillRect(x, 0, W * 0.0015, H);
        c.fillStyle = 'rgba(255,251,239,0.25)';
        for (let y = 0; y < H; y += H / 85) c.fillRect(0, y, W, H * 0.001);
        const px = W * 0.27, py = H * 0.12 + Math.sin(t * 0.35) * H * 0.004;
        const pw = W * 0.65, ph = H * 0.69, edge = W * 0.016;
        c.fillStyle = '#faf5e9';
        c.fillRect(px - edge, py - edge, pw + edge * 2, ph + edge * 2);
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.035 + lp * 0.022, 0.8);
        c.fillStyle = '#978269';
        c.font = gFont(400, W * 0.04, KIT_FONTS.gowun.f);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        Array.from('일상의결').forEach((ch, i) => c.fillText(ch, W * 0.13, H * 0.15 + i * W * 0.055));
        const nx = W * 0.06, ny = H * 0.45 + (1 - ent) * H * 0.008;
        if (typeof arBeginMotionCaptionCard !== 'function' || arBeginMotionCaptionCard(c, W, H, cutIdx, local, nx + W * 0.29, ny + H * 0.132, W * 0.58, H * 0.265)) {
          inCaptionScrim(c, 0, 0, W, H, (ny + H * 0.132) / H);
          inLabel(c, '간직하고 싶은 순간', nx + W * 0.06, ny + H * 0.032, '#fffaf2', 'left', W * 0.023);
          mCaption(c, caption, nx + W * 0.06, ny + H * 0.055, W * 0.46, H * 0.185, W * 0.05, 'gowun', '#fffaf2', e, 'left');
          if (typeof arEndMotionCaptionCard === 'function') arEndMotionCaptionCard(c);
        }
        inLabel(c, inDateLabel().split(' ')[0], W * 0.91, H * 0.85, '#88725b', 'right', W * 0.023);
        inGrain(c, W, H, t, 0.055);
      } else if (M === 'in_x_cover') {
        // 한 잡지 안의 여섯 역할. 컷 순서로 결정하므로 다시 탐색해도 구도가 같음.
        const role = cutIdx % 6, paper = custom ? custom.colors.primary : '#f6f1e7', ink = custom ? sp.accent2 : '#392e25', muted = custom ? custom.colors.accent : '#756452';
        const beat = Math.min(1, cutDur / 2), titleE = mClamp((local / beat - 0.22) / 0.8);
        const infoE = mEase((local / beat - 0.72) / 0.35), photoE = mEase(local / (0.3 * beat));
        const safeDealer = arDealerForCopy(d);
        const full = role === 0 || role === 3 || role === 5;
        c.fillStyle = paper; c.fillRect(0, 0, W, H);
        const print = (k, x, y, w, h, angle = 0, zoom = 1.03, shade = false) => {
          c.save(); c.globalAlpha = photoE;
          c.translate(W * (x + w / 2), H * (y + h / 2) + (1 - photoE) * H * 0.015);
          c.rotate(angle * photoE);
          const px = -W * w / 2, py = -H * h / 2, edge = W * 0.018;
          c.fillStyle = '#fffcf6'; c.fillRect(px - edge, py - edge, W * w + edge * 2, H * h + edge * 2);
          mPhoto(c, S, k, px, py, W * w, H * h, zoom + lp * 0.015);
          inWarm(c, px, py, W * w, H * h, 0.65);
          if (shade) inCaptionScrim(c, px, py, W * w, H * h, 0.22);
          c.restore();
        };
        const title = (x, y, w, h, color = ink, align = 'left', size = 0.062) => {
          if (custom) return; // 사용자 자막은 모든 사진 위에 마지막으로 그린다.
          mCaption(c, caption, W * x, H * y, W * w, H * h, W * size, 'maru', color, titleE, align);
        };
        if (full) {
          inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, (role === 3 ? 1.48 : 1.025) + lp * 0.025, 0.75);
          inCaptionScrim(c, 0, 0, W, H, custom ? { top: 0.29, middle: 0.48, bottom: 0.68 }[custom.caption.position] : role === 3 ? 0.72 : role === 5 ? 0.52 : 0.29);
        }
        if (role === 0) {
          // 도입: 표지 사진과 질문, 제호는 보조 정보로 나중에 등장.
          title(0.09, 0.19, 0.76, 0.25, '#fffaf2', 'left', 0.085);
        } else if (role === 1) {
          // 공개: 종이 위 오른쪽 인화지와 왼쪽 기사 제목.
          print(0, 0.43, 0.22, 0.48, 0.56, 0.035);
          title(0.08, 0.31, 0.30, 0.37);
          c.fillStyle = '#cabbab'; c.fillRect(W * 0.08, H * 0.25, W * 0.20 * photoE, H * 0.001);
        } else if (role === 2) {
          // 상황: 인화지 위쪽의 부드러운 명암 위에 직접 메모한다.
          print(0, 0.075, 0.16, 0.85, 0.64, -0.012, 1, !custom);
          title(0.16, 0.205, 0.55, 0.20, '#fffaf2');
        } else if (role === 3) {
          // 근거: 디테일 확대와 주석. 수치·효능은 만들어 넣지 않음.
          c.save(); c.globalAlpha = infoE; c.strokeStyle = paper; c.lineWidth = W * 0.0015;
          c.beginPath(); c.arc(W * 0.65, H * 0.36, W * 0.06, 0, Math.PI * 2); c.stroke();
          c.beginPath(); c.moveTo(W * 0.61, H * 0.39); c.lineTo(W * 0.44, H * 0.58); c.stroke(); c.restore();
          title(0.15, 0.61, 0.60, 0.19, '#fffaf2');
        } else if (role === 4) {
          // 선택: 실제로 다른 사진이 있을 때만 두 장을 비교.
          const current = kitImg(S, 0);
          const other = S.photos.findIndex((p) => p !== current && (!p.src || p.src !== current?.src));
          title(0.09, 0.12, 0.80, 0.16);
          if (other >= 0) {
            print(0, 0.08, 0.34, 0.39, 0.38, -0.045);
            print(other - S.idx, 0.54, 0.43, 0.38, 0.38, 0.04);
          } else {
            print(0, 0.15, 0.36, 0.70, 0.43, -0.025, 1);
          }
        } else {
          // 마무리: 실제 입력한 매장·혜택만 사용. 비어 있으면 본문 기록만 남김.
          title(0.20, 0.37, 0.60, 0.24, '#fffaf2');
          c.save(); c.globalAlpha = infoE;
          if (!custom) {
            c.fillStyle = '#cabbab'; c.fillRect(W * 0.20, H * 0.65, W * 0.60, H * 0.001);
            mCaption(c, safeDealer.promoTag || safeDealer.name, W * 0.20, H * 0.67, W * 0.60, H * 0.06, W * 0.03, 'maru', '#fffaf2', infoE, 'left');
          }
          c.restore();
        }
        // 명암은 제호·쪽 번호보다 먼저 그려 작은 글자가 흐려지지 않게 한다.
        if (custom && !full) {
          const center = { top: 0.29, middle: 0.48, bottom: 0.68 }[custom.caption.position];
          c.save(); c.globalAlpha = photoE;
          inCaptionScrim(c, 0, 0, W, H, center, ink !== '#fffaf2'); c.restore();
        }
        c.save(); c.globalAlpha = infoE;
        if (full) { c.shadowColor = 'rgba(0,0,0,0.22)'; c.shadowBlur = Math.min(10, W * 0.006); }
        inLabel(c, custom ? custom.name : '우리의 작은 잡지', W * 0.08, H * 0.065, custom ? (full ? '#fffaf2' : ink) : (full ? paper : muted), 'left', W * 0.026);
        inLabel(c, `${String(cutIdx + 1).padStart(2, '0')} / ${String(totalCuts).padStart(2, '0')}`, W * 0.92, H * 0.065, custom ? (full ? '#fffaf2' : ink) : (full ? paper : muted), 'right', W * 0.026);
        if (!custom) inLabel(c, ['첫 장면', '오늘의 발견', '머무는 순간', '자세히 보기', '다른 시선', safeDealer.name ? '다시 만날 곳' : '남겨둘 장면'][role], W * 0.08, H * 0.87, full ? paper : muted, 'left', W * 0.026);
        c.restore();
        inGrain(c, W, H, t, 0.045);
        if (custom) {
          const y = H * { top: 0.17, middle: 0.36, bottom: 0.56 }[custom.caption.position];
          c.save(); c.globalAlpha = photoE;
          c.fillStyle = muted; c.fillRect(W * 0.13, y + H * 0.025, W * 0.12, H * 0.002);
          mCaption(c, caption, W * 0.13, y + H * 0.04, W * 0.74, H * 0.18, W * custom.caption.sizeRatio, custom.fontKey, full ? '#fffaf2' : ink, titleE, 'left');
          c.restore();
        }
      } else if (M === 'in_card_news') {
        // 사진 위에 직접 얹은 페이지 번호·제목·본문. 앞 페이지도 함께 밀어 빈 프레임을 막음.
        const turnDur = Math.min(0.48, cutDur * 0.18), turn = cutIdx ? mEase(local / turnDur) : 1;
        const drawPage = (pageIdx, offset, settled) => {
          const pageTime = pageIdx === cutIdx ? t : (pageIdx + 1) * cutDur - 0.001;
          const pageScene = Object.assign({}, S, { idx: S.n ? Math.min(S.n - 1, Math.floor(pageTime / (mainDuration / S.n))) : 0 });
          const pageRaw = String((campaign.cutCaptions && campaign.cutCaptions[pageIdx]) || campaign.hook || '');
          // 줄바꿈이나 문장 경계로 제목/본문을 나누되 원문에 없는 내용은 더하지 않음.
          const parts = pageRaw.split(/\n+|(?<=[.!?。])\s+/).map(gCleanCaption).filter(Boolean);
          const headline = parts.shift() || '', body = parts.join(' ');
          const pace = Math.min(1, cutDur / 2), pe = settled ? 1 : mClamp((local / pace - 0.18) / 0.8);
          const be = settled ? 1 : mClamp((local / pace - 0.52) / 0.7);
          const textY = custom ? { top: 0.17, middle: 0.33, bottom: 0.49 }[custom.caption.position] : pageIdx % 2 ? 0.44 : 0.18;
          const pagePal = arCardCutPalette(sp, pageIdx, true);
          const pageAcc = custom ? custom.colors.accent : pagePal.accent;
          c.save(); c.translate(offset, 0);
          gRoundRect(c, W * 0.04, H * 0.035, W * 0.92, H * 0.85, W * 0.035); c.clip();
          mPhoto(c, pageScene, 0, W * 0.04, H * 0.035, W * 0.92, H * 0.85, 1.025);
          inWarm(c, W * 0.04, H * 0.035, W * 0.92, H * 0.85, 0.45);
          inCaptionScrim(c, W * 0.04, H * 0.035, W * 0.92, H * 0.85, (textY + 0.17 - 0.035) / 0.85);
          // 컷마다 포인트 컬러 칩으로 페이지 번호 강조
          c.fillStyle = pageAcc;
          gRoundRect(c, W * 0.15, H * (textY + 0.018), W * 0.16, H * 0.032, 999); c.fill();
          inLabel(c, `${pageIdx + 1} / ${totalCuts}`, W * 0.23, H * (textY + 0.034), kTextOn(pageAcc), 'center', W * 0.026);
          arCardRhythmCaption(c, headline, W * 0.15, H * (textY + 0.065), W * 0.70, H * 0.155, W * (custom ? custom.caption.sizeRatio : 0.076), {
            cutIdx: pageIdx, local: settled ? 2 : local, accent: pageAcc, ink: '#fffaf2', isDark: true, align: 'left',
            headFont: custom ? custom.fontKey : undefined
          });
          c.fillStyle = pageAcc; c.fillRect(W * 0.15, H * (textY + 0.235), W * 0.14 * (settled ? 1 : mEase(local / 0.35)), H * 0.003);
          mCaption(c, body, W * 0.15, H * (textY + 0.252), W * 0.70, H * 0.075, W * (custom ? custom.caption.sizeRatio * 0.65 : 0.043), custom ? custom.fontKey : 'pretL', '#fffaf2', be, 'left');
          c.restore();
        };
        c.save(); c.beginPath(); c.rect(0, 0, W, H * 0.91); c.clip();
        if (cutIdx > 0 && turn < 1) drawPage(cutIdx - 1, -W * turn, true);
        drawPage(cutIdx, W * (1 - turn), false);
        c.restore();
      } else if (M === 'in_x_tabs') {
        // 붙여둔 한마디: 꽉 찬 사진 가장자리의 색인과 가로로 살짝 들어오는 사진 위 손글씨
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.04 + lp * 0.02, 0.9);
        c.fillStyle = 'rgba(37,30,21,0.12)'; c.fillRect(0, 0, W, H);
        const labels = ['눈길', '머문 곳', '기억'];
        labels.forEach((label, i) => {
          const selected = i === cutIdx % 3, tw = W * (selected ? 0.27 : 0.22);
          const tx = W - tw, ty = H * (0.13 + i * 0.058);
          inGlass(c, tx, ty, tw + W * 0.02, H * 0.045, W * 0.025);
          inLabel(c, label, tx + W * 0.035, ty + H * 0.0225, '#fffaf2', 'left', W * 0.025);
        });
        const nx = W * 0.07 + (1 - ent) * W * 0.025, ny = H * 0.57;
        if (typeof arBeginMotionCaptionCard !== 'function' || arBeginMotionCaptionCard(c, W, H, cutIdx, local, nx + W * 0.405, ny + H * 0.127, W * 0.81, H * 0.255)) {
          inCaptionScrim(c, 0, 0, W, H, (ny + H * 0.127) / H);
          inLabel(c, '여기에 남겨둘 말', nx + W * 0.065, ny + H * 0.035, '#fffaf2', 'left', W * 0.024);
          mCaption(c, caption, nx + W * 0.065, ny + H * 0.06, W * 0.67, H * 0.17, W * 0.058, 'pen', '#fffaf2', e, 'left');
          if (typeof arEndMotionCaptionCard === 'function') arEndMotionCaptionCard(c);
        }
        inGrain(c, W, H, t, 0.05);
      } else if (M === 'in_x_walk') {
        // 산책 기록: 사진 위 점선 동선과 방문 순서 핀, 현재 지점 옆에 나타나는 담백한 자막
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.035 + lp * 0.025, 0.7);
        const shade = c.createLinearGradient(0, 0, W, H * 0.65);
        shade.addColorStop(0, 'rgba(23,29,20,0.66)');
        shade.addColorStop(0.55, 'rgba(23,29,20,0.5)');
        shade.addColorStop(1, 'rgba(23,29,20,0.25)');
        c.fillStyle = shade; c.fillRect(0, 0, W, H);
        inLabel(c, '천천히 걷는 하루', W * 0.08, H * 0.065, '#f8f3e7', 'left', W * 0.03);
        inLabel(c, inDateLabel().split(' ')[0], W * 0.08, H * 0.1, '#cbd0b8', 'left', W * 0.023);
        const points = [[W * 0.15, H * 0.25], [W * 0.3, H * 0.41], [W * 0.18, H * 0.61]];
        c.fillStyle = 'rgba(238,235,213,0.55)';
        for (let segment = 0; segment < 2; segment++) {
          const a = points[segment], b = points[segment + 1];
          for (let j = 1; j < 15; j++) {
            const p = j / 15;
            c.beginPath(); c.arc(a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, W * 0.0025, 0, Math.PI * 2); c.fill();
          }
        }
        points.forEach(([x, y], i) => {
          c.fillStyle = '#d8dbc8';
          c.beginPath(); c.arc(x, y, W * 0.013, 0, Math.PI * 2); c.fill();
          if (i < 2) inLabel(c, i === 0 ? '발길 따라' : '잠시 머물러', x + W * 0.04, y, '#f8f3e7', 'left', W * 0.025);
        });
        const [pinX, pinY] = points[2];
        c.save(); c.globalAlpha = ent;
        c.fillStyle = '#f8f3e7';
        c.beginPath(); c.arc(pinX, pinY - W * 0.035, W * 0.033, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.moveTo(pinX - W * 0.024, pinY - W * 0.015);
        c.lineTo(pinX, pinY + W * 0.025); c.lineTo(pinX + W * 0.024, pinY - W * 0.015); c.closePath(); c.fill();
        c.fillStyle = '#687456'; c.beginPath(); c.arc(pinX, pinY - W * 0.035, W * 0.011, 0, Math.PI * 2); c.fill();
        c.restore();
        inLabel(c, `${cutIdx + 1}번째 기록`, W * 0.28, H * 0.61, '#cbd0b8', 'left', W * 0.024);
        mCaption(c, caption, W * 0.28, H * 0.645, W * 0.63, H * 0.21, W * 0.053, 'pretL', '#f8f3e7', e, 'left');
        inGrain(c, W, H, t, 0.06);
      } else if (M === 'in_x_window') {
        // 창가의 오후: 사진 위 반투명 창빛이 느리게 이동하고 가운데 얇은 명조가 스며듦
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.02 + lp * 0.018, 0.6);
        c.fillStyle = 'rgba(246,235,214,0.22)'; c.fillRect(0, 0, W, H);
        c.save();
        c.translate(Math.sin(t * 0.18) * W * 0.035, 0);
        c.transform(1, 0, -0.26, 1, W * 0.18, 0);
        for (let i = 0; i < 3; i++) {
          const x = W * (-0.2 + i * 0.46), beam = c.createLinearGradient(x, 0, x + W * 0.3, 0);
          beam.addColorStop(0, 'rgba(255,247,225,0)');
          beam.addColorStop(0.25, 'rgba(255,247,225,0.28)');
          beam.addColorStop(0.75, 'rgba(255,247,225,0.28)');
          beam.addColorStop(1, 'rgba(255,247,225,0)');
          c.fillStyle = beam; c.fillRect(x, 0, W * 0.3, H);
        }
        c.restore();
        const veil = c.createLinearGradient(0, H * 0.24, 0, H * 0.78);
        veil.addColorStop(0, 'rgba(248,240,224,0)');
        veil.addColorStop(0.3, 'rgba(248,240,224,0.88)');
        veil.addColorStop(0.7, 'rgba(248,240,224,0.88)');
        veil.addColorStop(1, 'rgba(248,240,224,0)');
        c.fillStyle = veil; c.fillRect(0, H * 0.24, W, H * 0.54);
        inLabel(c, '잠시, 이대로', W / 2, H * 0.37, '#79674f', 'center', W * 0.026);
        c.fillStyle = '#b6a389'; c.fillRect(W * 0.47, H * 0.4, W * 0.06, H * 0.001);
        mCaption(c, caption, W / 2, H * 0.425, W * 0.78, H * 0.2, W * 0.058, 'maruL', '#40372d', e);
        inGrain(c, W, H, t, 0.045);
      } else if (M === 'in_y_chat') {
        // 사진 대화: 전체 사진 위 서로 마주 보는 말풍선, 답장이 천천히 올라옴
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.035 + lp * 0.025, 0.85);
        c.fillStyle = 'rgba(32,25,18,0.18)'; c.fillRect(0, 0, W, H);
        const bx = W * 0.07, by = H * 0.49, bw = W * 0.5, bh = H * 0.065;
        c.save(); c.globalAlpha = mEase(local / 0.65);
        inGlass(c, bx, by, bw, bh, W * 0.035);
        inLabel(c, '오늘은 어떤 장면이야?', bx + W * 0.04, by + bh / 2, '#fffaf2', 'left', Math.round(W * 0.026));
        c.restore();
        const reply = mEase((local - 0.22) / 0.65), rx = W * 0.18;
        const ry = H * 0.59 + (1 - reply) * H * 0.014, rw = W * 0.74, rh = H * 0.245;
        if (typeof arBeginMotionCaptionCard !== 'function' || arBeginMotionCaptionCard(c, W, H, cutIdx, local, rx + rw / 2, ry + rh / 2, rw, rh)) {
          c.save(); c.globalAlpha = reply;
          inGlass(c, rx, ry, rw, rh, W * 0.035);
          c.restore();
          mCaption(c, caption, rx + W * 0.045, ry + H * 0.02, rw - W * 0.09, rh - H * 0.04,
            Math.round(W * 0.06), 'pretM', '#fffaf2', mClamp((local - 0.32) / 1.1), 'left');
          if (typeof arEndMotionCaptionCard === 'function') arEndMotionCaptionCard(c);
        }
        inGrain(c, W, H, t, 0.045);
      } else if (M === 'in_y_torn') {
        // 찢은 인화: 불규칙한 종이 가장자리 안에 큰 사진, 종이 전체가 살짝 떠오름
        const lift = Math.sin(t * 0.24) * H * 0.003, left = W * 0.055, right = W * 0.945;
        const top = H * 0.055 + lift, bottom = H * 0.88 + lift;
        c.save(); c.beginPath(); c.moveTo(left, top);
        for (let i = 1; i <= 24; i++) c.lineTo(left + (right - left) * i / 24, top + Math.sin(i * 2.7) * H * 0.003);
        for (let i = 1; i <= 40; i++) c.lineTo(right + Math.sin(i * 2.3) * W * 0.006, top + (bottom - top) * i / 40);
        for (let i = 1; i <= 24; i++) c.lineTo(right - (right - left) * i / 24, bottom + Math.sin(i * 3.1) * H * 0.003);
        for (let i = 1; i <= 40; i++) c.lineTo(left + Math.sin(i * 2.9) * W * 0.006, bottom - (bottom - top) * i / 40);
        c.closePath(); c.clip();
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.04 + lp * 0.02, 0.95);
        const shade = c.createLinearGradient(0, H * 0.42, 0, bottom);
        shade.addColorStop(0, 'rgba(41,28,18,0)'); shade.addColorStop(1, 'rgba(41,28,18,0.8)');
        c.fillStyle = shade; c.fillRect(0, H * 0.42, W, H * 0.5);
        inLabel(c, '손끝에 남긴 풍경', W * 0.12, H * 0.65, '#ecdbc3', 'left', Math.round(W * 0.026));
        mCaption(c, caption, W * 0.12, H * 0.68, W * 0.75, H * 0.17, Math.round(W * 0.06), 'pen', '#fff8ea', e, 'left');
        c.restore(); inGrain(c, W, H, t, 0.07);
      } else if (M === 'in_y_mosaic') {
        // 조각 현상: 여러 사진 격자가 아닌 한 사진의 열두 조각이 순서대로 스며들어 완성
        const developing = local < 1.3;
        mPhoto(c, S, developing && cutIdx > 0 ? -1 : 0, 0, 0, W, H, 1.035 + lp * 0.02);
        if (developing) {
          c.fillStyle = 'rgba(239,228,208,0.42)'; c.fillRect(0, 0, W, H);
        }
        const tw = W / 3, th = H / 4;
        for (let row = 0; developing && row < 4; row++) for (let col = 0; col < 3; col++) {
          const reveal = mEase((local - (row + col) * 0.09) / 0.85);
          const x = col * tw, y = row * th;
          c.save(); c.beginPath(); c.rect(x, y, tw, th); c.clip(); c.globalAlpha = reveal;
          mPhoto(c, S, 0, 0, 0, W, H, 1.035 + lp * 0.02);
          c.restore();
          c.save(); c.globalAlpha = (1 - reveal) * 0.65; c.fillStyle = '#f3eadb';
          c.fillRect(x, y, W * 0.003, th); c.fillRect(x, y, tw, H * 0.002); c.restore();
        }
        inWarm(c, 0, 0, W, H, 0.8);
        const shade = c.createLinearGradient(0, H * 0.52, 0, H);
        shade.addColorStop(0, 'rgba(30,24,18,0)'); shade.addColorStop(1, 'rgba(30,24,18,0.82)');
        c.fillStyle = shade; c.fillRect(0, H * 0.52, W, H * 0.48);
        inLabel(c, '조금씩 선명해지는 하루', W * 0.08, H * 0.67, '#ecdbc2', 'left', Math.round(W * 0.026));
        mCaption(c, caption, W * 0.08, H * 0.7, W * 0.84, H * 0.17,
          Math.round(W * 0.06), 'pretL', '#fff9ee', mClamp((local - 0.25) / 1.1), 'left');
        inGrain(c, W, H, t, 0.055);
      } else if (M === 'ed_vogue') {
        // 보그 에디토리얼: 풀블리드 감성 톤 + 상단 이슈 헤더 + 하단 페이드 명조 타이포
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.03 + lp * 0.04, 1);
        const topG = c.createLinearGradient(0, 0, 0, 150);
        topG.addColorStop(0, 'rgba(0,0,0,0.48)');
        topG.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = topG; c.fillRect(0, 0, W, 150);
        const botG = c.createLinearGradient(0, H * 0.5, 0, H);
        botG.addColorStop(0, 'rgba(0,0,0,0)');
        botG.addColorStop(1, 'rgba(0,0,0,0.82)');
        c.fillStyle = botG; c.fillRect(0, H * 0.5, W, H * 0.5);
        inLabel(c, `ISSUE NO. 0${cutIdx + 1} · ${inDateLabel()}`, 32, 44, 'rgba(232,213,188,0.88)');
        c.fillStyle = 'rgba(232,213,188,0.35)';
        c.fillRect(32, 62, W - 64, 1);
        c.save();
        c.globalAlpha = 0.14 * ent;
        c.fillStyle = '#ffffff';
        c.font = gFont(400, 74, KIT_FONTS.maru.f);
        c.textAlign = 'left';
        c.fillText('EDITORIAL', 24 + (1 - ent) * -30, H * 0.58);
        c.restore();
        if (isPrice) mPrice(c, W, H - 290, sp, e);
        mCaption(c, caption, 32, H - 245, W - 64, 145, 34, 'maru', '#ffffff', e, 'left');
        inSign(c, d, W - 32, H - 46, 'rgba(232,213,188,0.85)');
      } else if (M === 'ed_glasspill') {
        // 글래스 플로우: 풀블리드 + 글자 폭에 딱 맞는 컴팩트 프로스트 글래스 알약
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.05 + lp * 0.05, 1);
        const lg = c.createRadialGradient(W * 0.85, H * 0.12, 10, W * 0.85, H * 0.12, 340);
        lg.addColorStop(0, sp.accent + '44');
        lg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = lg; c.fillRect(0, 0, W, H);
        const F = KIT_FONTS.pretM || KIT_FONTS.sans;
        const wr = mFit(c, caption, W - 120, 2, 30, 20, 'pretM');
        c.font = gFont(F.w, wr.size, F.f);
        const maxW = Math.max(...wr.lines.map((l) => c.measureText(l).width), 120);
        const pw = Math.min(W - 56, maxW + 64);
        const ph = wr.lines.length * wr.lh + 34;
        const px = (W - pw) / 2, py = H - 230 + (1 - ent) * 28;
        if (typeof arBeginMotionCaptionCard !== 'function' || arBeginMotionCaptionCard(c, W, H, cutIdx, local, px + pw / 2, py + ph / 2, pw, ph)) {
          c.save();
          c.globalAlpha = ent;
          gRoundRect(c, px, py, pw, ph, ph / 2);
          c.fillStyle = 'rgba(14,18,28,0.58)';
          c.fill();
          c.strokeStyle = 'rgba(255,255,255,0.28)';
          c.lineWidth = 1.2;
          c.stroke();
          c.fillStyle = sp.accent;
          c.beginPath(); c.arc(px + 26, py + ph / 2, 5, 0, Math.PI * 2); c.fill();
          const capOv = (typeof cutElementOverrides !== 'undefined' && cutElementOverrides && cutElementOverrides[cutIdx] && cutElementOverrides[cutIdx].caption) || null;
          c.fillStyle = (capOv && capOv.color) || '#ffffff';
          if (capOv && capOv.font && CUT_TEXT_FONTS) {
            const fo = CUT_TEXT_FONTS.find((f) => f.id === capOv.font);
            if (fo) c.font = `${fo.weight} ${wr.size}px ${fo.css}`;
          }
          c.textAlign = 'left';
          c.textBaseline = 'middle';
          wr.lines.forEach((ln, i) => {
            c.fillText(ln, px + 44, py + 17 + wr.lh * (i + 0.5));
          });
          c.restore();
          if (typeof arEndMotionCaptionCard === 'function') arEndMotionCaptionCard(c);
        }
      } else if (M === 'ed_kinetic') {
        // 키네틱 포스터: 풀블리드 + 사선 빛 스윕 + 마스크 타이포
        mPhoto(c, S, 0, 0, 0, W, H, 1.06 + lp * 0.05);
        const g = c.createLinearGradient(0, H * 0.42, 0, H);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(0,0,0,0.84)');
        c.fillStyle = g; c.fillRect(0, H * 0.42, W, H * 0.58);
        if (local < 0.55) {
          c.save();
          c.translate(-W + mEase(local / 0.55) * W * 2.4, 0);
          c.transform(1, 0, -0.35, 1, 0, 0);
          c.fillStyle = sp.accent + '44';
          c.fillRect(0, 0, 140, H);
          c.restore();
        }
        mPromptType(c, W, H, caption, cutIdx, local, cutDur, 'mask', { font: 'impact', size: W * 0.095, accent: sp.accent });
      } else if (M === 'ed_arch') {
        // 아치 갤러리: 따뜻한 스톤 배경 위 아치형 창 + 얇은 골드 라인 + 명조 서명
        const ax = 40, ay = 74, aw = W - 80, ah = 590, r = aw / 2;
        c.save();
        c.beginPath();
        c.moveTo(ax, ay + ah);
        c.lineTo(ax, ay + r);
        c.arc(ax + r, ay + r, r, Math.PI, 0, false);
        c.lineTo(ax + aw, ay + ah);
        c.closePath();
        c.save();
        c.clip();
        inPhotoFade(c, S, cutIdx, local, ax, ay, aw, ah, 1.04 + lp * 0.04, 1);
        c.restore();
        c.strokeStyle = sp.accent;
        c.lineWidth = 1.5;
        c.stroke();
        c.restore();
        inLabel(c, 'GALLERY EDITION', W / 2, 44, '#8a7968', 'center');
        mCaption(c, caption, W / 2, ay + ah + 26, W - 80, 140, 28, 'maru', '#2b2622', e, 'center');
        inSign(c, d, W - 40, H - 44, '#8a7968');
        inGrain(c, W, H, t, 0.04);
      } else if (M === 'ed_duotone') {
        // 듀오톤 포스터: 모던 모노크롬/컬러 틴트 + 코너 크롭마크 + 긴그림자 타이포
        c.save();
        c.filter = 'grayscale(1) contrast(1.18)';
        mPhoto(c, S, 0, 0, 0, W, H, 1.05 + lp * 0.04);
        c.restore();
        c.save();
        c.globalCompositeOperation = 'multiply';
        c.fillStyle = sp.accent;
        c.globalAlpha = 0.38;
        c.fillRect(0, 0, W, H);
        c.restore();
        const g = c.createLinearGradient(0, H * 0.45, 0, H);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(0,0,0,0.82)');
        c.fillStyle = g; c.fillRect(0, H * 0.45, W, H * 0.55);
        c.strokeStyle = 'rgba(255,255,255,0.5)';
        c.lineWidth = 1.5;
        [[28, 36], [W - 28, 36], [28, H - 90], [W - 28, H - 90]].forEach(([mx, my]) => {
          c.beginPath(); c.moveTo(mx - 8, my); c.lineTo(mx + 8, my); c.moveTo(mx, my - 8); c.lineTo(mx, my + 8); c.stroke();
        });
        const capFk = mCapFont(cutIdx, 'dohyeon');
        const wr = kWrap(c, caption, W - 72, 2, 46, 26, capFk);
        const F = KIT_FONTS[capFk];
        c.save();
        c.font = gFont(F.w, wr.size, F.f);
        c.textAlign = 'left';
        if (mCapBegin(c, W, H, cutIdx, local, wr.lines, 32, H - 232, wr.lh, 'left')) {
          wr.lines.forEach((ln, i) => {
            const p = mEase((e - i * 0.1) / 0.4);
            c.globalAlpha = p;
            kLongShadow(c, ln, 32, H - 220 + i * wr.lh + (1 - p) * 20, mCapColor(cutIdx, i === 0 ? '#ffffff' : sp.accent2), 'rgba(0,0,0,0.58)', 10, 0.85, 1);
          });
          mCapEnd(c);
        }
        c.restore();
      } else if (M === 'stm_kinetic') {
        // script-to-motion: 은은한 웜 키라이트 + 부드러운 expo.out 시차 타이포 (25px 명조, 여백과 감성)
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.02 + lp * 0.035, 1);
        const kl = c.createRadialGradient(W * 0.84, H * 0.14, 8, W * 0.84, H * 0.14, W * 1.05);
        kl.addColorStop(0, 'rgba(255, 236, 205, 0.20)');
        kl.addColorStop(0.45, 'rgba(232, 213, 188, 0.05)');
        kl.addColorStop(1, 'rgba(8, 7, 6, 0.56)');
        c.fillStyle = kl; c.fillRect(0, 0, W, H);
        const botG = c.createLinearGradient(0, H * 0.55, 0, H);
        botG.addColorStop(0, 'rgba(0,0,0,0)');
        botG.addColorStop(1, 'rgba(10,9,8,0.78)');
        c.fillStyle = botG; c.fillRect(0, H * 0.55, W, H * 0.45);
        // 아주 잔잔하게 떠다니는 미세 먼지 빛
        c.save();
        c.globalCompositeOperation = 'screen';
        for (let i = 0; i < 10; i++) {
          const sx = (((Math.sin(i * 19.3 + 0.5) * 43758.5) % 1 + 1) % 1) * W + Math.sin(t * 0.45 + i) * 12;
          const sy = (((Math.cos(i * 27.1 + 1.2) * 23421.6) % 1 + 1) % 1) * H - ((t * 14 + i * 17) % 90);
          c.fillStyle = 'rgba(245, 230, 205, 0.24)';
          c.beginPath(); c.arc(sx, (sy + H) % H, 1.4 + (i % 3) * 0.7, 0, Math.PI * 2); c.fill();
        }
        c.restore();
        inLabel(c, `0${cutIdx + 1} · ${inDateLabel()}`, 34, 46, 'rgba(232,213,188,0.82)');
        mPromptType(c, W, H, caption, cutIdx, local, cutDur, 'mask', { font: 'maru', size: W * 0.06, align: 'center', bottom: H * 0.81 });
        if (isPrice) mPrice(c, W, H - 265, sp, e);
        inSign(c, d, W - 34, H - 46, 'rgba(232,213,188,0.78)');
      } else if (M === 'stm_cinema') {
        // script-to-motion: 얇은 시네마스코프 레터박스 + 따뜻한 필름 리크 + 23px 영화 자막
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.02 + lp * 0.03, 1);
        c.save();
        c.globalCompositeOperation = 'screen';
        const lkX = W * (0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t * 0.45)));
        const lk = c.createRadialGradient(lkX, H * 0.2, 8, lkX, H * 0.2, W * 0.8);
        lk.addColorStop(0, 'rgba(255, 178, 120, 0.16)');
        lk.addColorStop(0.5, 'rgba(255, 130, 120, 0.05)');
        lk.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = lk; c.fillRect(0, 0, W, H);
        c.restore();
        const botG = c.createLinearGradient(0, H * 0.6, 0, H);
        botG.addColorStop(0, 'rgba(0,0,0,0)');
        botG.addColorStop(1, 'rgba(0,0,0,0.78)');
        c.fillStyle = botG; c.fillRect(0, H * 0.6, W, H * 0.4);
        c.fillStyle = '#080809';
        c.fillRect(0, 0, W, 68);
        c.fillRect(0, H - 68, W, 68);
        c.strokeStyle = 'rgba(230,204,178,0.16)';
        c.lineWidth = 1;
        c.beginPath(); c.moveTo(0, 68.5); c.lineTo(W, 68.5); c.moveTo(0, H - 68.5); c.lineTo(W, H - 68.5); c.stroke();
        inLabel(c, `SCENE 0${cutIdx + 1}`, 32, 38, 'rgba(230,204,178,0.78)');
        if (isPrice) mPrice(c, W, H - 245, sp, e);
        mCaption(c, caption, W / 2, H - 190, W - 88, 100, 23, 'gowun', 'rgba(255,255,255,0.95)', mClamp(local / 0.7), 'center');
        inSign(c, d, W - 32, H - 36, 'rgba(230,204,178,0.75)');
        inGrain(c, W, H, t, 0.04);
      } else if (M === 'stm_sonar') {
        // script-to-motion: 부드러운 포커스 인 + 은은한 파동 링 1개 + 깔끔한 미니 글래스 자막(24px)
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.03 + lp * 0.035, 1);
        const pRing = 1 - Math.pow(1 - Math.min(1, local / 1.05), 3);
        if (pRing < 0.99) {
          c.save();
          c.strokeStyle = `rgba(255, 255, 255, ${(1 - pRing) * 0.28})`;
          c.lineWidth = 1.5;
          c.beginPath();
          c.arc(W / 2, H * 0.44, 24 + pRing * 280, 0, Math.PI * 2);
          c.stroke();
          c.restore();
        }
        const botG = c.createLinearGradient(0, H * 0.58, 0, H);
        botG.addColorStop(0, 'rgba(9,13,18,0)');
        botG.addColorStop(1, 'rgba(9,13,18,0.78)');
        c.fillStyle = botG; c.fillRect(0, H * 0.58, W, H * 0.42);
        inLabel(c, `0${cutIdx + 1} · ${sp.label || 'STORY'}`, 34, 46, 'rgba(226,232,240,0.85)');
        if (isPrice) mPrice(c, W, H - 255, sp, e);
        mCaption(c, caption, W / 2, H - 198, W - 88, 105, 24, 'pretL', '#ffffff', mClamp(local / 0.65), 'center', 'rgba(15, 20, 28, 0.52)');
        inSign(c, d, W - 34, H - 46, 'rgba(226,232,240,0.78)');
      } else if (M === 'stm_glint') {
        // script-to-motion: 샴페인 웜 보케 + 24px 얇은 명조 자막 + 은은한 실버 글린트
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.02 + lp * 0.035, 1);
        c.save();
        c.globalCompositeOperation = 'screen';
        for (let i = 0; i < 11; i++) {
          const bx = (((Math.sin(i * 15.7 + 0.3) * 43758.5) % 1 + 1) % 1) * W + Math.sin(t * 0.45 + i) * 14;
          const by = (((Math.cos(i * 23.9 + 0.9) * 23421.6) % 1 + 1) % 1) * H + Math.cos(t * 0.4 + i) * 12;
          const br = 18 + (i % 4) * 12;
          const g = c.createRadialGradient(bx, by, 2, bx, by, br);
          const col = i % 2 === 0 ? '255,236,195' : '255,255,255';
          g.addColorStop(0, `rgba(${col},0.14)`);
          g.addColorStop(1, `rgba(${col},0)`);
          c.fillStyle = g; c.beginPath(); c.arc(bx, by, br, 0, Math.PI * 2); c.fill();
        }
        c.restore();
        const botG = c.createLinearGradient(0, H * 0.56, 0, H);
        botG.addColorStop(0, 'rgba(0,0,0,0)');
        botG.addColorStop(1, 'rgba(12,10,9,0.78)');
        c.fillStyle = botG; c.fillRect(0, H * 0.56, W, H * 0.44);
        inLabel(c, sp.label || 'MOMENT', 34, 46, 'rgba(243,229,171,0.85)');
        if (isPrice) mPrice(c, W, H - 260, sp, e);
        mCaption(c, caption, W / 2, H - 196, W - 88, 105, 25, 'maruL', '#ffffff', mClamp(local / 0.7), 'center');
        if (local >= 0.4 && local <= 1.35) {
          const gp = (local - 0.4) / 0.95;
          const gx = W * (-0.1 + 1.2 * gp);
          c.save();
          c.globalCompositeOperation = 'screen';
          const gl = c.createLinearGradient(gx - 36, H - 220, gx + 36, H - 110);
          gl.addColorStop(0, 'rgba(255,255,255,0)');
          gl.addColorStop(0.5, 'rgba(255,255,255,0.22)');
          gl.addColorStop(1, 'rgba(255,255,255,0)');
          c.fillStyle = gl;
          c.fillRect(40, H - 210, W - 80, 110);
          c.restore();
        }
        inSign(c, d, W - 34, H - 46, 'rgba(243,229,171,0.78)');
      } else if (M.startsWith('ba_')) {
        // 비포·애프터 비교 5종 공통 배지 헬퍼
        const baBadge = (bx, by, txt, bgCol, fgCol, align = 'left') => {
          c.save();
          c.font = gFont(800, 12, GENRE_FONTS.sans);
          const bw = c.measureText(txt).width + 22, bh = 28;
          const rx = align === 'right' ? bx - bw : align === 'center' ? bx - bw / 2 : bx;
          gRoundRect(c, rx, by, bw, bh, 14);
          c.fillStyle = bgCol; c.fill();
          c.fillStyle = fgCol;
          c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(txt, rx + bw / 2, by + bh / 2 + 1);
          c.restore();
        };
        const beforeIdx = cutIdx === 0 ? 1 : -1;
        if (M === 'ba_slider') {
          const sx = Math.round(W * (0.18 + 0.68 * mEase(local / 1.35)));
          c.save();
          c.filter = 'saturate(0.72) contrast(0.95)';
          mPhoto(c, S, beforeIdx, 0, 0, W, H, 1.05 + lp * 0.03);
          c.restore();
          c.save();
          c.beginPath(); c.rect(sx, 0, W - sx, H); c.clip();
          mPhoto(c, S, 0, 0, 0, W, H, 1.05 + lp * 0.03);
          c.restore();
          c.save();
          c.shadowColor = sp.accent; c.shadowBlur = 16;
          c.fillStyle = '#ffffff';
          c.fillRect(sx - 1.5, 0, 3, H);
          c.beginPath(); c.arc(sx, H * 0.44, 18, 0, Math.PI * 2); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = '#111111';
          c.font = gFont(800, 11, GENRE_FONTS.sans);
          c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText('◀▶', sx, H * 0.44 + 1);
          c.restore();
          baBadge(22, 42, 'BEFORE', 'rgba(15,23,42,0.72)', '#e2e8f0', 'left');
          baBadge(W - 22, 42, 'AFTER', sp.accent, kTextOn(sp.accent), 'right');
          const g = c.createLinearGradient(0, H * 0.55, 0, H);
          g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.84)');
          c.fillStyle = g; c.fillRect(0, H * 0.55, W, H * 0.45);
          mCaption(c, caption, W / 2, H - 235, W - 64, 130, 36, sp.font, '#ffffff', e);
        } else if (M === 'ba_diagonal') {
          const p = mEase(local / 1.05);
          c.save();
          c.filter = 'saturate(0.7)';
          mPhoto(c, S, beforeIdx, 0, 0, W, H, 1.05);
          c.restore();
          const cutY = H * (1.25 - p * 1.35);
          c.save();
          c.beginPath();
          c.moveTo(0, cutY + 240); c.lineTo(W, cutY - 120);
          c.lineTo(W, H + 200); c.lineTo(0, H + 200); c.closePath();
          c.clip();
          mPhoto(c, S, 0, 0, 0, W, H, 1.05 + lp * 0.04);
          c.restore();
          c.save();
          c.strokeStyle = sp.accent; c.lineWidth = 5;
          c.shadowColor = sp.accent; c.shadowBlur = 18;
          c.beginPath(); c.moveTo(0, cutY + 240); c.lineTo(W, cutY - 120); c.stroke();
          c.restore();
          baBadge(22, 42, 'BEFORE', 'rgba(0,0,0,0.68)', '#cbd5e1', 'left');
          baBadge(W - 22, 42, 'AFTER', sp.accent, kTextOn(sp.accent), 'right');
          const g = c.createLinearGradient(0, H * 0.55, 0, H);
          g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.85)');
          c.fillStyle = g; c.fillRect(0, H * 0.55, W, H * 0.45);
          mCaption(c, caption, 30, H - 235, W - 60, 135, 38, sp.font, '#ffffff', e, 'left');
        } else if (M === 'ba_collage') {
          const cw = (W - 60) / 2, ch = 480, py = 100;
          const slide = mEase(local / 0.55);
          [[22, beforeIdx, 'BEFORE', 'rgba(15,23,42,0.82)', '#e2e8f0', (1 - slide) * -28], [22 + cw + 16, 0, 'AFTER', sp.accent, kTextOn(sp.accent), (1 - slide) * 28]].forEach(([cx, idx, lbl, bgc, fgc, dx]) => {
            c.save();
            c.shadowColor = 'rgba(0,0,0,0.35)'; c.shadowBlur = 20; c.shadowOffsetY = 8;
            gRoundRect(c, cx + dx, py, cw, ch, 20);
            c.fillStyle = '#18181b'; c.fill();
            c.restore();
            c.save();
            gRoundRect(c, cx + dx, py, cw, ch, 20); c.clip();
            mPhoto(c, S, idx, cx + dx, py, cw, ch, 1.04 + lp * 0.04);
            c.restore();
            baBadge(cx + dx + 12, py + 14, lbl, bgc, fgc, 'left');
          });
          c.save();
          c.fillStyle = sp.accent;
          c.beginPath(); c.arc(W / 2, py + ch / 2, 18, 0, Math.PI * 2); c.fill();
          c.fillStyle = kTextOn(sp.accent);
          c.font = gFont(800, 16, GENRE_FONTS.sans);
          c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText('→', W / 2, py + ch / 2 + 1);
          c.restore();
          mCaption(c, caption, W / 2, py + ch + 28, W - 60, 160, 34, sp.font, '#ffffff', e);
        } else if (M === 'ba_flash') {
          const afterOn = local >= 0.72;
          if (!afterOn) {
            c.save(); c.filter = 'saturate(0.75)';
            mPhoto(c, S, beforeIdx, 0, 0, W, H, 1.04);
            c.restore();
            baBadge(W / 2, 56, 'BEFORE', 'rgba(15,23,42,0.78)', '#ffffff', 'center');
          } else {
            mPhoto(c, S, 0, 0, 0, W, H, 1.05 + lp * 0.05);
            if (local < 0.92) {
              c.fillStyle = `rgba(255,255,255,${0.7 * (1 - (local - 0.72) / 0.2)})`;
              c.fillRect(0, 0, W, H);
            }
            baBadge(W / 2, 56, 'AFTER ✨', sp.accent, kTextOn(sp.accent), 'center');
          }
          const g = c.createLinearGradient(0, H * 0.55, 0, H);
          g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.84)');
          c.fillStyle = g; c.fillRect(0, H * 0.55, W, H * 0.45);
          mCaption(c, caption, W / 2, H - 235, W - 64, 135, 38, sp.font, '#ffffff', e);
        } else if (M === 'ba_polaroid') {
          const snap = (cx, cy, rot, idx, lbl, bgc, fgc, sc) => {
            c.save();
            c.translate(cx, cy); c.rotate(rot); c.scale(sc, sc);
            c.shadowColor = 'rgba(0,0,0,0.22)'; c.shadowBlur = 20; c.shadowOffsetY = 8;
            c.fillStyle = '#fffdf9';
            gRoundRect(c, -135, -165, 270, 330, 12); c.fill();
            c.shadowBlur = 0;
            c.save();
            gRoundRect(c, -121, -151, 242, 242, 8); c.clip();
            mPhoto(c, S, idx, -121, -151, 242, 242, 1.04 + lp * 0.03);
            c.restore();
            baBadge(0, 114, lbl, bgc, fgc, 'center');
            c.restore();
          };
          snap(W * 0.34, 290, -0.07, beforeIdx, 'BEFORE', '#e5e7eb', '#374151', 0.94);
          snap(W * 0.66, 360, 0.05, 0, 'AFTER', sp.accent, kTextOn(sp.accent), 0.94 + 0.08 * ent);
          mCaption(c, caption, W / 2, 585, W - 70, 170, 32, sp.font, '#2b2622', e);
        }
      } else if (M === 'cn_deck') {
        // 카드뉴스 · 스택 덱: 컷별 컬러 리듬 + 폰트 강약 + 형광펜/칩 강조
        const cp = arCardCutPalette(sp, cutIdx, false);
        c.fillStyle = sp.bg1 || '#f5f1ea';
        c.fillRect(0, 0, W, H);
        const slideIn = cutIdx > 0 ? mEase(local / 0.36) : 1;
        // 뒤쪽 겹쳐진 종이 카드 장식 (컷별 포인트 컬러 엣지)
        c.save();
        c.translate(W / 2, H * 0.44);
        c.rotate(-0.025);
        c.fillStyle = cp.accentSoft;
        gRoundRect(c, -216, -330, 432, 668, 22); c.fill();
        c.rotate(0.05);
        c.fillStyle = '#ebe4d8';
        gRoundRect(c, -216, -330, 432, 668, 22); c.fill();
        c.restore();
        // 메인 전면 카드 (컷별 진입 리듬 변화)
        const cardX = 46 + (cp.beatMode === 1 ? (1 - slideIn) * 52 : 0);
        const cardY = 82 + (cp.beatMode === 0 ? (1 - slideIn) * 32 : 0);
        const cardW = W - 92;
        const cardH = 700;
        c.save();
        c.globalAlpha = Math.min(1, slideIn + 0.25);
        if (cp.beatMode === 2) {
          const sc = 0.95 + 0.05 * arBackOut(local / 0.34);
          c.translate(W / 2, cardY + cardH / 2); c.scale(sc, sc); c.translate(-W / 2, -(cardY + cardH / 2));
        }
        c.shadowColor = 'rgba(20, 16, 12, 0.14)'; c.shadowBlur = 24; c.shadowOffsetY = 10;
        c.fillStyle = cp.tintBg;
        gRoundRect(c, cardX, cardY, cardW, cardH, 22); c.fill();
        c.shadowBlur = 0; c.shadowOffsetY = 0;
        // 상단 사진 영역
        c.save();
        gRoundRect(c, cardX + 14, cardY + 14, cardW - 28, 396, 16); c.clip();
        mPhoto(c, S, 0, cardX + 14, cardY + 14, cardW - 28, 396, 1.03 + lp * 0.035);
        c.restore();
        // 카드 상단 번호 칩 & 총 컷 도트 (컷별 컬러 변화)
        c.fillStyle = cp.accent;
        gRoundRect(c, cardX + 26, cardY + 26, 86, 26, 13); c.fill();
        c.fillStyle = cp.pillFg;
        c.font = gFont(800, 11, GENRE_FONTS.sans);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(`CARD 0${cutIdx + 1}`, cardX + 69, cardY + 40);
        // 페이지 도트
        for (let di = 0; di < totalCuts; di++) {
          c.fillStyle = di === cutIdx ? cp.accent : '#d6d0c4';
          c.beginPath(); c.arc(cardX + cardW - 30 - (totalCuts - 1 - di) * 14, cardY + 432, di === cutIdx ? 5 : 3.5, 0, Math.PI * 2); c.fill();
        }
        inLabel(c, `${String(cutIdx + 1).padStart(2, '0')} / ${String(totalCuts).padStart(2, '0')}`, cardX + 24, cardY + 432, cp.accent, 'left', 12);
        c.fillStyle = cp.accentSoft;
        c.fillRect(cardX + 24, cardY + 450, (cardW - 48) * mEase(local / 0.35), 2);
        if (isPrice) mPrice(c, W, cardY + 462, { ...sp, accent: cp.accent }, e);
        arCardRhythmCaption(c, caption, W / 2, cardY + (isPrice ? 506 : 466), cardW - 44, 182, 28, {
          cutIdx, local, accent: cp.accent, ink: '#1c1917', isDark: false, align: 'center'
        });
        inSign(c, d, W / 2, cardY + cardH - 24, '#78716c');
        c.restore();
      } else if (M === 'cn_summary') {
        // 카드뉴스 · 핵심 요약: 은은한 블러 배경 + 컷별 컬러 진행바 & 리듬 타이포 카드
        const cp = arCardCutPalette(sp, cutIdx, false);
        c.save();
        c.filter = 'blur(8px) brightness(0.68)';
        mPhoto(c, S, 0, -16, -16, W + 32, H + 32, 1.08);
        c.restore();
        const slideP = mEase(local / 0.32);
        const cx = 32, cy = 88 + (1 - slideP) * 18, cw = W - 64, ch = 730;
        c.save();
        c.shadowColor = 'rgba(0,0,0,0.34)'; c.shadowBlur = 32; c.shadowOffsetY = 12;
        c.fillStyle = cp.tintBg;
        gRoundRect(c, cx, cy, cw, ch, 24); c.fill();
        c.shadowBlur = 0; c.shadowOffsetY = 0;
        // 카드 헤더: 포인트 번호 + 진행 스텝 바
        const segW = (cw - 48 - (totalCuts - 1) * 6) / Math.max(1, totalCuts);
        for (let si = 0; si < totalCuts; si++) {
          c.fillStyle = si <= cutIdx ? cp.accent : '#e2e8f0';
          gRoundRect(c, cx + 24 + si * (segW + 6), cy + 22, segW, 5, 3); c.fill();
        }
        c.fillStyle = cp.accentSoft;
        gRoundRect(c, cx + 22, cy + 38, 146, 26, 13); c.fill();
        inLabel(c, `POINT 0${cutIdx + 1} · 핵심 안내`, cx + 34, cy + 51, cp.accent, 'left', 12);
        // 카드 내부 사진
        c.save();
        gRoundRect(c, cx + 20, cy + 74, cw - 40, 338, 16); c.clip();
        mPhoto(c, S, 0, cx + 20, cy + 74, cw - 40, 338, 1.04 + lp * 0.04);
        c.restore();
        if (isPrice) mPrice(c, W, cy + 430, { ...sp, accent: cp.accent }, e);
        arCardRhythmCaption(c, caption, W / 2, cy + (isPrice ? 474 : 438), cw - 48, 202, 29, {
          cutIdx, local, accent: cp.accent, ink: '#0f172a', isDark: false, align: 'center'
        });
        c.fillStyle = '#e2e8f0';
        c.fillRect(cx + 24, cy + ch - 52, cw - 48, 1);
        inSign(c, d, cx + cw / 2, cy + ch - 26, '#64748b');
        c.restore();
      } else if (M === 'cn_boldquote') {
        // 카드뉴스 · 매거진 표지형: 딥 차콜 프레임 + 컷별 포인트 컬러 & 에디토리얼 폰트 리듬
        const cp = arCardCutPalette(sp, cutIdx, true);
        c.fillStyle = cp.tintBg;
        c.fillRect(0, 0, W, H);
        const pw = W - 64, ph = 390, px = 32, py = 278;
        c.fillStyle = cp.accent;
        gRoundRect(c, 34, 48, 108, 26, 13); c.fill();
        c.fillStyle = cp.pillFg;
        c.font = gFont(800, 11, GENRE_FONTS.sans);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(`ISSUE NO. 0${cutIdx + 1}`, 88, 62);
        c.fillStyle = 'rgba(255,255,255,0.52)';
        c.textAlign = 'right';
        c.fillText(`${cutIdx + 1} / ${totalCuts}`, W - 34, 62);
        c.fillStyle = cp.accentSoft;
        c.fillRect(34, 84, (W - 68) * mEase(local / 0.35), 2);
        arCardRhythmCaption(c, caption, W / 2, 98, W - 76, 162, 29, {
          cutIdx, local, accent: cp.accent, ink: '#ffffff', isDark: true, align: 'center', serif: true
        });
        c.save();
        gRoundRect(c, px, py, pw, ph, 14); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 1);
        c.restore();
        c.strokeStyle = cp.accentSoft; c.lineWidth = 1.5;
        gRoundRect(c, px, py, pw, ph, 14); c.stroke();
        if (isPrice) mPrice(c, W, py + ph + 32, { ...sp, accent: cp.accent }, e);
        else {
          c.fillStyle = cp.accent;
          c.fillRect(W / 2 - 28 * mEase(local / 0.4), py + ph + 36, 56 * mEase(local / 0.4), 3);
        }
      } else if (M === 'cn_splitbar') {
        // 카드뉴스 · 컬러 배너: 상단 사진(56%) + 하단 컷마다 컬러가 리드미컬하게 바뀌는 임팩트 카드(34%)
        const cp = arCardCutPalette(sp, cutIdx, false);
        c.fillStyle = '#18181b';
        c.fillRect(0, 0, W, H);
        const cardPad = 24;
        const photoH = 510;
        c.save();
        gRoundRect(c, cardPad, 34, W - cardPad * 2, photoH, 20); c.clip();
        inPhotoFade(c, S, cutIdx, local, cardPad, 34, W - cardPad * 2, photoH, 1.04 + lp * 0.04, 1);
        c.restore();
        const slideUp = (1 - mEase(local / 0.30)) * 22;
        const botY = 34 + photoH + 14 + slideUp;
        const botH = 310;
        const acc = cp.accent;
        const fg = kTextOn(acc);
        const subHl = fg === '#111111' ? '#111111' : '#fde047';
        c.save();
        c.fillStyle = acc;
        gRoundRect(c, cardPad, botY, W - cardPad * 2, botH, 20); c.fill();
        c.fillStyle = fg === '#111111' ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.20)';
        gRoundRect(c, cardPad + 20, botY + 18, 96, 24, 12); c.fill();
        c.fillStyle = fg;
        c.font = gFont(800, 11, GENRE_FONTS.sans);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(`GUIDE 0${cutIdx + 1}`, cardPad + 68, botY + 31);
        if (isPrice) mPrice(c, W, botY + 62, { accent: fg, accent2: fg }, e);
        arCardRhythmCaption(c, caption, W / 2, botY + (isPrice ? 100 : 58), W - cardPad * 2 - 40, 174, 30, {
          cutIdx, local, accent: subHl, ink: fg, isDark: fg !== '#111111', align: 'center',
          headPool: ['dohyeon', 'gasoek', 'jua']
        });
        inSign(c, d, W / 2, botY + botH - 22, fg);
        c.restore();
      } else if (M === 'stm_split') {
        // ✦ 모던 스플릿 프레임: 다크 갤러리 매트 + 선명한 얇은 테두리 사진 + 하단 얇은 명조 자막 + 언더라인
        c.fillStyle = '#101012';
        c.fillRect(0, 0, W, H);
        const fx = 38, fy = 112, fw = W - 76, fh = 500;
        inLabel(c, `0${cutIdx + 1} · ${(sp.label || 'CURATION').slice(0, 14)}`, 40, 68, sp.accent || '#e5d4b7', 'left', 12);
        c.save();
        gRoundRect(c, fx, fy, fw, fh, 12); c.clip();
        inPhotoFade(c, S, cutIdx, local, fx, fy, fw, fh, 1.03 + lp * 0.04, 1);
        c.restore();
        c.strokeStyle = 'rgba(229, 212, 183, 0.35)'; c.lineWidth = 1;
        gRoundRect(c, fx, fy, fw, fh, 12); c.stroke();
        if (isPrice) mPrice(c, W, fy + fh + 28, sp, e);
        mCaption(c, caption, W / 2, fy + fh + (isPrice ? 70 : 38), W - 80, 150, 26, 'maruL', '#ffffff', mClamp(local / 0.65), 'center');
        c.fillStyle = sp.accent || '#e5d4b7';
        c.fillRect(W / 2 - 42 * mEase(local / 0.7), fy + fh + 198, 84 * mEase(local / 0.7), 1.5);
      } else if (M === 'stm_ticket') {
        // 🎫 미니 바우처 티켓: 풀스크린 배경 + 하단 티켓 노치 바우처 카드 + 점선 절취선
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.03 + lp * 0.035, 1);
        const bgGrad = c.createLinearGradient(0, H * 0.45, 0, H);
        bgGrad.addColorStop(0, 'rgba(0,0,0,0)');
        bgGrad.addColorStop(1, 'rgba(9,11,15,0.82)');
        c.fillStyle = bgGrad; c.fillRect(0, H * 0.45, W, H * 0.55);
        const tx = 28, tw = W - 56, ty = 552, th = 266;
        c.save();
        c.shadowColor = 'rgba(0,0,0,0.45)'; c.shadowBlur = 24;
        c.fillStyle = 'rgba(20, 24, 32, 0.92)';
        gRoundRect(c, tx, ty, tw, th, 20); c.fill();
        c.shadowBlur = 0;
        c.strokeStyle = 'rgba(255,255,255,0.16)'; c.lineWidth = 1;
        gRoundRect(c, tx, ty, tw, th, 20); c.stroke();
        // 좌우 티켓 홈 + 점선
        c.fillStyle = '#090b0f';
        c.beginPath(); c.arc(tx, ty + 62, 10, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.arc(tx + tw, ty + 62, 10, 0, Math.PI * 2); c.fill();
        c.strokeStyle = 'rgba(255,255,255,0.18)'; c.setLineDash([5, 5]);
        c.beginPath(); c.moveTo(tx + 18, ty + 62); c.lineTo(tx + tw - 18, ty + 62); c.stroke();
        c.setLineDash([]);
        c.fillStyle = sp.accent || '#4cc38a';
        c.font = gFont(800, 12, GENRE_FONTS.sans);
        c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText(`PASS · NO.0${cutIdx + 1}`, tx + 22, ty + 32);
        c.fillStyle = 'rgba(255,255,255,0.62)';
        c.textAlign = 'right';
        c.fillText(String((d && d.name) || 'SPECIAL OFFER').slice(0, 14), tx + tw - 22, ty + 32);
        if (isPrice) mPrice(c, W, ty + 82, sp, e);
        mCaption(c, caption, W / 2, ty + (isPrice ? 124 : 84), tw - 44, 130, 26, 'pretM', '#ffffff', mClamp(local / 0.55), 'center');
        inSign(c, d, W / 2, ty + th - 20, 'rgba(255,255,255,0.68)');
        c.restore();
      } else if (M === 'cn_timeline') {
        // 카드뉴스 · 4단계 타임라인: 컷별 포인트 컬러 스텝 라인 + 리듬 타이포
        const cp = arCardCutPalette(sp, cutIdx, true);
        c.fillStyle = cp.tintBg;
        c.fillRect(0, 0, W, H);
        const railX = 48;
        c.strokeStyle = 'rgba(148,163,184,0.22)'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(railX, 110); c.lineTo(railX, 740); c.stroke();
        const progH = 630 * ((cutIdx + 1) / Math.max(1, totalCuts));
        c.strokeStyle = cp.accent; c.lineWidth = 3;
        c.beginPath(); c.moveTo(railX, 110); c.lineTo(railX, 110 + progH); c.stroke();
        for (let si = 0; si < Math.min(totalCuts, 6); si++) {
          const sy = 130 + si * (560 / Math.max(1, Math.min(totalCuts, 6) - 1));
          const act = si === cutIdx;
          c.fillStyle = si <= cutIdx ? cp.accent : '#1e293b';
          c.beginPath(); c.arc(railX, sy, act ? 17 : 11, 0, Math.PI * 2); c.fill();
          c.fillStyle = si <= cutIdx ? cp.pillFg : '#94a3b8';
          c.font = gFont(800, act ? 12 : 10, GENRE_FONTS.sans);
          c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(`${si + 1}`, railX, sy + 1);
        }
        const cx = 86, cw = W - cx - 28;
        c.save();
        gRoundRect(c, cx, 94, cw, 388, 18); c.clip();
        inPhotoFade(c, S, cutIdx, local, cx, 94, cw, 388, 1.03 + lp * 0.04, 1);
        c.restore();
        c.fillStyle = cp.accentSoft;
        gRoundRect(c, cx, 498, 114, 26, 13); c.fill();
        inLabel(c, `STEP 0${cutIdx + 1} / 0${totalCuts}`, cx + 14, 511, cp.accent, 'left', 12);
        if (isPrice) mPrice(c, W, 536, { ...sp, accent: cp.accent }, e);
        arCardRhythmCaption(c, caption, cx + cw / 2, isPrice ? 578 : 540, cw - 12, 186, 28, {
          cutIdx, local, accent: cp.accent, ink: '#f8fafc', isDark: true, align: 'center'
        });
      } else if (M === 'cn_qna') {
        // 카드뉴스 · Q&A 가이드: 컷별 포인트 컬러 Q 뱃지 + 리듬 답변 카드
        const cp = arCardCutPalette(sp, cutIdx, false);
        c.fillStyle = '#faf7f2';
        c.fillRect(0, 0, W, H);
        const acc = cp.accent;
        c.fillStyle = acc;
        gRoundRect(c, 36, 70, 96, 32, 16); c.fill();
        c.fillStyle = cp.pillFg;
        c.font = gFont(800, 12, GENRE_FONTS.sans);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(`Q&A · 0${cutIdx + 1}`, 84, 87);
        c.fillStyle = '#78716c'; c.textAlign = 'right';
        c.font = gFont(700, 12, GENRE_FONTS.sans);
        c.fillText(`${cutIdx + 1} / ${totalCuts}`, W - 36, 87);
        c.save();
        gRoundRect(c, 36, 120, W - 72, 390, 20); c.clip();
        inPhotoFade(c, S, cutIdx, local, 36, 120, W - 72, 390, 1.03 + lp * 0.04, 1);
        c.restore();
        const cardSlide = (1 - mEase(local / 0.30)) * 18;
        c.save();
        c.shadowColor = 'rgba(15,23,42,0.08)'; c.shadowBlur = 18; c.shadowOffsetY = 6;
        c.fillStyle = cp.tintBg;
        gRoundRect(c, 36, 532 + cardSlide, W - 72, 236, 20); c.fill();
        c.restore();
        c.fillStyle = acc;
        gRoundRect(c, 58, 554 + cardSlide, 4, 28, 2); c.fill();
        inLabel(c, 'KEY ANSWER', 72, 568 + cardSlide, acc, 'left', 12);
        if (isPrice) mPrice(c, W, 594 + cardSlide, { ...sp, accent: acc }, e);
        arCardRhythmCaption(c, caption, W / 2, (isPrice ? 628 : 592) + cardSlide, W - 116, 152, 27, {
          cutIdx, local, accent: acc, ink: '#0f172a', isDark: false, align: 'center'
        });
      } else if (M === 'cn_compare') {
        // 카드뉴스 · 체크 포인트: 컷별 포인트 컬러 배지 + 리듬 타이포 카드
        const cp = arCardCutPalette(sp, cutIdx, true);
        c.fillStyle = cp.tintBg;
        c.fillRect(0, 0, W, H);
        c.save();
        gRoundRect(c, 32, 68, W - 64, 456, 20); c.clip();
        inPhotoFade(c, S, cutIdx, local, 32, 68, W - 64, 456, 1.04 + lp * 0.04, 1);
        c.restore();
        const acc = cp.accent;
        c.fillStyle = acc;
        gRoundRect(c, 48, 86, 126, 30, 15); c.fill();
        c.fillStyle = cp.pillFg;
        c.font = gFont(800, 12, GENRE_FONTS.sans);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(`✓ CHECK 0${cutIdx + 1}`, 111, 102);
        c.fillStyle = 'rgba(255,255,255,0.07)';
        gRoundRect(c, 32, 542, W - 64, 240, 20); c.fill();
        c.strokeStyle = cp.accentSoft; c.lineWidth = 1.5;
        gRoundRect(c, 32, 542, W - 64, 240, 20); c.stroke();
        if (isPrice) mPrice(c, W, 566, { ...sp, accent: acc }, e);
        arCardRhythmCaption(c, caption, W / 2, isPrice ? 604 : 566, W - 108, 192, 29, {
          cutIdx, local, accent: acc, ink: '#ecfdf5', isDark: true, align: 'center'
        });
      } else if (M === 'cn_receipt') {
        // 카드뉴스 · 클린 영수증: 컷별 포인트 스탬프 + 리듬 타이포 영수증 카드
        const cp = arCardCutPalette(sp, cutIdx, false);
        c.save();
        c.filter = 'blur(7px) brightness(0.74)';
        mPhoto(c, S, 0, -16, -16, W + 32, H + 32, 1.08);
        c.restore();
        const rx = 44, rw = W - 88, ry = 82 + (1 - mEase(local / 0.30)) * 20, rh = 696;
        c.save();
        c.shadowColor = 'rgba(0,0,0,0.34)'; c.shadowBlur = 28; c.shadowOffsetY = 12;
        c.fillStyle = cp.tintBg;
        gRoundRect(c, rx, ry, rw, rh, 14); c.fill();
        c.restore();
        c.fillStyle = cp.accent;
        c.font = gFont(800, 12, GENRE_FONTS.sans);
        c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText(`RECEIPT · #0${cutIdx + 1}`, rx + 24, ry + 34);
        c.fillStyle = '#71717a'; c.textAlign = 'right';
        c.fillText(String((d && d.name) || 'NOTE').slice(0, 12), rx + rw - 24, ry + 34);
        c.strokeStyle = '#d4d4d8'; c.setLineDash([4, 4]);
        c.beginPath(); c.moveTo(rx + 22, ry + 54); c.lineTo(rx + rw - 22, ry + 54); c.stroke();
        c.setLineDash([]);
        c.save();
        gRoundRect(c, rx + 22, ry + 70, rw - 44, 340, 10); c.clip();
        inPhotoFade(c, S, cutIdx, local, rx + 22, ry + 70, rw - 44, 340, 1.03 + lp * 0.035, 1);
        c.restore();
        c.strokeStyle = '#d4d4d8'; c.setLineDash([4, 4]);
        c.beginPath(); c.moveTo(rx + 22, ry + 432); c.lineTo(rx + rw - 22, ry + 432); c.stroke();
        c.setLineDash([]);
        if (isPrice) mPrice(c, W, ry + 448, { ...sp, accent: cp.accent }, e);
        arCardRhythmCaption(c, caption, W / 2, ry + (isPrice ? 488 : 452), rw - 48, 182, 27, {
          cutIdx, local, accent: cp.accent, ink: '#18181b', isDark: false, align: 'center'
        });
        c.fillStyle = '#18181b';
        for (let bi = 0; bi < 28; bi++) {
          const bw = (bi % 3 === 0 ? 4 : 2);
          c.fillRect(W / 2 - 84 + bi * 6, ry + rh - 38, bw, 16);
        }
      } else if (M === 'cn_polaroid_duo') {
        // 카드뉴스 · 투컷 앨범: 컷별 컬러 넘버 배지 + 에디토리얼 폰트 리듬
        const cp = arCardCutPalette(sp, cutIdx, false);
        c.fillStyle = '#f3ede3';
        c.fillRect(0, 0, W, H);
        c.save();
        c.translate(W * 0.56, 300); c.rotate(0.06);
        c.fillStyle = '#e7ded0';
        gRoundRect(c, -180, -180, 360, 360, 14); c.fill();
        c.save();
        gRoundRect(c, -166, -166, 332, 332, 10); c.clip();
        mPhoto(c, S, -1, -166, -166, 332, 332, 1.03);
        c.restore();
        c.restore();
        c.save();
        c.translate(W * 0.46, 315); c.rotate(-0.025);
        c.shadowColor = 'rgba(40,30,20,0.18)'; c.shadowBlur = 22; c.shadowOffsetY = 8;
        c.fillStyle = cp.tintBg;
        gRoundRect(c, -188, -198, 376, 396, 14); c.fill();
        c.shadowBlur = 0;
        c.save();
        gRoundRect(c, -172, -182, 344, 344, 10); c.clip();
        inPhotoFade(c, S, cutIdx, local, -172, -182, 344, 344, 1.03 + lp * 0.04, 1);
        c.restore();
        c.restore();
        c.fillStyle = cp.accentSoft;
        gRoundRect(c, W / 2 - 64, 544, 128, 26, 13); c.fill();
        inLabel(c, `PAGE 0${cutIdx + 1} / 0${totalCuts}`, W / 2, 557, cp.accent, 'center', 12);
        if (isPrice) mPrice(c, W, 584, { ...sp, accent: cp.accent }, e);
        arCardRhythmCaption(c, caption, W / 2, isPrice ? 624 : 588, W - 84, 174, 29, {
          cutIdx, local, accent: cp.accent, ink: '#292524', isDark: false, align: 'center', serif: true
        });
      } else if (M === 'stm_glassbar') {
        // 💎 글래스 네온 바: 풀블리드 화보 + 하단 반투명 글래스 스트립 + 네온 세로 바
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.03 + lp * 0.035, 1);
        const grad = c.createLinearGradient(0, H * 0.5, 0, H);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(9,12,18,0.72)');
        c.fillStyle = grad; c.fillRect(0, H * 0.5, W, H * 0.5);
        const bx = 28, bw = W - 56, by = 602, bh = 180;
        c.save();
        c.fillStyle = 'rgba(15, 23, 42, 0.62)';
        gRoundRect(c, bx, by, bw, bh, 18); c.fill();
        c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 1;
        gRoundRect(c, bx, by, bw, bh, 18); c.stroke();
        c.fillStyle = sp.accent || '#38bdf8';
        gRoundRect(c, bx + 18, by + 26, 4, bh - 52, 2); c.fill();
        inLabel(c, `0${cutIdx + 1} · HIGHLIGHT`, bx + 36, by + 34, sp.accent || '#38bdf8', 'left', 12);
        if (isPrice) mPrice(c, W, by + 56, sp, e);
        mCaption(c, caption, W / 2 + 6, by + (isPrice ? 96 : 58), bw - 72, 108, 26, 'pretM', '#ffffff', mClamp(local / 0.5), 'center');
        c.restore();
      } else if (M === 'cinema') {
        // 시네마틱: 위아래 검은 띠 + 가장자리 비네트, 컷은 부드럽게 겹쳐 바뀜 (캡컷 "영화 화면"·"비네트")
        const fade = cutIdx > 0 ? mEase(local / 0.45) : 1;
        if (fade < 1) mPhoto(c, S, -1, 0, 0, W, H, 1.06);
        c.save();
        c.globalAlpha = fade;
        mPhoto(c, S, 0, 0, 0, W, H, 1.0 + lp * 0.03);
        c.restore();
        const vs = 0.45 + 0.25 * mEase(local / 0.55);
        const vg = c.createRadialGradient(W / 2, H * 0.45, W * 0.25, W / 2, H * 0.45, H * 0.62);
        vg.addColorStop(0, 'rgba(0,0,0,0)');
        vg.addColorStop(1, `rgba(15,12,10,${vs})`);
        c.fillStyle = vg;
        c.fillRect(0, 0, W, H);
        const band = Math.round(H * 0.14);
        const barH = Math.round(band * mEase((t - 0.1) / 0.55));
        c.fillStyle = '#000';
        c.fillRect(0, 0, W, barH);
        c.fillRect(0, H - barH, W, barH);
        if (barH > 20) {
          // 위 띠: 상품명(왼쪽) · 담당자(오른쪽)
          c.save();
          c.globalAlpha = mEase((t - 0.5) / 0.6);
          c.textBaseline = 'middle';
          c.fillStyle = sp.accent;
          c.textAlign = 'left';
          gDrawLine(c, String(campaign.vehicle || (typeof IND !== 'undefined' && IND.product) || ''), 26, barH * 0.55, W * 0.55, 16, 11, GENRE_FONTS.sans, 700);
          c.fillStyle = 'rgba(255,255,255,0.78)';
          c.textAlign = 'right';
          gDrawLine(c, d ? `${d.name || ''} ${d.title || ''}`.trim() : '', W - 26, barH * 0.55, W * 0.38, 15, 11, GENRE_FONTS.sans, 500);
          c.restore();
        }
        if (isPrice) mPrice(c, W, H - band - 52, sp, e);
        // 아래 띠 안의 영화 자막
        mCaption(c, caption, W / 2, H - band + 6, W - 60, band - 12, 30, sp.font, sp.accent2, e);
      } else if (M === 'credits') {
        // 옆 크레딧 롤: 사진은 왼쪽으로 살짝 밀리고, 오른쪽 어두운 면에 상품·매장 정보가 영화 엔딩처럼 올라감
        const fade = cutIdx > 0 ? mEase(local / 0.4) : 1;
        const pan = -W * 0.08 * mEase(t / 0.6);
        if (fade < 1) mPhoto(c, S, -1, 0, 0, W, H, 1.06, pan);
        c.save();
        c.globalAlpha = fade;
        mPhoto(c, S, 0, 0, 0, W, H, 1.06 + lp * 0.03, pan);
        c.restore();
        const sg = c.createLinearGradient(W * 0.3, 0, W * 0.64, 0);
        sg.addColorStop(0, 'rgba(10,10,12,0)');
        sg.addColorStop(1, 'rgba(10,10,12,0.94)');
        c.fillStyle = sg;
        c.fillRect(0, 0, W, H);
        const bb = c.createLinearGradient(0, H * 0.55, 0, H);
        bb.addColorStop(0, 'rgba(10,10,12,0)');
        bb.addColorStop(1, 'rgba(10,10,12,0.88)');
        c.fillStyle = bb;
        c.fillRect(0, H * 0.55, W, H * 0.45);
        const zx = W * 0.56, zw = W * 0.4, zTop = 36, zBot = capY - 16, zH = zBot - zTop;
        // 항목마다 값은 최대 2줄(18px → 최소 14px)로 나눠 높이를 계산
        const blocks = mCreditItems(d).map(([label, value]) => {
          const r = gWrap(c, value, zw, 2, 18, 14, GENRE_FONTS.sans, 800);
          return { label, lines: r.lines, size: r.size, h: 22 + r.lines.length * Math.round(r.size * 1.3) + 16 };
        });
        const total = blocks.reduce((s, b) => s + b.h, 0) + zH;
        const off = (t * (total / Math.max(4, mainDuration))) % total;
        c.save();
        c.beginPath();
        c.rect(zx - 6, zTop, zw + 12, zH);
        c.clip();
        c.globalAlpha = mEase((t - 0.3) / 0.6);
        c.textAlign = 'left';
        c.textBaseline = 'middle';
        let by = zBot - off;
        blocks.forEach((b) => {
          if (by + b.h > zTop - 10 && by < zBot + 10) {
            c.fillStyle = sp.accent;
            gDrawLine(c, b.label, zx, by + 10, zw, 13, 11, GENRE_FONTS.sans, 700);
            c.fillStyle = '#ffffff';
            c.font = gFont(800, b.size, GENRE_FONTS.sans);
            const lh = Math.round(b.size * 1.3);
            b.lines.forEach((ln, i) => c.fillText(ln, zx, by + 22 + lh / 2 + i * lh));
          }
          by += b.h;
        });
        c.restore();
        // 크레딧 위아래 가장자리를 어둡게 녹임
        [[zTop, 0], [zBot - 40, 1]].forEach(([y, dir]) => {
          const fg2 = c.createLinearGradient(0, y, 0, y + 40);
          fg2.addColorStop(dir ? 0 : 1, 'rgba(10,10,12,0)');
          fg2.addColorStop(dir ? 1 : 0, 'rgba(10,10,12,0.9)');
          c.fillStyle = fg2;
          c.fillRect(zx - 6, y, zw + 12, 40);
        });
        if (isPrice) mPrice(c, W, capY, sp, e);
        mCaption(c, caption, 30, capY + (isPrice ? 40 : 4), W - 60, capH - (isPrice ? 40 : 4), 38, sp.font, '#ffffff', e, 'left');
      } else {
        // strips: 세로 세 줄 사진이 서로 다른 속도로 움직임
        const gap = 8, sw = (W - gap * 4) / 3;
        for (let i = 0; i < 3; i++) {
          const x = gap + i * (sw + gap);
          const dir = i % 2 ? -1 : 1;
          const off = (1 - ent) * dir * 120 + Math.sin(t * 0.8 + i) * 10;
          c.save();
          gRoundRect(c, x, gap + off, sw, stageH - gap, 14);
          c.clip();
          mPhoto(c, S, 0, 0, gap + off, W, stageH, 1.12 + lp * 0.05, 0, dir * lp * 20);
          c.restore();
        }
        c.fillStyle = sp.accent;
        c.fillRect(gap, stageH + 6, (W - gap * 2) * lp, 4);
        if (isPrice) mPrice(c, W, capY + 6, sp, e);
        mCaption(c, caption, W / 2, capY + (isPrice ? 44 : 8), W - 60, capH - (isPrice ? 44 : 8), 40, sp.font, sp.accent2, e);
      }
      if (custom) arDrawCustomLogo(c, W, H, custom);
      // 시네마는 위 띠에, 크레딧은 크레딧 안에 이름이 나오므로 아래 이름 칩을 그리지 않음
      if (M !== 'story' && M !== 'feed' && M !== 'cinema' && M !== 'credits' && !sp.insta) mChip(c, d, W, H, sp, mEase(t / 0.6));
    }

    // 인스타 감성 엔딩: 크림 카드에 작은 사진, 명조 가게 이름, 얇은 선, 주소·연락처, 담백한 댓글 안내
    function renderInstaOutro(c, W, H, t, mainDuration, d, sp, still = false) {
      const lt = t - mainDuration;
      const customFont = sp.custom ? KIT_FONTS[sp.font] : null;
      c.fillStyle = sp.custom ? sp.custom.colors.primary : '#f3ece1';
      c.fillRect(0, 0, W, H);
      const S = kitScene(t, mainDuration, true);
      const a = (k) => mEase((lt - k) / 0.6);
      c.save();
      c.globalAlpha = a(0);
      const pw = 220, ph = 270, px = (W - pw) / 2, py = 110;
      c.shadowColor = 'rgba(60,40,20,0.16)'; c.shadowBlur = 14; c.shadowOffsetY = 4;
      c.fillStyle = '#fffdf9';
      c.fillRect(px - 10, py - 10, pw + 20, ph + 20);
      c.shadowColor = 'transparent';
      if (still) arLookbookPicture(c, kitImg(S, 0), px, py, pw, ph);
      else mPhoto(c, S, 0, px, py, pw, ph, 1.04);
      inWarm(c, px, py, pw, ph, 0.9);
      c.restore();
      const ny = py + ph + 76;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.globalAlpha = a(0.2);
      c.fillStyle = sp.custom ? sp.accent2 : '#2b2622';
      gDrawLine(c, (d && d.name) || '', W / 2, ny, W - 80, 40, 24, (customFont || KIT_FONTS.maru).f, 600);
      c.fillStyle = sp.custom ? sp.accent : '#cbbfae';
      c.fillRect(W / 2 - 20, ny + 36, 40, 1);
      c.globalAlpha = a(0.35);
      c.fillStyle = sp.custom ? sp.accent2 : '#7a6d61';
      const sub = [(d && d.title) || '', (d && d.branch) || ''].filter(Boolean).join(' · ');
      if (sub) gDrawLine(c, sub, W / 2, ny + 68, W - 90, 17, 12, (customFont || KIT_FONTS.pretL).f, 500);
      const phone = String((d && d.phone) || '').trim();
      if (phone) gDrawLine(c, phone, W / 2, ny + 98, W - 90, 18, 12, (customFont || KIT_FONTS.pretL).f, 500);
      const promo = String((d && d.promoTag) || '').trim();
      if (promo) { c.fillStyle = sp.custom ? sp.accent2 : '#8a6a4f'; gDrawLine(c, promo, W / 2, ny + 132, W - 90, 17, 12, (customFont || KIT_FONTS.maruL).f, 400); }
      c.globalAlpha = a(0.55);
      c.fillStyle = sp.custom ? sp.accent2 : '#2b2622';
      gDrawLine(c, arCta(), W / 2, H - 120, W - 100, 19, 13, (customFont || KIT_FONTS.pretL).f, 600);
      c.fillStyle = sp.custom ? sp.accent2 : '#2b2622';
      c.fillRect(W / 2 - 60, H - 104, 120, 1);
      c.globalAlpha = 1;
      inGrain(c, W, H, t, 0.07);
    }

    // =========================================================================
    // 2026 1군 풀스크린 릴스 전용 6대 캔버스 모션 엔진 (Safe Zone 준수 · 물리 모션)
    // =========================================================================
    function arRenderProReelsFrame(c, W, H, t, mainDuration, totalCuts, d, sp) {
      const accent = sp.accent || '#ffffff';
      const cutDur = Math.max(0.5, mainDuration / Math.max(1, totalCuts));
      const cutIdx = Math.min(totalCuts - 1, Math.floor(t / cutDur));
      const local = Math.max(0, t - cutIdx * cutDur);
      const lp = mClamp(local / cutDur);
      const M = sp.mstyle;
      const S = kitScene(t, mainDuration, false);
      const rawCap = (campaign.cutCaptions && campaign.cutCaptions[cutIdx]) || campaign.hook || '';
      const capOv = mCapOv(cutIdx);
      const caption = capOv.hidden ? '' : gCleanCaption(rawCap);
      const F = KIT_FONTS[mCapFont(cutIdx, sp.font)] || KIT_FONTS.sans;
      const easeOutExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * mClamp(x)));
      const easeOutBack = (x) => { const v = mClamp(x) - 1; return 1 + 2.4 * v * v * v + 1.4 * v * v; };

      c.save();
      c.fillStyle = sp.bg1 || '#080808';
      c.fillRect(0, 0, W, H);

      // 1) 9:16 풀스크린 매끄러운 시네마 카메라 모션 (흔들림·회전 0%, 컷 전환 끊김 0%)
      const dir = cutIdx % 2 === 0 ? 1 : -1;
      const dirY = cutIdx % 3 === 0 ? 1 : -1;
      const easeOutCubic = (x) => 1 - Math.pow(1 - mClamp(x), 3);
      const easeOutQuart = (x) => 1 - Math.pow(1 - mClamp(x), 4);
      const drawDynamicPhoto = (zoom, px, py, fadeDur = 0.34, flashAmt = 0, leakAmt = 0) => {
        const img = kitImg(S, 0);
        const isVid = !!(img && img._isVideo);
        const safeZoom = isVid ? Math.min(1.05, Math.max(1.0, zoom)) : zoom;
        const safePx = isVid ? px * 0.15 : px;
        const safePy = isVid ? py * 0.15 : py;
        const tDur = Math.max(0.36, fadeDur);
        const p = cutIdx > 0 ? easeOutQuart(local / tDur) : 1;
        const rem = 1 - p;
        const transKind = cutIdx % 5;
        if (cutIdx > 0 && rem > 0.001) {
          if (transKind === 1) {
            // 1) 풀 슬라이드 푸시 (좌우 100% 밀어내기 + 경계 빛 라인)
            const newX = Math.round(W * rem) * dir;
            mPhoto(c, S, -1, -Math.round(W * p) * dir, 0, W, H, 1.08, 0, 0);
            mPhoto(c, S, 0, newX, 0, W, H, safeZoom + rem * 0.04, safePx, safePy);
            c.fillStyle = 'rgba(255,255,255,0.55)';
            c.fillRect(dir > 0 ? newX - 1 : newX + W - 1, 0, 2, H);
          } else if (transKind === 2) {
            // 2) 대각선 시네마 슬래시 와이프
            mPhoto(c, S, -1, 0, 0, W, H, 1.08, 0, 0);
            const slant = Math.round(W * 0.28);
            const edgeX = -slant + (W + slant * 2) * p;
            c.save();
            c.beginPath();
            c.moveTo(-slant, 0);
            c.lineTo(edgeX, 0);
            c.lineTo(edgeX - slant, H);
            c.lineTo(-slant, H);
            c.closePath();
            c.clip();
            mPhoto(c, S, 0, 0, 0, W, H, safeZoom + rem * 0.06, safePx, safePy);
            c.restore();
            c.strokeStyle = 'rgba(255,250,240,0.75)';
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(edgeX, 0);
            c.lineTo(edgeX - slant, H);
            c.stroke();
          } else if (transKind === 3) {
            // 3) 상하 셔터 오픈 리빌
            mPhoto(c, S, -1, 0, 0, W, H, 1.08, 0, 0);
            const openH = Math.round(H * p);
            const topY = Math.round((H - openH) / 2);
            c.save();
            c.beginPath();
            c.rect(0, topY, W, openH);
            c.clip();
            mPhoto(c, S, 0, 0, 0, W, H, safeZoom + rem * 0.07, safePx, safePy);
            c.restore();
          } else if (transKind === 4) {
            // 4) 수직 풀-업 슬라이드 푸시
            const newY = Math.round(H * rem);
            mPhoto(c, S, -1, 0, -Math.round(H * p * 0.55), W, H, 1.08, 0, 0);
            mPhoto(c, S, 0, 0, newY, W, H, safeZoom + rem * 0.04, safePx, safePy);
            c.fillStyle = 'rgba(255,255,255,0.5)';
            c.fillRect(0, newY - 1, W, 2);
          } else {
            // 0) 크리스프 노출 줌-스냅
            mPhoto(c, S, -1, 0, 0, W, H, 1.08 + p * 0.14, 0, 0);
            c.save();
            c.globalAlpha = easeOutCubic(local / (tDur * 0.72));
            mPhoto(c, S, 0, 0, 0, W, H, safeZoom + rem * 0.14, safePx, safePy);
            c.restore();
            if (local < 0.18) {
              c.fillStyle = `rgba(255,252,245,${((1 - local / 0.18) * 0.28).toFixed(3)})`;
              c.fillRect(0, 0, W, H);
            }
          }
        } else {
          mPhoto(c, S, 0, 0, 0, W, H, safeZoom, safePx, safePy);
        }
        if (flashAmt > 0 && local < 0.14 && cutIdx > 0) {
          c.fillStyle = `rgba(255,252,245,${((1 - local / 0.14) * flashAmt).toFixed(3)})`;
          c.fillRect(0, 0, W, H);
        }
        if (leakAmt > 0 && local < 0.38 && cutIdx > 0) {
          const lkA = (1 - local / 0.38) * leakAmt;
          const lg = c.createRadialGradient(W * (dir > 0 ? 0.15 : 0.85), H * 0.22, 10, W * 0.5, H * 0.4, W * 0.95);
          lg.addColorStop(0, `rgba(255,188,120,${lkA.toFixed(3)})`);
          lg.addColorStop(1, 'rgba(255,140,80,0)');
          c.fillStyle = lg;
          c.fillRect(0, 0, W, H);
        }
      };

      // ★ 렌즈 포커스 풀 + 4단 구도 리듬 컴포지션 (흔들림 0% · 구도 변화로 시선 유지)
      const drawWithFocusPull = (fn, maxBlur = 4.5, dur = 0.28) => {
        const img = kitImg(S, 0);
        const isVid = !!(img && img._isVideo);
        const b = (!isVid && local < dur) ? (1 - easeOutCubic(local / dur)) * maxBlur : 0;
        if (b > 0.25) {
          c.save();
          try { c.filter = `blur(${b.toFixed(1)}px) brightness(${(1 + (b / maxBlur) * 0.08).toFixed(2)})`; } catch (_) {}
          fn();
          c.restore();
        } else {
          fn();
        }
      };

      const drawRhythmComposition = (warmAmt = 0, borderCol = 'rgba(255,255,255,0.22)') => {
        const beat = cutIdx % 4;
        const img = kitImg(S, 0);
        const isVid = !!(img && img._isVideo);
        const p = easeOutQuart(local / 0.36);
        const rem = 1 - p;
        const slowZoom = isVid ? 1.03 : (1.05 + lp * 0.07);
        const slowPanX = isVid ? 0 : (lp - 0.5) * 26 * dir;

        if (beat === 0) {
          // Beat 0: 풀스크린 시네마 히어로 + 스피드 램프 + 렌즈 포커스 풀
          drawWithFocusPull(() => {
            drawDynamicPhoto(slowZoom + rem * 0.06, slowPanX, 0, 0.34, 0, warmAmt > 0 ? 0.16 : 0);
          }, 4.5, 0.28);
        } else if (beat === 1) {
          // Beat 1: 블러 배경 위 플로팅 4:5 에디토리얼 액자 카드 (하단 Safe Zone 자막 공간 확보)
          c.save();
          try { c.filter = 'blur(16px) brightness(0.45)'; } catch (_) {}
          mPhoto(c, S, 0, -20, -20, W + 40, H + 40, 1.16, 0, 0);
          c.restore();
          c.fillStyle = 'rgba(8,8,10,0.34)';
          c.fillRect(0, 0, W, H);

          const cw = W - 84, ch = 490;
          const cx = 42, cy = 122 + rem * 26;
          c.save();
          c.globalAlpha = easeOutCubic(local / 0.24);
          c.shadowColor = 'rgba(0,0,0,0.55)';
          c.shadowBlur = 32;
          c.shadowOffsetY = 14;
          gRoundRect(c, cx, cy, cw, ch, 22);
          c.fillStyle = '#111114';
          c.fill();
          c.restore();

          c.save();
          c.globalAlpha = easeOutCubic(local / 0.24);
          gRoundRect(c, cx, cy, cw, ch, 22);
          c.clip();
          drawWithFocusPull(() => {
            mPhoto(c, S, 0, cx, cy, cw, ch, isVid ? 1.02 : (1.06 + lp * 0.07), slowPanX * 0.7, 0);
          }, 3.5, 0.24);
          c.restore();

          c.save();
          c.globalAlpha = easeOutCubic(local / 0.28);
          gRoundRect(c, cx, cy, cw, ch, 22);
          c.strokeStyle = borderCol;
          c.lineWidth = 1.2;
          c.stroke();
          c.restore();
        } else if (beat === 2) {
          // Beat 2: 상하 2분할 다이나믹 스플릿 (상단 풀뷰 + 하단 디테일 클로즈업)
          const splitY = Math.round(H * 0.48);
          c.save();
          c.beginPath();
          c.rect(0, 0, W, splitY - 2);
          c.clip();
          mPhoto(c, S, 0, Math.round(rem * 42 * dir), 0, W, splitY, isVid ? 1.03 : (1.07 + lp * 0.06), slowPanX, 0);
          c.restore();

          c.save();
          c.beginPath();
          c.rect(0, splitY + 2, W, H - splitY - 2);
          c.clip();
          mPhoto(c, S, cutIdx > 0 ? -1 : 0, Math.round(-rem * 42 * dir), splitY, W, H - splitY, isVid ? 1.04 : (1.18 - lp * 0.06), -slowPanX * 0.8, 0);
          c.fillStyle = 'rgba(8,8,10,0.32)';
          c.fillRect(0, splitY + 2, W, H - splitY - 2);
          c.restore();

          c.fillStyle = borderCol;
          c.fillRect(0, splitY - 1, W, 2);
        } else {
          // Beat 3: 와이드 시네마 레터박스 프레임 + 포커스 풀
          c.save();
          try { c.filter = 'blur(18px) brightness(0.36)'; } catch (_) {}
          mPhoto(c, S, 0, -20, -20, W + 40, H + 40, 1.18, 0, 0);
          c.restore();
          c.fillStyle = 'rgba(6,6,8,0.44)';
          c.fillRect(0, 0, W, H);

          const cw = W - 44, ch = 396;
          const cx = 22, cy = 176 + rem * 18;
          c.save();
          c.globalAlpha = easeOutCubic(local / 0.26);
          gRoundRect(c, cx, cy, cw, ch, 16);
          c.clip();
          drawWithFocusPull(() => {
            mPhoto(c, S, 0, cx, cy, cw, ch, isVid ? 1.02 : (1.05 + lp * 0.09), slowPanX * 0.9, 0);
          }, 4.0, 0.26);
          c.restore();

          c.save();
          c.globalAlpha = easeOutCubic(local / 0.30);
          gRoundRect(c, cx, cy, cw, ch, 16);
          c.strokeStyle = borderCol;
          c.lineWidth = 1;
          c.stroke();
          c.restore();
        }
        if (warmAmt > 0) inWarm(c, 0, 0, W, H, warmAmt);
      };

      if (M === 'pro_rhythm_editorial') {
        drawRhythmComposition(0, 'rgba(232,213,188,0.36)');
        inGrain(c, W, H, t, 0.032);
      } else if (M === 'pro_focus_cinema') {
        drawRhythmComposition(0.45, 'rgba(242,228,204,0.34)');
        inGrain(c, W, H, t, 0.048);
      } else if (M === 'pro_karaoke') {
        const snap = 1 - easeOutQuart(local / 0.30);
        drawWithFocusPull(() => {
          drawDynamicPhoto(1.08 + snap * 0.10 + lp * 0.06, (lp - 0.5) * 32 * dir, 0, 0.28, 0.16, 0);
        }, 3.0, 0.20);
      } else if (M === 'pro_film_sub') {
        drawWithFocusPull(() => {
          drawDynamicPhoto(1.07 + lp * 0.10, (lp - 0.5) * 34 * dir, (lp - 0.5) * 16 * dirY, 0.36, 0, 0.18);
        }, 4.5, 0.28);
        inGrain(c, W, H, t, 0.045);
      } else if (M === 'pro_punch_hook') {
        const snap = 1 - easeOutQuart(local / 0.26);
        drawDynamicPhoto(1.08 + snap * 0.14 + lp * 0.06, (lp - 0.5) * 30 * dir, 0, 0.26, 0.16, 0);
      } else if (M === 'pro_editorial_center') {
        drawWithFocusPull(() => {
          drawDynamicPhoto(1.18 - lp * 0.11, (lp - 0.5) * 18 * dir, (0.5 - lp) * 28 * dirY, 0.36, 0, 0.12);
        }, 4.0, 0.26);
        inGrain(c, W, H, t, 0.032);
      } else if (M === 'pro_pov_caption') {
        drawDynamicPhoto(1.08 + lp * 0.08, (lp - 0.5) * 30 * dir, (0.5 - lp) * 14, 0.32, 0, 0);
      } else if (M === 'pro_split_reveal') {
        const wipe = easeOutQuart(local / 0.38);
        if (cutIdx > 0 && wipe < 0.995) {
          mPhoto(c, S, -1, 0, 0, W, H, 1.09, -wipe * 28, 0);
        }
        const splitX = Math.round(W * wipe);
        c.save();
        c.beginPath();
        c.rect(0, 0, cutIdx > 0 ? splitX : W, H);
        c.clip();
        mPhoto(c, S, 0, 0, 0, W, H, 1.15 - lp * 0.08, (1 - wipe) * 22 + (lp - 0.5) * 16 * dir, 0);
        c.restore();
        if (cutIdx > 0 && wipe > 0.02 && wipe < 0.98) {
          c.fillStyle = 'rgba(244,240,232,0.85)';
          c.fillRect(splitX - 2, 0, 3, H);
        }
      } else if (M === 'pro_handwrite') {
        drawWithFocusPull(() => {
          drawDynamicPhoto(1.10 + lp * 0.07, (lp - 0.5) * 38 * dir, 0, 0.36, 0, 0.22);
        }, 4.0, 0.26);
        inWarm(c, 0, 0, W, H, 0.55);
        inGrain(c, W, H, t, 0.05);
      } else if (M === 'pro_trend_sticker') {
        drawRhythmComposition(0.18, 'rgba(242,228,204,0.32)');
        inGrain(c, W, H, t, 0.04);
      } else if (M === 'pro_glass_card') {
        drawRhythmComposition(0, 'rgba(255,255,255,0.22)');
      } else if (M === 'pro_neon_pulse') {
        const snap = 1 - easeOutQuart(local / 0.28);
        drawDynamicPhoto(1.08 + snap * 0.11 + lp * 0.06, (lp - 0.5) * 32 * dir, 0, 0.28, 0.14, 0);
        c.fillStyle = 'rgba(6,10,18,0.20)';
        c.fillRect(0, 0, W, H);
      } else if (M === 'pro_magazine_cover') {
        drawRhythmComposition(0, 'rgba(232,213,188,0.34)');
        inGrain(c, W, H, t, 0.035);
      } else if (M === 'pro_warm_diary') {
        drawRhythmComposition(0.50, 'rgba(248,243,234,0.36)');
        inGrain(c, W, H, t, 0.04);
      } else if (M === 'pro_bold_badge') {
        const snap = 1 - easeOutQuart(local / 0.26);
        drawDynamicPhoto(1.09 + snap * 0.14 + lp * 0.06, (lp - 0.5) * 28 * dir, 0, 0.26, 0.18, 0);
      } else if (M === 'pro_minimal_mono') {
        c.save();
        try { c.filter = 'grayscale(100%) contrast(1.14)'; } catch (_) {}
        drawDynamicPhoto(1.18 - lp * 0.10, (lp - 0.5) * 28 * dir, (0.5 - lp) * 20 * dirY, 0.36, 0, 0);
        c.restore();
        inGrain(c, W, H, t, 0.055);
      }

      // 2) 풀스크린 가독성 보호 그라데이션 스크림
      const scTop = c.createLinearGradient(0, 0, 0, H * 0.24);
      scTop.addColorStop(0, 'rgba(6,6,6,0.42)');
      scTop.addColorStop(1, 'rgba(6,6,6,0)');
      c.fillStyle = scTop;
      c.fillRect(0, 0, W, H * 0.24);

      const scBot = c.createLinearGradient(0, H * 0.44, 0, H);
      scBot.addColorStop(0, 'rgba(6,6,6,0)');
      scBot.addColorStop(0.58, M === 'pro_editorial_center' ? 'rgba(6,6,6,0.46)' : 'rgba(6,6,6,0.62)');
      scBot.addColorStop(1, 'rgba(6,6,6,0.84)');
      c.fillStyle = scBot;
      c.fillRect(0, H * 0.44, W, H * 0.56);

      // 3) 각 1군 포맷별 시그니처 타이포그래피 (인스타/쇼츠 Safe Zone 준수 · 컷 자막 숨김(쓰레기통 삭제) 반영)
      const _proOv = typeof getCutElementOverride === 'function' ? getCutElementOverride(cutIdx) : null;
      if (_proOv && _proOv.caption && _proOv.caption.hidden) {
        c.restore();
        return;
      }
      const safeW = W * 0.80;
      const numTag = `${String(cutIdx + 1).padStart(2, '0')} / ${String(totalCuts).padStart(2, '0')}`;

      if (M === 'pro_karaoke') {
        const words = caption.replace(/\n+/g, ' ').split(/\s+/).filter(Boolean);
        if (words.length) {
          const activeWord = Math.min(words.length - 1, Math.floor(lp * words.length * 1.06));
          const fontSize = Math.round(W * 0.068);
          c.font = `800 ${fontSize}px ${F.f}`;
          c.textBaseline = 'middle';
          c.textAlign = 'left';
          const padX = Math.round(fontSize * 0.28), padY = Math.round(fontSize * 0.16);
          const spaceW = Math.round(fontSize * 0.34);
          const lines = [[]];
          let lineW = 0;
          words.forEach((w, wi) => {
            const tw = c.measureText(w).width + padX * 2;
            if (lines[lines.length - 1].length && lineW + spaceW + tw > safeW && lines.length < 3) {
              lines.push([]);
              lineW = 0;
            }
            lines[lines.length - 1].push({ w, wi, tw });
            lineW += (lines[lines.length - 1].length > 1 ? spaceW : 0) + tw;
          });
          const lh = Math.round(fontSize * 1.48);
          const startY = H * 0.665 - ((lines.length - 1) * lh) / 2;
          const entryPop = easeOutBack(local / 0.22);
          lines.forEach((ln, li) => {
            const totalW = ln.reduce((s, item, idx2) => s + item.tw + (idx2 ? spaceW : 0), 0);
            let cx = (W - totalW) / 2;
            const cy = startY + li * lh;
            ln.forEach((item) => {
              const isAct = item.wi === activeWord;
              c.save();
              const midX = cx + item.tw / 2;
              c.translate(midX, cy);
              const sc = isAct ? 1.06 * Math.min(1.04, entryPop) : 1;
              c.scale(sc, sc);
              if (isAct) {
                c.fillStyle = sp.accent || '#f4f0e8';
                gRoundRect(c, -item.tw / 2, -(fontSize / 2 + padY), item.tw, fontSize + padY * 2, 12);
                c.fill();
                c.fillStyle = '#080808';
              } else {
                c.shadowColor = 'rgba(0,0,0,0.82)';
                c.shadowBlur = 16;
                c.shadowOffsetY = 3;
                c.fillStyle = item.wi < activeWord ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.72)';
              }
              c.fillText(item.w, -item.tw / 2 + padX, 1);
              c.restore();
              cx += item.tw + spaceW;
            });
          });
        }
      } else if (M === 'pro_film_sub') {
        c.save();
        c.font = `500 ${Math.round(W * 0.025)}px 'JetBrains Mono', monospace`;
        c.fillStyle = 'rgba(244,240,232,0.68)';
        c.textAlign = 'left';
        c.textBaseline = 'top';
        c.fillText(numTag, W * 0.075, H * 0.085);
        c.restore();
        const alpha = easeOutExpo(local / 0.32);
        const rise = (1 - alpha) * 14;
        const r = mFit(c, caption, safeW, 2, Math.round(W * 0.052), Math.round(W * 0.036), sp.font);
        c.save();
        c.globalAlpha = alpha;
        c.font = `500 ${r.size}px ${F.f}`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.shadowColor = 'rgba(0,0,0,0.88)';
        c.shadowBlur = 18;
        c.shadowOffsetY = 2;
        c.fillStyle = '#f4f0e8';
        const baseY = H * 0.725 - ((r.lines.length - 1) * r.lh) / 2 + rise;
        r.lines.forEach((ln, li) => c.fillText(ln, W / 2, baseY + li * r.lh));
        c.restore();
      } else if (M === 'pro_punch_hook') {
        const r = mFit(c, caption, safeW, 3, Math.round(W * 0.068), Math.round(W * 0.044), sp.font);
        const blockH = r.lines.length * r.lh;
        const startY = H * 0.64 - blockH / 2;
        const barW = W * 0.28;
        const barX = (W - barW) / 2;
        c.fillStyle = 'rgba(255,255,255,0.22)';
        c.fillRect(barX, startY - 26, barW, 3);
        c.fillStyle = sp.accent || '#facc15';
        c.fillRect(barX, startY - 26, barW * lp, 3);
        c.save();
        c.font = `800 ${r.size}px ${F.f}`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.shadowColor = 'rgba(0,0,0,0.78)';
        c.shadowBlur = 14;
        r.lines.forEach((ln, li) => {
          const lineP = easeOutExpo((local - li * 0.07) / 0.22);
          const ly = startY + li * r.lh + r.lh / 2;
          c.save();
          c.beginPath();
          c.rect(0, ly - r.lh * 0.55, W, r.lh * 1.1);
          c.clip();
          c.globalAlpha = lineP;
          c.fillStyle = li === 0 ? '#ffffff' : (sp.accent || '#facc15');
          c.fillText(ln, W / 2, ly + (1 - lineP) * r.lh * 0.75);
          c.restore();
        });
        c.restore();
      } else if (M === 'pro_editorial_center') {
        const alpha = easeOutExpo(local / 0.36);
        const r = mFit(c, caption, W * 0.76, 3, Math.round(W * 0.060), Math.round(W * 0.040), sp.font);
        const blockH = r.lines.length * r.lh;
        const centerY = H * 0.49;
        c.save();
        c.globalAlpha = alpha;
        c.fillStyle = 'rgba(244,240,232,0.45)';
        c.fillRect(W / 2 - 28, centerY - blockH / 2 - 28, 56, 1);
        c.fillRect(W / 2 - 28, centerY + blockH / 2 + 28, 56, 1);
        c.font = `500 ${Math.round(W * 0.023)}px 'JetBrains Mono', monospace`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillStyle = 'rgba(244,240,232,0.68)';
        c.fillText(numTag.replace('/', '—'), W / 2, centerY - blockH / 2 - 46);
        c.font = `500 ${r.size}px ${F.f}`;
        c.fillStyle = '#f4f0e8';
        c.shadowColor = 'rgba(0,0,0,0.65)';
        c.shadowBlur = 20;
        const topY = centerY - ((r.lines.length - 1) * r.lh) / 2 + (1 - alpha) * 10;
        r.lines.forEach((ln, li) => c.fillText(ln, W / 2, topY + li * r.lh));
        c.restore();
      } else if (M === 'pro_pov_caption') {
        const pop = easeOutBack(local / 0.24);
        const r = mFit(c, caption, W * 0.72, 3, Math.round(W * 0.044), Math.round(W * 0.032), sp.font);
        c.font = `600 ${r.size}px ${F.f}`;
        let maxW = 0;
        r.lines.forEach((ln) => { maxW = Math.max(maxW, c.measureText(ln).width); });
        const boxW = Math.min(W * 0.84, maxW + 52);
        const boxH = r.lines.length * r.lh + 34;
        const cx = W / 2, cy = H * 0.24;
        c.save();
        c.translate(cx, cy);
        c.scale(0.92 + 0.08 * pop, 0.92 + 0.08 * pop);
        c.globalAlpha = mClamp(local / 0.16);
        c.fillStyle = 'rgba(14,14,16,0.64)';
        gRoundRect(c, -boxW / 2, -boxH / 2, boxW, boxH, 20);
        c.fill();
        c.strokeStyle = 'rgba(255,255,255,0.20)';
        c.lineWidth = 1.5;
        c.stroke();
        c.fillStyle = '#f4f0e8';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        const topY = -((r.lines.length - 1) * r.lh) / 2;
        r.lines.forEach((ln, li) => c.fillText(ln, 0, topY + li * r.lh));
        c.restore();
      } else if (M === 'pro_split_reveal') {
        const alpha = easeOutExpo(local / 0.28);
        const leftX = W * 0.075;
        const maxLeftW = W * 0.72;
        const r = mFit(c, caption, maxLeftW, 3, Math.round(W * 0.056), Math.round(W * 0.038), sp.font);
        const baseY = H * 0.67 - ((r.lines.length - 1) * r.lh) / 2;
        c.save();
        c.globalAlpha = alpha;
        const pillText = `CUT ${String(cutIdx + 1).padStart(2, '0')}`;
        c.font = `600 ${Math.round(W * 0.024)}px 'JetBrains Mono', monospace`;
        const pw = c.measureText(pillText).width + 24;
        c.fillStyle = 'rgba(244,240,232,0.16)';
        gRoundRect(c, leftX, baseY - r.lh / 2 - 42, pw, 28, 999);
        c.fill();
        c.strokeStyle = 'rgba(244,240,232,0.35)';
        c.lineWidth = 1;
        c.stroke();
        c.fillStyle = '#f4f0e8';
        c.textAlign = 'left';
        c.textBaseline = 'middle';
        c.fillText(pillText, leftX + 12, baseY - r.lh / 2 - 28);
        c.font = `700 ${r.size}px ${F.f}`;
        c.shadowColor = 'rgba(0,0,0,0.82)';
        c.shadowBlur = 16;
        r.lines.forEach((ln, li) => c.fillText(ln, leftX + (1 - alpha) * -14, baseY + li * r.lh));
        c.restore();
      } else if (M === 'pro_handwrite') {
        // 감성 손글씨: 왼쪽에서 오른쪽으로 써 내려가는 클립 리빌 + 손그림 곡선 밑줄 (Safe Zone: y = 0.65H)
        const writeP = easeOutExpo(local / 0.52);
        const r = mFit(c, caption, W * 0.78, 3, Math.round(W * 0.068), Math.round(W * 0.044), sp.font);
        const baseY = H * 0.655 - ((r.lines.length - 1) * r.lh) / 2;
        c.save();
        c.font = `500 ${r.size}px ${F.f}`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.shadowColor = 'rgba(0,0,0,0.72)';
        c.shadowBlur = 18;
        c.fillStyle = '#f8f3ea';
        let widest = 0;
        r.lines.forEach((ln) => { widest = Math.max(widest, c.measureText(ln).width); });
        r.lines.forEach((ln, li) => {
          const lineP = easeOutExpo((local - li * 0.12) / 0.44);
          const ly = baseY + li * r.lh;
          c.save();
          const lw = c.measureText(ln).width + 24;
          const lx = W / 2 - lw / 2;
          c.beginPath();
          c.rect(lx, ly - r.lh * 0.7, lw * lineP, r.lh * 1.4);
          c.clip();
          c.fillText(ln, W / 2, ly);
          c.restore();
        });
        // 마지막 줄 아래에 손으로 그은 듯한 부드러운 곡선 밑줄
        const ulW = Math.min(W * 0.54, widest * 0.72);
        const ulY = baseY + (r.lines.length - 1) * r.lh + r.lh * 0.56;
        const ulP = easeOutExpo((local - 0.18) / 0.42);
        if (ulP > 0.02) {
          c.save();
          c.beginPath();
          c.rect(W / 2 - ulW / 2 - 6, ulY - 14, (ulW + 12) * ulP, 28);
          c.clip();
          c.strokeStyle = sp.accent || '#e8d5bc';
          c.lineWidth = 3.2;
          c.lineCap = 'round';
          c.beginPath();
          c.moveTo(W / 2 - ulW / 2, ulY + 3);
          c.quadraticCurveTo(W / 2, ulY - 5, W / 2 + ulW / 2, ulY + 2);
          c.stroke();
          c.restore();
        }
        c.restore();
      } else if (M === 'pro_trend_sticker') {
        // 2026 트렌디 감성: 상단 좌측 필름 타임스탬프 + Safe Zone 감성 자막 플로트
        const now = new Date();
        const stamp = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} · SCENE ${String(cutIdx + 1).padStart(2, '0')}`;
        c.save();
        c.font = `500 ${Math.round(W * 0.024)}px 'JetBrains Mono', monospace`;
        const sw = c.measureText(stamp).width + 26;
        c.fillStyle = 'rgba(12,11,10,0.52)';
        gRoundRect(c, W * 0.07, H * 0.085, sw, 30, 999);
        c.fill();
        c.strokeStyle = 'rgba(242,228,204,0.28)';
        c.lineWidth = 1;
        c.stroke();
        c.fillStyle = '#f2e4cc';
        c.textAlign = 'left';
        c.textBaseline = 'middle';
        c.fillText(stamp, W * 0.07 + 13, H * 0.085 + 15);
        c.restore();

        const pop = easeOutBack(local / 0.28);
        const alpha = mClamp(local / 0.22);
        const r = mFit(c, caption, safeW, 3, Math.round(W * 0.056), Math.round(W * 0.038), sp.font);
        const baseY = H * 0.68 - ((r.lines.length - 1) * r.lh) / 2;
        c.save();
        c.globalAlpha = alpha;
        c.translate(W / 2, baseY);
        c.scale(0.95 + 0.05 * pop, 0.95 + 0.05 * pop);
        c.font = `600 ${r.size}px ${F.f}`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.shadowColor = 'rgba(0,0,0,0.82)';
        c.shadowBlur = 20;
        c.fillStyle = '#ffffff';
        r.lines.forEach((ln, li) => c.fillText(ln, 0, li * r.lh));
        c.restore();
      } else if (M === 'pro_glass_card') {
        // 글래스모피즘 모던 카드: 하단 Safe Zone 반투명 다크 글래스 + 1px 스페큘러 보더
        const rise = (1 - easeOutCubic(local / 0.30)) * 22;
        const alpha = mClamp(local / 0.24);
        const r = mFit(c, caption, safeW - 44, 3, Math.round(W * 0.052), Math.round(W * 0.036), sp.font);
        const boxH = r.lines.length * r.lh + 36;
        const boxW = safeW;
        const bx = (W - boxW) / 2;
        const by = H * 0.69 - boxH / 2 + rise;
        c.save();
        c.globalAlpha = alpha;
        c.fillStyle = 'rgba(14, 16, 22, 0.62)';
        gRoundRect(c, bx, by, boxW, boxH, 20);
        c.fill();
        c.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        c.lineWidth = 1.2;
        c.stroke();
        // 상단 미세 스페큘러 하이라이트
        c.fillStyle = accent;
        gRoundRect(c, bx + 20, by + 10, 28, 3, 2);
        c.fill();
        c.font = `600 ${r.size}px ${F.f}`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillStyle = '#ffffff';
        const firstY = by + boxH / 2 - ((r.lines.length - 1) * r.lh) / 2 + 4;
        r.lines.forEach((ln, li) => c.fillText(ln, W / 2, firstY + li * r.lh));
        c.restore();
      } else if (M === 'pro_neon_pulse') {
        // 미드나잇 에디토리얼 포인트 바: 좌측 수직 액센트 바 + 고대비 좌정렬 타이포
        const slide = (1 - easeOutCubic(local / 0.24)) * 28;
        const alpha = mClamp(local / 0.20);
        const r = mFit(c, caption, safeW - 26, 3, Math.round(W * 0.058), Math.round(W * 0.04), sp.font);
        const totalH = r.lines.length * r.lh;
        const startX = W * 0.11;
        const topY = H * 0.67 - totalH / 2;
        c.save();
        c.globalAlpha = alpha;
        // 상단 미니멀 씬 인디케이터
        c.font = `600 ${Math.round(W * 0.024)}px 'JetBrains Mono', monospace`;
        c.fillStyle = accent;
        c.textAlign = 'left';
        c.fillText(`● 0${cutIdx + 1} / 0${totalCuts}`, startX, H * 0.095);
        // 좌측 수직 포인트 바
        c.fillStyle = accent;
        gRoundRect(c, startX, topY - 4, 5, totalH + 8, 3);
        c.fill();
        c.font = `800 ${r.size}px ${F.f}`;
        c.textAlign = 'left';
        c.textBaseline = 'middle';
        c.shadowColor = 'rgba(0,0,0,0.85)';
        c.shadowBlur = 18;
        c.fillStyle = '#ffffff';
        r.lines.forEach((ln, li) => c.fillText(ln, startX + 20 + slide, topY + r.lh / 2 + li * r.lh));
        c.restore();
      } else if (M === 'pro_magazine_cover') {
        // 보그 럭셔리 매거진 커버: 상단 1px 마스트헤드 + 하단 명조 에디토리얼
        const alpha = mClamp(local / 0.30);
        c.save();
        c.globalAlpha = alpha * 0.9;
        c.strokeStyle = 'rgba(232,213,188,0.45)';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(W * 0.09, H * 0.095);
        c.lineTo(W * 0.91, H * 0.095);
        c.stroke();
        c.font = `500 ${Math.round(W * 0.023)}px 'JetBrains Mono', monospace`;
        c.fillStyle = '#e8d5bc';
        c.textAlign = 'left';
        c.fillText(`ISSUE NO.${String(cutIdx + 1).padStart(2, '0')}`, W * 0.09, H * 0.082);
        c.textAlign = 'right';
        c.fillText('EDITORIAL REEL', W * 0.91, H * 0.082);
        c.restore();

        const r = mFit(c, caption, safeW, 3, Math.round(W * 0.06), Math.round(W * 0.04), sp.font);
        const baseY = H * 0.69 - ((r.lines.length - 1) * r.lh) / 2;
        c.save();
        c.globalAlpha = alpha;
        c.font = `600 ${r.size}px ${F.f}`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.shadowColor = 'rgba(0,0,0,0.78)';
        c.shadowBlur = 22;
        c.fillStyle = '#f8f3ea';
        r.lines.forEach((ln, li) => c.fillText(ln, W / 2, baseY + li * r.lh));
        c.restore();
      } else if (M === 'pro_warm_diary') {
        // 따뜻한 브이로그 크림 일기: 웜 크림 캡슐 + 에스프레소 잉크 텍스트
        const pop = easeOutCubic(local / 0.28);
        const alpha = mClamp(local / 0.22);
        const r = mFit(c, caption, safeW - 44, 3, Math.round(W * 0.05), Math.round(W * 0.036), sp.font);
        c.save();
        c.globalAlpha = alpha;
        c.font = `600 ${r.size}px ${F.f}`;
        let maxW = 0;
        r.lines.forEach((ln) => { maxW = Math.max(maxW, c.measureText(ln).width); });
        const boxW = Math.min(safeW, maxW + 46);
        const boxH = r.lines.length * r.lh + 30;
        const bx = (W - boxW) / 2;
        const by = H * 0.69 - boxH / 2 + (1 - pop) * 16;
        c.fillStyle = 'rgba(248, 243, 234, 0.93)';
        gRoundRect(c, bx, by, boxW, boxH, 18);
        c.fill();
        c.fillStyle = '#231b15';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        const firstY = by + boxH / 2 - ((r.lines.length - 1) * r.lh) / 2;
        r.lines.forEach((ln, li) => c.fillText(ln, W / 2, firstY + li * r.lh));
        c.restore();
      } else if (M === 'pro_bold_badge') {
        // 숏폼 임팩트 형광펜 강조: 각 줄 뒤로 붓터치 하이라이트 리본 + 펀치 바운스
        const pop = easeOutBack(local / 0.24);
        const alpha = mClamp(local / 0.16);
        const r = mFit(c, caption, safeW - 28, 3, Math.round(W * 0.062), Math.round(W * 0.042), sp.font);
        const baseY = H * 0.67 - ((r.lines.length - 1) * (r.lh + 8)) / 2;
        c.save();
        c.globalAlpha = alpha;
        c.font = `900 ${r.size}px ${F.f}`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        r.lines.forEach((ln, li) => {
          const ly = baseY + li * (r.lh + 8);
          const lw = c.measureText(ln).width + 28;
          const lh = r.size + 14;
          const isHi = li === r.lines.length - 1;
          c.save();
          c.translate(W / 2, ly);
          c.scale(0.92 + 0.08 * pop, 0.92 + 0.08 * pop);
          c.rotate(isHi ? -0.018 : 0.01);
          c.fillStyle = isHi ? accent : 'rgba(12,12,15,0.86)';
          gRoundRect(c, -lw / 2, -lh / 2, lw, lh, 10);
          c.fill();
          c.fillStyle = isHi ? (gLuminance(accent) > 0.45 ? '#111111' : '#ffffff') : '#ffffff';
          c.fillText(ln, 0, 1);
          c.restore();
        });
        c.restore();
      } else if (M === 'pro_minimal_mono' || M === 'pro_rhythm_editorial' || M === 'pro_focus_cinema') {
        // 프로 리듬 / 포커스 시네마 / 모노크롬: 하단 Safe Zone 정갈한 명조 + 미니멀 씬 진행 바
        const rise = (1 - easeOutQuart(local / 0.28)) * 14;
        const alpha = mClamp(local / 0.24);
        const r = mFit(c, caption, safeW, 3, Math.round(W * 0.055), Math.round(W * 0.038), sp.font);
        const baseY = H * 0.72 - ((r.lines.length - 1) * r.lh) / 2 + rise;
        c.save();
        c.globalAlpha = alpha;
        if (M !== 'pro_minimal_mono') {
          // 상단 미니멀 씬 번호 & 헤어라인
          c.font = `500 ${Math.round(W * 0.023)}px 'JetBrains Mono', monospace`;
          c.fillStyle = M === 'pro_focus_cinema' ? '#f2e4cc' : '#e8d5bc';
          c.textAlign = 'center';
          c.fillText(`0${cutIdx + 1} / 0${totalCuts}`, W / 2, H * 0.088);
        }
        c.font = `600 ${r.size}px ${F.f}`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.shadowColor = 'rgba(0,0,0,0.88)';
        c.shadowBlur = 22;
        c.fillStyle = M === 'pro_focus_cinema' ? '#f8f3ea' : '#ffffff';
        r.lines.forEach((ln, li) => c.fillText(ln, W / 2, baseY + li * r.lh));
        // 하단 미니멀 진행 바
        const barW = W * 0.56;
        const barX = (W - barW) / 2;
        const barY = H * 0.805;
        c.fillStyle = 'rgba(255,255,255,0.22)';
        c.fillRect(barX, barY, barW, 2);
        c.fillStyle = M === 'pro_minimal_mono' ? '#ffffff' : accent;
        c.fillRect(barX, barY, barW * mClamp(t / Math.max(0.1, mainDuration)), 2);
        c.restore();
      }
      c.restore();
    }

    // ★ 코드 기반 오퍼스 화풍 30종 전용 6대 캔버스 엔진 (실시간 60fps · 0원 · 무흔들림 · Safe Zone 준수)
    function arRenderOpusFrame(c, W, H, t, mainDuration, totalCuts, d, sp) {
      const cutDur = Math.max(0.5, mainDuration / Math.max(1, totalCuts));
      const cutIdx = Math.min(totalCuts - 1, Math.floor(t / cutDur));
      const local = Math.max(0, t - cutIdx * cutDur);
      const lp = mClamp(local / cutDur);
      const M = sp.mstyle;
      const S = kitScene(t, mainDuration, false);
      const rawCap = (campaign.cutCaptions && campaign.cutCaptions[cutIdx]) || campaign.hook || '';
      const capOv = mCapOv(cutIdx);
      const caption = capOv.hidden ? '' : gCleanCaption(rawCap);
      const F = KIT_FONTS[mCapFont(cutIdx, sp.font)] || KIT_FONTS.sans;
      const accent = sp.accent || '#60a5fa';
      const fg = sp.accent2 || (sp.light ? '#141414' : '#ffffff');
      const muted = sp.light ? 'rgba(20,20,24,0.52)' : 'rgba(255,255,255,0.52)';
      const lineCol = sp.light ? 'rgba(20,20,24,0.14)' : 'rgba(255,255,255,0.16)';
      const easeOutCubic = (x) => 1 - Math.pow(1 - mClamp(x), 3);
      const easeOutQuart = (x) => 1 - Math.pow(1 - mClamp(x), 4);
      const ent = easeOutQuart(local / 0.38);
      const rem = 1 - ent;
      const dir = cutIdx % 2 === 0 ? 1 : -1;
      const _ov = typeof getCutElementOverride === 'function' ? getCutElementOverride(cutIdx) : null;
      const capHidden = Boolean(_ov && _ov.caption && _ov.caption.hidden);
      const safeW = W * 0.82;

      c.save();
      const bgGrad = c.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, sp.bg1 || '#090a0e');
      bgGrad.addColorStop(1, sp.bg2 || sp.bg1 || '#141620');
      c.fillStyle = bgGrad;
      c.fillRect(0, 0, W, H);

      if (M === 'op_keynote') {
        // 1) 다크테크·애플 키노트 인포그래픽: 상단 인덱스 + 라운드 16:10 쇼케이스 창 + 하단 볼드 헤드라인
        const pad = 34;
        // 상단 프로그레스 틱 & 씬 번호
        c.font = `600 12px 'JetBrains Mono', monospace`;
        c.fillStyle = accent;
        c.textAlign = 'left';
        c.fillText(`KEYNOTE · 0${cutIdx + 1} / 0${totalCuts}`, pad, 84);
        const tickW = (W - pad * 2 - (totalCuts - 1) * 6) / totalCuts;
        for (let i = 0; i < totalCuts; i++) {
          const tx = pad + i * (tickW + 6);
          c.fillStyle = lineCol;
          gRoundRect(c, tx, 98, tickW, 3, 2);
          c.fill();
          if (i < cutIdx || i === cutIdx) {
            c.fillStyle = accent;
            gRoundRect(c, tx, 98, i < cutIdx ? tickW : tickW * lp, 3, 2);
            c.fill();
          }
        }
        // 중앙 16:10 쇼케이스 창
        const fw = W - pad * 2, fh = 372, fx = pad, fy = 132 + rem * 18;
        c.save();
        c.globalAlpha = easeOutCubic(local / 0.28);
        c.shadowColor = sp.light ? 'rgba(0,0,0,0.14)' : 'rgba(0,0,0,0.55)';
        c.shadowBlur = 28;
        c.shadowOffsetY = 12;
        gRoundRect(c, fx, fy, fw, fh, 20);
        c.fillStyle = sp.light ? '#ffffff' : '#11131a';
        c.fill();
        c.restore();

        c.save();
        c.globalAlpha = easeOutCubic(local / 0.28);
        gRoundRect(c, fx, fy, fw, fh, 20);
        c.clip();
        inPhotoFade(c, S, cutIdx, local, fx, fy, fw, fh, 1.05 + lp * 0.05, 0);
        c.restore();

        gRoundRect(c, fx, fy, fw, fh, 20);
        c.strokeStyle = lineCol;
        c.lineWidth = 1.2;
        c.stroke();

        // 하단 헤드라인 타이포
        if (!capHidden && caption) {
          const r = mFit(c, caption, safeW, 3, 34, 22, sp.font);
          const by = 568 + rem * 14;
          c.save();
          c.globalAlpha = easeOutCubic(local / 0.30);
          c.fillStyle = accent;
          gRoundRect(c, pad, by - 26, 36, 4, 2);
          c.fill();
          c.font = `700 ${r.size}px ${F.f}`;
          c.fillStyle = fg;
          c.textAlign = 'left';
          c.textBaseline = 'top';
          r.lines.forEach((ln, li) => c.fillText(ln, pad, by + li * r.lh));
          c.restore();
        }
      } else if (M === 'op_swiss') {
        // 2) 스위스 인터내셔널 그리드: 1px 건축 그리드 + 대형 인덱스 번호 + 비대칭 사진 & 타이포
        const pad = 32;
        c.strokeStyle = lineCol;
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(pad, 74); c.lineTo(W - pad, 74);
        c.moveTo(pad, 136); c.lineTo(W - pad, 136);
        c.moveTo(pad, 574); c.lineTo(W - pad, 574);
        c.moveTo(pad, 788); c.lineTo(W - pad, 788);
        c.stroke();

        c.font = `700 32px 'JetBrains Mono', monospace`;
        c.fillStyle = accent;
        c.textAlign = 'left';
        c.textBaseline = 'middle';
        c.fillText(`0${cutIdx + 1}`, pad, 106);
        c.font = `500 12px 'JetBrains Mono', monospace`;
        c.fillStyle = muted;
        c.textAlign = 'right';
        c.fillText(`GRID SYSTEM · ${cutIdx + 1} / ${totalCuts}`, W - pad, 106);

        // 사진 영역 (스위스 그리드 셀)
        const px = pad, py = 152, pw = W - pad * 2, ph = 406;
        c.save();
        c.beginPath();
        c.rect(px, py, pw, ph);
        c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.05 + lp * 0.05, 0);
        c.restore();

        // 하단 스위스 좌정렬 볼드 타이포
        if (!capHidden && caption) {
          const r = mFit(c, caption, safeW, 3, 35, 22, sp.font);
          const startY = 602 + rem * 14;
          c.save();
          c.globalAlpha = easeOutCubic(local / 0.28);
          c.font = `800 ${r.size}px ${F.f}`;
          c.fillStyle = fg;
          c.textAlign = 'left';
          c.textBaseline = 'top';
          r.lines.forEach((ln, li) => c.fillText(ln, pad, startY + li * r.lh));
          c.restore();
        }
      } else if (M === 'op_infocard') {
        // 3) 인포그래픽 설명 카드: 블러 배경 + 컷별 포인트 컬러 & 리듬 타이포 2단 STEP 카드
        const cp = arCardCutPalette(sp, cutIdx, !sp.light);
        c.save();
        try { c.filter = sp.light ? 'blur(18px) brightness(1.06)' : 'blur(18px) brightness(0.38)'; } catch (_) {}
        mPhoto(c, S, 0, -20, -20, W + 40, H + 40, 1.15, 0, 0);
        c.restore();
        c.fillStyle = sp.light ? 'rgba(246,242,234,0.72)' : 'rgba(10,12,18,0.58)';
        c.fillRect(0, 0, W, H);

        const cx = 36, cy = 104 + rem * 20, cw = W - 72, ch = 660;
        c.save();
        c.globalAlpha = easeOutCubic(local / 0.26);
        c.shadowColor = 'rgba(0,0,0,0.32)';
        c.shadowBlur = 32;
        c.shadowOffsetY = 14;
        gRoundRect(c, cx, cy, cw, ch, 24);
        c.fillStyle = sp.light ? cp.tintBg : sp.bg1;
        c.fill();
        c.restore();

        // 카드 상단 사진 (370px)
        c.save();
        c.globalAlpha = easeOutCubic(local / 0.26);
        gRoundRect(c, cx + 14, cy + 14, cw - 28, 370, 18);
        c.clip();
        inPhotoFade(c, S, cutIdx, local, cx + 14, cy + 14, cw - 28, 370, 1.04 + lp * 0.05, 0);
        c.restore();

        // 카드 하단 STEP 배지 + 리듬 타이포
        c.save();
        c.globalAlpha = easeOutCubic(local / 0.30);
        c.fillStyle = cp.accent;
        gRoundRect(c, cx + 22, cy + 402, 82, 26, 999);
        c.fill();
        c.font = `700 11px 'JetBrains Mono', monospace`;
        c.fillStyle = cp.pillFg;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(`STEP 0${cutIdx + 1}`, cx + 63, cy + 415);

        if (!capHidden && caption) {
          arCardRhythmCaption(c, caption, cx + 22, cy + 440, cw - 44, 172, 28, {
            cutIdx, local, accent: cp.accent, ink: fg, isDark: !sp.light, align: 'left'
          });
        }
        // 카드 하단 진행 바
        c.fillStyle = lineCol;
        gRoundRect(c, cx + 22, cy + ch - 26, cw - 44, 4, 2);
        c.fill();
        c.fillStyle = cp.accent;
        gRoundRect(c, cx + 22, cy + ch - 26, (cw - 44) * mClamp(t / Math.max(0.1, mainDuration)), 4, 2);
        c.fill();
        c.restore();
      } else if (M === 'op_kinetic_bar') {
        // 4) 키네틱 타이포 · 세그먼트 바: 풀스크린 + 좌측 강렬한 액센트 바 + 하단 컷 세그먼트
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.05 + lp * 0.06, 0);
        const sc = c.createLinearGradient(0, H * 0.38, 0, H);
        sc.addColorStop(0, 'rgba(6,6,10,0)');
        sc.addColorStop(0.55, 'rgba(6,6,10,0.62)');
        sc.addColorStop(1, 'rgba(6,6,10,0.88)');
        c.fillStyle = sc;
        c.fillRect(0, H * 0.38, W, H * 0.62);

        if (!capHidden && caption) {
          const r = mFit(c, caption, safeW - 26, 3, 36, 23, sp.font);
          const totalH = r.lines.length * r.lh;
          const sx = 46, sy = H * 0.67 - totalH / 2;
          c.save();
          c.globalAlpha = easeOutCubic(local / 0.24);
          c.fillStyle = accent;
          gRoundRect(c, sx, sy - 4, 6, totalH + 8, 3);
          c.fill();
          c.font = `800 ${r.size}px ${F.f}`;
          c.fillStyle = '#ffffff';
          c.textAlign = 'left';
          c.textBaseline = 'middle';
          c.shadowColor = 'rgba(0,0,0,0.8)';
          c.shadowBlur = 18;
          r.lines.forEach((ln, li) => {
            const lineEnt = easeOutQuart((local - li * 0.06) / 0.28);
            c.fillText(ln, sx + 22 + (1 - lineEnt) * 20, sy + r.lh / 2 + li * r.lh);
          });
          c.restore();
        }
        // 하단 세그먼트 진행 바
        const segGap = 6, padX = 46;
        const segW = (W - padX * 2 - (totalCuts - 1) * segGap) / totalCuts;
        for (let i = 0; i < totalCuts; i++) {
          const bx = padX + i * (segW + segGap);
          c.fillStyle = 'rgba(255,255,255,0.22)';
          gRoundRect(c, bx, H * 0.81, segW, 4, 2);
          c.fill();
          if (i <= cutIdx) {
            c.fillStyle = accent;
            gRoundRect(c, bx, H * 0.81, i < cutIdx ? segW : segW * lp, 4, 2);
            c.fill();
          }
        }
      } else if (M === 'op_editorial_split') {
        // 5) 에디토리얼 60/40 스플릿 룩북: 상단 60% 사진 + 하단 40% 매트 여백 타이포
        const splitY = Math.round(H * 0.57);
        c.save();
        c.beginPath();
        c.rect(0, 0, W, splitY);
        c.clip();
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, splitY, 1.05 + lp * 0.06, 0.2);
        c.restore();

        c.fillStyle = accent;
        c.fillRect(0, splitY, W * mClamp(t / Math.max(0.1, mainDuration)), 3);
        c.fillStyle = lineCol;
        c.fillRect(0, splitY + 3, W, 1);

        c.font = `500 12px 'JetBrains Mono', monospace`;
        c.fillStyle = muted;
        c.textAlign = 'left';
        c.fillText(`NO.0${cutIdx + 1}`, 38, splitY + 34);

        if (!capHidden && caption) {
          const r = mFit(c, caption, safeW, 3, 32, 21, sp.font);
          c.save();
          c.globalAlpha = easeOutCubic(local / 0.28);
          c.font = `600 ${r.size}px ${F.f}`;
          c.fillStyle = fg;
          c.textAlign = 'left';
          c.textBaseline = 'top';
          r.lines.forEach((ln, li) => c.fillText(ln, 38, splitY + 56 + rem * 12 + li * r.lh));
          c.restore();
        }
      } else if (M === 'op_cinema_frame') {
        // 6) 시네마틱 아트 프레임: 블러 배경 + 4:5 갤러리 액자 + 하단 미니멀 캡션
        const isMono = sp.id === 'op_cine_leica';
        c.save();
        try { c.filter = (isMono ? 'grayscale(100%) ' : '') + (sp.light ? 'blur(18px) brightness(1.05)' : 'blur(18px) brightness(0.36)'); } catch (_) {}
        mPhoto(c, S, 0, -20, -20, W + 40, H + 40, 1.16, 0, 0);
        c.restore();
        c.fillStyle = sp.light ? 'rgba(239,233,222,0.68)' : 'rgba(8,8,10,0.46)';
        c.fillRect(0, 0, W, H);

        const cw = W - 84, ch = 486, cx = 42, cy = 112 + rem * 16;
        c.save();
        c.globalAlpha = easeOutCubic(local / 0.28);
        gRoundRect(c, cx, cy, cw, ch, 14);
        c.clip();
        if (isMono) { try { c.filter = 'grayscale(100%) contrast(1.12)'; } catch (_) {} }
        inPhotoFade(c, S, cutIdx, local, cx, cy, cw, ch, 1.05 + lp * 0.06, isMono ? 0 : 0.25);
        c.restore();

        gRoundRect(c, cx, cy, cw, ch, 14);
        c.strokeStyle = sp.light ? 'rgba(38,32,26,0.22)' : 'rgba(255,255,255,0.24)';
        c.lineWidth = 1.2;
        c.stroke();

        c.font = `500 11px 'JetBrains Mono', monospace`;
        c.fillStyle = muted;
        c.textAlign = 'center';
        c.fillText(`FRAME 0${cutIdx + 1} / 0${totalCuts}`, W / 2, 92);

        if (!capHidden && caption) {
          const r = mFit(c, caption, safeW, 3, 30, 20, sp.font);
          const by = 648 + rem * 12;
          c.save();
          c.globalAlpha = easeOutCubic(local / 0.30);
          c.font = `600 ${r.size}px ${F.f}`;
          c.fillStyle = fg;
          c.textAlign = 'center';
          c.textBaseline = 'top';
          if (!sp.light) { c.shadowColor = 'rgba(0,0,0,0.75)'; c.shadowBlur = 16; }
          r.lines.forEach((ln, li) => c.fillText(ln, W / 2, by + li * r.lh));
          c.restore();
        }
        inGrain(c, W, H, t, 0.038);
      }

      c.restore();
    }

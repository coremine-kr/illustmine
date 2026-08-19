// -------------------------------------------------------------
// Supabase 설정
// -------------------------------------------------------------
const SUPABASE_URL = 'https://mftczswnpdlrbedneare.supabase.co'.trim();
// ⚠️ 아래 따옴표 안에 본인의 anon public key를 넣어주세요
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mdGN6c3ducGRscmJlZG5lYXJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNzk4MzIsImV4cCI6MjEwMjY1NTgzMn0.lEjCvgDC0l_1J310_ToTH5pHjCV8MxKOiQBfFJfx2_8'.trim();
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let illustrations = [];
let currentSelectedItem = null;
const galleryGrid = document.getElementById('galleryGrid');
const searchInput = document.getElementById('searchInput');

// 1. 일러스트 데이터 가져오기
async function loadIllustrations() {
  try {
    const { data, error } = await supabaseClient
      .from('illustrations')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    illustrations = (data || []).map(item => ({
      ...item,
      imageUrl: item.image_url || item.imageUrl || '',
      desc: item.description || item.desc || '',
      season: Array.isArray(item.season) ? item.season : [],
      tags: Array.isArray(item.tags) ? item.tags : []
    }));

    renderGallery(illustrations);
  } catch (error) {
    console.error('데이터 로드 실패:', error);
    if (galleryGrid) {
      galleryGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-sub); padding: 60px;">데이터를 불러오는 데 실패했습니다.</p>';
    }
  }
}

// 2. 갤러리 카드 화면에 그리기
function renderGallery(items) {
  if (!galleryGrid) return;
  galleryGrid.innerHTML = '';

  if (items.length === 0) {
    galleryGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-sub); padding: 60px; font-weight:600;">조건에 일치하는 일러스트가 없습니다 🥲</p>';
    return;
  }

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.onclick = () => openModal(item);
    
    const previewContent = item.imageUrl 
      ? `<img src="${item.imageUrl}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: contain;">`
      : (item.emoji || '🎨');

    card.innerHTML = `
      <div>
        <div class="card-preview">${previewContent}</div>
        <div class="card-info">
          <div class="card-category">${item.category}</div>
          <div class="card-title">${item.title}</div>
        </div>
      </div>
    `;
    galleryGrid.appendChild(card);
  });
}

// 3. 검색 및 체크박스 필터 기능 (이모지 무시하고 글자만 비교)
function applyFilters() {
  const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';
  
  // 체크된 계절 / 카테고리에서 특수문자/이모지를 제거하고 순수 글자만 추출
  const selectedSeasons = Array.from(document.querySelectorAll('input[name="season"]:checked'))
    .map(el => el.value.replace(/[^가-힣a-zA-Z0-9/]/g, '').trim());

  const selectedCategories = Array.from(document.querySelectorAll('input[name="category"]:checked'))
    .map(el => el.value.replace(/[^가-힣a-zA-Z0-9/]/g, '').trim());

  const filtered = illustrations.filter(item => {
    // 1) 검색어 확인
    const matchKeyword = !keyword || 
      item.title.toLowerCase().includes(keyword) || 
      (item.desc || '').toLowerCase().includes(keyword) ||
      (item.tags || []).some(t => t.toLowerCase().includes(keyword));

    // 2) 카테고리 확인 (글자 포함 여부로 비교)
    const itemCat = (item.category || '').replace(/[^가-힣a-zA-Z0-9/]/g, '').trim();
    const matchCategory = selectedCategories.length === 0 || 
      selectedCategories.some(cat => itemCat.includes(cat) || cat.includes(itemCat));

    // 3) 계절 확인
    const itemSeasons = (item.season || []).map(s => s.replace(/[^가-힣a-zA-Z0-9/]/g, '').trim());
    const matchSeason = selectedSeasons.length === 0 || 
      itemSeasons.length === 0 || 
      itemSeasons.includes('사계절') ||
      itemSeasons.some(s => selectedSeasons.includes(s));

    return matchKeyword && matchCategory && matchSeason;
  });

  renderGallery(filtered);
}

function resetFilters() {
  if (searchInput) searchInput.value = '';
  document.querySelectorAll('.sidebar input[type="checkbox"]').forEach(cb => cb.checked = false);
  applyFilters();
}

function quickTagSearch(tag) {
  if (searchInput) searchInput.value = tag;
  applyFilters();
}

if (searchInput) {
  searchInput.addEventListener('input', applyFilters);
}

// 체크박스 누를 때마다 바로 필터 적용되도록 연결
document.querySelectorAll('.sidebar input[type="checkbox"]').forEach(cb => {
  cb.addEventListener('change', applyFilters);
});

// 4. 상세 모달 열기/닫기
function openModal(item) {
  currentSelectedItem = item;
  const modalPreview = document.getElementById('modalPreview');
  if (modalPreview) {
    modalPreview.innerHTML = item.imageUrl 
      ? `<img src="${item.imageUrl}" alt="${item.title}" style="max-width: 100%; max-height: 100%; object-fit: contain;">`
      : (item.emoji || '🎨');
  }

  const modalCategory = document.getElementById('modalCategory');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  const tagsWrap = document.getElementById('modalTags');

  if (modalCategory) modalCategory.textContent = item.category;
  if (modalTitle) modalTitle.textContent = item.title;
  if (modalDesc) modalDesc.textContent = item.desc;

  if (tagsWrap) {
    tagsWrap.innerHTML = (item.tags || []).map(t => `<span class="modal-tag">#${t}</span>`).join('');
  }

  const modal = document.getElementById('imageModal');
  if (modal) modal.classList.add('active');
}

function closeModal() {
  const modal = document.getElementById('imageModal');
  if (modal) modal.classList.remove('active');
  currentSelectedItem = null;
}

// 5. 다운로드 기능
const modalDownloadBtn = document.getElementById('modalDownloadBtn');
if (modalDownloadBtn) {
  modalDownloadBtn.addEventListener('click', async () => {
    if (!currentSelectedItem) return;

    const resolutionSelect = document.getElementById('resolutionSelect');
    const resolution = resolutionSelect ? parseInt(resolutionSelect.value) : 1024;
    const filename = `${currentSelectedItem.title}_${resolution}px.png`;

    if (currentSelectedItem.imageUrl) {
      try {
        const response = await fetch(currentSelectedItem.imageUrl);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } catch (e) {
        const link = document.createElement('a');
        link.href = currentSelectedItem.imageUrl;
        link.download = filename;
        link.target = '_blank';
        link.click();
      }
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = resolution;
    canvas.height = resolution;
    const ctx = canvas.getContext('2d');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${resolution * 0.65}px sans-serif`;
    ctx.fillText(currentSelectedItem.emoji || '🎨', resolution / 2, resolution / 2);

    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
}

// 첫 화면 로딩
loadIllustrations();
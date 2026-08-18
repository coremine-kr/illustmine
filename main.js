let illustrations = [];
let currentSelectedItem = null;
const galleryGrid = document.getElementById('galleryGrid');
const searchInput = document.getElementById('searchInput');

// 1. JSON 파일 불러오기 (fetch)
async function loadIllustrations() {
  try {
    const response = await fetch('illustration.json');
    illustrations = await response.json();
    renderGallery(illustrations);
  } catch (error) {
    console.error('데이터 로드 실패:', error);
    galleryGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-sub); padding: 60px;">데이터를 불러오는 데 실패했습니다.</p>';
  }
}

// 2. 갤러리 렌더링
function renderGallery(items) {
  galleryGrid.innerHTML = '';
  if (items.length === 0) {
    galleryGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-sub); padding: 60px; font-weight:600;">조건에 일치하는 일러스트가 없습니다 🥲</p>';
    return;
  }

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.onclick = () => openModal(item);
    
    // imageUrl이 있으면 이미지 태그, 없으면 이모지 출력
    const previewContent = item.imageUrl 
      ? `<img src="${item.imageUrl}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: contain;">`
      : item.emoji;

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

// 3. 다중 필터 & 검색
function applyFilters() {
  const keyword = searchInput.value.toLowerCase().trim();
  const selectedSeasons = Array.from(document.querySelectorAll('input[name="season"]:checked')).map(el => el.value);
  const selectedCategories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(el => el.value);

  const filtered = illustrations.filter(item => {
    const matchKeyword = !keyword || 
      item.title.toLowerCase().includes(keyword) || 
      item.tags.some(t => t.toLowerCase().includes(keyword));

    const matchSeason = selectedSeasons.length === 0 || 
      item.season.some(s => selectedSeasons.includes(s) || s === '사계절');

    const matchCategory = selectedCategories.length === 0 || 
      selectedCategories.includes(item.category);

    return matchKeyword && matchSeason && matchCategory;
  });

  renderGallery(filtered);
}

function resetFilters() {
  searchInput.value = '';
  document.querySelectorAll('.sidebar input[type="checkbox"]').forEach(cb => cb.checked = false);
  applyFilters();
}

function quickTagSearch(tag) {
  searchInput.value = tag;
  applyFilters();
}

searchInput.addEventListener('input', applyFilters);

// 4. 모달 열기/닫기
function openModal(item) {
  currentSelectedItem = item;
  const modalPreview = document.getElementById('modalPreview');
  modalPreview.innerHTML = item.imageUrl 
    ? `<img src="${item.imageUrl}" alt="${item.title}" style="max-width: 100%; max-height: 100%; object-fit: contain;">`
    : item.emoji;

  document.getElementById('modalCategory').textContent = item.category;
  document.getElementById('modalTitle').textContent = item.title;
  document.getElementById('modalDesc').textContent = item.desc;

  const tagsWrap = document.getElementById('modalTags');
  tagsWrap.innerHTML = item.tags.map(t => `<span class="modal-tag">#${t}</span>`).join('');

  document.getElementById('imageModal').classList.add('active');
}

function closeModal() {
  document.getElementById('imageModal').classList.remove('active');
  currentSelectedItem = null;
}

// 5. 다운로드 처리
document.getElementById('modalDownloadBtn').addEventListener('click', () => {
  if (!currentSelectedItem) return;

  const resolution = parseInt(document.getElementById('resolutionSelect').value);
  const filename = `${currentSelectedItem.title}_${resolution}px.png`;

  // 실제 이미지 URL이 있는 경우 해당 파일 다운로드
  if (currentSelectedItem.imageUrl) {
    const link = document.createElement('a');
    link.href = currentSelectedItem.imageUrl;
    link.download = filename;
    link.click();
    return;
  }

  // 이모지인 경우 Canvas를 통해 생성 다운로드
  const canvas = document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext('2d');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${resolution * 0.65}px sans-serif`;
  ctx.fillText(currentSelectedItem.emoji, resolution / 2, resolution / 2);

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
});

// 초기 실행
loadIllustrations();
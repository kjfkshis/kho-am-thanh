// DÁN 2 "CHÌA KHOÁ" CỦA BẠN VÀO ĐÂY
const APPWRITE_PROJECT_ID = '6904f537002b8df7dd89';
const APPWRITE_BUCKET_ID = '6904f5d60014d41970a2';
const DELETE_PASSWORD = '221504'; // Mật khẩu xóa file

// ----- KHÔNG SỬA PHẦN BÊN DƯỚI -----

// 1. Kết nối với Appwrite
const { Client, Storage, ID } = Appwrite;
const client = new Client();
client
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(APPWRITE_PROJECT_ID);
const storage = new Storage(client);

// 2. Lấy các phần tử HTML (Đã thêm bộ lọc)
const uploadInput = document.getElementById('upload-input');
const chooseFileBtn = document.getElementById('choose-file-btn');
const uploadButton = document.getElementById('upload-button');
const statusText = document.getElementById('status');
const fileListDiv = document.getElementById('file-list');
const fileNameDisplay = document.getElementById('file-name-display');

// Bộ lọc MỚI
const searchInput = document.getElementById('search-input');
const genderFilter = document.getElementById('filter-gender');
const countryFilter = document.getElementById('filter-country');
const sortFilter = document.getElementById('filter-sort');

// 3. Biến toàn cục để lưu trữ danh sách file
let allAudioFiles = [];

// 4. Xử lý Tải lên (Giữ nguyên)
chooseFileBtn.addEventListener('click', () => uploadInput.click());

uploadInput.addEventListener('change', () => {
    if (uploadInput.files.length > 0) {
        fileNameDisplay.textContent = uploadInput.files[0].name;
        uploadButton.disabled = false;
    } else {
        fileNameDisplay.textContent = 'Chưa chọn file nào';
        uploadButton.disabled = true;
    }
});

uploadButton.addEventListener('click', () => {
    const file = uploadInput.files[0];
    if (!file) { statusText.textContent = 'Lỗi: Bạn chưa chọn file!'; return; }

    statusText.textContent = 'Đang tải lên...';
    uploadButton.disabled = true;
    chooseFileBtn.disabled = true;

    storage.createFile(APPWRITE_BUCKET_ID, ID.unique(), file).then(function (response) {
        statusText.textContent = 'Tải lên thành công!';
        uploadInput.value = '';
        fileNameDisplay.textContent = 'Chưa chọn file nào';
        
        allAudioFiles.unshift(response); // Thêm file mới vào đầu
        applyFiltersAndRender(); // Render lại danh sách
        
        chooseFileBtn.disabled = false;
    }, function (error) {
        statusText.textContent = `Lỗi: ${error.message}`;
        uploadButton.disabled = false;
        chooseFileBtn.disabled = false;
    });
});

// 5. HÀM MỚI: Lọc và Sắp xếp (Bộ não chính)
function applyFiltersAndRender() {
    // Lấy giá trị từ các bộ lọc
    const searchTerm = searchInput.value.toLowerCase();
    const gender = genderFilter.value;
    const country = countryFilter.value;
    const sort = sortFilter.value;

    // Bắt đầu lọc
    let filteredList = [...allAudioFiles];

    // Lọc theo Tìm kiếm
    if (searchTerm) {
        filteredList = filteredList.filter(file => 
            file.name.toLowerCase().includes(searchTerm)
        );
    }

    // Lọc theo Giới tính (dựa trên tag [Nam] [Nữ])
    if (gender !== 'all') {
        const tag = `[${gender}]`;
        filteredList = filteredList.filter(file => 
            file.name.toLowerCase().includes(tag.toLowerCase())
        );
    }

    // Lọc theo Quốc gia (dựa trên tag [VN] [US]...)
    if (country !== 'all') {
        const tag = `[${country}]`;
        filteredList = filteredList.filter(file => 
            file.name.toLowerCase().includes(tag.toLowerCase())
        );
    }

    // Sắp xếp
    if (sort === 'name-asc') {
        filteredList.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'name-desc') {
        filteredList.sort((a, b) => b.name.localeCompare(a.name));
    } else {
        // Mặc định là 'newest' (đã được sắp xếp khi tải)
        // Nếu dùng sort khác, ta cần sort lại theo $createdAt
        filteredList.sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));
    }

    // "Vẽ" kết quả ra giao diện
    renderCards(filteredList);
}

// 6. HÀM "VẼ" GIAO DIỆN (Đã thêm Nút Xóa)
function renderCards(filesToRender) {
    fileListDiv.innerHTML = ''; // Xóa nội dung cũ

    if (filesToRender.length === 0) {
        if (searchInput.value || genderFilter.value !== 'all' || countryFilter.value !== 'all') {
            fileListDiv.innerHTML = '<div class="empty-state">Không tìm thấy file nào khớp với bộ lọc.</div>';
        } else {
            fileListDiv.innerHTML = '<div class="empty-state">Chưa có file nào.</div>';
        }
        return;
    }

    filesToRender.forEach(file => {
        const url = `https://cloud.appwrite.io/v1/storage/buckets/${APPWRITE_BUCKET_ID}/files/${file.$id}/view?project=${APPWRITE_PROJECT_ID}`;
        
        const card = document.createElement('div');
        card.className = 'file-card';
        card.id = `file-card-${file.$id}`; // Thêm ID để xóa khỏi UI

        card.innerHTML = `
            <div class="file-card-header">
                <span class="file-icon">🎵</span>
                <span class="file-name" title="${file.name}">${file.name}</span>
            </div>
            <div class="file-card-body">
                <audio controls preload="none" src="${url}"></audio>
            </div>
            <div class="file-card-footer">
                <button class="use-btn" data-url="${url}" data-filename="${file.name}">
                    Sử dụng
                </button>
                <button class="delete-btn" data-file-id="${file.$id}" data-file-name="${file.name}">
                    🗑️ Xóa
                </button>
            </div>
        `;
        fileListDiv.appendChild(card);
    });
}

// 7. LẮNG NGHE SỰ KIỆN CHO CÁC BỘ LỌC
searchInput.addEventListener('input', applyFiltersAndRender);
genderFilter.addEventListener('change', applyFiltersAndRender);
countryFilter.addEventListener('change', applyFiltersAndRender);
sortFilter.addEventListener('change', applyFiltersAndRender);

// 8. LẮNG NGHE SỰ KIỆN CHO NÚT "SỬ DỤNG" VÀ "XÓA" (Event Delegation)
fileListDiv.addEventListener('click', function(e) {
    
    // --- Xử lý Nút "Sử dụng" ---
    if (e.target && e.target.classList.contains('use-btn')) {
        const button = e.target;
        window.parent.postMessage({
            type: 'USE_AUDIO',
            url: button.dataset.url,
            fileName: button.dataset.filename
        }, 'https://www.minimax.io');
    }

    // --- Xử lý Nút "Xóa" ---
    if (e.target && e.target.classList.contains('delete-btn')) {
        const button = e.target;
        const fileId = button.dataset.fileId;
        const fileName = button.dataset.fileName;

        // 1. Hỏi mật khẩu
        const password = prompt(`Bạn có chắc muốn xóa file "${fileName}"?\n\nNếu chắc, hãy nhập mật khẩu:`);
        
        if (password === null) {
            return; // Người dùng nhấn Hủy
        }

        if (password === DELETE_PASSWORD) {
            // 2. Mật khẩu đúng -> Xóa file
            statusText.textContent = `Đang xóa file ${fileName}...`;
            button.textContent = '...';
            button.disabled = true;

            storage.deleteFile(APPWRITE_BUCKET_ID, fileId).then(function (response) {
                statusText.textContent = `Đã xóa file "${fileName}" thành công!`;
                
                // Xóa khỏi mảng data chính
                allAudioFiles = allAudioFiles.filter(file => file.$id !== fileId);
                // Render lại danh sách
                applyFiltersAndRender();
                
            }, function (error) {
                statusText.textContent = `Lỗi khi xóa file: ${error.message}`;
                button.textContent = '🗑️ Xóa';
                button.disabled = false;
            });

        } else {
            // 3. Mật khẩu sai
            alert('Mật khẩu không đúng. Xóa file thất bại.');
        }
    }
});


// 9. HÀM TẢI FILE BAN ĐẦU
function loadFiles() {
    fileListDiv.innerHTML = '<div class="loading">Đang tải danh sách...</div>';

    storage.listFiles(APPWRITE_BUCKET_ID).then(function (response) {
        // Sắp xếp mặc định: Mới nhất lên đầu
        allAudioFiles = response.files.sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));
        // Render ra lần đầu
        applyFiltersAndRender();

    }, function (error) {
        fileListDiv.innerHTML = '<div class="empty-state" style="color: #f55;">Lỗi khi tải danh sách file.</div>';
        console.log(error);
    });
}

// 10. Tải danh sách file ngay khi mở trang
loadFiles();

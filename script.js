// DÁN 2 "CHÌA KHOÁ" CỦA BẠN VÀO ĐÂY
const APPWRITE_PROJECT_ID = '6904f537002b8df7dd89';
const APPWRITE_BUCKET_ID = '6904f5d60014d41970a2';
const DELETE_PASSWORD = '221504'; // Mật khẩu xóa file
const MAX_FILE_SIZE_MB = 20; // <-- GIỚI HẠN DUNG LƯỢNG MỚI (20MB)

// ----- KHÔNG SỬA PHẦN BÊN DƯỚI -----

// 1. Kết nối với Appwrite
const { Client, Storage, ID } = Appwrite;
const client = new Client();
client
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(APPWRITE_PROJECT_ID);
const storage = new Storage(client);

// 2. Lấy các phần tử HTML
const uploadInput = document.getElementById('upload-input');
const chooseFileBtn = document.getElementById('choose-file-btn');
const uploadButton = document.getElementById('upload-button');
const statusText = document.getElementById('status');
const fileListDiv = document.getElementById('file-list');
const fileNameDisplay = document.getElementById('file-name-display');
const uploadMetadataDiv = document.getElementById('upload-metadata');
const uploadGender = document.getElementById('upload-gender');
const uploadCountry = document.getElementById('upload-country');
const searchInput = document.getElementById('search-input');
const genderFilter = document.getElementById('filter-gender');
const countryFilter = document.getElementById('filter-country');
const sortFilter = document.getElementById('filter-sort');

// 3. Biến toàn cục
let allAudioFiles = [];
let isFileSizeValid = false; // <-- Biến mới để theo dõi dung lượng file

// 4. HÀM MỚI: Kiểm tra xem đã sẵn sàng tải lên chưa
function checkUploadReadiness() {
    const fileSelected = uploadInput.files.length > 0;
    const genderSelected = uploadGender.value !== '';
    const countrySelected = uploadCountry.value !== '';

    // Chỉ bật nút "Tải lên" khi CẢ 4 điều kiện đều đúng
    if (fileSelected && genderSelected && countrySelected && isFileSizeValid) {
        uploadButton.disabled = false;
    } else {
        uploadButton.disabled = true;
    }
}

// 5. Xử lý Tải lên (ĐÃ NÂNG CẤP VỚI KIỂM TRA DUNG LƯỢNG)
chooseFileBtn.addEventListener('click', () => uploadInput.click());

// Khi chọn file
uploadInput.addEventListener('change', () => {
    if (uploadInput.files.length > 0) {
        const file = uploadInput.files[0];
        const fileSizeMB = file.size / 1024 / 1024; // Tính dung lượng MB

        // === KIỂM TRA DUNG LƯỢNG (MỚI) ===
        if (fileSizeMB > MAX_FILE_SIZE_MB) {
            // Lỗi: File quá lớn
            statusText.textContent = `Lỗi: File quá lớn (${fileSizeMB.toFixed(1)}MB). Tối đa ${MAX_FILE_SIZE_MB}MB.`;
            fileNameDisplay.textContent = `Lỗi: ${file.name}`;
            uploadMetadataDiv.style.display = 'none'; // Ẩn metadata
            isFileSizeValid = false; // Đánh dấu file KHÔNG hợp lệ
        } else {
            // Hợp lệ: File OK
            statusText.textContent = 'Trạng thái: Sẵn sàng (chọn giới tính và quốc gia).';
            fileNameDisplay.textContent = file.name;
            uploadMetadataDiv.style.display = 'grid'; // Hiển thị metadata
            isFileSizeValid = true; // Đánh dấu file HỢP LỆ
        }
        // ====================================

    } else {
        // Không chọn file
        fileNameDisplay.textContent = 'Chưa chọn file nào';
        uploadMetadataDiv.style.display = 'none'; // Ẩn 2 ô chọn
        statusText.textContent = 'Trạng thái: Sẵn sàng';
        isFileSizeValid = false;
    }
    checkUploadReadiness(); // Kiểm tra lại nút "Tải lên"
});

// Khi chọn giới tính hoặc quốc gia
uploadGender.addEventListener('change', checkUploadReadiness);
uploadCountry.addEventListener('change', checkUploadReadiness);

// Khi bấm nút "Tải lên" (Code này giữ nguyên, vì đã được checkUploadReadiness bảo vệ)
uploadButton.addEventListener('click', () => {
    const originalFile = uploadInput.files[0];
    if (!originalFile || !isFileSizeValid) { // Kiểm tra lại
        statusText.textContent = 'Lỗi: File không hợp lệ hoặc quá lớn.';
        return;
    }

    const genderTag = uploadGender.value;
    const countryTag = `[${uploadCountry.value}]`;
    const newFileName = `${genderTag} ${countryTag} ${originalFile.name}`;
    const fileToUpload = new File([originalFile], newFileName, { type: originalFile.type });

    statusText.textContent = `Đang tải lên file: ${newFileName}...`;
    uploadButton.disabled = true;
    chooseFileBtn.disabled = true;

    storage.createFile(APPWRITE_BUCKET_ID, ID.unique(), fileToUpload)
        .then(function (response) {
            statusText.textContent = 'Tải lên thành công!';
            uploadInput.value = '';
            fileNameDisplay.textContent = 'Chưa chọn file nào';
            uploadMetadataDiv.style.display = 'none';
            uploadGender.value = '';
            uploadCountry.value = '';
            isFileSizeValid = false; // Reset trạng thái
            
            allAudioFiles.unshift(response);
            applyFiltersAndRender();
            
            chooseFileBtn.disabled = false;
        }, function (error) {
            statusText.textContent = `Lỗi: ${error.message}`;
            uploadButton.disabled = true; // Giữ nút tắt
            chooseFileBtn.disabled = false;
        });
});

// 6. HÀM LỌC VÀ SẮP XẾP (Giữ nguyên)
function applyFiltersAndRender() {
    const searchTerm = searchInput.value.toLowerCase();
    const gender = genderFilter.value;
    const countryValue = countryFilter.value;
    const sort = sortFilter.value;

    let filteredList = [...allAudioFiles];

    if (searchTerm) {
        filteredList = filteredList.filter(file => 
            file.name.toLowerCase().includes(searchTerm)
        );
    }
    if (gender !== 'all') {
        filteredList = filteredList.filter(file => 
            file.name.toLowerCase().includes(gender.toLowerCase())
        );
    }
    if (countryValue !== 'all') {
        const countryTag = `[${countryValue.toUpperCase()}]`;
        filteredList = filteredList.filter(file => 
            file.name.toUpperCase().includes(countryTag)
        );
    }

    if (sort === 'name-asc') {
        filteredList.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'name-desc') {
        filteredList.sort((a, b) => b.name.localeCompare(a.name));
    } else {
        filteredList.sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));
    }

    renderCards(filteredList);
}

// 7. HÀM "VẼ" GIAO DIỆN (Giữ nguyên)
function renderCards(filesToRender) {
    fileListDiv.innerHTML = ''; 

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
        card.id = `file-card-${file.$id}`;

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

// 8. LẮNG NGHE SỰ KIỆN CHO CÁC BỘ LỌC (Giữ nguyên)
searchInput.addEventListener('input', applyFiltersAndRender);
genderFilter.addEventListener('change', applyFiltersAndRender);
countryFilter.addEventListener('change', applyFiltersAndRender);
sortFilter.addEventListener('change', applyFiltersAndRender);

// 9. LẮNG NGHE SỰ KIỆN CHO NÚT "SỬ DỤNG" VÀ "XÓA" (Giữ nguyên)
fileListDiv.addEventListener('click', function(e) {
    const button = e.target.closest('button');
    if (!button) return;

    if (button.classList.contains('use-btn')) {
        window.parent.postMessage({
            type: 'USE_AUDIO',
            url: button.dataset.url,
            fileName: button.dataset.filename
        }, 'https://www.minimax.io');
    }

    if (button.classList.contains('delete-btn')) {
        const fileId = button.dataset.fileId;
        const fileName = button.dataset.fileName;

        const password = prompt(`Bạn có chắc muốn xóa file "${fileName}"?\n\nNếu chắc, hãy nhập mật khẩu:`);
        
        if (password === null) return; // Hủy

        if (password === DELETE_PASSWORD) {
            statusText.textContent = `Đang xóa file ${fileName}...`;
            button.textContent = '...';
            button.disabled = true;

            storage.deleteFile(APPWRITE_BUCKET_ID, fileId).then(function (response) {
                statusText.textContent = `Đã xóa file "${fileName}" thành công!`;
                allAudioFiles = allAudioFiles.filter(file => file.$id !== fileId);
                applyFiltersAndRender();
            }, function (error) {
                statusText.textContent = `Lỗi khi xóa file: ${error.message}`;
                button.textContent = '🗑️ Xóa';
                button.disabled = false;
            });

        } else {
            alert('Mật khẩu không đúng. Xóa file thất bại.');
        }
    }
});

// 10. HÀM TẢI FILE BAN ĐẦU (Giữ nguyên)
function loadFiles() {
    fileListDiv.innerHTML = '<div class="loading">Đang tải danh sách...</div>';

    storage.listFiles(APPWRITE_BUCKET_ID).then(function (response) {
        allAudioFiles = response.files.sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));
        applyFiltersAndRender();
    }, function (error) {
        fileListDiv.innerHTML = '<div class="empty-state" style="color: #f55;">Lỗi khi tải danh sách file.</div>';
        console.log(error);
    });
}

// 11. Tải danh sách file ngay khi mở trang
loadFiles();

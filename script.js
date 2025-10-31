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

// 2. Lấy các phần tử HTML (Đã thêm các ô metadata)
const uploadInput = document.getElementById('upload-input');
const chooseFileBtn = document.getElementById('choose-file-btn');
const uploadButton = document.getElementById('upload-button');
const statusText = document.getElementById('status');
const fileListDiv = document.getElementById('file-list');
const fileNameDisplay = document.getElementById('file-name-display');

// Các ô chọn metadata MỚI
const uploadMetadataDiv = document.getElementById('upload-metadata');
const uploadGender = document.getElementById('upload-gender');
const uploadCountry = document.getElementById('upload-country');

// Bộ lọc
const searchInput = document.getElementById('search-input');
const genderFilter = document.getElementById('filter-gender');
const countryFilter = document.getElementById('filter-country');
const sortFilter = document.getElementById('filter-sort');

// 3. Biến toàn cục để lưu trữ danh sách file
let allAudioFiles = [];

// 4. HÀM MỚI: Kiểm tra xem đã sẵn sàng tải lên chưa
function checkUploadReadiness() {
    const fileSelected = uploadInput.files.length > 0;
    const genderSelected = uploadGender.value !== '';
    const countrySelected = uploadCountry.value !== '';

    // Chỉ bật nút "Tải lên" khi cả 3 điều kiện đều đúng
    if (fileSelected && genderSelected && countrySelected) {
        uploadButton.disabled = false;
    } else {
        uploadButton.disabled = true;
    }
}

// 5. Xử lý Tải lên (ĐÃ NÂNG CẤP)
chooseFileBtn.addEventListener('click', () => uploadInput.click());

// Khi chọn file
uploadInput.addEventListener('change', () => {
    if (uploadInput.files.length > 0) {
        fileNameDisplay.textContent = uploadInput.files[0].name;
        uploadMetadataDiv.style.display = 'grid'; // Hiển thị 2 ô chọn metadata
    } else {
        fileNameDisplay.textContent = 'Chưa chọn file nào';
        uploadMetadataDiv.style.display = 'none'; // Ẩn 2 ô chọn
    }
    checkUploadReadiness(); // Kiểm tra nút "Tải lên"
});

// Khi chọn giới tính hoặc quốc gia
uploadGender.addEventListener('change', checkUploadReadiness);
uploadCountry.addEventListener('change', checkUploadReadiness);

// Khi bấm nút "Tải lên"
uploadButton.addEventListener('click', () => {
    const originalFile = uploadInput.files[0];
    if (!originalFile) {
        statusText.textContent = 'Lỗi: Bạn chưa chọn file!';
        return;
    }

    // Lấy tag từ các ô chọn
    const genderTag = uploadGender.value; // (VD: "[Nam]")
    const countryTag = `[${uploadCountry.value}]`; // (VD: "[VN]")
    
    // Tạo tên file MỚI
    const newFileName = `${genderTag} ${countryTag} ${originalFile.name}`;
    
    // Tạo một File object MỚI với tên mới
    // Đây là bước quan trọng nhất
    const fileToUpload = new File([originalFile], newFileName, { type: originalFile.type });

    statusText.textContent = `Đang tải lên file: ${newFileName}...`;
    uploadButton.disabled = true;
    chooseFileBtn.disabled = true;

    storage.createFile(APPWRITE_BUCKET_ID, ID.unique(), fileToUpload) // Tải file ĐÃ ĐỔI TÊN
        .then(function (response) {
            statusText.textContent = 'Tải lên thành công!';
            uploadInput.value = ''; // Reset
            fileNameDisplay.textContent = 'Chưa chọn file nào';
            uploadMetadataDiv.style.display = 'none'; // Ẩn ô metadata
            uploadGender.value = '';
            uploadCountry.value = '';
            
            allAudioFiles.unshift(response); // Thêm file mới vào đầu
            applyFiltersAndRender(); // Render lại danh sách
            
            chooseFileBtn.disabled = false;
        }, function (error) {
            statusText.textContent = `Lỗi: ${error.message}`;
            uploadButton.disabled = false; // Bật lại nút (vẫn bị tắt do checkUploadReadiness)
            chooseFileBtn.disabled = false;
        });
});

// 6. HÀM LỌC VÀ SẮP XẾP (ĐÃ SỬA)
function applyFiltersAndRender() {
    const searchTerm = searchInput.value.toLowerCase();
    const gender = genderFilter.value; // (VD: "[Nam]")
    const countryValue = countryFilter.value; // (VD: "VN")
    const sort = sortFilter.value;

    let filteredList = [...allAudioFiles];

    // Lọc theo Tìm kiếm
    if (searchTerm) {
        filteredList = filteredList.filter(file => 
            file.name.toLowerCase().includes(searchTerm)
        );
    }

    // Lọc theo Giới tính (dựa trên tag [Nam] [Nữ])
    if (gender !== 'all') {
        filteredList = filteredList.filter(file => 
            file.name.toLowerCase().includes(gender.toLowerCase())
        );
    }

    // Lọc theo Quốc gia (dựa trên tag [VN] [US]...)
    if (countryValue !== 'all') {
        const countryTag = `[${countryValue.toUpperCase()}]`; // Chuyển "vn" -> "[VN]"
        filteredList = filteredList.filter(file => 
            file.name.toUpperCase().includes(countryTag)
        );
    }

    // Sắp xếp
    if (sort === 'name-asc') {
        filteredList.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'name-desc') {
        filteredList.sort((a, b) => b.name.localeCompare(a.name));
    } else {
        // Mặc định là 'newest' (đã được sắp xếp khi tải)
        filteredList.sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));
    }

    renderCards(filteredList);
}

// 7. HÀM "VẼ" GIAO DIỆN (Đã thêm Nút Xóa)
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

// 8. LẮNG NGHE SỰ KIỆN CHO CÁC BỘ LỌC
searchInput.addEventListener('input', applyFiltersAndRender);
genderFilter.addEventListener('change', applyFiltersAndRender);
countryFilter.addEventListener('change', applyFiltersAndRender);
sortFilter.addEventListener('change', applyFiltersAndRender);

// 9. LẮNG NGHE SỰ KIỆN CHO NÚT "SỬ DỤNG" VÀ "XÓA"
fileListDiv.addEventListener('click', function(e) {
    const button = e.target.closest('button'); // Tìm nút được click
    if (!button) return;

    // --- Xử lý Nút "Sử dụng" ---
    if (button.classList.contains('use-btn')) {
        window.parent.postMessage({
            type: 'USE_AUDIO',
            url: button.dataset.url,
            fileName: button.dataset.filename
        }, 'https://www.minimax.io');
    }

    // --- Xử lý Nút "Xóa" ---
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


// 10. HÀM TẢI FILE BAN ĐẦU
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

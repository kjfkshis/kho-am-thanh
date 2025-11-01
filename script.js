// DÁN 2 "CHÌA KHOÁ" CỦA BẠN VÀO ĐÂY
const APPWRITE_PROJECT_ID = '6904f537002b8df7dd89';
const APPWRITE_BUCKET_ID = '6904f5d60014d41970a2';
const DELETE_PASSWORD = '221504'; // Mật khẩu xóa file
const MAX_FILE_SIZE_MB = 20; // Giới hạn dung lượng

// ----- KHÔNG SỬA PHẦN BÊN DƯỚI -----

// 1. Kết nối với Appwrite ( === SỬA LỖI: Thêm 'Permission' và 'Role' === )
const { Client, Storage, ID, Permission, Role, Query } = Appwrite;
const client = new Client();
client
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(APPWRITE_PROJECT_ID);
const storage = new Storage(client);

// 2. Lấy các phần tử HTML (Giữ nguyên)
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

// 3. Biến toàn cục (Giữ nguyên)
let allAudioFiles = [];
let isFileSizeValid = false; 

// 4. HÀM: Kiểm tra sẵn sàng tải lên (Giữ nguyên)
function checkUploadReadiness() {
    const fileSelected = uploadInput.files.length > 0;
    const genderSelected = uploadGender.value !== '';
    const countrySelected = uploadCountry.value !== '';

    if (fileSelected && genderSelected && countrySelected && isFileSizeValid) {
        uploadButton.disabled = false;
    } else {
        uploadButton.disabled = true;
    }
}

// 5. Xử lý Tải lên (Giữ nguyên phần kiểm tra dung lượng)
chooseFileBtn.addEventListener('click', () => uploadInput.click());

uploadInput.addEventListener('change', () => {
    if (uploadInput.files.length > 0) {
        const file = uploadInput.files[0];
        const fileSizeMB = file.size / 1024 / 1024;

        if (fileSizeMB > MAX_FILE_SIZE_MB) {
            statusText.textContent = `Lỗi: File quá lớn (${fileSizeMB.toFixed(1)}MB). Tối đa ${MAX_FILE_SIZE_MB}MB.`;
            fileNameDisplay.textContent = `Lỗi: ${file.name}`;
            uploadMetadataDiv.style.display = 'none';
            isFileSizeValid = false;
        } else {
            statusText.textContent = 'Trạng thái: Sẵn sàng (chọn giới tính và quốc gia).';
            fileNameDisplay.textContent = file.name;
            uploadMetadataDiv.style.display = 'grid';
            isFileSizeValid = true;
        }
    } else {
        fileNameDisplay.textContent = 'Chưa chọn file nào';
        uploadMetadataDiv.style.display = 'none';
        statusText.textContent = 'Trạng thái: Sẵn sàng';
        isFileSizeValid = false;
    }
    checkUploadReadiness();
});

uploadGender.addEventListener('change', checkUploadReadiness);
uploadCountry.addEventListener('change', checkUploadReadiness);

// === 6. XỬ LÝ NÚT TẢI LÊN (ĐÃ THÊM QUYỀN VĨNH VIỄN) ===
uploadButton.addEventListener('click', () => {
    const originalFile = uploadInput.files[0];
    if (!originalFile || !isFileSizeValid) {
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

    // === SỬA LỖI QUAN TRỌNG NHẤT: Thêm quyền khi tạo file ===
    const filePermissions = [
        Permission.read(Role.any()),    // "any()" = "All users" (Bất kỳ ai)
        Permission.update(Role.any()),  // Cho phép "All users" cập nhật (quan trọng cho Xóa)
        Permission.delete(Role.any())   // Cho phép "All users" xóa
    ];
    // ===================================================

    storage.createFile(
        APPWRITE_BUCKET_ID,
        ID.unique(),
        fileToUpload,
        filePermissions // <-- Thêm mảng quyền vào đây
    ).then(function (response) {
        statusText.textContent = 'Tải lên thành công!';
        uploadInput.value = '';
        fileNameDisplay.textContent = 'Chưa chọn file nào';
        uploadMetadataDiv.style.display = 'none';
        uploadGender.value = '';
        uploadCountry.value = '';
        isFileSizeValid = false;
        
        allAudioFiles.unshift(response);
        applyFiltersAndRender();
        
        chooseFileBtn.disabled = false;
    }, function (error) {
        statusText.textContent = `Lỗi: ${error.message} (File có thể chưa được cấp quyền)`;
        uploadButton.disabled = true;
        chooseFileBtn.disabled = false;
    });
});
// === KẾT THÚC SỬA LỖI ===


// 7. HÀM LỌC VÀ SẮP XẾP (Giữ nguyên)
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

// 8. HÀM "VẼ" GIAO DIỆN (Giữ nguyên)
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

        const audioElement = document.createElement('audio');
        audioElement.controls = true;
        audioElement.preload = 'none';
        audioElement.src = url;
        
        // Thêm xử lý lỗi cho audio element
        audioElement.addEventListener('error', function(e) {
            console.error('❌ Lỗi khi tải audio:', file.name, url, e);
        });
        
        audioElement.addEventListener('loadeddata', function() {
            console.log('✅ Audio đã tải:', file.name);
        });

        card.innerHTML = `
            <div class="file-card-header">
                <span class="file-icon">🎵</span>
                <span class="file-name" title="${file.name}">${file.name}</span>
            </div>
            <div class="file-card-body">
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
        
        // Thêm audio element vào card
        const cardBody = card.querySelector('.file-card-body');
        cardBody.appendChild(audioElement);
        
        fileListDiv.appendChild(card);
    });
}

// 9. LẮNG NGHE SỰ KIỆN CHO CÁC BỘ LỌC (Giữ nguyên)
searchInput.addEventListener('input', applyFiltersAndRender);
genderFilter.addEventListener('change', applyFiltersAndRender);
countryFilter.addEventListener('change', applyFiltersAndRender);
sortFilter.addEventListener('change', applyFiltersAndRender);

// 10. LẮNG NGHE SỰ KIỆN CHO NÚT "SỬ DỤNG" VÀ "XÓA" (Giữ nguyên)
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


// 11. HÀM TẢI FILE BAN ĐẦU (SỬA: Tải TẤT CẢ files bằng pagination - hỗ trợ hàng nghìn file)
function loadFiles() {
    fileListDiv.innerHTML = '<div class="loading">Đang tải danh sách...</div>';

    // Bước 1: Tải page đầu tiên để biết tổng số files
    const LIMIT_PER_PAGE = 100; // Tải 100 files mỗi lần
    
    storage.listFiles(APPWRITE_BUCKET_ID, [Query.limit(LIMIT_PER_PAGE)]).then(function (firstResponse) {
        const totalFiles = firstResponse.total;
        console.log('📊 Tổng số files:', totalFiles);
        
        // Nếu chỉ có ít hơn hoặc bằng LIMIT_PER_PAGE files thì xong
        if (totalFiles <= LIMIT_PER_PAGE) {
            console.log('✅ Tải tất cả files thành công:', firstResponse.files.length, 'files');
            allAudioFiles = firstResponse.files.sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));
            applyFiltersAndRender();
            return;
        }
        
        // Nếu có nhiều hơn, tải tất cả các page còn lại
        console.log('📥 Đang tải thêm các files còn lại...');
        let allFiles = [...firstResponse.files];
        
        // Cập nhật loading message
        fileListDiv.innerHTML = `<div class="loading">Đang tải ${allFiles.length}/${totalFiles} files...</div>`;
        
        // Tạo mảng promises để tải tất cả các page còn lại
        const promises = [];
        for (let offset = LIMIT_PER_PAGE; offset < totalFiles; offset += LIMIT_PER_PAGE) {
            promises.push(
                storage.listFiles(APPWRITE_BUCKET_ID, [
                    Query.limit(LIMIT_PER_PAGE),
                    Query.offset(offset)
                ])
            );
        }
        
        // Tải tất cả các page song song (nhanh hơn)
        Promise.all(promises).then(function (responses) {
            responses.forEach(function (response) {
                if (response.files && response.files.length > 0) {
                    allFiles = allFiles.concat(response.files);
                }
            });
            
            console.log('✅ Tải tất cả files thành công:', allFiles.length, 'files trên tổng số', totalFiles);
            
            if (allFiles.length < totalFiles) {
                console.warn('⚠️ Cảnh báo: Chỉ tải được', allFiles.length, 'files trên tổng số', totalFiles, 'files');
            }
            
            allAudioFiles = allFiles.sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));
            applyFiltersAndRender();
        }, function (error) {
            console.error('❌ Lỗi khi tải các page tiếp theo:', error);
            // Vẫn hiển thị những file đã tải được
            console.log('⚠️ Chỉ hiển thị', allFiles.length, 'files đầu tiên');
            allAudioFiles = allFiles.sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));
            applyFiltersAndRender();
        });
        
    }, function (error) {
        console.error('❌ Lỗi khi tải danh sách file:', error);
        let errorMessage = 'Lỗi khi tải danh sách file.';
        if (error.message) {
            errorMessage += '<br>Chi tiết: ' + error.message;
        }
        if (error.type === 'general_cors') {
            errorMessage += '<br><br>⚠️ Lỗi CORS: Cần thêm domain GitHub Pages vào CORS settings trong Appwrite Console.';
        }
        fileListDiv.innerHTML = '<div class="empty-state" style="color: #f55;">' + errorMessage + '</div>';
    });
}

// 12. Tải danh sách file ngay khi mở trang
loadFiles();

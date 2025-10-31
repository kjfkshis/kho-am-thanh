// DÁN 2 "CHÌA KHOÁ" CỦA BẠN VÀO ĐÂY
const APPWRITE_PROJECT_ID = '6904f537002b8df7dd89';
const APPWRITE_BUCKET_ID = '6904f5d60014d41970a2';

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
const searchInput = document.getElementById('search-input'); // <-- Thêm thanh tìm kiếm

// 3. Biến toàn cục để lưu trữ danh sách file (giúp tìm kiếm nhanh)
let allAudioFiles = [];

// 4. Xử lý sự kiện nhấn nút "Chọn Tệp"
chooseFileBtn.addEventListener('click', () => {
    uploadInput.click(); // Kích hoạt input file ẩn
});

// 5. Hiển thị tên file khi đã chọn
uploadInput.addEventListener('change', () => {
    if (uploadInput.files.length > 0) {
        fileNameDisplay.textContent = uploadInput.files[0].name;
        uploadButton.disabled = false; // Bật nút tải lên
    } else {
        fileNameDisplay.textContent = 'Chưa chọn file nào';
        uploadButton.disabled = true; // Tắt nút tải lên
    }
});

// 6. Xử lý sự kiện nhấn nút "Tải lên"
uploadButton.addEventListener('click', () => {
    const file = uploadInput.files[0];
    if (!file) {
        statusText.textContent = 'Lỗi: Bạn chưa chọn file!';
        return;
    }

    statusText.textContent = 'Đang tải lên...';
    uploadButton.disabled = true;
    chooseFileBtn.disabled = true;

    const promise = storage.createFile(
        APPWRITE_BUCKET_ID,
        ID.unique(),
        file
    );

    promise.then(function (response) {
        statusText.textContent = 'Tải lên thành công!';
        uploadInput.value = '';
        fileNameDisplay.textContent = 'Chưa chọn file nào';
        
        // NÂNG CẤP: Thêm file mới vào danh sách và render lại
        allAudioFiles.unshift(response); // Thêm file mới vào đầu danh sách
        renderFiles(allAudioFiles); // Vẽ lại danh sách
        
        chooseFileBtn.disabled = false;
        // Nút upload vẫn tắt, đợi chọn file mới
    }, function (error) {
        statusText.textContent = `Lỗi: ${error.message}`;
        uploadButton.disabled = false;
        chooseFileBtn.disabled = false;
    });
});

// 7. HÀM MỚI: "Vẽ" danh sách file ra giao diện
// (Tách ra từ hàm loadFiles để dùng cho cả tìm kiếm)
function renderFiles(filesToRender) {
    fileListDiv.innerHTML = ''; // Xóa nội dung cũ

    if (filesToRender.length === 0) {
        // Kiểm tra xem có đang tìm kiếm không
        if (searchInput.value.length > 0) {
            fileListDiv.innerHTML = '<div class="empty-state">Không tìm thấy file nào khớp.</div>';
        } else {
            fileListDiv.innerHTML = '<div class="empty-state">Chưa có file nào.</div>';
        }
        return;
    }

    // Tạo các card
    filesToRender.forEach(file => {
        const url = `https://cloud.appwrite.io/v1/storage/buckets/${APPWRITE_BUCKET_ID}/files/${file.$id}/view?project=${APPWRITE_PROJECT_ID}`;
        
        const card = document.createElement('div');
        card.className = 'file-card';

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
                    Sử dụng file này
                </button>
            </div>
        `;

        fileListDiv.appendChild(card);

        // Gắn sự kiện cho nút "Sử dụng"
        const useButton = card.querySelector('.use-btn');
        useButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.parent.postMessage({
                type: 'USE_AUDIO',
                url: url,
                fileName: file.name
            }, 'https://www.minimax.io'); 
        });
    });
}

// 8. HÀM MỚI: Lắng nghe sự kiện tìm kiếm
searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    
    // Lọc từ danh sách file toàn cục (allAudioFiles)
    const filteredFiles = allAudioFiles.filter(file => 
        file.name.toLowerCase().includes(searchTerm)
    );
    
    // "Vẽ" lại danh sách đã lọc
    renderFiles(filteredFiles);
});

// 9. HÀM CŨ (ĐÃ SỬA): Tải danh sách file từ Appwrite
function loadFiles() {
    fileListDiv.innerHTML = '<div class="loading">Đang tải danh sách...</div>';

    const promise = storage.listFiles(APPWRITE_BUCKET_ID); // Lấy danh sách file

    promise.then(function (response) {
        // Sắp xếp file theo ngày tạo, mới nhất lên đầu
        const sortedFiles = response.files.sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));
        
        // LƯU VÀO BIẾN TOÀN CỤC
        allAudioFiles = sortedFiles;
        
        // Render ra lần đầu
        renderFiles(allAudioFiles);

    }, function (error) {
        fileListDiv.innerHTML = '<div class="empty-state" style="color: #f55;">Lỗi khi tải danh sách file.</div>';
        console.log(error);
    });
}

// 10. Tải danh sách file ngay khi mở trang
loadFiles();

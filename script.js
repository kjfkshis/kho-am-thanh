// DÁN 2 "CHÌA KHOÁ" CỦA BẠN VÀO ĐÂY
const APPWRITE_PROJECT_ID = '6904f537002b8df7dd89';
const APPWRITE_BUCKET_ID = '6904f5d60014d41970a2';

// ----- KHÔNG SỬA PHẦN BÊN DƯỚI -----

// 1. Kết nối với Appwrite
const { Client, Storage, ID } = Appwrite;
const client = new Client();
client
    .setEndpoint('https://cloud.appwrite.io/v1') // Máy chủ Appwrite
    .setProject(APPWRITE_PROJECT_ID);          // Mã dự án của bạn

const storage = new Storage(client);

// 2. Lấy các phần tử HTML (Đã thêm các nút mới)
const uploadInput = document.getElementById('upload-input');
const chooseFileBtn = document.getElementById('choose-file-btn');
const uploadButton = document.getElementById('upload-button');
const statusText = document.getElementById('status');
const fileListDiv = document.getElementById('file-list');
const fileNameDisplay = document.getElementById('file-name-display');

// 3. Xử lý sự kiện nhấn nút "Chọn Tệp" MỚI
chooseFileBtn.addEventListener('click', () => {
    uploadInput.click(); // Kích hoạt input file ẩn
});

// 4. Hiển thị tên file khi đã chọn và bật nút "Tải lên"
uploadInput.addEventListener('change', () => {
    if (uploadInput.files.length > 0) {
        fileNameDisplay.textContent = uploadInput.files[0].name;
        uploadButton.disabled = false; // Bật nút tải lên
    } else {
        fileNameDisplay.textContent = 'Chưa chọn file nào';
        uploadButton.disabled = true; // Tắt nút tải lên
    }
});

// 5. Xử lý sự kiện nhấn nút "Tải lên"
uploadButton.addEventListener('click', () => {
    const file = uploadInput.files[0];
    if (!file) {
        statusText.textContent = 'Lỗi: Bạn chưa chọn file!';
        return;
    }

    statusText.textContent = 'Đang tải lên...';
    uploadButton.disabled = true; // Vô hiệu hóa nút khi đang tải
    chooseFileBtn.disabled = true;

    // Tải file lên Appwrite Storage
    const promise = storage.createFile(
        APPWRITE_BUCKET_ID, // Mã nhà kho
        ID.unique(),        // Tạo một ID ngẫu nhiên cho file
        file                // File để tải lên
    );

    promise.then(function (response) {
        statusText.textContent = 'Tải lên thành công!';
        uploadInput.value = ''; // Xóa file đã chọn
        fileNameDisplay.textContent = 'Chưa chọn file nào';
        loadFiles(); // Tải lại danh sách file
        chooseFileBtn.disabled = false; // Bật lại nút
        // Nút "Tải lên" vẫn disabled cho đến khi chọn file mới
    }, function (error) {
        statusText.textContent = `Lỗi: ${error.message}`;
        uploadButton.disabled = false; // Bật lại nút
        chooseFileBtn.disabled = false;
    });
});

// 6. Hàm tải và hiển thị danh sách file (ĐÃ VIẾT LẠI CHO GIAO DIỆN CARD)
function loadFiles() {
    fileListDiv.innerHTML = '<div class="loading">Đang tải danh sách...</div>';

    const promise = storage.listFiles(APPWRITE_BUCKET_ID); // Lấy danh sách file

    promise.then(function (response) {
        fileListDiv.innerHTML = ''; // Xóa nội dung cũ
        if (response.files.length === 0) {
            fileListDiv.innerHTML = '<div class="empty-state">Chưa có file nào.</div>';
            return;
        }

        // Sắp xếp file theo ngày tạo, mới nhất lên đầu
        const sortedFiles = response.files.sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));

        sortedFiles.forEach(file => {
            // Lấy URL công khai để nghe/tải
            const url = `https://cloud.appwrite.io/v1/storage/buckets/${APPWRITE_BUCKET_ID}/files/${file.$id}/view?project=${APPWRITE_PROJECT_ID}`;

            // Tạo thẻ .file-card
            const card = document.createElement('div');
            card.className = 'file-card';

            // Tạo nội dung HTML cho card
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

            // Gắn card vào lưới
            fileListDiv.appendChild(card);

            // QUAN TRỌNG: Thêm listener cho nút "Sử dụng" sau khi đã tạo card
            const useButton = card.querySelector('.use-btn');
            useButton.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Gửi tin nhắn cho cửa sổ cha (tool)
                window.parent.postMessage({
                    type: 'USE_AUDIO',        // Tín hiệu nhận biết
                    url: url,                 // Đường link file
                    fileName: file.name       // Tên file
                }, 'https://www.minimax.io'); 
            });
        });

    }, function (error) {
        fileListDiv.innerHTML = '<div class="empty-state" style="color: #f55;">Lỗi khi tải danh sách file.</div>';
        console.log(error);
    });
}

// 7. Tải danh sách file ngay khi mở trang
loadFiles();

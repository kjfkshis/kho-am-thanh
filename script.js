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
const searchInput = document.getElementById('search-input');
const suggestionsBox = document.getElementById('search-suggestions'); // <-- Hộp gợi ý MỚI

// 3. Biến toàn cục để lưu trữ danh sách file
let allAudioFiles = [];

// 4. Xử lý sự kiện nhấn nút "Chọn Tệp"
chooseFileBtn.addEventListener('click', () => {
    uploadInput.click();
});

// 5. Hiển thị tên file khi đã chọn
uploadInput.addEventListener('change', () => {
    if (uploadInput.files.length > 0) {
        fileNameDisplay.textContent = uploadInput.files[0].name;
        uploadButton.disabled = false;
    } else {
        fileNameDisplay.textContent = 'Chưa chọn file nào';
        uploadButton.disabled = true;
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
        
        allAudioFiles.unshift(response); // Thêm file mới vào đầu danh sách
        renderFiles(allAudioFiles); // Vẽ lại toàn bộ danh sách
        
        chooseFileBtn.disabled = false;
    }, function (error) {
        statusText.textContent = `Lỗi: ${error.message}`;
        uploadButton.disabled = false;
        chooseFileBtn.disabled = false;
    });
});

// 7. HÀM "Vẽ" danh sách file (ĐÃ NÂNG CẤP VỚI ID)
function renderFiles(filesToRender) {
    fileListDiv.innerHTML = ''; 

    if (filesToRender.length === 0) {
        fileListDiv.innerHTML = '<div class="empty-state">Chưa có file nào.</div>';
        return;
    }

    filesToRender.forEach(file => {
        const url = `https://cloud.appwrite.io/v1/storage/buckets/${APPWRITE_BUCKET_ID}/files/${file.$id}/view?project=${APPWRITE_PROJECT_ID}`;
        
        const card = document.createElement('div');
        card.className = 'file-card';
        // === NÂNG CẤP QUAN TRỌNG: Thêm ID duy nhất cho mỗi card ===
        card.id = `file-card-${file.$id}`;
        // ======================================================

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

// 8. HÀM MỚI: "Nhảy" (Scroll) đến card và làm nổi bật
function jumpToCard(fileId) {
    const targetCard = document.getElementById(`file-card-${fileId}`);
    if (targetCard) {
        // Cuộn đến card
        targetCard.scrollIntoView({
            behavior: 'smooth', // Cuộn mượt
            block: 'center'    // Căn card vào giữa màn hình
        });

        // Làm nổi bật card
        targetCard.classList.add('highlight');

        // Xóa nổi bật sau 2 giây
        setTimeout(() => {
            targetCard.classList.remove('highlight');
        }, 2000);
    }
}

// 9. HÀM MỚI: Lắng nghe sự kiện tìm kiếm (ĐÃ THAY ĐỔI HOÀN TOÀN)
searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    suggestionsBox.innerHTML = ''; // Xóa gợi ý cũ

    // Nếu không gõ gì, ẩn hộp gợi ý
    if (searchTerm.length === 0) {
        suggestionsBox.style.display = 'none';
        return;
    }

    // Lọc 10 gợi ý hàng đầu
    const filteredFiles = allAudioFiles.filter(file => 
        file.name.toLowerCase().includes(searchTerm)
    ).slice(0, 10); // Giới hạn 10 gợi ý

    if (filteredFiles.length > 0) {
        filteredFiles.forEach(file => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            
            // Làm nổi bật chữ cái khớp
            const regex = new RegExp(`(${searchTerm})`, 'gi');
            item.innerHTML = file.name.replace(regex, '<strong>$1</strong>');
            
            // Gắn sự kiện click để "nhảy"
            item.addEventListener('click', () => {
                jumpToCard(file.$id); // Gọi hàm "nhảy"
                searchInput.value = ''; // Xóa thanh tìm kiếm
                suggestionsBox.style.display = 'none'; // Ẩn hộp gợi ý
            });
            
            suggestionsBox.appendChild(item);
        });
        suggestionsBox.style.display = 'block'; // Hiển thị hộp gợi ý
    } else {
        suggestionsBox.style.display = 'none'; // Ẩn nếu không có gợi ý
    }
});

// 10. HÀM CŨ: Tải danh sách file từ Appwrite
function loadFiles() {
    fileListDiv.innerHTML = '<div class="loading">Đang tải danh sách...</div>';

    const promise = storage.listFiles(APPWRITE_BUCKET_ID);

    promise.then(function (response) {
        const sortedFiles = response.files.sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));
        
        // LƯU VÀO BIẾN TOÀN CỤC
        allAudioFiles = sortedFiles;
        
        // Render ra lần đầu (vẽ toàn bộ)
        renderFiles(allAudioFiles);

    }, function (error) {
        fileListDiv.innerHTML = '<div class="empty-state" style="color: #f55;">Lỗi khi tải danh sách file.</div>';
        console.log(error);
    });
}

// 11. Tải danh sách file ngay khi mở trang
loadFiles();

// 12. Ẩn hộp gợi ý khi click ra ngoài
document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target)) {
        suggestionsBox.style.display = 'none';
    }
});

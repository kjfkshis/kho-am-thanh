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

// 2. Lấy các phần tử HTML
const uploadInput = document.getElementById('upload-input');
const uploadButton = document.getElementById('upload-button');
const statusText = document.getElementById('status');
const fileListDiv = document.getElementById('file-list');

// 3. Xử lý sự kiện nhấn nút Tải lên
uploadButton.addEventListener('click', () => {
    const file = uploadInput.files[0];
    if (!file) {
        statusText.textContent = 'Lỗi: Bạn chưa chọn file!';
        return;
    }

    statusText.textContent = 'Đang tải lên...';

    // Tải file lên Appwrite Storage
    const promise = storage.createFile(
        APPWRITE_BUCKET_ID, // Mã nhà kho
        ID.unique(),        // Tạo một ID ngẫu nhiên cho file
        file                // File để tải lên
    );

    promise.then(function (response) {
        statusText.textContent = 'Tải lên thành công!';
        console.log(response); // Xem kết quả
        loadFiles(); // Tải lại danh sách file
        uploadInput.value = ''; // Xóa file đã chọn
    }, function (error) {
        statusText.textContent = `Lỗi: ${error.message}`;
        console.log(error); // Báo lỗi
    });
});

// 4. Hàm tải và hiển thị danh sách file
function loadFiles() {
    fileListDiv.innerHTML = 'Đang tải danh sách...';

    const promise = storage.listFiles(APPWRITE_BUCKET_ID); // Lấy danh sách file

    promise.then(function (response) {
        fileListDiv.innerHTML = ''; // Xóa nội dung cũ
        if (response.files.length === 0) {
            fileListDiv.innerHTML = 'Chưa có file nào.';
            return;
        }

        response.files.forEach(file => {
            // Lấy URL công khai để nghe/tải
            const url = `https://cloud.appwrite.io/v1/storage/buckets/${APPWRITE_BUCKET_ID}/files/${file.$id}/view?project=${APPWRITE_PROJECT_ID}`;

            const link = document.createElement('a');
            link.href = url;
            link.textContent = file.name; // Tên file
            link.target = '_blank';

            const audioPlayer = new Audio(url);
            audioPlayer.controls = true;

            // === BẮT ĐẦU NÂNG CẤP (THÊM NÚT "SỬ DỤNG") ===
            const useButton = document.createElement('button');
            useButton.textContent = 'Sử dụng file này';
            useButton.style.cssText = "margin-left: 10px; padding: 5px 8px; cursor: pointer; background-color: #50fa7b; border: none; border-radius: 4px; font-weight: bold;";

            useButton.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Gửi tin nhắn cho cửa sổ cha (tool Tampermonkey)
                window.parent.postMessage({
                    type: 'USE_AUDIO',        // Tín hiệu nhận biết
                    url: url,                 // Đường link file
                    fileName: file.name       // Tên file
                }, 'https://www.minimax.io'); // **QUAN TRỌNG: Chỉ gửi cho trang web của tool**
            });
            // === KẾT THÚC NÂNG CẤP ===

            // Tạo một hàng để chứa các phần tử
            const itemContainer = document.createElement('div');
            itemContainer.style.marginBottom = '10px'; // Thêm khoảng cách
            itemContainer.appendChild(link);
            itemContainer.appendChild(audioPlayer);
            itemContainer.appendChild(useButton); // Thêm nút mới

            fileListDiv.appendChild(itemContainer);
        });

    }, function (error) {
        fileListDiv.innerHTML = 'Lỗi khi tải danh sách file.';
        console.log(error);
    });
}

// 5. Tải danh sách file ngay khi mở trang
loadFiles();

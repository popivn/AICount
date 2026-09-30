# AI Classroom Monitoring & Attendance System

Hệ thống AI giám sát và điểm danh phòng học thông minh kết hợp kiến trúc Tri-Model:
- **YOLOv8-Pose:** Nhận diện toàn thân, 17 điểm khung xương, tư thế ngồi học sinh/sinh viên.
- **YOLOv8-Head:** Nhận diện đầu người trong trường hợp bị bàn ghế che khuất hoặc ngồi sát nhau.
- **P2PNet:** Định vị đầu người ở các hàng ghế xa cùng của phòng học.

---

## Cấu Trúc Dự Án

```text
PaddleDetection/
├── client/                 # Frontend ReactJS (Vite + Nginx)
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── src/
│   └── run_client.bat      # Chạy dev local không cần docker
│
├── server/                 # Backend AI (Flask + PyTorch + YOLO)
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app.py              # API Flask (Port 3838)
│   ├── pipeline_fusion.py  # Tri-Model Ensemble Pipeline
│   ├── yolov8m-pose.pt     # Weight Pose
│   ├── weights/            # Weight Head Detection
│   ├── p2pnet_module/      # Module P2PNet & Weight
│   └── run_server.bat      # Chạy dev local không cần docker
│
└── docker-compose.yml      # Điều phối chạy toàn bộ hệ thống
```

---

## 1. Triển Khai Bằng Docker (Khuyến nghị trên Server)

Chạy 1 lệnh duy nhất để tự động build và chạy cả Client & Server:

```bash
docker compose up --build -d
```

* **Giao diện Web & API:** `http://<SERVER_IP>:3838`

### Các lệnh quản trị:
* Xem log: `docker compose logs -f`
* Dừng hệ thống: `docker compose down`

---

## 2. Chạy Local (Không dùng Docker)

Chỉ cần **nhấp đúp chuột vào 1 file duy nhất** ở thư mục gốc:
```bash
run_all.bat
```
File này sẽ tự động:
1. Mở cửa sổ khởi chạy Backend AI Server (Port 3838).
2. Mở cửa sổ khởi chạy Frontend React Client (`npm run dev` - Port 3000).
3. Tự động mở trình duyệt web tại `http://localhost:3000`.

*(Hoặc bạn có thể chạy riêng từng phần qua `server/run_server.bat` và `client/run_client.bat`)*
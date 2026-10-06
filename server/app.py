import os
import sys
import time
import uuid
import cv2
from flask import Flask, render_template, request, jsonify, send_from_directory

# 1. Thiet lap moi truong
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from pipeline_fusion import UltimateClassroomPipeline

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = os.path.join(BASE_DIR, 'static', 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024 # 50MB max

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# 2. Khoi tao Pipeline 1 lan duy nhat (Warm start)
print("=" * 60)
print("  DANG KHOI DONG SERVER AI CLASSROOM MONITORING (PORT 3838)")
print("=" * 60)
pipeline = UltimateClassroomPipeline(use_gpu=False, use_p2pnet=False)
print("[+] Server da san sang phuc vu!")


@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response


@app.route('/')
def index():
    template_path = os.path.join(BASE_DIR, 'templates', 'index.html')
    if os.path.exists(template_path):
        return render_template('index.html')
    return jsonify({
        'status': 'online',
        'service': 'AI Classroom Monitoring Backend',
        'port': 3838,
        'cron_default_conf': 0.36,
        'endpoints': {
            'predict': '/predict (POST)',
            'cron_scan': '/api/cron/scan (GET/POST)',
            'cron_process': '/api/cron/process?conf_thresh=0.36 (GET/POST)',
            'cron_run': '/api/cron/run?conf_thresh=0.36 (GET/POST)'
        }
    })


@app.route('/predict', methods=['POST'])
def handle_predict():
    t_start = time.time()
    
    # Kiem tra xem nguoi dung upload file hay chon mau co san
    uploaded_file = request.files.get('image')
    sample_name = request.form.get('sample_name')
    conf_thresh = float(request.form.get('conf_thresh', 0.44))

    if uploaded_file and uploaded_file.filename != '':
        ext = os.path.splitext(uploaded_file.filename)[1].lower()
        if ext not in ['.jpg', '.jpeg', '.png', '.bmp', '.webp']:
            return jsonify({'success': False, 'error': 'Dinh dang anh khong hop le (chi chap nhan JPG, PNG, WEBP)'}), 400
        
        file_id = uuid.uuid4().hex[:8]
        orig_filename = f"orig_{file_id}{ext}"
        result_filename = f"result_{file_id}.png"
        
        orig_path = os.path.join(app.config['UPLOAD_FOLDER'], orig_filename)
        result_path = os.path.join(app.config['UPLOAD_FOLDER'], result_filename)
        
        uploaded_file.save(orig_path)
    elif sample_name:
        # Lay anh mau trong thu muc goc
        sample_path = os.path.join(BASE_DIR, sample_name)
        if not os.path.exists(sample_path):
            return jsonify({'success': False, 'error': f'Khong tim thay anh mau: {sample_name}'}), 404
        
        file_id = uuid.uuid4().hex[:8]
        ext = os.path.splitext(sample_name)[1]
        orig_filename = f"orig_sample_{file_id}{ext}"
        result_filename = f"result_sample_{file_id}.png"
        
        orig_path = os.path.join(app.config['UPLOAD_FOLDER'], orig_filename)
        result_path = os.path.join(app.config['UPLOAD_FOLDER'], result_filename)
        
        # Copy anh mau vao static upload
        img = cv2.imread(sample_path)
        cv2.imwrite(orig_path, img)
    else:
        return jsonify({'success': False, 'error': 'Vui long tai len 1 file anh hoac chon anh mau'}), 400

    try:
        # Chay inference qua pipeline
        res = pipeline.predict(orig_path, output_path=result_path, conf_thresh=conf_thresh)
        elapsed_ms = int((time.time() - t_start) * 1000)

        # Chuan hoa danh sach sinh vien va diem tin cay
        students_data = []
        for idx, s in enumerate(res.get('students', []), 1):
            students_data.append({
                'id': idx,
                'type': s.get('type', 'fused_pose_head'),
                'conf': round(float(s.get('conf', 0.0)), 4),
                'x': int(s.get('head_pt', [0, 0])[0]),
                'y': int(s.get('head_pt', [0, 0])[1])
            })

        return jsonify({
            'success': True,
            'total_students': res['total_students'],
            'pose_students': res['pose_students'],
            'head_students': res.get('head_students', 0),
            'recovered_students': res.get('recovered_students', 0),
            'far_head_students': res['far_head_students'],
            'students': students_data,
            'original_url': f'/static/uploads/{orig_filename}',
            'result_url': f'/static/uploads/{result_filename}',
            'elapsed_ms': elapsed_ms
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


from scripts.cron_scan_data import scan_and_enqueue_images
from scripts.process_queue import process_queue_items


# ==============================================================================
# CÁC API ENDPOINT DÀNH CHO CRON JOB (HTTP GET / POST)
# ==============================================================================

@app.route('/api/cron/scan', methods=['GET', 'POST'])
def handle_cron_scan():
    """
    Endpoint 1: Quét thư mục data/ và đẩy ảnh mới vào data_queue.
    URL: http://localhost:3838/api/cron/scan
    """
    try:
        total_found, new_enqueued, already_exists = scan_and_enqueue_images(verbose=True)
        return jsonify({
            'success': True,
            'action': 'scan',
            'total_found': total_found,
            'new_enqueued': new_enqueued,
            'already_exists': already_exists,
            'message': f"Quét thành công! Tìm thấy {total_found} ảnh, thêm mới {new_enqueued} vào hàng đợi."
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/cron/process', methods=['GET', 'POST'])
def handle_cron_process():
    """
    Endpoint 2: Xử lý các ảnh đang chờ trong data_queue bằng AI.
    URL: http://localhost:3838/api/cron/process?limit=10&conf_thresh=0.36
    """
    try:
        limit = request.args.get('limit', default=None, type=int)
        conf_thresh = request.args.get('conf_thresh', default=0.44, type=float)
        # Sử dụng lại pipeline đã warm-up sẵn trong RAM giúp xử lý cực nhanh
        processed_count = process_queue_items(pipeline=pipeline, max_items=limit, conf_thresh=conf_thresh, verbose=True)
        return jsonify({
            'success': True,
            'action': 'process',
            'conf_thresh': conf_thresh,
            'processed_count': processed_count,
            'message': f"Đã xử lý thành công {processed_count} ảnh trong hàng đợi (Độ tin cậy: {conf_thresh})."
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/cron/run', methods=['GET', 'POST'])
def handle_cron_run_all():
    """
    Endpoint 3: Chạy toàn trình Cron (Quét thư mục data -> Đẩy vào queue -> AI xử lý -> Lưu CSDL).
    URL: http://localhost:3838/api/cron/run?conf_thresh=0.44
    """
    try:
        # Bước 1: Quét ảnh
        total_found, new_enqueued, already_exists = scan_and_enqueue_images(verbose=True)

        # Bước 2: Xử lý hàng đợi
        limit = request.args.get('limit', default=None, type=int)
        conf_thresh = request.args.get('conf_thresh', default=0.44, type=float)
        processed_count = process_queue_items(pipeline=pipeline, max_items=limit, conf_thresh=conf_thresh, verbose=True)

        return jsonify({
            'success': True,
            'action': 'scan_and_process',
            'conf_thresh': conf_thresh,
            'scan': {
                'total_found': total_found,
                'new_enqueued': new_enqueued,
                'already_exists': already_exists
            },
            'processed_count': processed_count,
            'message': f"Hoàn tất toàn trình Cron: Quét được {total_found} ảnh (+{new_enqueued} mới), AI đã xử lý {processed_count} ảnh (Độ tin cậy: {conf_thresh})."
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3838, debug=False)

"""
================================================================================
 PIPELINE TOI THUONG: TRI-MODEL ENSEMBLE FUSION CHO GIANG DUONG (~100 SINH VIEN)
 1. Model 1: YOLOv8-Pose (Toan than, 17 diem khung xuong, tu the ngoi)
 2. Model 2: YOLOv8-Head (Chuyen tri dau nguoi bi ban ghe che than, ngoi sat nhau)
 3. Model 3: P2PNet (Chuyen tri dau sinh vien hang xa cung, do phan giai thap)
================================================================================
"""

import os
import sys
import gc
import cv2
import numpy as np
import torch
from PIL import Image
from ultralytics import YOLO

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)
sys.path.insert(0, os.path.join(BASE_DIR, "p2pnet_module"))

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Import P2PNet
import models.backbone as backbone_module
def custom_backbone_init(self, name: str, return_interm_layers: bool):
    import models.vgg_ as vgg_models
    if name == 'vgg16_bn':
        backbone = vgg_models.vgg16_bn(pretrained=False)
    elif name == 'vgg16':
        backbone = vgg_models.vgg16(pretrained=False)
    num_channels = 256
    backbone_module.BackboneBase_VGG.__init__(self, backbone, num_channels, name, return_interm_layers)

backbone_module.Backbone_VGG.__init__ = custom_backbone_init
from models import build_model
import torchvision.transforms as standard_transforms

class DummyArgs:
    backbone = 'vgg16_bn'
    row = 2
    line = 2


class UltimateClassroomPipeline:
    def __init__(self, use_gpu=False, use_p2pnet=False):
        self.device = torch.device('cuda' if torch.cuda.is_available() and use_gpu else 'cpu')
        self.use_p2pnet = use_p2pnet
        print(f"[*] Khoi tao Classroom Pipeline tren Device: {self.device} (P2PNet: {'BAT' if self.use_p2pnet else 'TAT'})")

        # 1. Model 1: YOLOv8-Pose (Toan than, tu the ngoi, trum ao hoodie)
        pose_weight = os.path.join(BASE_DIR, "yolov8m-pose.pt")
        if not os.path.exists(pose_weight):
            pose_weight = "yolov8m-pose.pt"
        print(f"[*] [1/2] Loading YOLOv8-Pose ({pose_weight})...")
        self.pose_model = YOLO(pose_weight)

        # 2. Model 2: YOLOv8-Head (Chuyen tri dau nguoi bi ban ghe che than, ngoi san sat)
        head_weight = os.path.join(BASE_DIR, "weights", "yolov8_head_medium.pt")
        if not os.path.exists(head_weight):
            head_weight = os.path.join(BASE_DIR, "weights", "yolov8_head_nano.pt")
        print(f"[*] [2/2] Loading YOLOv8-Head ({head_weight})...")
        self.head_model = YOLO(head_weight)

        # 3. Model 3: P2PNet (Chuyen tri dau sinh vien hang ghe xa cung - tuy chon)
        if self.use_p2pnet:
            print("[*] [3/3] Loading P2PNet weights...")
            self.p2p_model = build_model(DummyArgs(), training=False)
            self.p2p_model.to(self.device)
            p2p_weight_path = os.path.join(BASE_DIR, "p2pnet_module", "weights", "SHTechA.pth")
            checkpoint = torch.load(p2p_weight_path, map_location='cpu')
            self.p2p_model.load_state_dict(checkpoint['model'])
            self.p2p_model.eval()

            self.transform = standard_transforms.Compose([
                standard_transforms.ToTensor(),
                standard_transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ])
        else:
            print("[+] Da tat hoan toan P2PNet (Chi dung YOLOv8-Pose + YOLOv8-Head chuyen nghiep)")

    def predict(self, image_path, output_path=None, conf_thresh=0.15):
        img_bgr = cv2.imread(image_path)
        if img_bgr is None:
            raise FileNotFoundError(f"Khong tim thay anh: {image_path}")
        orig_h, orig_w = img_bgr.shape[:2]

        # ----------------------------------------------------
        # BƯỚC 1: CHẠY POSE ESTIMATION (YOLOv8-Pose)
        # ----------------------------------------------------
        pose_conf = max(0.12, conf_thresh)
        with torch.inference_mode():
            pose_res = self.pose_model.predict(
                source=image_path,
                conf=pose_conf,
                iou=0.45,
                imgsz=1280,
                device=str(self.device),
                verbose=False
            )[0]

        pose_candidates = []
        for box, kpt in zip(pose_res.boxes, pose_res.keypoints):
            xyxy = box.xyxy[0].cpu().numpy()
            conf = float(box.conf[0])
            kpts = kpt.xy[0].cpu().numpy()
            kconf = kpt.conf[0].cpu().numpy() if kpt.conf is not None else [1.0] * 17

            # Tinh tam dau: Uu tien mui (0), mat (1, 2) hoac vai (5, 6)
            head_x = (xyxy[0] + xyxy[2]) / 2.0
            head_y = xyxy[1] + (xyxy[3] - xyxy[1]) * 0.18
            valid_face_kpts = [kpts[idx] for idx in range(5) if kconf[idx] > 0.18]
            if len(valid_face_kpts) > 0:
                head_x = float(np.mean([pt[0] for pt in valid_face_kpts]))
                head_y = float(np.mean([pt[1] for pt in valid_face_kpts]))
            elif kconf[5] > 0.18 and kconf[6] > 0.18:
                head_x = float((kpts[5][0] + kpts[6][0]) / 2.0)
                head_y = float(min(kpts[5][1], kpts[6][1]) - 12)

            pose_candidates.append({
                'box': [float(xyxy[0]), float(xyxy[1]), float(xyxy[2]), float(xyxy[3])],
                'head_pt': np.array([head_x, head_y]),
                'conf': conf,
                'matched': False
            })

        # ----------------------------------------------------
        # BƯỚC 2: CHẠY HEAD DETECTOR (YOLOv8-Head)
        # Linh hoạt theo conf_thresh của người dùng (tối thiểu 0.18) để bắt trọn cả sinh viên cúi đầu / trùm mũ
        # ----------------------------------------------------
        head_conf = max(0.18, float(conf_thresh))
        with torch.inference_mode():
            head_res = self.head_model.predict(
                source=image_path,
                conf=head_conf,
                iou=0.45,
                imgsz=1280,
                device=str(self.device),
                verbose=False
            )[0]

        head_candidates = []
        for box in head_res.boxes:
            xyxy = box.xyxy[0].cpu().numpy()
            conf = float(box.conf[0])
            cx = (xyxy[0] + xyxy[2]) / 2.0
            cy = (xyxy[1] + xyxy[3]) / 2.0
            bw = xyxy[2] - xyxy[0]
            bh = xyxy[3] - xyxy[1]
            head_candidates.append({
                'box': [float(xyxy[0]), float(xyxy[1]), float(xyxy[2]), float(xyxy[3])],
                'head_pt': np.array([cx, cy]),
                'size': max(bw, bh),
                'conf': conf,
                'matched': False
            })

        # ----------------------------------------------------
        # BƯỚC 3: CHẠY P2PNET (CROWD DENSITY MAP CHO HÀNG XA - TUỲ CHỌN)
        # ----------------------------------------------------
        p2p_points = []
        if self.use_p2pnet:
            img_pil = Image.open(image_path).convert('RGB')
            resample_mode = getattr(getattr(Image, 'Resampling', Image), 'LANCZOS', Image.BILINEAR)
            max_p2p_dim = 960.0
            p2p_scale = min(1.0, max_p2p_dim / max(orig_w, orig_h))
            nw = max(128, int(orig_w * p2p_scale) // 128 * 128)
            nh = max(128, int(orig_h * p2p_scale) // 128 * 128)
            
            inp = self.transform(img_pil.resize((nw, nh), resample_mode)).unsqueeze(0).to(self.device)
            with torch.inference_mode():
                out = self.p2p_model(inp)
                sc = torch.nn.functional.softmax(out['pred_logits'], -1)[:, :, 1][0]
                pt = out['pred_points'][0]
                p2p_thresh = 0.45
                mask = sc > p2p_thresh
                valid_pt = pt[mask].detach().cpu().numpy()
                valid_sc = sc[mask].detach().cpu().numpy()

            sx = orig_w / float(nw)
            sy = orig_h / float(nh)
            if len(valid_pt) > 0:
                for p, s in zip(valid_pt, valid_sc):
                    p2p_points.append({'pt': np.array([p[0] * sx, p[1] * sy]), 'score': float(s)})

            del inp, out, sc, pt
            gc.collect()

        # ----------------------------------------------------
        # BƯỚC 4: TRI-MODEL FUSION ENGINE (HỢP NHẤT KHÔNG TRIỆT TIÊU SAI)
        # ----------------------------------------------------
        final_list = []

        # A. Hợp nhất YOLO-Head với YOLO-Pose
        for h in head_candidates:
            hx, hy = h['head_pt']
            h_size = h['size']

            matched_pose = None
            min_dist = 999999.0
            for p in pose_candidates:
                dist = np.linalg.norm(h['head_pt'] - p['head_pt'])
                px1, py1, px2, py2 = p['box']
                upper_y = py1 + (py2 - py1) * 0.40
                in_upper_body = (px1 - 6 <= hx <= px2 + 6 and py1 - 10 <= hy <= upper_y)

                if dist < h_size * 1.35 or in_upper_body:
                    if dist < min_dist:
                        min_dist = dist
                        matched_pose = p

            if matched_pose is not None:
                matched_pose['matched'] = True
                final_list.append({
                    'type': 'fused_pose_head',
                    'head_pt': h['head_pt'],
                    'box': h['box'],
                    'conf': max(h['conf'], matched_pose['conf'])
                })
            else:
                # Sinh viên bị bàn ghế che khuất thân thể (như bạn 2 & 3 kề bên!)
                final_list.append({
                    'type': 'head_only',
                    'head_pt': h['head_pt'],
                    'box': h['box'],
                    'conf': h['conf']
                })

        # B. Bổ sung các bạn chỉ Pose phát hiện được (ví dụ quay lưng, trùm kín đầu)
        for p in pose_candidates:
            if not p['matched']:
                is_near = False
                for s in final_list:
                    if np.linalg.norm(p['head_pt'] - s['head_pt']) < 18.0:
                        is_near = True
                        break
                if not is_near:
                    final_list.append({
                        'type': 'pose_only',
                        'head_pt': p['head_pt'],
                        'box': p['box'],
                        'conf': p['conf']
                    })

        # C. Bổ sung các điểm đầu hàng xa từ P2PNet (Nếu được kích hoạt)
        if self.use_p2pnet:
            p2p_points.sort(key=lambda x: x['score'], reverse=True)
            for pt_item in p2p_points:
                pt = pt_item['pt']
                norm_y = np.clip(pt[1] / float(orig_h), 0.0, 1.0)
                if norm_y > 0.38:
                    continue

                head_radius = 8.0 + 16.0 * norm_y
                is_covered = False
                for s in final_list:
                    dist = np.linalg.norm(pt - s['head_pt'])
                    if dist < head_radius:
                        is_covered = True
                        break
                    bx1, by1, bx2, by2 = s['box']
                    if bx1 - 2 <= pt[0] <= bx2 + 2 and by1 - 2 <= pt[1] <= by2 + 2:
                        is_covered = True
                        break

                if not is_covered:
                    box_w = head_radius * 1.4
                    final_list.append({
                        'type': 'far_crowd_head',
                        'head_pt': pt,
                        'box': [pt[0] - box_w / 2.0, pt[1] - box_w / 2.0, pt[0] + box_w / 2.0, pt[1] + box_w / 2.0],
                        'conf': pt_item['score']
                    })

        # Sắp xếp từ trên xuống dưới theo vị trí Y
        final_list.sort(key=lambda s: s['head_pt'][1])

        # ----------------------------------------------------
        # BƯỚC 5: VẼ ẢNH TRỰC QUAN ĐẸP MẮT
        # ----------------------------------------------------
        total_count = len(final_list)
        pose_count = len([s for s in final_list if s['type'] in ('fused_pose_head', 'pose_only')])
        head_count = len([s for s in final_list if s['type'] == 'head_only'])
        far_count = len([s for s in final_list if s['type'] == 'far_crowd_head'])

        if output_path:
            out_img = img_bgr.copy()
            for i, s in enumerate(final_list, 1):
                hx, hy = int(s['head_pt'][0]), int(s['head_pt'][1])

                if s['type'] == 'fused_pose_head':
                    # Toàn thân + Đầu (Xanh lá neon)
                    cv2.circle(out_img, (hx, hy), 7, (0, 255, 128), 1, cv2.LINE_AA)
                    cv2.circle(out_img, (hx, hy), 4, (0, 0, 255), -1, cv2.LINE_AA)
                    cv2.circle(out_img, (hx, hy), 2, (255, 255, 255), -1, cv2.LINE_AA)
                elif s['type'] == 'head_only':
                    # Chuyên bắt đầu bị che thân (Xanh Cyan / Sky Blue)
                    cv2.circle(out_img, (hx, hy), 7, (255, 200, 0), 1, cv2.LINE_AA)
                    cv2.circle(out_img, (hx, hy), 4, (255, 120, 0), -1, cv2.LINE_AA)
                    cv2.circle(out_img, (hx, hy), 2, (255, 255, 255), -1, cv2.LINE_AA)
                elif s['type'] == 'pose_only':
                    # Pose đơn lẻ
                    cv2.circle(out_img, (hx, hy), 7, (0, 255, 128), 1, cv2.LINE_AA)
                    cv2.circle(out_img, (hx, hy), 4, (0, 180, 0), -1, cv2.LINE_AA)
                else:
                    # Chuyên bắt đầu (Xanh Cyan đồng bộ)
                    cv2.circle(out_img, (hx, hy), 7, (255, 200, 0), 1, cv2.LINE_AA)
                    cv2.circle(out_img, (hx, hy), 4, (255, 120, 0), -1, cv2.LINE_AA)
                    cv2.circle(out_img, (hx, hy), 2, (255, 255, 255), -1, cv2.LINE_AA)

                # Số thứ tự sinh viên
                font = cv2.FONT_HERSHEY_SIMPLEX
                cv2.putText(out_img, str(i), (hx + 6, hy - 4), font, 0.35, (0, 0, 0), 2, cv2.LINE_AA)
                cv2.putText(out_img, str(i), (hx + 6, hy - 4), font, 0.35, (0, 255, 255), 1, cv2.LINE_AA)

            # Dashboard thống kê tinh gọn góc trái
            overlay = out_img.copy()
            cv2.rectangle(overlay, (15, 15), (510, 130), (20, 20, 20), -1)
            cv2.addWeighted(overlay, 0.75, out_img, 0.25, 0, out_img)

            title_text = "DUAL-MODEL AI CLASSROOM (POSE + HEAD)" if not self.use_p2pnet else "TRI-MODEL AI CLASSROOM FUSION"
            cv2.putText(out_img, title_text, (25, 38), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2, cv2.LINE_AA)
            cv2.putText(out_img, f"TONG SO SINH VIEN: {total_count}", (25, 66), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (0, 255, 0), 2, cv2.LINE_AA)
            cv2.putText(out_img, f"* Toan than / Tu the (Pose): {pose_count}", (25, 86), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (0, 255, 128), 1, cv2.LINE_AA)
            cv2.putText(out_img, f"* Dau nguoi / Che than (Head AI): {head_count}", (25, 104), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (255, 200, 0), 1, cv2.LINE_AA)
            if self.use_p2pnet:
                cv2.putText(out_img, f"* Hang xa cung cuoi lop (P2PNet): {far_count}", (25, 122), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (0, 160, 255), 1, cv2.LINE_AA)

            os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
            cv2.imwrite(output_path, out_img)
            print(f"[+] Da xuat anh thanh pham tai: {output_path}")

        return {
            'total_students': total_count,
            'pose_students': pose_count,
            'head_students': head_count,
            'far_head_students': far_count,
            'students': final_list
        }


if __name__ == '__main__':
    pipeline = UltimateClassroomPipeline(use_gpu=False)
    target_img = sys.argv[1] if len(sys.argv) > 1 else r"2550_0_4. P.202-01_20260923075304.png"
    out_file = sys.argv[2] if len(sys.argv) > 2 else r"output_paddle/tri_model_result.png"
    res = pipeline.predict(target_img, output_path=out_file)
    print("\n" + "=" * 50)
    print(f"  KET QUA TRI-MODEL FUSION:")
    print(f"  - Tong so sinh vien:             {res['total_students']}")
    print(f"  - Toan than / Tu the (Pose):     {res['pose_students']}")
    print(f"  - Dau bi ban ghe che (YOLO-Head): {res['head_students']}")
    print(f"  - Hang xa cung (P2PNet):         {res['far_head_students']}")
    print("=" * 50)

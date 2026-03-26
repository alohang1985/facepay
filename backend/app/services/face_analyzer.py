"""
Face analysis service using MediaPipe Tasks API (v0.10+).
Detects faces, extracts 478 landmarks, generates unique Face ID from geometry.
"""
import hashlib
import io
import math
import os
import numpy as np
import mediapipe as mp
from mediapipe.tasks.python import BaseOptions
from mediapipe.tasks.python.vision import (
    FaceDetector,
    FaceDetectorOptions,
    FaceLandmarker,
    FaceLandmarkerOptions,
)

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models")
DETECTOR_MODEL = os.path.join(MODELS_DIR, "face_detection_short_range.tflite")
LANDMARKER_MODEL = os.path.join(MODELS_DIR, "face_landmarker.task")


def analyze_face(image_bytes: bytes) -> dict:
    """
    Analyze a face image and return:
    - face_id: unique hash derived from facial geometry
    - confidence: detection confidence score
    - bbox: bounding box of the face
    - landmarks: key facial landmarks
    - geometry: geometric ratios (used for uniqueness)
    """
    # Load as MediaPipe Image
    img_array = np.frombuffer(image_bytes, dtype=np.uint8)

    # Decode with OpenCV
    import cv2
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    if img is None:
        return {"success": False, "error": "Could not decode image"}

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    h, w = img_rgb.shape[:2]

    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)

    # Step 1: Detect faces
    detector_options = FaceDetectorOptions(
        base_options=BaseOptions(model_asset_path=DETECTOR_MODEL),
        min_detection_confidence=0.5,
    )
    with FaceDetector.create_from_options(detector_options) as detector:
        detection_result = detector.detect(mp_image)

        if not detection_result.detections:
            return {"success": False, "error": "No face detected in the image. Please upload a clear face photo."}

        if len(detection_result.detections) > 1:
            return {
                "success": False,
                "error": f"Multiple faces detected ({len(detection_result.detections)}). Please upload a photo with a single face.",
            }

        det = detection_result.detections[0]
        confidence = det.categories[0].score
        bbox = det.bounding_box
        face_bbox = {
            "x": round(bbox.origin_x / w, 4),
            "y": round(bbox.origin_y / h, 4),
            "width": round(bbox.width / w, 4),
            "height": round(bbox.height / h, 4),
        }

    # Step 2: Extract face landmarks
    landmarker_options = FaceLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=LANDMARKER_MODEL),
        num_faces=1,
        min_face_detection_confidence=0.5,
        min_face_presence_confidence=0.5,
    )
    with FaceLandmarker.create_from_options(landmarker_options) as landmarker:
        landmark_result = landmarker.detect(mp_image)

        if not landmark_result.face_landmarks:
            # Fallback: use detection only
            face_id = _generate_id_from_bbox(face_bbox, confidence)
            return {
                "success": True,
                "face_id": face_id,
                "confidence": round(float(confidence), 4),
                "bbox": face_bbox,
                "landmarks": {},
                "geometry": {},
                "landmark_count": 0,
                "image_size": {"width": w, "height": h},
            }

        face_lm = landmark_result.face_landmarks[0]

        # Extract key landmarks
        key_points = _extract_key_landmarks(face_lm, w, h)

        # Compute geometric ratios
        geometry = _compute_face_geometry(face_lm)

        # Generate unique Face ID
        face_id = _generate_face_id(geometry)

        return {
            "success": True,
            "face_id": face_id,
            "confidence": round(float(confidence), 4),
            "bbox": face_bbox,
            "landmarks": key_points,
            "geometry": geometry,
            "landmark_count": len(face_lm),
            "image_size": {"width": w, "height": h},
        }


def _extract_key_landmarks(landmarks, img_w, img_h) -> dict:
    """Extract key facial landmark positions."""
    KEY_INDICES = {
        "left_eye_inner": 133,
        "left_eye_outer": 33,
        "right_eye_inner": 362,
        "right_eye_outer": 263,
        "nose_tip": 1,
        "mouth_left": 61,
        "mouth_right": 291,
        "chin": 199,
        "forehead": 10,
        "left_cheek": 234,
        "right_cheek": 454,
    }

    result = {}
    for name, idx in KEY_INDICES.items():
        if idx < len(landmarks):
            lm = landmarks[idx]
            result[name] = {
                "x": round(lm.x * img_w, 1),
                "y": round(lm.y * img_h, 1),
            }
    return result


def _compute_face_geometry(landmarks) -> dict:
    """
    Compute scale/position-invariant geometric ratios.
    These ratios are unique to each person's face structure.
    """
    def dist(i, j):
        a, b = landmarks[i], landmarks[j]
        dx = a.x - b.x
        dy = a.y - b.y
        dz = a.z - b.z
        return math.sqrt(dx*dx + dy*dy + dz*dz)

    # Base: inter-eye distance
    eye_dist = dist(33, 263)
    if eye_dist < 1e-6:
        eye_dist = 1e-6

    geometry = {
        "eye_distance_ratio": 1.0,
        "nose_length_ratio": round(dist(6, 1) / eye_dist, 4),
        "mouth_width_ratio": round(dist(61, 291) / eye_dist, 4),
        "face_height_ratio": round(dist(10, 152) / eye_dist, 4),
        "jaw_width_ratio": round(dist(234, 454) / eye_dist, 4),
        "nose_to_mouth_ratio": round(dist(1, 13) / eye_dist, 4),
        "forehead_to_nose_ratio": round(dist(10, 6) / eye_dist, 4),
        "left_eye_height_ratio": round(dist(159, 145) / eye_dist, 4),
        "right_eye_height_ratio": round(dist(386, 374) / eye_dist, 4),
        "nose_width_ratio": round(dist(129, 358) / eye_dist, 4),
        "upper_lip_ratio": round(dist(0, 13) / eye_dist, 4),
        "chin_ratio": round(dist(17, 152) / eye_dist, 4),
    }

    return geometry


def _generate_face_id(geometry: dict) -> str:
    """Generate a unique Face ID from geometric ratios."""
    values = [f"{v:.4f}" for v in geometry.values()]
    geometry_str = "|".join(values)
    full_hash = hashlib.sha256(geometry_str.encode()).hexdigest()
    return f"FP-{full_hash[:4].upper()}-{full_hash[4:8].upper()}-{full_hash[8:12].upper()}"


def _generate_id_from_bbox(bbox: dict, confidence: float) -> str:
    """Fallback ID generation."""
    data = f"{bbox['x']:.4f}|{bbox['y']:.4f}|{bbox['width']:.4f}|{bbox['height']:.4f}|{confidence:.4f}"
    full_hash = hashlib.sha256(data.encode()).hexdigest()
    return f"FP-{full_hash[:4].upper()}-{full_hash[4:8].upper()}-{full_hash[8:12].upper()}"

import cv2

def capture_image(camera_index=0, save_path="captured.jpg"):
    cap = cv2.VideoCapture(camera_index)

    if not cap.isOpened():
        raise Exception("Could not open camera")

    ret, frame = cap.read()

    if not ret:
        raise Exception("Failed to capture image")

    cv2.imwrite(save_path, frame)
    cap.release()

    return save_path

if __name__ == "__main__":
    print("Capturing test image...")
    path = capture_image()
    print("Saved to:", path)

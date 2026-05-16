from camera_pipeline.capture import capture_image
from inference.inference import predict
from servo_control.servo import sort_to_bin
import time

MODEL_PATH = "ai-model/waste_model.onnx"

def main():
    print("Smart Waste Segregation Pipeline Started")

    while True:
        input("Press ENTER to capture...")
        
        img_path = capture_image()
        print("Captured:", img_path)

        label, conf = predict(image_path=img_path, model_path=MODEL_PATH)
        print(f"Prediction: {label} (Confidence: {conf:.2f})")

        print("Sorting...")
        sort_to_bin(label)
        print("Done.\n")
        time.sleep(1)

if __name__ == "__main__":
    main()

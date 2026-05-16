import cv2
import numpy as np
from tensorflow.keras.models import load_model
from tkinter import *
from tkinter import messagebox
from PIL import Image, ImageTk

# ------------------------------
# CONFIGURATION
# ------------------------------
MODEL_PATH = "waste_model_10class_final.h5"  # Your .h5 model file
IMAGE_SIZE = (224, 224)

# Map model classes to main categories
class_to_main = {
    "hazardous_batteries": "hazardous",
    "hazardous_biomedical": "hazardous",
    "hazardous_e-waste": "hazardous",
    "hazardous_toxic-sharp": "hazardous",
    "non_recyclable": "non-recyclable",
    "organic": "organic",
    "recyclable_cardboard": "recyclable",
    "recyclable_metal": "recyclable",
    "recyclable_paper": "recyclable",
    "recyclable_plastic": "recyclable"  
}

# List of classes in the same order as the model output
model_classes = list(class_to_main.keys())

# ------------------------------
# LOAD KERAS MODEL
# ------------------------------
model = load_model(MODEL_PATH)

# ------------------------------
# HELPER FUNCTIONS
# ------------------------------
def preprocess_image(frame):
    img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, IMAGE_SIZE)
    img = img.astype(np.float32) / 255.0
    img = np.expand_dims(img, axis=0)
    return img

def predict_category(frame):
    img = preprocess_image(frame)
    preds = model.predict(img)
    class_index = np.argmax(preds)
    confidence = preds[0][class_index]
    predicted_class = model_classes[class_index]
    main_category = class_to_main[predicted_class]
    return predicted_class, main_category, confidence

# ------------------------------
# GUI AND CAMERA SETUP
# ------------------------------
cap = cv2.VideoCapture(0)  # Use 1 for external webcam (adjust if needed)

root = Tk()
root.title("AI Waste Segregation")

lmain = Label(root)
lmain.pack()

result_label = Label(root, text="", font=("Helvetica", 16))
result_label.pack(pady=10)

def show_frame():
    ret, frame = cap.read()
    if ret:
        frame = cv2.flip(frame, 1)  # Mirror image
        cv2image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGBA)
        img = Image.fromarray(cv2image)
        imgtk = ImageTk.PhotoImage(image=img)
        lmain.imgtk = imgtk
        lmain.configure(image=imgtk)
    lmain.after(10, show_frame)

def capture_and_predict():
    ret, frame = cap.read()
    if not ret:
        messagebox.showerror("Error", "Failed to capture image")
        return
    predicted_class, main_category, confidence = predict_category(frame)
    result_text = f"Predicted Class: {predicted_class}\nMain Category: {main_category}\nConfidence: {confidence:.2f}"
    result_label.config(text=result_text)

# Capture button
btn_capture = Button(root, text="Capture & Predict", command=capture_and_predict, font=("Helvetica", 14))
btn_capture.pack(pady=10)

# Start GUI loop
show_frame()
root.mainloop()

# Release camera on exit
cap.release()
cv2.destroyAllWindows()

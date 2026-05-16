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

def predict_class(frame):
    img = preprocess_image(frame)
    preds = model.predict(img)
    class_index = np.argmax(preds)
    predicted_class = model_classes[class_index]
    return predicted_class

# ------------------------------
# GUI AND CAMERA SETUP
# ------------------------------
cap = cv2.VideoCapture(1, cv2.CAP_DSHOW)  # Use the correct index for your external webcam

root = Tk()
root.title("AI Waste Segregation")

lmain = Label(root)
lmain.pack()

result_label = Label(root, text="", font=("Helvetica", 20), fg="blue")
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
    detected_class = predict_class(frame)
    result_label.config(text=f"Detected Class: {detected_class}")

# Capture button
btn_capture = Button(root, text="Capture & Detect", command=capture_and_predict, font=("Helvetica", 16))
btn_capture.pack(pady=10)

# Start GUI loop
show_frame()
root.mainloop()

# Release camera on exit
cap.release()
cv2.destroyAllWindows()

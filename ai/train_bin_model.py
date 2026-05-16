# waste_cnn_final.py
import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, Dropout, GlobalAveragePooling2D
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
from sklearn.metrics import classification_report, confusion_matrix

# -------------------- CONFIG --------------------
DATASET_DIR = "final_dataset"  # top-level folder containing train/, val/, test/
TRAIN_DIR = os.path.join(DATASET_DIR, "train")
VAL_DIR = os.path.join(DATASET_DIR, "val")
TEST_DIR = os.path.join(DATASET_DIR, "test")

IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS_HEAD = 25
EPOCHS_FINE = 20
MODEL_H5_PATH = "waste_model_10class_final.h5"

# -------------------- AUTOMATIC CLASS DETECTION --------------------
CLASS_NAMES = sorted(os.listdir(TRAIN_DIR))  # reads exact folder names
NUM_CLASSES = len(CLASS_NAMES)
print("Detected classes:", CLASS_NAMES)

# -------------------- DATA GENERATORS --------------------
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=25,
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.2,
    zoom_range=0.2,
    horizontal_flip=True,
    fill_mode='nearest'
)

val_test_datagen = ImageDataGenerator(rescale=1./255)

train_gen = train_datagen.flow_from_directory(
    TRAIN_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    classes=CLASS_NAMES,
    class_mode='categorical',
    batch_size=BATCH_SIZE,
    shuffle=True
)

val_gen = val_test_datagen.flow_from_directory(
    VAL_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    classes=CLASS_NAMES,
    class_mode='categorical',
    batch_size=BATCH_SIZE,
    shuffle=False
)

test_gen = val_test_datagen.flow_from_directory(
    TEST_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    classes=CLASS_NAMES,
    class_mode='categorical',
    batch_size=BATCH_SIZE,
    shuffle=False
)

# -------------------- BUILD MODEL --------------------
base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(IMG_SIZE, IMG_SIZE, 3))
base_model.trainable = False  # Stage 1: freeze base

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(512, activation='relu')(x)
x = Dropout(0.4)(x)
x = Dense(256, activation='relu')(x)
x = Dropout(0.3)(x)
outputs = Dense(NUM_CLASSES, activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=outputs)
model.compile(optimizer=Adam(1e-4), loss='categorical_crossentropy', metrics=['accuracy'])
model.summary()

# -------------------- CALLBACKS --------------------
checkpoint = ModelCheckpoint(MODEL_H5_PATH, monitor='val_accuracy', save_best_only=True, verbose=1)
early_stop = EarlyStopping(monitor='val_loss', patience=6, restore_best_weights=True, verbose=1)
reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, min_lr=1e-6, verbose=1)

callbacks = [checkpoint, early_stop, reduce_lr]

# -------------------- STAGE 1: TRAIN HEAD --------------------
print("=== Stage 1: Training head (base frozen) ===")
history_head = model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=EPOCHS_HEAD,
    callbacks=callbacks
)

# -------------------- STAGE 2: FINE-TUNE --------------------
print("=== Stage 2: Fine-tuning full model ===")
base_model.trainable = True
fine_tune_at = 100
for layer in base_model.layers[:fine_tune_at]:
    layer.trainable = False

model.compile(optimizer=Adam(1e-5), loss='categorical_crossentropy', metrics=['accuracy'])

history_fine = model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=EPOCHS_HEAD+EPOCHS_FINE,
    initial_epoch=history_head.epoch[-1]+1,
    callbacks=callbacks
)

# -------------------- EVALUATE ON TEST SET --------------------
print("=== Evaluating on test set ===")
model.load_weights(MODEL_H5_PATH)
loss, acc = model.evaluate(test_gen)
print(f"📌 Test Loss: {loss:.4f}, Test Accuracy: {acc*100:.2f}%")

# -------------------- CLASSIFICATION REPORT & CONFUSION MATRIX --------------------
test_gen.reset()
Y_pred = model.predict(test_gen)
y_pred = np.argmax(Y_pred, axis=1)
y_true = test_gen.classes

print("\n📌 Classification Report:\n")
print(classification_report(y_true, y_pred, target_names=CLASS_NAMES))

cm = confusion_matrix(y_true, y_pred)
print("\n📌 Confusion Matrix:\n", cm)

# -------------------- SUB → MAIN CATEGORY MAPPING --------------------
sub_to_main = {
    "organic": "Organic",
    "non-recyclable": "Non_Recyclable",
    "hazardous_batteries": "Hazardous",
    "hazardous_e-waste": "Hazardous",
    "hazardous_toxic-sharp": "Hazardous",
    "hazardous_biomedical": "Hazardous",
    "recyclable_paper": "Recyclable",
    "recyclable_cardboard": "Recyclable",
    "recyclable_plastic": "Recyclable",
    "recyclable_metal": "Recyclable"
}

print("\n✔ Sub-category → Main category mapping ready for inference.")

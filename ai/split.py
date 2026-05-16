import os
import shutil
import random

# ---------------- CONFIG ----------------
SOURCE_DIR = "dataset"  # original images folder containing 10 category folders
DEST_DIR = "final_dataset"       # folder to create train/val/test splits

SPLIT_RATIO = {
    "train": 0.7,
    "val": 0.15,
    "test": 0.15
}

random.seed(42)  # for reproducibility

# ---------------- CREATE FOLDERS ----------------
for split in SPLIT_RATIO:
    for class_name in os.listdir(SOURCE_DIR):
        os.makedirs(os.path.join(DEST_DIR, split, class_name), exist_ok=True)

# ---------------- SPLIT IMAGES ----------------
for class_name in os.listdir(SOURCE_DIR):
    class_path = os.path.join(SOURCE_DIR, class_name)
    images = os.listdir(class_path)
    random.shuffle(images)
    
    n_total = len(images)
    train_end = int(SPLIT_RATIO["train"] * n_total)
    val_end = train_end + int(SPLIT_RATIO["val"] * n_total)
    
    splits = {
        "train": images[:train_end],
        "val": images[train_end:val_end],
        "test": images[val_end:]
    }
    
    for split, img_list in splits.items():
        for img in img_list:
            src = os.path.join(class_path, img)
            dst = os.path.join(DEST_DIR, split, class_name, img)
            shutil.copy2(src, dst)

print("✅ All 10 categories successfully split into train/val/test!")

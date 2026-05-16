import tensorflow as tf
import tf2onnx

# Load your Keras model
keras_model = tf.keras.models.load_model("waste_model_10class_final.h5")

# Convert Keras model to ONNX
spec = (tf.TensorSpec(keras_model.inputs[0].shape, tf.float32, name="input"),)
output_path = "waste_model.onnx"
model_proto, _ = tf2onnx.convert.from_keras(keras_model, input_signature=spec, output_path=output_path)

print(f"Model successfully converted and saved as {output_path}")

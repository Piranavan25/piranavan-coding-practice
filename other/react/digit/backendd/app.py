from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from PIL import Image
import io
import tensorflow as tf
from tensorflow.keras.models import load_model
import base64
import re

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load your trained model
model = load_model('mnist_model.h5')

def preprocess_image(image):
    """Preprocess the image to match MNIST format"""
    # Convert to grayscale and resize
    img = image.convert('L').resize((28, 28))
    
    # Convert to numpy array
    img_array = np.array(img)
    
    # Invert colors if needed (black digits on white background to white on black)
    # MNIST has white digits on black background
    #img_array = 255 - img_array
    
    # Normalize and reshape for the model
    img_array = img_array / 255.0
    img_array = img_array.reshape(1, 784)  # Flatten to 784 pixels
    
    return img_array

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Check if image was provided
        if 'image' not in request.files:
            # Check if image was sent as base64 in form data
            if 'image' not in request.form:
                return jsonify({'error': 'No image provided'}), 400
            else:
                # Handle base64 image
                image_data = request.form['image']
                header, encoded = image_data.split(",", 1)
                image_bytes = base64.b64decode(encoded)
                img = Image.open(io.BytesIO(image_bytes))
        else:
            # Handle file upload
            file = request.files['image']
            img = Image.open(io.BytesIO(file.read()))
        
        # Preprocess the image
        processed_image = preprocess_image(img)
        
        # Make prediction
        predictions = model.predict(processed_image)
        predicted_digit = np.argmax(predictions[0])
        confidence = np.max(predictions[0])
        
        # Debug output
        print(f"Predicted digit: {predicted_digit}")
        print(f"Confidence: {confidence}")
        
        return jsonify({
            'prediction': int(predicted_digit),
            'confidence': float(confidence)
        })
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

@app.route('/test', methods=['GET'])
def test_model():
    """Test the model with a simple example"""
    try:
        # Create a simple test image (number 7)
        test_image = np.zeros((28, 28))
        test_image[5:20, 5:10] = 255  # Vertical line
        test_image[5:10, 10:20] = 255  # Horizontal line
        
        # Preprocess
        test_image = test_image / 255.0
        test_image = test_image.reshape(1, 784)
        
        # Predict
        predictions = model.predict(test_image)
        predicted_digit = np.argmax(predictions[0])
        confidence = np.max(predictions[0])
        
        return jsonify({
            'test_prediction': int(predicted_digit),
            'test_confidence': float(confidence),
            'all_predictions': predictions[0].tolist()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
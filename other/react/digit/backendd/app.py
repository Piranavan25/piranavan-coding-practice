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
    img_array = 255 - img_array
    
    # Normalize and reshape for the model
    img_array = img_array / 255.0
    img_array = img_array.reshape(1, 784)  # Flatten to 784 pixels
    
    return img_array


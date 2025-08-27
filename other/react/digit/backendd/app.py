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


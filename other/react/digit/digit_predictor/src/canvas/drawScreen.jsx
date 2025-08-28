import React, { useRef, useState, useEffect } from "react";

export default function DrawScreen() {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [predicted, setPredicted] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState("unknown");

  // Check backend status on component mount
  useEffect(() => {
    checkBackendStatus();
  }, []);

  // Initialize canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Set initial canvas style - WHITE background with BLACK drawing
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
  }, []);

  const checkBackendStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/health');
      if (response.ok) {
        setBackendStatus("connected");
      } else {
        setBackendStatus("error");
      }
    } catch (error) {
      console.error("Backend connection failed:", error);
      setBackendStatus("error");
    }
  };

  // Drawing handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();

    setDrawing(true);
    ctx.beginPath();
    ctx.moveTo(
      e.clientX - rect.left,
      e.clientY - rect.top
    );
  };

  const draw = (e) => {
    if (!drawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();

    ctx.lineTo(
      e.clientX - rect.left,
      e.clientY - rect.top
    );
    ctx.stroke();
  };

  const endDrawing = () => {
    setDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setPredicted(null);
    setConfidence(null);
  };

  // Convert canvas to image and send to backend
  const predictDigit = async () => {
    try {
      setIsLoading(true);
      setPredicted("...");
      setConfidence("...");

      const canvas = canvasRef.current;

      // Convert canvas to data URL instead of blob
      const dataUrl = canvas.toDataURL('image/png');

      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Create form data to send to backend
      const formData = new FormData();
      formData.append('image', blob, 'digit.png');

      // Send to backend
      const backendResponse = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        body: formData,
      });

      if (!backendResponse.ok) {
        throw new Error('Server response was not ok');
      }

      const data = await backendResponse.json();
      setPredicted(data.prediction);
      setConfidence(`${(data.confidence * 100).toFixed(2)}%`);
    } catch (error) {
      console.error('Prediction error:', error);
      setPredicted("Error");
      setConfidence("N/A");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Digit Recognition</h1>
          <p className="text-center text-gray-600 mb-6">Draw a digit (0-9) and click Predict</p>

          {/* Backend status indicator */}
          <div className={`text-center mb-4 text-sm ${backendStatus === "connected" ? "text-green-600" :
              backendStatus === "error" ? "text-red-600" : "text-yellow-600"
            }`}>
            Backend: {backendStatus === "connected" ? "Connected" :
              backendStatus === "error" ? "Not Connected" : "Checking..."}
          </div>

          {/* Drawing canvas */}
          <div className="flex justify-center mb-6">
            <canvas
              ref={canvasRef}
              width={280}
              height={280}
              className="border-2 border-gray-300 rounded-lg cursor-crosshair bg-white"
              onMouseDown={startDrawing}
              onMouseUp={endDrawing}
              onMouseMove={draw}
              onMouseLeave={endDrawing}
              onTouchStart={(e) => {
                e.preventDefault();
                startDrawing(e.touches[0]);
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                draw(e.touches[0]);
              }}
              onTouchEnd={endDrawing}
            />
          </div>

          {/* Control buttons */}
          <div className="flex justify-center space-x-4 mb-6">
            <button
              onClick={clearCanvas}
              className="px-5 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={predictDigit}
              disabled={isLoading || backendStatus !== "connected"}
              className={`px-5 py-2 text-white rounded-lg font-medium transition-colors ${isLoading || backendStatus !== "connected"
                  ? 'bg-gray-400'
                  : 'bg-green-500 hover:bg-green-600'
                }`}
            >
              {isLoading ? 'Processing...' : 'Predict'}
            </button>
          </div>

          {/* Prediction result display */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h2 className="text-lg font-semibold text-center text-gray-700 mb-2">Prediction Result</h2>
            <div className="flex justify-center items-baseline space-x-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Digit:</p>
                <div className="text-4xl font-bold text-gray-800 h-12 flex items-center justify-center">
                  {predicted !== null ? predicted : "-"}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Confidence:</p>
                <div className="text-xl font-semibold text-gray-700 h-12 flex items-center justify-center">
                  {confidence !== null ? confidence : "-"}
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-sm text-gray-500 text-center">
            <p>Draw a single digit from 0 to 9 in the canvas above.</p>
            <p>Click Predict to see what the AI thinks it is.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
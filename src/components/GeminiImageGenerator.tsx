import React, { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import FileSaver from 'file-saver';

// Get API key from environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

function GeminiImageGenerator() {
  const [style, setStyle] = useState('');
  const [word, setWord] = useState('');
  const [image, setImage] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const generateImage = async () => {
    if (!word || !style) {
      setError('Please enter both a word and style');
      return;
    }
    
    if (!API_KEY) {
      setError('API key is missing. Please add your Gemini API key to the .env file.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setDebugInfo([]);
    
    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      
      // Use gemini-2.0-flash-exp-image-generation which supports image generation
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash-exp" 
      });
      
      // Create a detailed prompt combining the word and style
      const imagePrompt = `Create a high-quality, clear image of a "${word}" in the style of ${style}. The object should be the central focus of the image, and visually styled according to the description: ${style}. Make it visually appealing and artistic.`;
      
      const logs = [`Sending prompt: ${imagePrompt}`];
      setDebugInfo(logs);
      
      // Generate the image content
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: imagePrompt }]
        }],
        generationConfig: {
          responseModalities: ['Text', 'Image']
        }
      });
      
      logs.push('Received response from Gemini API');
      setDebugInfo([...logs]);
      
      const response = await result.response;
      logs.push('Processing response');
      
      // Check for safety blocks
      if (response.candidates?.[0]?.safetyAttributes?.blockedCategories?.includes('IMAGE_SAFETY')) {
        logs.push('Image was blocked due to safety concerns');
        setError('The image generation was blocked due to safety concerns. Please try a different prompt.');
        setDebugInfo([...logs]);
        return;
      }
      
      // Find the image part in the response
      const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
      
      if (imagePart && imagePart.inlineData) {
        logs.push('Successfully extracted image data');
        setImage(imagePart);
        logs.push(`Image MIME type: ${imagePart.inlineData.mimeType}`);
      } else {
        logs.push('No image data found in the response');
        setError('Failed to generate an image. The API did not return image data.');
        
        // Log the actual response for debugging
        logs.push(`API Response: ${JSON.stringify(response, null, 2)}`);
      }
      
      setDebugInfo([...logs]);
    } catch (err: any) {
      console.error('Error generating image:', err);
      setError(`Failed to generate image: ${err.message || 'Unknown error'}`);
      setDebugInfo([...debugInfo, `Error: ${err.message || 'Unknown error'}`]);
    } finally {
      setLoading(false);
    }
  };

  const saveImage = () => {
    if (!image || !word) return;
    
    try {
      // For inline data from Gemini API
      if (image.inlineData) {
        const { mimeType, data } = image.inlineData;
        
        // Convert base64 to blob
        const byteCharacters = atob(data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        
        // Get file extension from MIME type
        const extension = mimeType.split('/')[1] || 'png';
        
        // Save the image
        FileSaver.saveAs(blob, `${word}.${extension}`);
      } else {
        setError('No valid image data to save');
      }
    } catch (err: any) {
      console.error('Error saving image:', err);
      setError(`Failed to save image: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Gemini AI Image Generator</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="word" className="block text-sm font-medium text-gray-700 mb-1">
            Word to Visualize
          </label>
          <input
            type="text"
            id="word"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="Enter a word"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="style" className="block text-sm font-medium text-gray-700 mb-1">
            Style Description
          </label>
          <input
            type="text"
            id="style"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="Enter style (e.g., watercolor, pixel art, 3D rendering)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={generateImage}
            disabled={loading || !word || !style}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate Image'}
          </button>
          
          <button
            onClick={saveImage}
            disabled={!image}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:bg-green-300 disabled:cursor-not-allowed"
          >
            Save Image
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
          {error}
        </div>
      )}
      
      {image && image.inlineData && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Generated Image:</h3>
          <div className="w-full h-auto bg-gray-100 rounded-md overflow-hidden shadow">
            <img
              src={`data:${image.inlineData.mimeType};base64,${image.inlineData.data}`}
              alt={`AI generated image of ${word}`}
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      )}
      
      {debugInfo.length > 0 && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Debug Information:</h3>
          <pre className="text-xs text-gray-600 overflow-auto max-h-48">
            {debugInfo.join('\n')}
          </pre>
        </div>
      )}
    </div>
  );
}

export default GeminiImageGenerator;
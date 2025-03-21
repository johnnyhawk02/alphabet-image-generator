import GeminiImageGenerator from './components/GeminiImageGenerator'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Gemini Image Generator</h1>
        <GeminiImageGenerator />
      </div>
    </div>
  )
}

export default App

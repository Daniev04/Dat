
import React, { useState, useCallback } from 'react';
import { generateStoryboardFrame } from './services/geminiService';
import type { StoryboardResult } from './types';

// --- Icon Components (defined outside to prevent re-creation on re-renders) ---
const FilmIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M8.25 3.75H19.5a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h.75V9.75h-2.25a.75.75 0 010-1.5H19.5V5.25h-2.25a.75.75 0 010-1.5h2.25V3.75z" clipRule="evenodd" />
    <path d="M6.75 5.25A2.25 2.25 0 004.5 7.5v9A2.25 2.25 0 006.75 18.75h10.5A2.25 2.25 0 0019.5 16.5v-3.75a.75.75 0 00-1.5 0v3.75a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75v-9a.75.75 0 01.75-.75h2.25a.75.75 0 000-1.5H6.75z" />
  </svg>
);

const WandIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 004.463-.69a.75.75 0 01.819.162l1.06 1.06a.75.75 0 010 1.06l-4.288 4.287a3.75 3.75 0 01-5.302 0l-4.288-4.287a.75.75 0 010-1.06l1.06-1.06a.75.75 0 011.06 0l1.06 1.06a.75.75 0 001.06 0l1.06-1.06a.75.75 0 000-1.06l-1.06-1.06a.75.75 0 00-1.06 0l-1.06 1.06a.75.75 0 01-1.06 0l-4.288-4.287a3.75 3.75 0 010-5.302l4.288-4.287a.75.75 0 011.06 0l1.06 1.06a.75.75 0 001.06 0l1.06-1.06a.75.75 0 000-1.06l-1.06-1.06a.75.75 0 00-1.06 0L9.528 1.718z" clipRule="evenodd" />
  </svg>
);


// --- UI Components (defined outside to prevent re-creation on re-renders) ---

const Header: React.FC = () => (
  <header className="text-center p-4 md:p-6 border-b border-gray-700">
    <div className="flex items-center justify-center gap-4">
      <FilmIcon className="w-10 h-10 text-gray-400" />
      <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
        Storyboard Artist AI
      </h1>
    </div>
    <p className="mt-2 text-md md:text-lg text-gray-400 max-w-2xl mx-auto">
      Visualize your screenplay. Describe a scene and get a cinematic storyboard frame with camera and mood direction.
    </p>
  </header>
);

interface SceneInputFormProps {
  sceneDescription: string;
  setSceneDescription: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const SceneInputForm: React.FC<SceneInputFormProps> = ({ sceneDescription, setSceneDescription, onSubmit, isLoading }) => (
  <div className="w-full sticky bottom-0 bg-gray-900/80 backdrop-blur-sm p-4 border-t border-gray-700">
    <div className="max-w-3xl mx-auto">
      <div className="relative">
        <textarea
          value={sceneDescription}
          onChange={(e) => setSceneDescription(e.target.value)}
          placeholder="e.g., A lone astronaut stands on a desolate red planet, gazing at two suns setting on the horizon."
          className="w-full bg-gray-800 border border-gray-600 rounded-lg text-white p-4 pr-32 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors duration-200 resize-none"
          rows={3}
          disabled={isLoading}
        />
        <button
          onClick={onSubmit}
          disabled={isLoading || !sceneDescription.trim()}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-white font-semibold rounded-md hover:bg-slate-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isLoading ? (
            'Generating...'
          ) : (
            <>
              <WandIcon className="w-5 h-5" />
              <span>Generate</span>
            </>
          )}
        </button>
      </div>
    </div>
  </div>
);

const Loader: React.FC = () => (
  <div className="flex flex-col items-center justify-center gap-4 p-8 text-gray-300">
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-slate-400"></div>
    <p className="text-lg font-medium">Generating cinematic frame...</p>
    <p className="text-sm text-gray-500">This may take a moment.</p>
  </div>
);

const StoryboardDisplay: React.FC<{ result: StoryboardResult }> = ({ result }) => (
  <div className="bg-gray-800 rounded-lg overflow-hidden shadow-2xl shadow-black/30 animate-fade-in">
    <img src={result.imageUrl} alt="Generated storyboard frame" className="w-full h-auto aspect-video object-cover" />
    <div className="p-4 bg-gray-800/50 border-t border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Camera Angle</h3>
        <p className="text-lg text-white font-medium">{result.cameraAngle}</p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Mood</h3>
        <p className="text-lg text-white font-medium">{result.mood}</p>
      </div>
    </div>
  </div>
);


const App: React.FC = () => {
  const [sceneDescription, setSceneDescription] = useState<string>('');
  const [storyboardResult, setStoryboardResult] = useState<StoryboardResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!sceneDescription.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setStoryboardResult(null);

    try {
      const result = await generateStoryboardFrame(sceneDescription);
      setStoryboardResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [sceneDescription, isLoading]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Header />
      <main className="flex-grow p-4 md:p-8 flex items-center justify-center">
        <div className="w-full max-w-3xl space-y-6">
          {!isLoading && !storyboardResult && !error && (
            <div className="text-center text-gray-500 p-8 border-2 border-dashed border-gray-700 rounded-lg">
              <FilmIcon className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-300">Your storyboard will appear here</h2>
              <p>Describe your scene below to get started.</p>
            </div>
          )}
          {isLoading && <Loader />}
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg text-center">
              <h3 className="font-bold">Generation Failed</h3>
              <p>{error}</p>
            </div>
          )}
          {storyboardResult && <StoryboardDisplay result={storyboardResult} />}
        </div>
      </main>
      <SceneInputForm
        sceneDescription={sceneDescription}
        setSceneDescription={setSceneDescription}
        onSubmit={handleGenerate}
        isLoading={isLoading}
      />
    </div>
  );
};

export default App;

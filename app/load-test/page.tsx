'use client';
import { useState, useEffect } from 'react';
import { GlobalLoading } from '@/components/global-loading';

interface LoadData {
  message: string;
}

export default function LoadTestPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<LoadData | null>(null);

  useEffect(() => {
    // Simulate a slow operation
    const timer = setTimeout(() => {
      setData({ message: "Data loaded successfully!" });
      setIsLoading(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <GlobalLoading message="Testing the beer loading animation..." size="lg" />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">🍺 Load Test Page</h1>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-green-800 mb-4">✅ Loading Complete!</h2>
          <p className="text-green-700 mb-4">{data?.message}</p>
          <p className="text-sm text-green-600">
            This page took 5 seconds to load, during which you should have seen the beer glass loading animation.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-blue-800 mb-3">What You Should Have Seen</h3>
            <ul className="text-blue-700 space-y-2">
              <li>• Beer glass filling up animation</li>
              <li>• Bubbles rising from the bottom</li>
              <li>• Foam forming at the top</li>
              <li>• "Testing the beer loading animation..." message</li>
              <li>• Glass emptying after 4 seconds</li>
            </ul>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-purple-800 mb-3">Test Different Scenarios</h3>
            <ul className="text-purple-700 space-y-2">
              <li>• Refresh the page to see it again</li>
              <li>• Navigate away and back</li>
              <li>• Test on different devices</li>
              <li>• Check network throttling</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button 
            onClick={() => {
              setIsLoading(true);
              setData(null);
              setTimeout(() => {
                setData({ message: "Data loaded successfully!" });
                setIsLoading(false);
              }, 5000);
            }}
            className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            🔄 Test Again
          </button>
        </div>
      </div>
    </div>
  );
}

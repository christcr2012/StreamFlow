import React, { useState, useEffect, useRef, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { MagnifyingGlassIcon, SparklesIcon, BoltIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';

interface Feature {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  href: string;
  enabled: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  confidence?: number;
  isRecommended?: boolean;
}

interface FeatureGroup {
  category: string;
  features: Feature[];
  icon: React.ComponentType<{ className?: string }>;
}

export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [features, setFeatures] = useState<Feature[]>([]);
  const [recommendations, setRecommendations] = useState<Feature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Listen for global command palette open events
  useEffect(() => {
    const handleOpenPalette = () => {
      setIsOpen(true);
    };

    window.addEventListener('open-command-palette', handleOpenPalette);
    return () => window.removeEventListener('open-command-palette', handleOpenPalette);
  }, []);

  // Load features and recommendations when opened
  useEffect(() => {
    if (isOpen) {
      loadFeaturesAndRecommendations();
      // Focus search input after modal opens
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset query when closing
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  const loadFeaturesAndRecommendations = async () => {
    setIsLoading(true);
    try {
      const [featuresResponse, recommendationsResponse] = await Promise.all([
        fetch('/api/features/catalog'),
        fetch('/api/ai/recommendations?limit=5'),
      ]);

      const featuresData = await featuresResponse.json();
      const recommendationsData = await recommendationsResponse.json();

      if (featuresData.success) {
        setFeatures(featuresData.features || []);
      }

      if (recommendationsData.success) {
        setRecommendations(recommendationsData.recommendations || []);
      }
    } catch (error) {
      console.error('Failed to load features:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter features based on search query
  const filteredFeatures = features.filter(feature => 
    feature.name.toLowerCase().includes(query.toLowerCase()) ||
    feature.description.toLowerCase().includes(query.toLowerCase()) ||
    feature.category.toLowerCase().includes(query.toLowerCase())
  );

  // Group features by category
  const groupedFeatures = filteredFeatures.reduce((groups, feature) => {
    const category = feature.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(feature);
    return groups;
  }, {} as Record<string, Feature[]>);

  // Category icons
  const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    'AI_ANALYTICS': ChartBarIcon,
    'AUTOMATION': BoltIcon,
    'COMMUNICATION': MagnifyingGlassIcon,
    'INTEGRATION': BoltIcon,
    'MOBILE': BoltIcon,
    'MARKETING': SparklesIcon,
    'DEVELOPER_TOOLS': BoltIcon,
  };

  const handleFeatureSelect = (feature: Feature) => {
    setIsOpen(false);
    if (feature.href) {
      router.push(feature.href);
    } else if (feature.enabled) {
      // Navigate to feature page if enabled
      router.push(`/features/${feature.key}`);
    } else {
      // Navigate to feature enablement page if not enabled
      router.push(`/settings/features?highlight=${feature.key}`);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setIsOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel 
                className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-0 text-left align-middle shadow-xl transition-all mt-[10vh]"
                onKeyDown={handleKeyDown}
              >
                {/* Search Input */}
                <div className="relative border-b border-gray-200 dark:border-gray-700">
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-0 text-sm"
                    placeholder="Search features, settings, or actions..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {/* AI Recommendations Section */}
                  {query === '' && recommendations.length > 0 && (
                    <div className="p-2">
                      <div className="flex items-center px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                        <SparklesIcon className="mr-2 h-4 w-4" />
                        AI Recommendations
                      </div>
                      {recommendations.slice(0, 3).map((rec, index) => (
                        <button
                          key={rec.id || index}
                          className="w-full flex items-center px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg mx-2 mb-1"
                          onClick={() => handleFeatureSelect(rec)}
                        >
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-3">
                            <SparklesIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {rec.name}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400 text-xs truncate">
                              {rec.confidence && `${Math.round(rec.confidence * 100)}% match • `}
                              {rec.description}
                            </div>
                          </div>
                          {!rec.enabled && (
                            <span className="ml-2 px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                              Enable
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Search Results */}
                  {query && (
                    <div className="p-2">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                      ) : Object.keys(groupedFeatures).length === 0 ? (
                        <div className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                          No features found for "{query}"
                        </div>
                      ) : (
                        Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
                          <div key={category} className="mb-4">
                            <div className="flex items-center px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                              {React.createElement(categoryIcons[category] || BoltIcon, {
                                className: 'mr-2 h-4 w-4'
                              })}
                              {category.replace('_', ' ')}
                            </div>
                            {categoryFeatures.map((feature) => (
                              <button
                                key={feature.id}
                                className="w-full flex items-center px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg mx-2 mb-1"
                                onClick={() => handleFeatureSelect(feature)}
                              >
                                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                                  feature.enabled 
                                    ? 'bg-green-100 dark:bg-green-900/30' 
                                    : 'bg-gray-100 dark:bg-gray-700'
                                }`}>
                                  {feature.icon ? (
                                    React.createElement(feature.icon, {
                                      className: `h-4 w-4 ${
                                        feature.enabled 
                                          ? 'text-green-600 dark:text-green-400'
                                          : 'text-gray-600 dark:text-gray-400'
                                      }`
                                    })
                                  ) : (
                                    React.createElement(categoryIcons[feature.category] || BoltIcon, {
                                      className: `h-4 w-4 ${
                                        feature.enabled 
                                          ? 'text-green-600 dark:text-green-400'
                                          : 'text-gray-600 dark:text-gray-400'
                                      }`
                                    })
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 dark:text-white truncate">
                                    {feature.name}
                                  </div>
                                  <div className="text-gray-500 dark:text-gray-400 text-xs truncate">
                                    {feature.description}
                                  </div>
                                </div>
                                <span className={`ml-2 px-2 py-1 text-xs rounded ${
                                  feature.enabled
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                    : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                }`}>
                                  {feature.enabled ? 'Enabled' : 'Available'}
                                </span>
                              </button>
                            ))}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Quick Actions when no query */}
                  {query === '' && !isLoading && (
                    <div className="p-2">
                      <div className="flex items-center px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                        <BoltIcon className="mr-2 h-4 w-4" />
                        Quick Actions
                      </div>
                      <button
                        className="w-full flex items-center px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg mx-2 mb-1"
                        onClick={() => {
                          setIsOpen(false);
                          router.push('/features/catalog');
                        }}
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-3">
                          <ChartBarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">Browse All Features</div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs">View complete feature catalog</div>
                        </div>
                      </button>
                      
                      <button
                        className="w-full flex items-center px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg mx-2 mb-1"
                        onClick={() => {
                          setIsOpen(false);
                          router.push('/settings/features');
                        }}
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mr-3">
                          <BoltIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">Manage Features</div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs">Enable or disable features</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50">
                  <div className="flex items-center justify-between">
                    <span>Press ESC to close</span>
                    <span>⌘K to reopen</span>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
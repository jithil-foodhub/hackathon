"use client";

import React, { memo, useState } from 'react';
import { X, Grid, Layout, BarChart3, Check, RefreshCw, Settings } from 'lucide-react';
import { LayoutType } from '../types/overview';

interface LayoutCustomizerProps {
  currentLayout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
  onClose: () => void;
}

// Layout Preview Component
const LayoutPreview = memo(({ layout, isSelected, onClick }: {
  layout: LayoutType;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const getLayoutPreview = () => {
    switch (layout) {
      case 'default':
        return (
          <div className="grid grid-cols-4 gap-1 h-16 p-2">
            <div className="col-span-2 bg-blue-200 rounded"></div>
            <div className="col-span-2 bg-purple-200 rounded"></div>
            <div className="col-span-3 bg-green-200 rounded"></div>
            <div className="col-span-1 bg-orange-200 rounded"></div>
            <div className="col-span-1 bg-pink-200 rounded"></div>
            <div className="col-span-1 bg-indigo-200 rounded"></div>
            <div className="col-span-2 bg-red-200 rounded"></div>
          </div>
        );
      case 'compact':
        return (
          <div className="grid grid-cols-6 gap-1 h-16 p-2">
            <div className="col-span-3 bg-blue-200 rounded"></div>
            <div className="col-span-2 bg-purple-200 rounded"></div>
            <div className="col-span-1 bg-orange-200 rounded"></div>
            <div className="col-span-3 bg-green-200 rounded"></div>
            <div className="col-span-2 bg-pink-200 rounded"></div>
            <div className="col-span-1 bg-indigo-200 rounded"></div>
            <div className="col-span-3 bg-red-200 rounded"></div>
            <div className="col-span-3 bg-yellow-200 rounded"></div>
          </div>
        );
      case 'analytics':
        return (
          <div className="grid grid-cols-3 gap-1 h-16 p-2">
            <div className="col-span-2 bg-blue-200 rounded"></div>
            <div className="col-span-1 bg-purple-200 rounded"></div>
            <div className="col-span-1 bg-green-200 rounded"></div>
            <div className="col-span-2 bg-orange-200 rounded"></div>
            <div className="col-span-3 bg-pink-200 rounded"></div>
            <div className="col-span-2 bg-indigo-200 rounded"></div>
            <div className="col-span-1 bg-red-200 rounded"></div>
          </div>
        );
    }
  };

  const getLayoutDescription = () => {
    switch (layout) {
      case 'default':
        return {
          title: 'Default Layout',
          description: 'Balanced view with emphasis on key metrics and call analysis',
          features: ['4-column grid', 'Metrics focused', 'Good for general use']
        };
      case 'compact':
        return {
          title: 'Compact Layout',
          description: 'Space-efficient design for smaller screens and dense information',
          features: ['6-column grid', 'Dense layout', 'Mobile optimized']
        };
      case 'analytics':
        return {
          title: 'Analytics Layout',
          description: 'Data-heavy layout focusing on charts, trends, and performance',
          features: ['3-column grid', 'Chart focused', 'Best for analysis']
        };
    }
  };

  const layoutInfo = getLayoutDescription();

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 text-left rounded-xl border-2 transition-all hover:shadow-md ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className={`font-semibold ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
            {layoutInfo.title}
          </h3>
          <p className={`text-sm ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>
            {layoutInfo.description}
          </p>
        </div>
        {isSelected && (
          <div className="p-1 bg-blue-600 text-white rounded-full">
            <Check className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Preview */}
      <div className={`bg-slate-50 rounded-lg mb-3 ${isSelected ? 'ring-2 ring-blue-200' : ''}`}>
        {getLayoutPreview()}
      </div>

      {/* Features */}
      <div className="space-y-1">
        {layoutInfo.features.map((feature, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-blue-500' : 'bg-slate-400'}`} />
            <span className={`text-xs ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>
              {feature}
            </span>
          </div>
        ))}
      </div>
    </button>
  );
});

LayoutPreview.displayName = 'LayoutPreview';

// Widget Preview Grid Component
const WidgetPreviewGrid = memo(({ layout }: { layout: LayoutType }) => {
  const widgets = [
    { id: 'metrics', name: 'Key Metrics', color: 'bg-blue-100' },
    { id: 'sentiment', name: 'Sentiment', color: 'bg-purple-100' },
    { id: 'callAnalysis', name: 'Call Analysis', color: 'bg-green-100' },
    { id: 'aiSuggestions', name: 'AI Insights', color: 'bg-orange-100' },
    { id: 'performance', name: 'Performance', color: 'bg-pink-100' },
    { id: 'trends', name: 'Trends', color: 'bg-indigo-100' },
    { id: 'recentCalls', name: 'Recent Calls', color: 'bg-red-100' }
  ];

  const layoutConfigs = {
    default: 'grid-cols-4',
    compact: 'grid-cols-6',
    analytics: 'grid-cols-3'
  };

  const widgetSizes = {
    default: {
      metrics: 'col-span-2',
      sentiment: 'col-span-2',
      callAnalysis: 'col-span-3',
      aiSuggestions: 'col-span-1',
      performance: 'col-span-1',
      trends: 'col-span-1',
      recentCalls: 'col-span-2'
    },
    compact: {
      metrics: 'col-span-3',
      sentiment: 'col-span-2',
      aiSuggestions: 'col-span-1',
      callAnalysis: 'col-span-3',
      performance: 'col-span-2',
      trends: 'col-span-1',
      recentCalls: 'col-span-3'
    },
    analytics: {
      performance: 'col-span-2',
      sentiment: 'col-span-1',
      trends: 'col-span-1',
      callAnalysis: 'col-span-2',
      metrics: 'col-span-3',
      aiSuggestions: 'col-span-2',
      recentCalls: 'col-span-1'
    }
  };

  const getWidgetOrder = () => {
    switch (layout) {
      case 'default':
        return ['metrics', 'sentiment', 'callAnalysis', 'aiSuggestions', 'performance', 'trends', 'recentCalls'];
      case 'compact':
        return ['metrics', 'sentiment', 'aiSuggestions', 'callAnalysis', 'performance', 'trends', 'recentCalls'];
      case 'analytics':
        return ['performance', 'sentiment', 'trends', 'callAnalysis', 'metrics', 'aiSuggestions', 'recentCalls'];
    }
  };

  return (
    <div className="bg-slate-50 rounded-lg p-4">
      <h4 className="text-sm font-medium text-slate-700 mb-3">Widget Layout Preview</h4>
      <div className={`grid ${layoutConfigs[layout]} gap-2`}>
        {getWidgetOrder().map((widgetId) => {
          const widget = widgets.find(w => w.id === widgetId);
          if (!widget) return null;
          
          return (
            <div
              key={widgetId}
              className={`${widget.color} ${widgetSizes[layout][widgetId as keyof typeof widgetSizes[typeof layout]]} 
                         h-12 rounded-lg flex items-center justify-center text-xs font-medium text-slate-700`}
            >
              {widget.name}
            </div>
          );
        })}
      </div>
    </div>
  );
});

WidgetPreviewGrid.displayName = 'WidgetPreviewGrid';

export const LayoutCustomizer = memo(({ currentLayout, onLayoutChange, onClose }: LayoutCustomizerProps) => {
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>(currentLayout);
  const [hasChanges, setHasChanges] = useState(false);

  const layouts: LayoutType[] = ['default', 'compact', 'analytics'];

  const handleLayoutSelect = (layout: LayoutType) => {
    setSelectedLayout(layout);
    setHasChanges(layout !== currentLayout);
  };

  const handleApply = () => {
    onLayoutChange(selectedLayout);
    onClose();
  };

  const handleReset = () => {
    setSelectedLayout(currentLayout);
    setHasChanges(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Layout className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Customize Layout</h2>
              <p className="text-sm text-slate-600">Choose your preferred dashboard layout</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Layout Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {layouts.map((layout) => (
              <LayoutPreview
                key={layout}
                layout={layout}
                isSelected={selectedLayout === layout}
                onClick={() => handleLayoutSelect(layout)}
              />
            ))}
          </div>

          {/* Detailed Preview */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Grid className="w-5 h-5 text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-900">
                {selectedLayout.charAt(0).toUpperCase() + selectedLayout.slice(1)} Layout Preview
              </h3>
            </div>
            <WidgetPreviewGrid layout={selectedLayout} />
          </div>

          {/* Layout Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <div className="text-2xl font-bold text-slate-900 mb-1">
                {selectedLayout === 'default' ? '4' : selectedLayout === 'compact' ? '6' : '3'}
              </div>
              <div className="text-sm text-slate-600">Grid Columns</div>
            </div>
            
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <div className="text-2xl font-bold text-slate-900 mb-1">7</div>
              <div className="text-sm text-slate-600">Widgets</div>
            </div>
            
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <div className="text-2xl font-bold text-slate-900 mb-1">
                {selectedLayout === 'analytics' ? 'High' : selectedLayout === 'compact' ? 'Dense' : 'Balanced'}
              </div>
              <div className="text-sm text-slate-600">Density</div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="p-1 bg-blue-100 rounded-lg">
                <Settings className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Layout Tips</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Default: Best for general monitoring and balanced view</li>
                  <li>• Compact: Ideal for smaller screens and quick overview</li>
                  <li>• Analytics: Perfect for deep data analysis and reporting</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-3">
            {hasChanges && (
              <button
                onClick={handleReset}
                className="flex items-center px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!hasChanges}
              className={`flex items-center px-6 py-2 rounded-lg font-medium transition-colors ${
                hasChanges
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4 mr-2" />
              Apply Layout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

LayoutCustomizer.displayName = 'LayoutCustomizer';
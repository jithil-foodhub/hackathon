# Overview Dashboard

A comprehensive dashboard built with Next.js 13+ and React that provides real-time insights into call center performance, sentiment analysis, AI suggestions, and more.

## 📋 Features

### 🎛️ Bento Grid Layout
- **Default Layout**: Balanced 4-column grid perfect for general monitoring
- **Compact Layout**: Dense 6-column grid optimized for smaller screens
- **Analytics Layout**: Chart-focused 3-column grid ideal for data analysis

### 📊 Widgets

#### 1. Key Metrics Widget
- Real-time KPIs including call volume, response time, satisfaction, and conversion rates
- Trend indicators with color-coded status
- Live data updates with performance indicators

#### 2. Sentiment Analysis Widget
- Overall sentiment score with visual progress circle
- Emotion distribution breakdown (positive, neutral, negative)
- 7-day sentiment trends with mini-chart
- Emotional insights breakdown

#### 3. Call Analysis Widget
- Total and average call duration metrics
- Success and conversion rates
- 24-hour call trend visualization
- Top issues tracker with severity indicators
- Real-time line charts

#### 4. AI Suggestions Widget
- Smart recommendations categorized by type (product, sales, tone, process, technical)
- Priority levels (low, medium, high, critical)
- Confidence scores for each suggestion
- Expandable cards with detailed insights
- Trending topics analysis

#### 5. Performance Widget
- KPI tracking with target comparisons
- Agent performance rankings
- Hourly performance metrics
- Status indicators (good, warning, critical)

#### 6. Trends Widget
- Historical data visualization
- Call volume, sentiment, and performance trends
- Topic mention tracking over time
- Switchable views (overview/topics)

#### 7. Recent Calls Widget
- Real-time call feed with status tracking
- Sentiment indicators and outcome badges
- Call duration and agent assignment
- Quick summary statistics

### 🎨 Design Features

#### Visual Excellence
- Modern, trustworthy design with gradient backgrounds
- Consistent color scheme with semantic color coding
- Smooth animations and hover effects
- Responsive design for all screen sizes

#### Interactive Elements
- Layout customization modal with live previews
- Expandable cards for detailed information
- Hover states and smooth transitions
- Real-time data indicators

#### Accessibility
- High contrast ratios for all text
- Clear visual hierarchy
- Keyboard navigation support
- Screen reader friendly structure

## 🏗️ Architecture

### Component Structure
```
app/overview/
├── page.tsx              # Main overview page
├── components/           # Widget components
│   ├── MetricsWidget.tsx
│   ├── SentimentWidget.tsx
│   ├── CallAnalysisWidget.tsx
│   ├── AISparklingWidget.tsx
│   ├── PerformanceWidget.tsx
│   ├── TrendsWidget.tsx
│   ├── RecentCallsWidget.tsx
│   ├── LayoutCustomizer.tsx
│   └── index.ts         # Component exports
├── types/               # TypeScript definitions
│   ├── overview.ts      # All type definitions
│   └── index.ts         # Type exports
├── data/               # Sample data
│   ├── sampleData.ts   # Comprehensive sample data
│   └── index.ts        # Data exports
└── README.md          # This file
```

### Type Safety
- Comprehensive TypeScript definitions for all data structures
- Strict typing for component props and state
- Error handling interfaces
- Layout configuration types

### Data Flow
- Centralized data management with OverviewData interface
- Safe data extraction with optional chaining
- Error boundary handling for each widget
- Real-time data simulation with sample data

## 🔧 Technical Implementation

### Performance Optimizations
- React.memo for all components to prevent unnecessary re-renders
- useMemo hooks for expensive calculations
- Optimized SVG charts and visualizations
- Lazy loading and code splitting ready

### Error Handling
- Comprehensive error boundaries for each widget
- Loading states with skeleton screens
- Graceful fallbacks for missing data
- User-friendly error messages

### Responsive Design
- Mobile-first approach with breakpoint system
- Flexible grid layouts that adapt to screen size
- Touch-friendly interactions
- Optimized chart rendering for mobile

### Custom Visualizations
- Hand-built SVG charts for better performance
- Interactive data points with hover effects
- Gradient fills and smooth animations
- Accessible color schemes

## 🚀 Usage

### Basic Implementation
```tsx
import OverviewPage from '@/app/overview/page';

// The page is ready to use with sample data
export default function Dashboard() {
  return <OverviewPage />;
}
```

### Customizing Layouts
Users can switch between three pre-built layouts:
- Navigate to the overview page
- Click "Customize Layout" button
- Select desired layout and apply changes

### Integrating Real Data
Replace the sample data in `sampleData.ts` with your API calls:

```tsx
const fetchOverviewData = async () => {
  const response = await fetch('/api/overview-data');
  const data = await response.json();
  return data;
};
```

### Adding Custom Widgets
1. Create a new component following the BaseWidgetProps interface
2. Add it to the components index
3. Update the layout configuration
4. Add corresponding data types

## 🎯 Key Benefits

### For Users
- **Comprehensive Insights**: All key metrics in one place
- **Customizable Views**: Layouts that adapt to user preferences  
- **Real-time Updates**: Live data with automatic refresh
- **Intuitive Design**: Easy to understand and navigate

### For Developers
- **Modular Architecture**: Easy to extend and maintain
- **Type Safety**: Full TypeScript coverage
- **Performance Optimized**: Fast rendering and smooth interactions
- **Well Documented**: Clear code structure and documentation

### For Business
- **Better Decision Making**: Data-driven insights at a glance
- **Improved Efficiency**: Streamlined workflow with key metrics
- **Scalable Solution**: Ready to handle growing data volumes
- **Professional Appearance**: Trust-inspiring design that impresses clients

## 🔮 Future Enhancements

### Planned Features
- [ ] Drag-and-drop widget customization
- [ ] Custom date range selections
- [ ] Export functionality for reports
- [ ] Real-time WebSocket connections
- [ ] Advanced filtering and search
- [ ] Mobile app companion

### Integration Ready
- Compatible with REST APIs
- WebSocket support for real-time data
- Database integration ready
- Authentication system compatible

---

Built with ❤️ using Next.js 13+, React, TypeScript, and Tailwind CSS
import React, { useEffect, useRef } from 'react';
// @ts-ignore
import Plotly from 'plotly.js-dist-min';

interface PlotlyChartProps {
  figure: any;
  height?: number | string;
}

export const PlotlyChart: React.FC<PlotlyChartProps> = ({ figure, height = 400 }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !figure) return;

    try {
      const data = figure.data || [];
      const layout = {
        ...(figure.layout || {}),
        autosize: true,
        height: typeof height === 'number' ? height : undefined,
        margin: { t: 40, r: 20, l: 50, b: 40, ...(figure.layout?.margin || {}) },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
      };
      const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
      };

      Plotly.newPlot(containerRef.current, data, layout, config);

      const resizeHandler = () => {
        if (containerRef.current) {
          Plotly.Plots.resize(containerRef.current);
        }
      };

      window.addEventListener('resize', resizeHandler);
      return () => {
        window.removeEventListener('resize', resizeHandler);
        if (containerRef.current) {
          Plotly.purge(containerRef.current);
        }
      };
    } catch (e) {
      console.error('Error rendering Plotly chart:', e);
    }
  }, [figure, height]);

  if (!figure || (!figure.data && !figure.layout)) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
        No chart data available.
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      style={{ width: '100%', minHeight: typeof height === 'number' ? `${height}px` : height }} 
    />
  );
};

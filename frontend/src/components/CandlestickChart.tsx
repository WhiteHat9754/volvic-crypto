'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import {
  BarChart3, Maximize2, Minimize2, AlertCircle, Settings
} from 'lucide-react';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface CandlestickData {
  x: string;
  y: [number, number, number, number];
}

interface CandlestickChartProps {
  symbol: string;
  stockAPI: any;
}

function useWindowSize() {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    function handleResize() {
      if (typeof window !== 'undefined') {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      }
    }
    
    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  return windowSize;
}

const CandlestickChart: React.FC<CandlestickChartProps> = ({ symbol, stockAPI }) => {
  const [timeframe, setTimeframe] = useState('1D');
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dataSource, setDataSource] = useState<'database' | 'mock' | null>(null);

  const windowSize = useWindowSize();

  const chartKey = useMemo(() => 
    `${symbol}-${timeframe}-${chartData.length}-${Date.now()}`, 
    [symbol, timeframe, chartData.length]
  );

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const fetchData = useCallback(async (signal?: AbortSignal) => {
    if (!symbol) {
      setChartData([]);
      return;
    }

    setLoading(true);
    setError(null);
    setDataSource(null);

    try {
      console.log(`📊 Fetching chart data for ${symbol} (${timeframe})`);
      
      const response = await stockAPI.getCandlestickData(symbol, timeframe);

      if (signal?.aborted) return;

      let processedData: CandlestickData[] = [];
      let source: 'database' | 'mock' = 'mock';

      if (response && typeof response === 'object') {
        if ('success' in response && 'data' in response) {
          processedData = response.data || [];
          source = response.metadata?.dataSource === 'database' ? 'database' : 'mock';
        } 
        else if ('fallbackData' in response) {
          processedData = response.fallbackData || [];
          source = 'mock';
        }
        else if (Array.isArray(response)) {
          processedData = response;
          source = 'mock';
        }
      }

      if (Array.isArray(processedData) && processedData.length > 0) {
        const validData = processedData
          .filter(item => {
            return item && 
                   typeof item.x === 'string' && 
                   Array.isArray(item.y) && 
                   item.y.length === 4 &&
                   item.y.every(val => typeof val === 'number' && !isNaN(val) && val > 0);
          })
          .map(item => ({
            x: item.x,
            y: item.y.map(val => Number(val)) as [number, number, number, number]
          }))
          .sort((a, b) => new Date(a.x).getTime() - new Date(b.x).getTime());

        setChartData(validData);
        setDataSource(source);
        console.log(`✅ Chart data processed: ${validData.length} valid points for ${timeframe} (${source})`);
      } else {
        console.warn('No valid chart data received');
        setChartData([]);
        setDataSource('mock');
      }
    } catch (error) {
      if (signal?.aborted) return;
      console.error('❌ Chart data error:', error);
      setError('Failed to load chart data');
      setChartData([]);
      setDataSource(null);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [symbol, timeframe, stockAPI]);

  useEffect(() => {
    const controller = new AbortController();
    
    if (mounted && symbol) {
      fetchData(controller.signal);
    }

    return () => {
      controller.abort();
    };
  }, [mounted, symbol, timeframe, fetchData]);

  const chartHeight = useMemo(() => {
    if (!mounted) return 500;
    if (isFullscreen) {
      return Math.max(600, (windowSize.height || 800) - 150);
    }
    return 500;
  }, [isFullscreen, mounted, windowSize.height]);

  // FIXED: Enhanced chart options to handle candle width and multiple candles
  const chartOptions = useMemo((): ApexOptions => ({
    chart: {
      type: 'candlestick' as const,
      height: chartHeight,
      background: 'transparent',
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        }
      },
      zoom: { 
        enabled: true, 
        type: 'x' as const, 
        autoScaleYaxis: true 
      },
      animations: { enabled: false },
      // FIXED: Add spacing for better candle rendering
      offsetY: 0,
      sparkline: {
        enabled: false
      }
    },
    theme: { mode: 'dark' as const },
    title: {
      text: `${symbol} • ${timeframe} Chart ${dataSource ? `(${dataSource})` : ''}`,
      align: 'left' as const,
      style: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#ffffff',
        fontFamily: 'Inter, system-ui, sans-serif'
      },
    },
    xaxis: {
      type: 'datetime' as const,
      // FIXED: Proper tick configuration for multiple candles
      tickAmount: Math.max(6, Math.min(chartData.length, 20)),
      // FIXED: Remove min/max constraints that can cause single wide candle
      labels: { 
        show: true,
        style: { 
          colors: '#9ca3af', 
          fontSize: '12px',
          fontWeight: '400'
        },
        formatter: function(value: any): string {
          const date = new Date(value);
          
          if (isNaN(date.getTime())) {
            return 'Invalid Date';
          }
          
          switch(timeframe) {
            case '1H':
              return date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false
              });
            case '4H':
              return date.toLocaleString('en-US', { 
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              });
            case '1D':
              return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric'
              });
            case '1W':
              return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric'
              });
            case '1M':
              return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric'
              });
            case '1Y':
              return date.toLocaleDateString('en-US', { 
                month: 'short', 
                year: 'numeric'
              });
            default:
              return date.toLocaleDateString('en-US');
          }
        },
        datetimeUTC: false,
      },
    },
    yaxis: {
      tooltip: { enabled: true },
      labels: {
        show: true,
        style: { colors: '#9ca3af', fontSize: '12px' },
        formatter: (value: number) => `$${value.toFixed(2)}`,
      },
      axisBorder: { 
        show: true,
        color: '#374151' 
      }
    },
    plotOptions: {
      candlestick: {
        colors: { 
          upward: '#10b981', 
          downward: '#ef4444' 
        },
        wick: { 
          useFillColor: true 
        },
        // FIXED: This is crucial for proper candle width
        ...(chartData.length < 10 && {
          // For small datasets, prevent overly wide candles
          columnWidth: '60%'
        })
      },
    },
    // FIXED: Add proper spacing configuration
    dataLabels: { 
      enabled: false 
    },
    grid: { 
      show: true, 
      borderColor: '#374151', 
      strokeDashArray: 1,
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      },
      // FIXED: Add padding to prevent candles from touching edges
      padding: {
        top: 0,
        right: 30,
        bottom: 0,
        left: 10
      }
    },
    tooltip: {
      theme: 'dark' as const,
      style: { 
        fontSize: '12px', 
        fontFamily: 'Inter, system-ui, sans-serif' 
      },
      custom: function({ seriesIndex, dataPointIndex, w }: any) {
        if (!w.globals.initialSeries[seriesIndex] || !w.globals.initialSeries[seriesIndex].data[dataPointIndex]) {
          return '<div class="bg-gray-800 p-3 border border-gray-600 rounded shadow-lg text-white">No data available</div>';
        }
        
        const data = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
        const [open, high, low, close] = data.y;
        const date = new Date(data.x);
        const change = close - open;
        const changePercent = open > 0 ? ((change / open) * 100).toFixed(2) : '0.00';
        
        return `
          <div class="bg-gray-800 p-3 border border-gray-600 rounded shadow-lg">
            <div class="text-white font-semibold mb-2">${symbol}</div>
            <div class="text-xs text-gray-400 mb-2">${date.toLocaleString()}</div>
            <div class="text-sm space-y-1">
              <div class="flex justify-between">
                <span>Open:</span>
                <span class="text-blue-400 font-mono">$${open.toFixed(2)}</span>
              </div>
              <div class="flex justify-between">
                <span>High:</span>
                <span class="text-green-400 font-mono">$${high.toFixed(2)}</span>
              </div>
              <div class="flex justify-between">
                <span>Low:</span>
                <span class="text-red-400 font-mono">$${low.toFixed(2)}</span>
              </div>
              <div class="flex justify-between">
                <span>Close:</span>
                <span class="text-yellow-400 font-mono">$${close.toFixed(2)}</span>
              </div>
              <div class="flex justify-between border-t border-gray-600 pt-1 mt-1">
                <span>Change:</span>
                <span class="${change >= 0 ? 'text-green-400' : 'text-red-400'} font-mono">
                  ${change >= 0 ? '+' : ''}$${change.toFixed(2)} (${changePercent}%)
                </span>
              </div>
            </div>
          </div>
        `;
      }
    }
  }), [symbol, timeframe, chartHeight, chartData.length, dataSource]);

  // FIXED: Enhanced chart series with better timestamp handling
  const chartSeries = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      console.log('No chart data to display');
      return [];
    }

    const seriesData = chartData
      .filter(point => {
        return point && 
               typeof point.x === 'string' && 
               Array.isArray(point.y) && 
               point.y.length === 4 &&
               point.y.every(val => typeof val === 'number' && !isNaN(val));
      })
      .map(point => {
        try {
          let timestamp: number;
          
          if (point.x.includes('T')) {
            timestamp = new Date(point.x).getTime();
          } else if (point.x.match(/^\d{4}-\d{2}-\d{2}$/)) {
            timestamp = new Date(point.x + 'T12:00:00.000Z').getTime();
          } else {
            timestamp = new Date(point.x).getTime();
          }
          
          if (isNaN(timestamp)) {
            console.warn('Invalid date string:', point.x);
            return null;
          }

          return {
            x: timestamp,
            y: point.y
          };
        } catch (error) {
          console.warn('Error processing data point:', point, error);
          return null;
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.x - b.x);

    console.log(`Chart series: ${seriesData.length} valid points processed`);

    return [{
      name: symbol,
      data: seriesData as { x: number; y: [number, number, number, number]; }[]
    }];
  }, [chartData, symbol]);

  const timeframes = [
    { label: '1H', value: '1H' },
    { label: '4H', value: '4H' },
    { label: '1D', value: '1D' },
    { label: '1W', value: '1W' },
    { label: '1M', value: '1M' },
    { label: '1Y', value: '1Y' },
  ];

  const handleRetry = useCallback(() => {
    setError(null);
    fetchData();
  }, [fetchData]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/30">
        <div className="animate-pulse w-full p-4">
          <div className="h-6 bg-gray-700 w-48 mb-4 rounded"></div>
          <div className="h-96 bg-gray-700 w-full rounded"></div>
        </div>
      </div>
    );
  }

  if (!symbol) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/30">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-400 mb-2 font-medium">Select an Asset</p>
          <p className="text-gray-500 text-sm">Choose a stock to view its chart</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-500/30 border-t-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-400 font-medium">Loading {symbol} data...</p>
          <p className="text-gray-500 text-sm mt-1">Timeframe: {timeframe}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/30">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 font-medium mb-2">{error}</p>
          <p className="text-gray-500 text-sm mb-4">Failed to load {symbol} ({timeframe})</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-xl shadow-2xl ${isFullscreen ? 'fixed inset-0 z-50 m-4' : ''}`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-700/30">
        <div className="flex items-center space-x-2">
          {timeframes.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                timeframe === tf.value
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center space-x-2">
          {dataSource && (
            <span className={`px-2 py-1 text-xs rounded ${
              dataSource === 'database' 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {dataSource === 'database' ? 'Live' : 'Demo'}
            </span>
          )}
          <button className="p-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-all">
            <Settings className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-all"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      <div className="p-4">
        {chartSeries.length > 0 && chartSeries[0].data.length > 0 ? (
          <Chart
            key={chartKey}
            options={chartOptions}
            series={chartSeries}
            type="candlestick"
            height={chartHeight}
            width="100%"
          />
        ) : (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 mb-2 font-medium">No chart data available for {symbol}</p>
              <p className="text-gray-400 text-sm mb-4">
                Raw data: {chartData.length} points • Chart series: {chartSeries.length} points
                {dataSource && ` • Source: ${dataSource}`}
              </p>
              <button
                onClick={() => fetchData()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Reload Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandlestickChart;

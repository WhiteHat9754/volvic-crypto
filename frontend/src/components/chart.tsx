import React from 'react';
import Chart from 'react-apexcharts';

interface MarketDataPoint {
  time: string;
  value: number;
}

interface MarketOverviewChartProps {
  marketData: MarketDataPoint[];
}

const MarketOverviewChart: React.FC<MarketOverviewChartProps> = ({ marketData }) => {
  // Dynamic tick calculation based on data length
  const getOptimalTickAmount = (dataLength: number) => {
    if (dataLength <= 7) return dataLength;
    if (dataLength <= 30) return Math.ceil(dataLength / 4);
    if (dataLength <= 90) return Math.ceil(dataLength / 7);
    return Math.ceil(dataLength / 14); // For larger datasets, show every ~14th point
  };

  const options = {
    chart: {
      type: 'area' as const,
      height: 350,
      toolbar: { show: false }
    },
    stroke: {
      curve: 'smooth' as const,
      width: 2
    },
    fill: {
      type: 'gradient' as const,
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.1,
        stops: [0, 100]
      }
    },
    colors: ['#4CAF50'],
    xaxis: {
      type: 'datetime' as const,
      categories: marketData.map(point => point.time),
      title: { text: 'Trading Hours (EST)' },
      labels: {
        show: true,
        rotate: marketData.length > 10 ? -45 : 0, // Auto-rotate if many labels
        hideOverlappingLabels: true,
        showDuplicates: false,
        trim: false,
        style: {
          fontSize: '12px'
        },
        formatter: function(value: string, timestamp?: number) {
          let date;
          
          if (timestamp) {
            date = new Date(timestamp);
          } else {
            date = new Date(value);
          }
          
          if (isNaN(date.getTime())) {
            return value; // Return original if invalid date
          }
          
          // Dynamic formatting based on data span
          const firstDate = new Date(marketData[0]?.time);
          const lastDate = new Date(marketData[marketData.length - 1]?.time);
          const daysDiff = Math.abs(lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysDiff < 1) {
            // Same day data - show time format (HH:MM)
            return date.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            });
          } else if (daysDiff <= 31) {
            // Within a month - show DD-MMM format
            const day = date.getDate().toString().padStart(2, '0');
            const month = date.toLocaleDateString('en-US', { month: 'short' });
            return `${day}-${month}`;
          } else {
            // Longer periods - show MMM-YY format
            const month = date.toLocaleDateString('en-US', { month: 'short' });
            const year = date.getFullYear().toString().slice(-2);
            return `${month}-${year}`;
          }
        }
      },
      tickAmount: getOptimalTickAmount(marketData.length),
      tickPlacement: 'between' as const
    },
    yaxis: {
      title: { text: 'Market Value ($)' },
      labels: {
        formatter: (val: number) => {
          return `$${val.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`;
        }
      }
    },
    grid: {
      borderColor: '#e7e7e7'
    },
    tooltip: {
      x: {
        formatter: function(value: any, { dataPointIndex }: any) {
          const originalTime = marketData[dataPointIndex]?.time;
          const date = new Date(originalTime);
          
          if (isNaN(date.getTime())) {
            return `Time: ${originalTime} EST`;
          }
          
          // Show full datetime in tooltip
          return `Time: ${date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/New_York'
          })} EST`;
        }
      },
      y: {
        formatter: function(val: number) {
          return `$${val.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`;
        }
      }
    }
  };

  const series = [{
    name: 'Market Value',
    data: marketData.map(point => point.value)
  }];

  return <Chart options={options} series={series} type="area" height={350} />;
};

export default MarketOverviewChart;

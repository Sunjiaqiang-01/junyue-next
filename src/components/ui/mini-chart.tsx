'use client';

import React, { useRef, useEffect } from 'react';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

// 注册Chart.js组件
Chart.register(...registerables);

interface MiniChartProps {
  data: number[];
  labels?: string[];
  color?: string;
  height?: number;
  type?: 'line' | 'bar' | 'area';
  showGrid?: boolean;
  showAxes?: boolean;
}

export const MiniChart: React.FC<MiniChartProps> = ({
  data,
  labels,
  color = '#1A2B5C',
  height = 100,
  type = 'line',
  showGrid = false,
  showAxes = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // 销毁旧图表
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const chartLabels = labels || data.map((_, index) => index.toString());

    const config: ChartConfiguration = {
      type: type === 'area' ? 'line' : type,
      data: {
        labels: chartLabels,
        datasets: [{
          data: data,
          borderColor: color,
          backgroundColor: type === 'area' ? `${color}20` : color,
          borderWidth: 2,
          fill: type === 'area',
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: color,
            borderWidth: 1,
          }
        },
        scales: {
          x: {
            display: showAxes,
            grid: {
              display: showGrid,
              color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              display: showAxes
            }
          },
          y: {
            display: showAxes,
            grid: {
              display: showGrid,
              color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              display: showAxes
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        elements: {
          point: {
            radius: 0,
            hoverRadius: 4
          }
        }
      }
    };

    chartRef.current = new Chart(ctx, config);

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data, labels, color, type, showGrid, showAxes]);

  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}; 
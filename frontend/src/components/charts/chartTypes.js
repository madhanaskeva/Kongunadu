import { BarChart3, PieChart, LineChart, Donut } from 'lucide-react';

export const CHART_TYPES = [
  {
    value: 'bar',
    label: 'Bar chart',
    icon: BarChart3,
    description: 'Column and horizontal comparison',
  },
  {
    value: 'pie',
    label: 'Pie chart',
    icon: PieChart,
    description: 'Proportional slice distribution',
  },
  {
    value: 'line',
    label: 'Line chart',
    icon: LineChart,
    description: 'Continuous trend and progression',
  },
  {
    value: 'donut',
    label: 'Donut chart',
    icon: Donut,
    description: 'Ring distribution with center total',
  },
];

export const CHART_LABELS = {
  bar: 'Bar chart',
  pie: 'Pie chart',
  line: 'Line chart',
  donut: 'Donut chart',
};

export const CHART_PALETTE = [
  '#00623F', // Brand green
  '#F29A1F', // Saffron / Orange
  '#D91619', // Red / Crimson
  '#2F7DB5', // Blue / Info
  '#7A4300', // Amber / Brown
  '#5B52D4', // Indigo / Purple
  '#0B7E52', // Emerald
  '#0B6B5C', // Teal
  '#9A3412', // Rust
  '#4A4A46', // Steel Slate
];

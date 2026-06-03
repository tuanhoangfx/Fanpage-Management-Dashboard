import React from 'react';

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon }) => {
  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-5 flex items-center space-x-4 transition-all duration-300 hover:bg-slate-700/50 hover:-translate-y-1 hover:shadow-lg">
      <div className="bg-slate-700 rounded-full p-3">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-400 truncate">{label}</p>
        <p className="text-2xl font-semibold text-slate-100">{value}</p>
      </div>
    </div>
  );
};

export default MetricCard;
import React from "react";
import { AdminOverview } from "@/lib/types";

interface WeeklyTrendChartProps {
  activity: AdminOverview["weeklyActivity"];
}

export function WeeklyTrendChart({ activity }: WeeklyTrendChartProps) {
  const maxVal = Math.max(...activity.map((a) => Math.max(a.incoming, a.resolved)), 6);

  return (
    <div className="p-4 sm:p-5 bg-[#F7F9F7] border border-[#E2E8E3] rounded-[18px] text-left flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-[#121915]">
            Aktivitas Masalah Mingguan
          </h2>
          <p className="text-xs text-[#4A564F]">Perbandingan laporan masuk dan selesai</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[3px] bg-[#141916]" />
            <span className="text-[#4A564F]">Masuk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[3px] bg-[#D2F45A] border border-[#B8DC3C]" />
            <span className="text-[#4A564F]">Selesai</span>
          </div>
        </div>
      </div>

      {/* Chart visualization */}
      <div
        className="flex items-end justify-between gap-2 h-44 pt-6 pb-2 px-2 border-b border-[#E2E8E3]"
        aria-hidden="true"
      >
        {activity.map((item, idx) => {
          const isToday = idx === activity.length - 1;
          const incomingHeight = Math.max((item.incoming / maxVal) * 100, 8);
          const resolvedHeight = Math.max((item.resolved / maxVal) * 100, 8);

          return (
            <div key={item.day} className="flex-1 flex flex-col items-center gap-1.5 group relative">
              {/* Tooltip on hover/focus */}
              <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-[#141916] text-white text-[10px] rounded-[6px] py-1 px-2 pointer-events-none whitespace-nowrap z-10 shadow-md">
                {item.day}: {item.incoming} Masuk, {item.resolved} Selesai
              </div>

              <div className="w-full flex items-end justify-center gap-1 h-32">
                {/* Incoming bar */}
                <div
                  style={{ height: `${incomingHeight}%` }}
                  className={`w-2.5 sm:w-3.5 rounded-t-[4px] transition-all ${
                    isToday ? "bg-[#141916]" : "bg-[#8A968F]"
                  }`}
                />
                {/* Resolved bar */}
                <div
                  style={{ height: `${resolvedHeight}%` }}
                  className="w-2.5 sm:w-3.5 rounded-t-[4px] bg-[#D2F45A] border border-[#B5D839] transition-all"
                />
              </div>
              <span className={`text-[11px] font-medium ${isToday ? "text-[#121915] font-bold" : "text-[#7D8A82]"}`}>
                {item.day}
              </span>
            </div>
          );
        })}
      </div>

      {/* Hidden text for screen readers */}
      <div className="sr-only">
        <table>
          <caption>Aktivitas Laporan Mingguan</caption>
          <thead>
            <tr>
              <th>Hari</th>
              <th>Laporan Masuk</th>
              <th>Laporan Selesai</th>
            </tr>
          </thead>
          <tbody>
            {activity.map((a) => (
              <tr key={a.day}>
                <td>{a.day}</td>
                <td>{a.incoming}</td>
                <td>{a.resolved}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

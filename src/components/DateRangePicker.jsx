import { useState } from 'react';
import { endOfDay, format, startOfDay, subDays } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import * as Popover from '@radix-ui/react-popover';
import 'react-day-picker/dist/style.css';
import { LuCalendar } from 'react-icons/lu';
import { dataColors } from '../utils/dataColors';

const presets = [
  { label: 'Today', range: [new Date(), new Date()] },
  { label: 'Yesterday', range: [subDays(new Date(), 1), subDays(new Date(), 1)] },
  { label: 'Last 7 days', range: [subDays(new Date(), 6), new Date()] },
  { label: 'Last 30 days', range: [subDays(new Date(), 29), new Date()] },
];
const today = new Date();
const sevenDaysAgo = subDays(today, 6);

export default function DateRangePicker({ updateFilter }) {
  const [selectedRange, setSelectedRange] = useState({
    from: sevenDaysAgo,
    to: today,
  });
  const [open, setOpen] = useState(false);

  const handlePreset = (range) => {
    setSelectedRange({ from: range[0], to: range[1] });
  };

  const handleApply = () => {
    const toUtcISOString = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
    const [start, end] = [startOfDay(selectedRange.from), endOfDay(selectedRange.to)];
    const from = toUtcISOString(start); // 👈 ISO 8601 string
    const to = toUtcISOString(end);
    updateFilter({ from: from, to: to });
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger>
        <div
          className={`border-[${dataColors.default}] inline-flex gap-2 items-center !text-back justify-center whitespace-nowrap rounded-md !text-sm disabled:opacity-50 border border-input h-10 px-4 py-2 cursor-pointer text-sm`}
        >
          <LuCalendar size={16} />
          {selectedRange?.from && selectedRange?.to
            ? `${format(selectedRange.from, 'MMM d')} – ${format(selectedRange.to, 'MMM d, yyyy')}`
            : 'Pick a date range'}
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className="bg-white rounded shadow-md p-4 flex gap-4 !text-sm z-100 !text-back" side="bottom" align="start">
          {/* Left: Presets */}
          <div className="w-40 flex flex-col gap-1">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePreset(preset.range)}
                className={`text-left px-4 py-2 rounded hover:bg-[${dataColors.backgroundHover}] cursor-pointer`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Right: Calendar */}
          <div>
            <DayPicker
              mode="range"
              numberOfMonths={2}
              selected={selectedRange}
              onSelect={setSelectedRange}
              showOutsideDays={false}
              className="text-xs"
              modifiersClassNames={{
                selected: 'bg-black',
                range_middle: `!bg-[#f1f5f9]`,
              }}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  setOpen(false);
                }}
                className={`px-3 py-2 rounded-md !text-sm hover:bg-[${dataColors.backgroundHover}] cursor-pointer font-medium border border-[${dataColors.default}]`}
              >
                Close
              </button>
              <button
                onClick={handleApply}
                className="px-3 py-2 rounded-md bg-black text-white !text-sm !text-white cursor-pointer font-medium"
              >
                Apply
              </button>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

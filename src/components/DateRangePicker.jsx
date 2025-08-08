import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import * as Popover from '@radix-ui/react-popover';
import 'react-day-picker/dist/style.css';

const presets = [
  { label: 'Today', range: [new Date(), new Date()] },
  { label: 'Yesterday', range: [subDays(new Date(), 1), subDays(new Date(), 1)] },
  { label: 'Last 7 days', range: [subDays(new Date(), 6), new Date()] },
  { label: 'Last 30 days', range: [subDays(new Date(), 29), new Date()] },
];

export default function DateRangePicker() {
  const [selectedRange, setSelectedRange] = useState();
  const [open, setOpen] = useState(false);

  const handlePreset = (range) => {
    setSelectedRange({ from: range[0], to: range[1] });
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className="border px-3 py-2 rounded text-sm bg-white shadow">
        {selectedRange?.from && selectedRange?.to
          ? `${format(selectedRange.from, 'MMM d')} – ${format(selectedRange.to, 'MMM d, yyyy')}`
          : 'Pick a date range'}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className="bg-white rounded shadow-md p-4 flex gap-4" side="bottom" align="start">
          {/* Left: Presets */}
          <div className="w-40 flex flex-col gap-1">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePreset(preset.range)}
                className="text-left px-2 py-1 rounded hover:bg-gray-100 text-sm"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Right: Calendar */}
          <div>
            <DayPicker mode="range" numberOfMonths={2} selected={selectedRange} onSelect={setSelectedRange} showOutsideDays />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  setSelectedRange(undefined);
                  setOpen(false);
                }}
                className="px-3 py-1 rounded bg-gray-100 text-sm hover:bg-gray-200"
              >
                Close
              </button>
              <button onClick={() => setOpen(false)} className="px-3 py-1 rounded bg-black text-white text-sm">
                Apply
              </button>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

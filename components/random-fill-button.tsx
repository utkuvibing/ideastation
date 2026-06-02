'use client';

type Props = {
  fill: () => Record<string, string>;
  label?: string;
};

export function RandomFillButton({ fill, label = 'Random doldur' }: Props) {
  return (
    <button
      type="button"
      className="border border-zinc-300 dark:border-zinc-600 bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
      onClick={(e) => {
        const form = e.currentTarget.closest('form');
        if (!form) return;
        const data = fill();
        for (const [name, value] of Object.entries(data)) {
          const el = form.elements.namedItem(name);
          if (el instanceof RadioNodeList) {
            for (const node of el) {
              if (node instanceof HTMLInputElement && node.value === value) node.checked = true;
            }
          } else if (
            el instanceof HTMLInputElement ||
            el instanceof HTMLTextAreaElement ||
            el instanceof HTMLSelectElement
          ) {
            el.value = value;
            el.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      }}
    >
      {label}
    </button>
  );
}

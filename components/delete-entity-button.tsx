'use client';

import { useState } from 'react';

export function DeleteEntityButton({
  action,
  entityId,
  idField,
  entityName,
  entityType,
}: {
  action: (formData: FormData) => void | Promise<void>;
  entityId: number;
  idField: 'app_id' | 'idea_id';
  entityName: string;
  entityType: 'app' | 'fikir';
}) {
  const [pending, setPending] = useState(false);

  return (
    <form
      action={action}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `“${entityName}” ${entityType} kaydını silmek istediğinizden emin misiniz?\n\nBu kayıt veritabanından kalıcı olarak silinecektir ve işlem geri alınamaz.`,
        );
        if (!confirmed) {
          event.preventDefault();
          return;
        }
        setPending(true);
      }}
    >
      <input type="hidden" name={idField} value={entityId} />
      <button type="submit" disabled={pending} className="btn-danger">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6" />
        </svg>
        {pending ? 'Siliniyor...' : `${entityType === 'app' ? 'App’i' : 'Fikri'} sil`}
      </button>
    </form>
  );
}

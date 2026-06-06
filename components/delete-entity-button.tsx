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
      <button
        type="submit"
        disabled={pending}
        className="border border-red-500/50 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 dark:bg-red-600 dark:text-white"
      >
        {pending ? 'Siliniyor...' : `${entityType === 'app' ? 'App’i' : 'Fikri'} sil`}
      </button>
    </form>
  );
}

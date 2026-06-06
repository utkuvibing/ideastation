export const ideaStatuses = [
  { id: 'draft', label: 'Taslak' },
  { id: 'needs_feedback', label: 'Geri bildirim' },
  { id: 'approved', label: 'Onaylandı' },
  { id: 'needs_script', label: 'Senaryo gerekli' },
  { id: 'ready_to_shoot', label: 'Çekime hazır' },
  { id: 'shooting', label: 'Çekiliyor' },
  { id: 'shot', label: 'Çekildi' },
  { id: 'editing', label: 'Kurguda' },
  { id: 'published', label: 'Yayınlandı' },
  { id: 'rejected', label: 'Reddedildi' },
  { id: 'archived', label: 'Arşiv' },
] as const;

export type IdeaStatus = (typeof ideaStatuses)[number]['id'];


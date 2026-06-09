import { z } from 'zod';
import { ideaStatuses } from '@/lib/idea-statuses';

const optionalText = (max: number) => z.string().trim().max(max).optional().default('');
const optionalUrl = z.union([z.literal(''), z.string().trim().url().max(2048)]).optional().default('');

export const appSchema = z.object({
  name: z.string().trim().min(1).max(200),
  category: optionalText(200),
  one_liner: optionalText(1000),
  target_audience: optionalText(5000),
  main_problem: optionalText(5000),
  core_features: optionalText(10000),
  unique_selling_points: optionalText(10000),
  competitors: optionalText(10000),
  brand_tone: optionalText(5000),
  content_style: optionalText(5000),
  dos: optionalText(10000),
  donts: optionalText(10000),
  winning_ads: optionalText(20000),
  failed_ads: optionalText(20000),
  app_store_link: optionalUrl,
  play_store_link: optionalUrl,
  ai_instructions: optionalText(20000),
});

export const ideaSchema = z.object({
  app_id: z.coerce.number().int().positive(),
  title: z.string().trim().min(1).max(200),
  format: optionalText(100),
  status: z.enum(ideaStatuses.map((status) => status.id) as [string, ...string[]]),
  description: optionalText(20000),
  hook: optionalText(10000),
  script: optionalText(50000),
  storyboard: optionalText(50000),
  visual_notes: optionalText(20000),
  voiceover: optionalText(20000),
  caption: optionalText(20000),
  cta: optionalText(5000),
  hashtags: optionalText(5000),
  why_it_might_work: optionalText(20000),
  risks: optionalText(20000),
  production_difficulty: optionalText(1000),
  ai_score: z.union([z.literal(''), z.coerce.number().int().min(0).max(10)]).optional().default(''),
  source: optionalText(5000),
  competitor_url: optionalUrl,
  competitor_notes: optionalText(20000),
  owner: z.string().trim().email().or(z.literal('')).optional().default(''),
  team: optionalText(200),
  deadline: z.union([z.literal(''), z.string().date()]).optional().default(''),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  tags: optionalText(2000),
  campaign: optionalText(200),
  channel: optionalText(100),
  country: optionalText(100),
  language: optionalText(100),
});

export const performanceSchema = z.object({
  idea_id: z.coerce.number().int().positive(),
  platform: z.string().trim().min(1).max(100),
  report_date: z.string().date(),
  spend: z.coerce.number().min(0),
  impressions: z.coerce.number().int().min(0),
  views: z.coerce.number().int().min(0),
  clicks: z.coerce.number().int().min(0),
  installs: z.coerce.number().int().min(0),
  conversions: z.coerce.number().int().min(0),
  revenue: z.coerce.number().min(0),
});

export const feedbackSchema = z.object({
  idea_id: z.coerce.number().int().positive(),
  sentiment: optionalText(50),
  viral_score: z.coerce.number().int().min(0).max(10),
  ease_score: z.coerce.number().int().min(0).max(10),
  brand_fit_score: z.coerce.number().int().min(0).max(10),
  originality_score: z.coerce.number().int().min(0).max(10),
  comment: optionalText(10000),
});

export function formObject(form: FormData, fields: readonly string[]) {
  return Object.fromEntries(fields.map((field) => [field, String(form.get(field) ?? '')]));
}

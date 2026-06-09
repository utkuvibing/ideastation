import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function responseParagraphs(response: string) {
  return response.split(/\r?\n/).map((line) => {
    const text = line.trim();
    if (!text) return new Paragraph({ spacing: { after: 80 } });
    if (/^Fikir\s+\d+\s*:/i.test(text)) {
      return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 100 } });
    }
    const field = text.match(/^(Persona|Hook|Concept|Script|Storyboard|CTA|Why it works|Risks):\s*(.*)$/i);
    if (field) {
      return new Paragraph({
        children: [new TextRun({ text: `${field[1]}: `, bold: true }), new TextRun(field[2])],
        spacing: { after: 100 },
      });
    }
    if (/^\d+\.\s/.test(text)) {
      return new Paragraph({ text: text.replace(/^\d+\.\s*/, ''), numbering: { reference: 'shots', level: 0 } });
    }
    return new Paragraph({ text, spacing: { after: 100 } });
  });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole('viewer');
  const { id } = await params;
  const generation = db.prepare(`
    SELECT ai_generations.*, apps.name app_name
    FROM ai_generations LEFT JOIN apps ON apps.id=ai_generations.app_id
    WHERE ai_generations.id=?
  `).get(id) as { id: number; action: string; model: string; response: string; app_name?: string; created_at: string } | undefined;
  if (!generation) return new Response('Generation not found.', { status: 404 });

  const document = new Document({
    numbering: {
      config: [{
        reference: 'shots',
        levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: 'left' }],
      }],
    },
    sections: [{
      properties: {},
      children: [
        new Paragraph({ text: 'IdeaStation AI Brainstorm', heading: HeadingLevel.TITLE }),
        new Paragraph({ children: [new TextRun({ text: 'App: ', bold: true }), new TextRun(generation.app_name || 'App secilmedi')] }),
        new Paragraph({ children: [new TextRun({ text: 'Action: ', bold: true }), new TextRun(generation.action)] }),
        new Paragraph({ children: [new TextRun({ text: 'Model: ', bold: true }), new TextRun(generation.model)] }),
        new Paragraph({ children: [new TextRun({ text: 'Olusturulma: ', bold: true }), new TextRun(generation.created_at)] }),
        new Paragraph({ text: 'Fikirler', heading: HeadingLevel.HEADING_1, spacing: { before: 300 } }),
        ...responseParagraphs(generation.response),
      ],
    }],
  });
  const buffer = await Packer.toBuffer(document);
  return new Response(new Uint8Array(buffer), {
    headers: {
      'content-type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'content-disposition': `attachment; filename="ideastation-brainstorm-${generation.id}.docx"`,
    },
  });
}

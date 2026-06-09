export function mentionedEmails(body: string) {
  return Array.from(new Set(body.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g)?.map((email) => email.toLowerCase()) || []));
}

export function hasSensitiveData(text: string) {
  return /(?:\b\d{3}-?\d{2}-?\d{4}\b)|(?:\b(?:\d[ -]*?){13,16}\b)|(?:api[_-]?key|secret|password)\s*[:=]/i.test(text);
}

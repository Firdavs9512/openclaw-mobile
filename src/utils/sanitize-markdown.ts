/**
 * Streaming markdown matndan yopilmagan/incomplete konstruksiyalarni
 * tozalab, markdown parserga xavfsiz uzatish uchun tayyorlaydi.
 *
 * Asosiy maqsad: partial bold (`**bol`), partial code fence, partial link
 * kabi holatlarni render paytida raw ko'rsatmaslik.
 */

/** Cursor joylashuvini belgilash uchun sentinel belgi */
export const CURSOR_SENTINEL = '\u200B\uFFFD';

/**
 * Streaming paytida yopilmagan markdown konstruksiyalarni strip/close qiladi.
 * Pure funksiya — bir xil input uchun doim bir xil output qaytaradi.
 */
export function sanitizePartialMarkdown(text: string): string {
  if (!text) return text;

  let result = text;

  // 1. Yopilmagan code fence (``` juft bo'lmasa, oxiriga yopuvchi ``` qo'shish)
  const fenceRegex = /^(`{3,})/gm;
  let fenceCount = 0;
  while (fenceRegex.exec(result) !== null) {
    fenceCount++;
  }
  if (fenceCount % 2 !== 0) {
    result += '\n```';
    // Code fence ichida bo'lsa, boshqa inline sanitizatsiyalar kerak emas
    return result;
  }

  // 2. Oxirgi qatorni ajratish — inline konstruksiyalar faqat shu qatorda tekshiriladi
  const lastNewlineIdx = result.lastIndexOf('\n');
  const beforeLastLine = result.slice(0, lastNewlineIdx + 1);
  let lastLine = result.slice(lastNewlineIdx + 1);

  // 3. Yopilmagan link: [text yoki [text](url
  //    Oxirgi yopilmagan `[` ni topish
  const unclosedBracket = findUnclosedBracket(lastLine);
  if (unclosedBracket !== -1) {
    lastLine = lastLine.slice(0, unclosedBracket);
    return beforeLastLine + lastLine;
  }

  // 4. Yopilmagan inline code (backtick)
  //    Juft bo'lmagan ` larni tekshirish
  if (hasUnclosedInlineCode(lastLine)) {
    const lastBacktick = lastLine.lastIndexOf('`');
    lastLine = lastLine.slice(0, lastBacktick);
    return beforeLastLine + lastLine;
  }

  // 5. Yopilmagan bold/italic
  //    Trailing ** yoki * ni olib tashlash
  lastLine = stripTrailingUnclosedEmphasis(lastLine);

  return beforeLastLine + lastLine;
}

/**
 * Oxirgi yopilmagan `[` indeksini qaytaradi.
 * Agar barcha `[` lar `](...)` bilan yopilgan bo'lsa, -1 qaytaradi.
 */
function findUnclosedBracket(line: string): number {
  // Oxiridan boshlab `[` qidirish
  for (let i = line.length - 1; i >= 0; i--) {
    if (line[i] === '[') {
      // Bu `[` dan keyin `]` bormi?
      const closingBracket = line.indexOf(']', i);
      if (closingBracket === -1) {
        // `]` topilmadi — yopilmagan
        return i;
      }
      // `]` bor, keyin `(` bormi?
      if (closingBracket + 1 < line.length && line[closingBracket + 1] === '(') {
        // `)` bormi?
        const closingParen = line.indexOf(')', closingBracket + 2);
        if (closingParen === -1) {
          // `](url` — URL yopilmagan
          return i;
        }
        // To'liq yopilgan [text](url) — davom etish
      }
      // [text] — faqat bracket, yopilgan
    }
  }
  return -1;
}

/**
 * Inline code (backtick) yopilmaganligini tekshiradi.
 * Code fence (```) dan farq qilish kerak.
 */
function hasUnclosedInlineCode(line: string): boolean {
  let count = 0;
  let i = 0;
  while (i < line.length) {
    if (line[i] === '`') {
      // Triple backtick code fence emas, chunki u alohida tekshirilgan
      // Lekin inline `` (double backtick) bo'lishi mumkin
      while (i < line.length && line[i] === '`') {
        i++;
      }
      count++;
    } else {
      i++;
    }
  }
  return count % 2 !== 0;
}

/**
 * Trailing yopilmagan ** yoki * ni olib tashlaydi.
 *
 * Masalan:
 *  "Salom **qalin" → "Salom "
 *  "Salom *kursiv" → "Salom "
 *  "**qalin** va *kursiv" → "**qalin** va " (birinchi juft yopilgan, ikkinchisi yo'q)
 */
function stripTrailingUnclosedEmphasis(line: string): string {
  // Bold (**) tekshirish
  let result = stripTrailingUnclosed(line, '**');
  // Italic (*) tekshirish — ** ichidagi * ga tegmaslik kerak
  result = stripTrailingUnclosed(result, '*');
  // Bold/italic (__) va (_) ham
  result = stripTrailingUnclosed(result, '__');
  result = stripTrailingUnclosed(result, '_');
  // Strikethrough (~~)
  result = stripTrailingUnclosed(result, '~~');

  return result;
}

/**
 * Berilgan marker (**, *, __, _, ~~) uchun oxirgi yopilmagan holatni
 * topib, o'sha joydan kesiladi.
 */
function stripTrailingUnclosed(line: string, marker: string): string {
  // Markerning barcha pozitsiyalarini topish
  const positions: number[] = [];
  let searchFrom = 0;

  while (searchFrom < line.length) {
    const idx = line.indexOf(marker, searchFrom);
    if (idx === -1) break;

    // Ikki belgili marker uchun: agar ** ni qidiryapmiz va *** bo'lsa,
    // to'g'ri handle qilish
    if (marker.length === 1 && marker === '*') {
      // ** allaqachon alohida tekshirilgan, shuning uchun * faqat yolg'iz * ni topishi kerak
      if (idx > 0 && line[idx - 1] === '*') {
        searchFrom = idx + 1;
        continue;
      }
      if (idx + 1 < line.length && line[idx + 1] === '*') {
        searchFrom = idx + 2;
        continue;
      }
    }

    if (marker.length === 1 && marker === '_') {
      if (idx > 0 && line[idx - 1] === '_') {
        searchFrom = idx + 1;
        continue;
      }
      if (idx + 1 < line.length && line[idx + 1] === '_') {
        searchFrom = idx + 2;
        continue;
      }
    }

    positions.push(idx);
    searchFrom = idx + marker.length;
  }

  // Juft bo'lmasa (toq sonli marker), oxirgisidan kesish
  if (positions.length % 2 !== 0 && positions.length > 0) {
    return line.slice(0, positions[positions.length - 1]);
  }

  return line;
}

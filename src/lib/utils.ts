export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function validateColumns(cols: number): 2 | 3 | 4 {
  return (cols === 2 || cols === 3 || cols === 4) ? cols as 2 | 3 | 4 : 3;
}


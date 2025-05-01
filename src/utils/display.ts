export function dateDisplay(date: string): string {
  const [year, month, day] = date.split('-');
  const formattedDate = `${parseInt(month)}/${parseInt(day)}/${year.slice(-2)}`;
  return formattedDate;
}

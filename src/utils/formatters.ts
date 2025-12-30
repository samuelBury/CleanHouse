// Fonctions de formatage pour CleanHouse
import { MONTHS, DAYS_FULL } from '../config/constants';

export const formatters = {
  // Format date: DD/MM/YYYY
  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  },

  // Format date with month name: 15 Janvier 2024
  formatDateLong(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = d.getDate();
    const month = MONTHS[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  },

  // Format date short: 15 Jan
  formatDateShort(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = d.getDate();
    const month = MONTHS[d.getMonth()].slice(0, 3);
    return `${day} ${month}`;
  },

  // Format time: HH:MM
  formatTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  // Calculate end time
  calculateEndTime(startTime: string, duration: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + duration;
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  },

  // Format currency
  formatCurrency(amount: number, currency: string = '€'): string {
    return `${amount.toFixed(2)} ${currency}`;
  },

  // Format price
  formatPrice(amount: number): string {
    return `${amount}€`;
  },

  // Format phone number: 06 12 34 56 78
  formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    let formatted = '';
    for (let i = 0; i < cleaned.length && i < 10; i++) {
      if (i > 0 && i % 2 === 0) {
        formatted += ' ';
      }
      formatted += cleaned[i];
    }
    return formatted;
  },

  // Format card number: 1234 5678 9012 3456
  formatCardNumber(number: string): string {
    const cleaned = number.replace(/\s/g, '').replace(/\D/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19);
  },

  // Format expiry date: MM/YY
  formatExpiryDate(text: string): string {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  },

  // Format duration
  formatDuration(hours: number): string {
    return `${hours} heure${hours > 1 ? 's' : ''}`;
  },

  // Get day of week
  getDayOfWeek(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const dayIndex = d.getDay();
    // Adjust for Monday start (0 = Monday in our system)
    const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    return DAYS_FULL[adjustedIndex];
  },

  // Parse date from DD/MM/YYYY format
  parseDate(dateStr: string): Date {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  },

  // Format relative time (il y a X minutes/heures/jours)
  formatRelativeTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return formatters.formatDateShort(d);
  },

  // Capitalize first letter
  capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  // Truncate text
  truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
  },
};

export default formatters;

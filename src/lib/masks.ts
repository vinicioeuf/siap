// ========================================
// Input Masking Utilities for Brazilian Documents
// ========================================

/**
 * Applies CPF mask: 000.000.000-00
 * Limits to 11 digits, blocks further input.
 */
export function maskCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/**
 * Applies phone mask: (00) 00000-0000 or (00) 0000-0000
 * Adapts for 10 (landline) or 11 (mobile) digits.
 */
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/**
 * Removes all non-digit characters from a string.
 */
export function unmask(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Formats a raw CPF string for display.
 */
export function formatCPF(cpf: string | null | undefined): string {
  if (!cpf) return '—';
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return maskCPF(digits);
}

/**
 * Formats a raw phone string for display.
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return phone;
  return maskPhone(digits);
}

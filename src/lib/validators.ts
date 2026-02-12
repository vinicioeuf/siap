// ========================================
// CPF & Phone Validation Utilities
// ========================================

/**
 * Validates a Brazilian CPF number using the official algorithm.
 * Accepts only the 11 raw digits (no mask).
 */
export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;

  // Reject known invalid sequences (all same digit)
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let rest = 11 - (sum % 11);
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cleaned.charAt(9))) return false;

  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  rest = 11 - (sum % 11);
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cleaned.charAt(10))) return false;

  return true;
}

/**
 * Validates a Brazilian phone number (10 or 11 digits).
 * 10 digits = landline, 11 digits = mobile (with 9th digit).
 */
export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 11;
}

/**
 * Validates email format.
 */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validates password strength (min 6 characters).
 */
export function validatePassword(password: string): boolean {
  return password.length >= 6;
}

// ========================================
// Form Validation Errors
// ========================================

export interface FormErrors {
  [field: string]: string;
}

export function validateAlunoForm(form: {
  full_name: string;
  email: string;
  password: string;
  matricula: string;
  cpf: string;
  phone: string;
}): FormErrors {
  const errors: FormErrors = {};

  if (!form.full_name || form.full_name.trim().length < 3) {
    errors.full_name = "Nome deve ter pelo menos 3 caracteres";
  }
  if (!form.email || !validateEmail(form.email)) {
    errors.email = "E-mail inválido";
  }
  if (!form.password || !validatePassword(form.password)) {
    errors.password = "Senha deve ter pelo menos 6 caracteres";
  }
  if (!form.matricula || form.matricula.trim().length === 0) {
    errors.matricula = "Matrícula é obrigatória";
  }

  const cpfDigits = form.cpf.replace(/\D/g, '');
  if (cpfDigits.length > 0) {
    if (cpfDigits.length !== 11) {
      errors.cpf = "CPF deve ter 11 dígitos";
    } else if (!validateCPF(cpfDigits)) {
      errors.cpf = "CPF inválido (dígitos verificadores incorretos)";
    }
  }

  const phoneDigits = form.phone.replace(/\D/g, '');
  if (phoneDigits.length > 0) {
    if (!validatePhone(phoneDigits)) {
      errors.phone = "Telefone deve ter 10 ou 11 dígitos";
    }
  }

  return errors;
}

export function validateUserForm(form: {
  full_name: string;
  email: string;
  password: string;
  phone: string;
}): FormErrors {
  const errors: FormErrors = {};

  if (!form.full_name || form.full_name.trim().length < 3) {
    errors.full_name = "Nome deve ter pelo menos 3 caracteres";
  }
  if (!form.email || !validateEmail(form.email)) {
    errors.email = "E-mail inválido";
  }
  if (!form.password || !validatePassword(form.password)) {
    errors.password = "Senha deve ter pelo menos 6 caracteres";
  }

  const phoneDigits = form.phone.replace(/\D/g, '');
  if (phoneDigits.length > 0 && !validatePhone(phoneDigits)) {
    errors.phone = "Telefone deve ter 10 ou 11 dígitos";
  }

  return errors;
}

export function validateNotaValue(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined || value === '') return true;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num >= 0 && num <= 10;
}

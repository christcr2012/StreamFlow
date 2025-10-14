/**
 * Currency Utilities
 * 
 * Provides currency formatting, symbols, and conversion helpers
 */

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: Record<string, Currency> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimals: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimals: 2,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    decimals: 2,
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    decimals: 2,
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    decimals: 2,
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    decimals: 0,
  },
  CHF: {
    code: 'CHF',
    symbol: 'CHF',
    name: 'Swiss Franc',
    decimals: 2,
  },
  CNY: {
    code: 'CNY',
    symbol: '¥',
    name: 'Chinese Yuan',
    decimals: 2,
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    decimals: 2,
  },
  MXN: {
    code: 'MXN',
    symbol: 'MX$',
    name: 'Mexican Peso',
    decimals: 2,
  },
};

/**
 * Get currency symbol for a currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES[currencyCode.toUpperCase()];
  return currency?.symbol || currencyCode;
}

/**
 * Get currency info
 */
export function getCurrency(currencyCode: string): Currency | null {
  return SUPPORTED_CURRENCIES[currencyCode.toUpperCase()] || null;
}

/**
 * Format amount with currency symbol
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'USD',
  options: {
    showSymbol?: boolean;
    showCode?: boolean;
    locale?: string;
  } = {}
): string {
  const {
    showSymbol = true,
    showCode = false,
    locale = 'en-US',
  } = options;

  const currency = getCurrency(currencyCode);
  if (!currency) {
    return amount.toFixed(2);
  }

  const formatted = new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  }).format(amount);

  if (showSymbol && showCode) {
    return `${currency.symbol}${formatted} ${currency.code}`;
  } else if (showSymbol) {
    return `${currency.symbol}${formatted}`;
  } else if (showCode) {
    return `${formatted} ${currency.code}`;
  } else {
    return formatted;
  }
}

/**
 * Format amount for display (with symbol)
 */
export function formatAmount(amount: number, currencyCode: string = 'USD'): string {
  return formatCurrency(amount, currencyCode, { showSymbol: true });
}

/**
 * Format amount for input (no symbol)
 */
export function formatAmountForInput(amount: number, currencyCode: string = 'USD'): string {
  const currency = getCurrency(currencyCode);
  if (!currency) {
    return amount.toFixed(2);
  }
  return amount.toFixed(currency.decimals);
}

/**
 * Parse amount from string
 */
export function parseAmount(value: string, currencyCode: string = 'USD'): number {
  // Remove currency symbols and whitespace
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Get list of supported currencies for dropdown
 */
export function getCurrencyOptions(): Array<{ value: string; label: string }> {
  return Object.values(SUPPORTED_CURRENCIES).map((currency) => ({
    value: currency.code,
    label: `${currency.symbol} ${currency.name} (${currency.code})`,
  }));
}

/**
 * Validate currency code
 */
export function isValidCurrency(currencyCode: string): boolean {
  return currencyCode.toUpperCase() in SUPPORTED_CURRENCIES;
}

/**
 * Convert Decimal to number for currency formatting
 */
export function decimalToNumber(decimal: any): number {
  if (typeof decimal === 'number') {
    return decimal;
  }
  if (typeof decimal === 'string') {
    return parseFloat(decimal);
  }
  if (decimal && typeof decimal.toNumber === 'function') {
    return decimal.toNumber();
  }
  return Number(decimal);
}

/**
 * Format Decimal with currency
 */
export function formatDecimalCurrency(decimal: any, currencyCode: string = 'USD'): string {
  const amount = decimalToNumber(decimal);
  return formatCurrency(amount, currencyCode);
}


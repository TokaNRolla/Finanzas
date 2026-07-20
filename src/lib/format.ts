export function formatMoney(amount: number) {
  return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
}

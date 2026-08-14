export interface InitData {
  type: 'text' | 'password' | 'textarea' | 'select' | 'divider' | 'button'
  label?: string
  description?: string
  default?: string
  options?: Record<string, string>
  onClick?: (evt: MouseEvent) => void
}

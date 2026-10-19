export type UpdateCheckStatus =
  | 'idle'
  | 'checking'
  | 'update_available'
  | 'up_to_date'
  | 'throttled'
  | 'error'

export interface UpdateInfo {
  status: UpdateCheckStatus
  currentVersion: string
  availableVersion?: string
  lastCheckedTime: number
  isExtension: boolean
  error?: string
}

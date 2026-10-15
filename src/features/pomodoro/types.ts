export type PomodoroMode = 'work' | 'break' | 'longbreak'

export interface PomodoroConfig {
  showPomodoro: boolean
  workDuration: number // in minutes (default 25)
  breakDuration: number // in minutes (default 5)
  soundEnabled: boolean
}

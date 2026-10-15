export type NewTabMode = 'aura' | 'redirect'
export type StartupMode = 'aura' | 'custom_url'

export interface BrowserBehaviorConfig {
  newTabMode: NewTabMode
  newTabRedirectUrl: string
  startupMode: StartupMode
  startupUrl: string
  homepageUrl: string
  redirectCountdown: number // in seconds before redirecting (0 = instant)
}

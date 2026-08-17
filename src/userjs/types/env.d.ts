declare global {
  namespace NodeJS {
    interface ProcessEnv {
      USERJS_NAMESPACE?: string
      USERJS_AUTHOR?: string
      USERJS_LICENSE?: string
      USERJS_UPDATE_URL?: string
      USERJS_DOWNLOAD_URL?: string
    }
  }
}

export {}

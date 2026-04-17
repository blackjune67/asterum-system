import type { Logger, Plugin } from 'vite'

export function formatDevBanner(appName: string): string {
  const border = `+${'-'.repeat(appName.length + 2)}+`

  return ['', border, `| ${appName} |`, border, ''].join('\n')
}

function logDevBanner(logger: Logger, appName: string) {
  logger.info(formatDevBanner(appName), {
    clear: false,
    timestamp: false,
  })
}

export function createDevBannerPlugin(appName: string): Plugin {
  return {
    name: 'asterum-dev-banner',
    apply: 'serve',
    configureServer(server) {
      if (!server.httpServer) {
        logDevBanner(server.config.logger, appName)
        return
      }

      server.httpServer.once('listening', () => {
        logDevBanner(server.config.logger, appName)
      })
    },
  }
}

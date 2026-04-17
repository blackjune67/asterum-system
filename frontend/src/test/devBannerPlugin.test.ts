import { EventEmitter } from 'node:events'
import type { Logger, ViteDevServer } from 'vite'

import { createDevBannerPlugin, formatDevBanner } from '../devBannerPlugin'

function createLoggerSpy(): Logger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    warnOnce: vi.fn(),
    error: vi.fn(),
    clearScreen: vi.fn(),
    hasErrorLogged: vi.fn(() => false),
    hasWarned: false,
  }
}

test('formats the configured app name as a boxed banner', () => {
  expect(formatDevBanner('ASTERUM-SYSTEM-FRONT')).toBe(
    [
      '',
      '+----------------------+',
      '| ASTERUM-SYSTEM-FRONT |',
      '+----------------------+',
      '',
    ].join('\n'),
  )
})

test('logs the banner once when the dev server starts listening', () => {
  const httpServer = new EventEmitter()
  const logger = createLoggerSpy()
  const plugin = createDevBannerPlugin('ASTERUM-SYSTEM-FRONT')
  const server = {
    httpServer,
    config: { logger },
  } as Pick<ViteDevServer, 'httpServer' | 'config'> as ViteDevServer

  expect(plugin.name).toBe('asterum-dev-banner')
  expect(plugin.apply).toBe('serve')

  expect(typeof plugin.configureServer).toBe('function')

  if (typeof plugin.configureServer !== 'function') {
    throw new Error('configureServer hook is not callable')
  }

  plugin.configureServer.call({} as never, server)

  httpServer.emit('listening')
  httpServer.emit('listening')

  expect(logger.info).toHaveBeenCalledTimes(1)
  expect(logger.info).toHaveBeenCalledWith(
    expect.stringContaining('ASTERUM-SYSTEM-FRONT'),
    expect.objectContaining({
      clear: false,
      timestamp: false,
    }),
  )
})

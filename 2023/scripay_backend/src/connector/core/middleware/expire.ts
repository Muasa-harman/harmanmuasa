import { Errors } from 'ilp-packet'
import { ILPContext } from '../Scripay'

const { TransferTimedOutError } = Errors

/**
 * This middleware should be at the end of the outgoing pipeline to ensure
 * the whole pipeline process the reject that is generated when a prepare expires
 */
export function createOutgoingExpireMiddleware() {
  return async (
    { request, services: { logger } }: ILPContext,
    next: () => Promise<void>
  ): Promise<void> => {
    const { expiresAt } = request.prepare
    const duration = expiresAt.getTime() - Date.now()
    const timeout = setTimeout(() => {
      logger.debug({ request }, 'packet expired')
      throw new TransferTimedOutError('packet expired.')
    }, duration)

    await next().finally(() => {
      clearTimeout(timeout)
    })
  }
}

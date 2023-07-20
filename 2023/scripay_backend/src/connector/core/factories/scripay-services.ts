import * as crypto from 'crypto'
import { Factory } from 'rosie'
import { Redis } from 'ioredis'
import { StreamServer } from '@interledger/stream-receiver'
import { ScripayServices } from '../Scripay'
import { MockAccountingService } from '../test/mocks/accounting-service'
import { TestLoggerFactory } from './test-logger'

interface MockScripayServices extends ScripayServices {
  accounting: MockAccountingService
}

export const ScripayServicesFactory = Factory.define<MockScripayServices>(
  'PeerInfo'
)
  //.attr('router', ['peers'], (peers: InMemoryPeers) => {
  //  return new InMemoryRouter(peers, { ilpAddress: 'test.rafiki' })
  //})
  .option('ilpAddress', 'test.scripay')
  .attr('accounting', () => {
    return new MockAccountingService()
  })
  .attr('logger', TestLoggerFactory.build())
  .attr(
    'paymentPointers',
    ['accounting'],
    (accounting: MockAccountingService) => ({
      get: async (id: string) => await accounting._getAccount(id)
    })
  )
  .attr(
    'incomingPayments',
    ['accounting'],
    (accounting: MockAccountingService) => ({
      get: async ({ id }: { id: string }) =>
        await accounting._getIncomingPayment(id),
      handlePayment: async (_id: string) => {
        return undefined
      }
    })
  )
  .attr('peers', ['accounting'], (accounting: MockAccountingService) => ({
    getByDestinationAddress: async (address: string) =>
      await accounting._getByDestinationAddress(address),
    getByIncomingToken: async (token: string) =>
      await accounting._getByIncomingToken(token)
  }))
  .attr('rates', {
    convert: async (opts) => opts.sourceAmount,
    rates: () => {
      throw new Error('unimplemented')
    }
  })
  .attr(
    'redis',
    () =>
      new Redis(`${process.env.REDIS_URL}/${process.env.JEST_WORKER_ID}`, {
        // lazyConnect so that tests that don't use Redis don't have to disconnect it when they're finished.
        lazyConnect: true,
        stringNumbers: true
      })
  )
  .attr(
    'streamServer',
    ['ilpAddress'],
    (ilpAddress: string) =>
      new StreamServer({
        serverAddress: ilpAddress,
        serverSecret: crypto.randomBytes(32)
      })
  )

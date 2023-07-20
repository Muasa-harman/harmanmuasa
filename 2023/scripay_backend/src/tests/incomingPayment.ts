import { IocContract } from '@adonisjs/fold'
import { LiquidityAccountType } from '../accounting/service'

import { AppServices } from '../app'
import { isIncomingPaymentError } from '../payments/payment/incoming/errors'
import { IncomingPayment } from '../payments/payment/incoming/model'
import { CreateIncomingPaymentOptions } from '../payments/payment/incoming/service'

export async function createIncomingPayment(
  deps: IocContract<AppServices>,
  options: CreateIncomingPaymentOptions
): Promise<IncomingPayment> {
  const incomingPaymentService = await deps.use('incomingPaymentService')
  const incomingPaymentOrError = await incomingPaymentService.create(options)
  if (isIncomingPaymentError(incomingPaymentOrError)) {
    throw new Error()
  }

  const accountingService = await deps.use('accountingService')
  await accountingService.createLiquidityAccount(
    incomingPaymentOrError,
    LiquidityAccountType.INCOMING
  )

  return incomingPaymentOrError
}

import * as Promise from 'bluebird'
import { getSettingsWithDefaults, Settings } from './settings'
import { /* batchedSend, */ send } from './request'
import {
    BaseCommand, Callback, IRICommand, FindTransactionsCommand, GetBalancesCommand,
    GetInclusionStatesCommand, GetTrytesCommand, Provider
} from '../../types'
const BATCH_SIZE = 1000

export interface MapsToArrays {
    [key: string]: any[]
}

/* Known batchable commands */
export type BatchableCommand = MapsToArrays &
    (FindTransactionsCommand | GetBalancesCommand | GetInclusionStatesCommand | GetTrytesCommand)

export interface BatchableKeys {
    [key: string]: string[]
}

export type BatchableKey = 'addresses' | 'approvees' | 'bundles' | 'tags' | 'tips' | 'transactions' | 'hashes'

/** Batchable keys for each command */
export const batchableKeys: BatchableKeys = {
    [IRICommand.FIND_TRANSACTIONS]: ['addresses', 'approvees', 'bundles', 'tags'],
    [IRICommand.GET_BALANCES]: ['addresses'],
    [IRICommand.GET_INCLUSION_STATES]: ['tips', 'transactions'],
    [IRICommand.GET_TRYTES]: ['hashes'],
}

export const isBatchableCommand = (command: BaseCommand): command is BatchableCommand =>
    command.command === IRICommand.FIND_TRANSACTIONS ||
    command.command === IRICommand.GET_BALANCES ||
    command.command === IRICommand.GET_INCLUSION_STATES ||
    command.command === IRICommand.GET_TRYTES

export const getKeysToBatch = <C extends BatchableCommand>(
    command: C,
    batchSize: number = BATCH_SIZE
): Array<string> => Object.keys(command).filter((key: string) =>
    batchableKeys[command.command].indexOf(key) > -1 &&
    Array.isArray(command[key]) &&
    command[key].length > BATCH_SIZE
)

/**
 * 
 * @param settings 
 */
export const createHttpClient = (settings?: Partial<Settings>): Provider => {
    let _settings = getSettingsWithDefaults({ ...settings })
    return {
        send: <C extends BaseCommand, R>(
            command: C,
            callback?: Callback<R>
        ): Promise<R> => Promise.try(() => {
            const { provider, requestBatchSize, apiVersion } = _settings
            /*if (isBatchableCommand(command)) {
                const keysToBatch = getKeysToBatch(command, requestBatchSize)

                if (keysToBatch.length) {
                    return batchedSend<C, R>(command, keysToBatch, requestBatchSize, provider, apiVersion)
                }
            }*/

            return send<C, R>(command, provider, apiVersion)
        }).asCallback(callback),
        setSettings: (newSettings?: Partial<Settings>): void => {
            _settings = getSettingsWithDefaults({ ...newSettings })
        }
    }
}

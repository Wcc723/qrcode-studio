import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { effectScope } from 'vue'
import { useCopyText } from './useCopyText'

function runInScope<T>(fn: () => T) {
  const scope = effectScope()
  return { value: scope.run(fn)!, stop: () => scope.stop() }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('複製狀態', () => {
  it('成功後顯示已複製，過一段時間自動收回', async () => {
    const { value: c } = runInScope(() => useCopyText({ write: async () => {} }))
    await c.copy('hello')
    expect(c.copied.value).toBe(true)
    vi.advanceTimersByTime(5000)
    expect(c.copied.value).toBe(false)
  })

  it('剪貼簿被拒絕時給錯誤訊息，不會假裝成功', async () => {
    const { value: c } = runInScope(() => useCopyText({ write: async () => { throw new Error('denied') } }))
    await c.copy('hello')
    expect(c.copied.value).toBe(false)
    expect(c.error.value).toBeTruthy()
  })

  it('沒有剪貼簿 API 時也要給錯誤訊息而不是丟例外', async () => {
    const { value: c } = runInScope(() => useCopyText({ write: null }))
    await expect(c.copy('hello')).resolves.toBeUndefined()
    expect(c.error.value).toBeTruthy()
  })
})

describe('先後順序', () => {
  it('晚回來的舊複製不得把「已複製」掛到新內容上', async () => {
    let releaseFirst: () => void = () => {}
    let firstStarted!: () => void
    const started = new Promise<void>(res => { firstStarted = res })
    const write = vi.fn()
      .mockImplementationOnce(() => new Promise<void>(res => { releaseFirst = res; firstStarted() }))
      .mockImplementationOnce(async () => { throw new Error('denied') })

    const { value: c } = runInScope(() => useCopyText({ write }))
    const first = c.copy('OLD')
    await started
    await c.copy('NEW')
    expect(c.copied.value).toBe(false)
    expect(c.error.value).toBeTruthy()

    releaseFirst()
    await first
    // 舊的那次成功回來了，但使用者現在面對的是 NEW 那次的失敗
    expect(c.copied.value).toBe(false)
    expect(c.error.value).toBeTruthy()
  })

  it('元件卸載後回來的結果不得寫入狀態', async () => {
    let release: () => void = () => {}
    let started!: () => void
    const startedPromise = new Promise<void>(res => { started = res })
    const { value: c, stop } = runInScope(() => useCopyText({
      write: () => new Promise<void>(res => { release = res; started() }),
    }))
    const pending = c.copy('hello')
    await startedPromise
    stop()
    release()
    await pending
    expect(c.copied.value).toBe(false)
  })

  it('reset 會把狀態清乾淨', async () => {
    const { value: c } = runInScope(() => useCopyText({ write: async () => {} }))
    await c.copy('hello')
    c.reset()
    expect(c.copied.value).toBe(false)
    expect(c.error.value).toBeNull()
  })
})

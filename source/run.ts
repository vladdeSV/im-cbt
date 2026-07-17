import { spawn } from 'node:child_process'
import type { Writable } from 'node:stream'
import type { CommandBuilder } from './commandBuilder.ts'

export interface RunOptions {
  /** binary to spawn. defaults to `magick` */
  binary?: string
}

/** the spawned binary exited with a nonzero code or was killed by a signal */
export class ImageMagickError extends Error {
  readonly argv: string[]
  readonly exitCode: number | null
  readonly stderr: string

  constructor(argv: string[], exitCode: number | null, stderr: string) {
    const firstLine = stderr.trim().split('\n')[0] ?? ''
    super(firstLine === '' ? `magick exited with code ${exitCode}` : firstLine)
    this.name = 'ImageMagickError'
    this.argv = argv
    this.exitCode = exitCode
    this.stderr = stderr
  }
}

/**
 * spawns the imagemagick binary (argv array, no shell involved), streams the
 * builder's buffers into their `fd:N` slots, and resolves with the image
 * written to stdout in the requested format.
 *
 * the builder is not consumed; running it again spawns a fresh process.
 * note that magick writes warnings to stderr even on success, so only the
 * exit code decides between resolve and reject.
 *
 * @param format output format written to stdout, e.g. `png` runs the command with the output target `png:-`
 */
export function run(wand: CommandBuilder, format: string, options: RunOptions = {}): Promise<Buffer> {
  const binary = options.binary ?? 'magick'
  const argv = [...wand.args(), `${format}:-`]
  const buffers = wand.buffers()

  // slots 0-2 are stdin/stdout/stderr, then one pipe per buffer resource,
  // matching the fd:3, fd:4, ... references emitted by parts()
  const child = spawn(binary, argv, {
    stdio: ['ignore', 'pipe', 'pipe', ...buffers.map(() => 'pipe' as const)],
  })

  return new Promise((resolve, reject) => {
    const { stdout, stderr } = child
    if (stdout === null || stderr === null) {
      // unreachable: stdio slots 1 and 2 are always 'pipe'
      reject(new Error('child process is missing its stdout/stderr pipes'))
      return
    }

    const stdoutChunks: Buffer[] = []
    let stderrText = ''

    stdout.on('data', (chunk: Buffer) => {
      stdoutChunks.push(chunk)
    })
    stderr.setEncoding('utf8')
    stderr.on('data', (chunk: string) => {
      stderrText += chunk
    })

    for (const [index, buffer] of buffers.entries()) {
      const stream = child.stdio[3 + index] as Writable
      // EPIPE lands here when magick exits before reading every input;
      // the failure itself is reported through the exit code
      stream.on('error', () => {})
      stream.end(buffer)
    }

    child.on('error', error => {
      reject(new Error(`failed to spawn ${binary}: ${error.message}`, { cause: error }))
    })

    // 'close' instead of 'exit': close fires after stdio has drained, so stdout is complete
    child.on('close', code => {
      if (code === 0) {
        resolve(Buffer.concat(stdoutChunks))
      } else {
        reject(new ImageMagickError(argv, code, stderrText))
      }
    })
  })
}

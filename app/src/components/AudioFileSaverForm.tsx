import { FC } from 'react'
import { useForm, UseFormReturn } from 'react-hook-form'
import useBanner from '../context/BannerContext'
import useAudioFiles from '../context/db/AudioFilesContext'

export interface FileSaverFormInterface {
  filename: string
  filetype: 'tune' | 'beat'
  fileData: FileList
}

export type FileSaverForm = UseFormReturn<FileSaverFormInterface>

export default (function AudioFileSaver({ render, children }) {
  const form: FileSaverForm = useForm<FileSaverFormInterface>({
    defaultValues: {
      filetype: 'tune',
      filename: 'hello.mp3',
      fileData: undefined,
    },
  })
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    reset,
  } = form

  const { saveAudioFile } = useAudioFiles()

  const { setMessage } = useBanner()

  const onSubmit = handleSubmit(async ({ filename, filetype, fileData }) => {
    const file = fileData[0]

    if (!file) throw Error('received empty file')

    const tuneOrBeat =
      filetype === 'tune' ? 'tunes' : filetype === 'beat' ? 'beats' : null

    if (!tuneOrBeat) throw Error('received invalid filetype')

    const result = await saveAudioFile(
      tuneOrBeat,
      file.name === filename ? file : new File([file], filename)
    )
    // success
    if (result) return reset()

    setMessage(`a ${filetype} with that name already exists`)

    setError(
      'filename',
      {},
      {
        shouldFocus: true,
      }
    )
  })

  const registerOptions = {
    required: true,
    disabled: !watch('fileData')?.length,
    deps: ['fileData'],
  }

  return (
    <form className="row" onSubmit={onSubmit}>
      {children ?? (render && render(form))}
      <input
        type="text"
        placeholder={errors.filename ? 'please enter a filename' : 'filename'}
        {...register('filename', {
          ...registerOptions,
          // pattern: /.+\.[mp3|wav|ogg|opus]/,
        })}
      />
      <button disabled={registerOptions.disabled}>save</button>
      <label>
        tune
        <input
          type="radio"
          value="tune"
          defaultChecked
          {...register('filetype', registerOptions)}
        />
      </label>
      <label>
        beat
        <input
          type="radio"
          value="beat"
          {...register('filetype', registerOptions)}
        />
      </label>
    </form>
  )
} as FC<{
  action: 'recording' | 'upload'
  render?: <T extends { fileSaverForm: FileSaverForm }>(
    fileSaverForm: FileSaverForm
  ) => ReturnType<FC<T>>
}>)

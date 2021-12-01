# app

## about

App is the main user interface for .hum. It is a PWA meaning that it can be installed and work offline. It is a static site, meaning that it only runs client side only, does not require an internet connection, and lets us host the app for free. Uploaded and recorded files are saved into indexedDB so the files are remembered on that device. All assets for PWA are in public are were generated by [favicon generator](https://realfavicongenerator.net/). The development and build process were managed by [vite](https://vitejs.dev/).

## structure

Audio files stored in indexedDB, selected audio files and recordings, and the banner that displays user information are all stateful components that are stored top level so all components in the app can access, shared, and manipulate it. This is done using the react context api. The app has two basic components: the file saver, and the editor. Both of these have a base component to abstract the common functionality of the two. the editor's is in `./src/components/editor/index.tsx` the form form is in `./src/components/AudioFileSaverForm.tsx`. The form uses [react hook form](https://react-hook-form.com/) to manage it's state. The form also has a render prop that passes the contents of the hook so that child components can also be registered with the parent form e.g. `AudioFileRecorder.tsx` and `AudioFileUploader.tsx`. The app folder contains the unique components that comprise the views of the application. The app is styled with scss. Almost all components are styled with either flex row or column.
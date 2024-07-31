import { Mediator, Video, VideoUploadState } from "./uploader/types/types";
import { InitializeUploader } from "./uploader/initializeUploader";
import { hasExistingCookies } from "./uploader/helpers/helpers";
import fs from "fs";
import readline from "readline"
import minimist from 'minimist';

const args = minimist(process.argv.slice(2))
const readlineInstance = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const validateParameters = async () => {
  const hasCookies = hasExistingCookies(args.user);

  if (args.user === undefined || args.user === "") {
    args.user = await new Promise(resolve => {
      readlineInstance.question("Username: ", resolve)
    });
  }
  if (!hasCookies && (args.pass === undefined || args.pass === "")) {
    args.pass = await new Promise(resolve => {
      readlineInstance.question("Password: ", resolve)
    });
  }
  if (args.path === undefined || args.path === "") {
    args.pass = await new Promise(resolve => {
      readlineInstance.question("Filepath: ", resolve)
    });
  }
  if (!fs.existsSync(args.path)) {
    console.log("Could not find file")
    return false;
  }

  return true;
}

async function uploadVideo() {
  await validateParameters()
    .then((isValid) => {
      if (!isValid) {
        console.log("Missing parameters");
        return;
      }
    });

  // Set Title
  args.title = (args.title !== "" && args.title !== undefined)
    ? args.title
    : args.path.split('/').pop()

  // Set Tags
  args.tags = args.tags
    ? args.tags.split(',').map((tag: string) => tag.trim())
    : undefined;

  console.log(`Uploading ${args.title}`)
  console.log(`Path: ${args.path}`)

  const video = {
    path: args.path,
    title: args.title,
    description: args.description,
    channelName: args.channel,
    playlist: args.playlist,
    tags: args.tags,

    skipProcessingWait: !!args.waitForVideoProcessing,
    videoVisibility: args.visibility ?? "Private",

    onProgress: (progress: VideoUploadState) => {
      console.clear()
      console.log(progress.progressMessage)
    },
    onSuccess: (videoUrl: string) => console.log(`Video ${args.title} was uploaded successfully at ${videoUrl}`),
  } as Video;

  const puppeteerOptions = {
    headless: args.disableHeadless === undefined,
    args: [`--window-size=1920,1080`],
    viewPortWidth: 1920,
    viewPortHeight: 1080,
  }

  const mediator = {
    onLog: (message: Mediator) => console.log(`Log: ${message}`),
    onError: (message: string) => console.log(`Error: ${message}`),
    onUserAction: (message: string) => console.log(`User action: ${message}`),
  }

  const credentials = {
    email: args.user,
    pass: args.pass
  }

  const { LoginAccount, UploadVideo, CloseBrowser } = await InitializeUploader({
    mediator,
    credentials,
    puppeteerOptions
  });

  const isLoggedIn = await LoginAccount()

  if (isLoggedIn) {
    await UploadVideo(video)
    await CloseBrowser()
  } else {
    mediator.onError("Could not upload video. Not logged in.")
  }
}

const start = async () => await uploadVideo()
start().then(() => process.exit());

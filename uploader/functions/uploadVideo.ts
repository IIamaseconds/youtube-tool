import * as xPath from "../mappers/pathMapping.js";
import { Mediator, UploadResult, ProcessStageEnum, Video, VideoUploadState } from "../types/types.js";
import { PageInteraction, sleep } from "../helpers/helpers.js";
import { Browser, Page } from "puppeteer";
import { changeChannel } from "./changeChannel.js";
import { clearInterval } from "timers";
import { uploadStateTextXPath } from "../mappers/pathMapping.js";
import { ElementHandle } from "puppeteer";

interface UploadVideoProps{
  video: Video;
  mediator: Mediator;
  
  uploadUrl: string;
  maxTitleLength: number;
  maxDescriptionLength: number;
  
  browser: Browser;
  page: Page;
}

export async function uploadVideo(props: UploadVideoProps) {   
  const pageInteractor = PageInteraction(props.page);
  
  // Missing Filepath
  if (!props.video.path) {
    throw new Error("Invalid path provided for upload")
  }
  
  // Contains invalid characters
  for (let i in xPath.invalidCharacters) {
    if (props.video.title.includes(xPath.invalidCharacters[i])) {
      throw new Error(`"${props.video.title}" includes a character not allowed in youtube titles (${xPath.invalidCharacters[i]})`)
    }
  }

  // Upload to specific channel
  if (props.video.channelName) {
    await changeChannel({
      page: props.page,
      channelName: props.video.channelName
    });

    props.video.onProgress?.({
      progress: 0,
      stage: ProcessStageEnum.Preparing,
      progressMessage: `Setting channel to ${props.video.channelName}`,
    })
  }
  
  // Go to upload page
  await props.page.evaluate(() => { window.onbeforeunload = null })
  await props.page.goto(props.uploadUrl)

  props.video.onProgress?.({
    progress: 0,
    stage: ProcessStageEnum.Preparing,
    progressMessage: `Looking for file ${props.video.path}`,
  })
  
  // Get file chooser
  const [fileChooser] = await Promise.all([
    // Wait for file chooser
    props.page.waitForFileChooser(),

    // Open file selection
    pageInteractor.click(xPath.buttonSelectFilesXpath)
  ])
  
  // Submit filepath to selector
  await fileChooser.accept([props.video.path])

  props.video.onProgress?.({
    progress: 0,
    stage: ProcessStageEnum.Preparing,
    progressMessage: `Initiating upload`,
  })
  
  // Setup onProgress
  let progressUpdateInterval: any
  let progress: VideoUploadState = {progress: 0, progressMessage: "", stage: ProcessStageEnum.Preparing};
  
  if (props.video.onProgress) {
    
    // Setup callback for progress update
    props.video.onProgress(progress)

    progressUpdateInterval = setInterval(async () => {
      const uploadStateText = await props.page.waitForXPath(uploadStateTextXPath) as ElementHandle;
      let currentProgress = await uploadStateText.evaluate((element) => element.textContent);
      
      if (progressUpdateInterval == undefined || !currentProgress) {
        return
      }

      const originalProgress = currentProgress;
      const stage = 
            originalProgress.includes("Uploading") ? ProcessStageEnum.Uploading 
          : originalProgress.includes("Processing") ? ProcessStageEnum.Processing
          : ProcessStageEnum.Done;
      
      currentProgress = currentProgress.split(" ").find((txt: string) => txt.indexOf("%") != -1) ?? ""
      const newProgress = currentProgress !== "" ? parseInt(currentProgress.slice(0, -1)) : 0

      // Update new progress
      if (progress.progress !== newProgress) {
        progress.stage = stage;
        progress.progress = newProgress
        progress.progressMessage = originalProgress 
        props.video.onProgress!(progress)
      }
    }, 500)
  }

  // Setup promises for upload result
  const uploadCompletePromise = props.page.waitForXPath(xPath.uploadCompleteXPath, {timeout: 0}).then(() => UploadResult.Completed)
  const dailyUploadPromise = props.page.waitForXPath(xPath.uploadDailyLimitXPath, {timeout: 0}).then(() => UploadResult.DailyLimitReached);
  const skipProcessingPromise = new Promise<UploadResult>(function(resolve) {
    setInterval(async () => {
      if((props.video.skipProcessingWait && progress.stage === ProcessStageEnum.Done) || progress.stage === ProcessStageEnum.Processing){
        resolve(UploadResult.Completed)
      }
    }, 1000)
  });

  // Wait for upload result
  await Promise.any([
    skipProcessingPromise,
    uploadCompletePromise,
    dailyUploadPromise
  ]).then(async (result: UploadResult) => {
      if (result === UploadResult.DailyLimitReached) {
        await props.browser.close();
        throw new Error('Daily upload limit reached');
      }
  
      // Wait for upload to go away and processing to start, skip the wait if the user doesn't want it.
      if (props.video.skipProcessingWait && result === UploadResult.Completed) {
        await props.page.waitForXPath(xPath.uploadCompleteXPath, { hidden: true, timeout: 0 })
      }
  });
  
  if (props.video.onProgress) {
    clearInterval(progressUpdateInterval)
    progressUpdateInterval = undefined

    props.video.onProgress({
      progress: 100,
      stage: ProcessStageEnum.Done,
      progressMessage: "Completed upload, setting up remaining properties."
    })
  }

  // Setup thumbnail
  if (props.video.thumbnail) {
    const [thumbChooser] = await Promise.all([
      
      // Wait for file selector
      props.page.waitForFileChooser(),
      
      // Click thumbnail button
      props.page.click(xPath.buttonThumbnailSelectSelector)
    ])
    await thumbChooser.accept([props.video.thumbnail])

    props.video.onProgress?.({
      progress: 100,
      stage: ProcessStageEnum.Done,
      progressMessage: "Thumbnail added"
    })
  }
  
  // Wait for Title & Description
  await props.page.waitForFunction(xPath.textboxTitleAndDescriptionAvailableFunction)

  const [titleElement, descriptionElement] = await props.page.$x(xPath.textboxTitleAndDescriptionXPath)
  await props.page.bringToFront()
  
  // Add the title value
  await titleElement.focus()
  await sleep(1000)
  await props.page.keyboard.down("Control");
  await props.page.keyboard.press("KeyA");
  await props.page.keyboard.up("Control");
  await sleep(1000)
  await props.page.keyboard.press("Backspace");
  
  await titleElement.type(props.video.title.substring(0, props.maxTitleLength))

  // Add the Description content
  await descriptionElement.type(props.video.description?.substring(0, props.maxDescriptionLength) ?? "")
  
  // Set 'Is for kids' radio button
  await props.page.click(xPath.buttonChildOptionQuery(props.video.isForChildren));

  // Add video to playlist
  let createPlaylistDone;
  if (props.video.playlist) {
    await props.page.click(xPath.buttonPlaylistsDropdownSelector, {delay: 200})

    try {
      // Enter playlist name in search area
      const searchField = await props.page.waitForXPath(xPath.buttonSearchXpath);
      if(searchField !== undefined) {
        await pageInteractor.type(xPath.buttonSearchSelector, props.video.playlist);
      }
      
      // Select playlist entry
      await pageInteractor.click(xPath.selectPlayListNameXPath(props.video.playlist), { timeoutMs: 5000 })

      props.video.onProgress?.({
        progress: 100,
        stage: ProcessStageEnum.Configuring,
        progressMessage: `Added video to playlist: ${props.video.playlist}`
      })
      
    } catch (error) {
      // Creating new playlist 
      await pageInteractor.click(xPath.playlistsXPath);

      // click New playlist button
      await pageInteractor.click(xPath.createPlayListNameXPath)
      await props.page.waitForXPath(xPath.createPlayListNameXPath)
      
      // Enter new playlist name
      await props.page.keyboard.type(' ' + props.video.playlist.substring(0, 148))

      // Click create & then done button
      const createPlaylistBtn = await props.page.$x(xPath.createPlayListButtonXPath)
      await props.page.evaluate((el) => (el as HTMLElement).click(), createPlaylistBtn[1])

      createPlaylistDone = await props.page.$x(xPath.createPlayListDoneXPath)
      await props.page.evaluate((el) => (el as HTMLElement).click(), createPlaylistDone[0])

      props.video.onProgress?.({
        progress: 100,
        stage: ProcessStageEnum.Configuring,
        progressMessage: `Added video to new playlist: ${props.video.playlist}`
      })
    }
  }

  // Selecting video language
  if (props.video.language) {
    await pageInteractor.click(xPath.videoLanguageButtonXPath);
    await sleep(200);
    await pageInteractor.click(xPath.videoLanguageNameXPath(props.video.language))

    props.video.onProgress?.({
      progress: 100,
      stage: ProcessStageEnum.Configuring,
      progressMessage: `Video language set to ${props.video.language}`
    })
  }

  // Add tags
  if(props.video.tags){
    await pageInteractor.click(xPath.buttonShowMetaDataToggleXPath);
    await pageInteractor.type(xPath.uploadTagsInputXPath, props.video.tags.join(', ').substring(0, 495) + ', ')

    props.video.onProgress?.({
      progress: 100,
      stage: ProcessStageEnum.Configuring,
      progressMessage: `Added video tags: ${props.video.tags}`
    })
  }
  
  // Go to Video element  
  await pageInteractor.click(xPath.buttonNextXpath, { waitForEnabled: true })

  // Go to Checks
  await pageInteractor.click(xPath.buttonNextXpath, { waitForEnabled: true })

  // Go to Visibility
  await pageInteractor.click(xPath.buttonNextXpath, { waitForEnabled: true })

  // Set visibility selection
  await pageInteractor.click(xPath.visibilityXpath(props.video.videoVisibility))
  
  // Save youtube upload link
  await props.page.waitForSelector(xPath.uploadLinkSelector)

  const uploadedLinkHandle = await props.page.$(xPath.uploadLinkSelector)

  let uploadedLink
  do {
    await sleep(500)
    uploadedLink = await props.page.evaluate((e) => e?.getAttribute('href'), uploadedLinkHandle)
  }
  while (uploadedLink === undefined)

  props.video.onProgress?.({
    progress: 100,
    stage: ProcessStageEnum.Configuring,
    progressMessage: `Saving video settings`
  })
  
  // Set wait time to allow for youtube saving in the frontend
  await sleep(5000);
  await pageInteractor.click(xPath.buttonDoneXpath);
  await sleep(5000);

  props.video.onProgress?.({
    progress: 100,
    stage: ProcessStageEnum.Configuring,
    progressMessage: `Video uploaded successfully`
  })
  
  props.video.onSuccess?.(uploadedLink ?? "No link was found");
}
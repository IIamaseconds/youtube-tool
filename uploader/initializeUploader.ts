import puppeteer from 'puppeteer-extra'
import { Browser, Page, PuppeteerNodeLaunchOptions } from 'puppeteer'
import { Credentials, Mediator, Video } from "./types/types";
import { launchBrowser } from "./functions/launchBrowser";
import { login } from "./functions/login";
import { uploadVideo } from "./functions/uploadVideo";
import { defaultMediator } from "./functions/mediator";
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

const maxTitleLength = 100
const maxDescriptionLength = 5000

const homepageUrl = 'https://www.youtube.com'
const uploadUrl = `${homepageUrl}/upload`

let page: Page
let browser: Browser
let mediator: Mediator
let credentials: Credentials

interface InitializeProps {
  mediator?: Mediator
  credentials: Credentials
  puppeteerOptions?: PuppeteerNodeLaunchOptions
}

export const InitializeUploader = async (props: InitializeProps) => {
  const stealthPlugin = StealthPlugin();
  stealthPlugin.enabledEvasions.delete('media.codecs')
  stealthPlugin.enabledEvasions.delete('iframe.contentWindow')
  puppeteer.use(stealthPlugin)

  const launchResult = await launchBrowser({
    puppeteerLaunch: props.puppeteerOptions,
  })

  page = launchResult.page;
  browser = launchResult.browser;
  credentials = props.credentials;
  mediator = props.mediator ?? defaultMediator;

  return { LoginAccount, UploadVideo, CloseBrowser }
}

const LoginAccount = async (): Promise<boolean> => {
  if (!browser || !page) {
    mediator.onError("No browser or page was instantiated. Initialize uploader before logging in.")
    return false;
  }

  return await login({
    mediator,
    uploadUrl,
    homepageUrl,
    credentials,
    browser,
    page,
  })
}

const UploadVideo = async (video: Video) => {
  if (!browser || !page) {
    mediator.onError("No browser or page was instantiated. Initialize uploader and log in before uploading.")
    return;
  }

  await uploadVideo({
    page,
    browser,
    video,
    uploadUrl,
    maxTitleLength,
    maxDescriptionLength,
    mediator
  });
}

const CloseBrowser = async () => await browser.close();

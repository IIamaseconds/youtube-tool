import { Browser, Page } from "puppeteer";
import { PuppeteerNodeLaunchOptions } from "puppeteer";
import puppeteer from "puppeteer-extra";

interface LaunchBrowserProps {
  puppeteerLaunch?: PuppeteerNodeLaunchOptions;
  timeoutLimit?: number;
  
  viewPortHeight?: number;
  viewPortWidth?: number;
}

export async function launchBrowser(props: LaunchBrowserProps): Promise<{ browser: Browser, page: Page }> {
  const browser = await puppeteer.launch(props.puppeteerLaunch)
  const page = await browser.newPage()
  
  page.setDefaultTimeout(props.timeoutLimit ?? 30000)
  await page.setBypassCSP(true)
  await page.setViewport(
    {
      width: props.viewPortWidth ?? 1280,
      height: props.viewPortHeight ?? 720,
    })
  
  return {browser, page}
}
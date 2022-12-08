import { ElementHandle, Page } from "puppeteer";
import { channelNameXPath } from "../mappers/pathMapping.js";

interface ChangeChannelProps{
  channelName: string;
  page: Page;
}

export async function changeChannel(props: ChangeChannelProps) {
  await props.page.goto("https://www.youtube.com/channel_switcher");

  const element = await props.page.waitForXPath(channelNameXPath(props.channelName)) as ElementHandle;
  await element.click()

  await props.page.waitForNavigation({
    waitUntil: "networkidle0"
  });
}
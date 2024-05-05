import { ElementHandle, Page } from "puppeteer";
import { channelNameXPath } from "../mappers/pathMapping";
import { sleep } from "../helpers/helpers";

interface ChangeChannelProps{
  channelName: string;
  page: Page;
}

export async function changeChannel(props: ChangeChannelProps) {
  props.page.on('dialog', async dialog => {
    await dialog.dismiss()
  });
  
  await sleep(1000);

  await props.page.goto("https://www.youtube.com/channel_switcher");

  const element = await props.page.waitForXPath(channelNameXPath(props.channelName)) as ElementHandle;
  await element.click()

  await props.page.waitForNavigation({
    waitUntil: "networkidle0"
  });
}
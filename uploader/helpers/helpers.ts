import { Page } from "puppeteer";
import fs from "fs-extra";
import path from "path";

interface InteractionOption {
  waitForEnabled?: boolean;
  timeoutMs?: number;
  indexOfElement?: number;
  sleepBeforeInputMs?: number;
  sleepAfterInputMs? :number;
  inputDelayMs?: number;
}

export const PageInteraction = (page: Page) => {

  /* Finds the element and executes the click function on the element */
  const click = async (elementXPath: string, options?: InteractionOption) => {
    let element = await waitForXpath(elementXPath, options);

    if(Array.isArray(element)){
      element = element[options?.indexOfElement ?? 0];
    }

    await page.evaluate((e) => (e as HTMLElement).click(), element);
    
    if(options?.sleepAfterInputMs){
      await sleep(options.sleepAfterInputMs);
    }
  }

  /* Finds the element and and types the inputString in the element */
  const type = async (elementQuery: string, inputString: string, options?: InteractionOption) => {
    await page.waitForSelector(elementQuery, { timeout: options?.timeoutMs ?? 30000 });
    await page.focus(elementQuery)
    
    if(options?.sleepBeforeInputMs) {
      await sleep(options.sleepBeforeInputMs);
    }
    
    await page.type(elementQuery, inputString, { delay: options?.inputDelayMs ?? 60 })
  }

  const waitForXpath = async (xPath: string, options?: InteractionOption) => {
    return await page.waitForXPath(options?.waitForEnabled
      ? `${xPath}[not(@disabled)]`
      : xPath, {
      timeout: options?.timeoutMs
    });
  }

  return { click, type }
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

interface SaveCookiesToLocalResult {
  errorMessage?: string;
}

export const saveCookiesToLocal = async (email: string, page: Page) : Promise<SaveCookiesToLocalResult | undefined> => {
  const cookiesObject = await page.cookies()
  const cookiesDirectoryPath = getCookieDirectory()
  const cookiesFilePath = getCookiePath(email)
  
  await fs.mkdirSync(cookiesDirectoryPath, { recursive: true })
  
  await fs.writeFile(cookiesFilePath, JSON.stringify(cookiesObject), (err) => {
    if (err) {
      return {
        errorMessage: `The cookie file could not be written. ${err.message}`
      }
    }
  })
  
  return;
}
export const setCookiesFromExisting = async (email: string, page: Page) => {
  if (hasExistingCookies(email)) {    
    try { 
      const cookiesAsJsonString = fs.readFileSync(getCookiePath(email), {encoding: 'utf-8'})
      const cookiesAsObject = JSON.parse(cookiesAsJsonString)

      if (cookiesAsObject) {
        for (const cookie of cookiesAsObject) {
          await page.setCookie(cookie)
        }
        
        return true;
      }
    } catch {
      // If file exists and cookie is invalid, ignore.
      return false;
    }
  }
  
  return false;
}

export const hasExistingCookies = (email: string) => fs.existsSync(getCookiePath(email)); 
export const getCookieDirectory = () => path.join('.', 'cookies');
export const getCookiePath = (email: string) => {
  return path.join(
    getCookieDirectory(),
    `cookies-${email
      .split('@')[0]
      .replace(/\./g, '_')}-${email.split('@')[1].replace(/\./g, '_')}.json`
  )
}
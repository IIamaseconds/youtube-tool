import { Browser, Page } from "puppeteer";
import { PageInteraction, saveCookiesToLocal, setCookiesFromExisting, sleep } from "../helpers/helpers.js";
import { Credentials, Mediator } from "../types/types.js";
import {
  createChannelSelector,
  defaultLanguageXPath, 
  loginConfirmRecoveryXPath,
  loginEmailInputSelector,
  loginEmailInvalidSelector,
  loginEnterRecoveryXPath,
  loginGoogleAppAuthSelector,
  loginPasswordInputSelector,
  loginPasswordInvalidSelector,
  loginRecaptchaInputSelector,
  loginSmsAuthSelector,
  uploadPopupSelector
} from "../mappers/pathMapping.js";

interface LoginYoutubeAccountProps {
  credentials: Credentials;
  mediator: Mediator;
  
  browser: Browser;
  page: Page;
  
  uploadUrl: string;
  homepageUrl: string;
}

export async function login(props: LoginYoutubeAccountProps) : Promise<boolean> {
  const hasCookies = await setCookiesFromExisting(props.credentials.email, props.page);

  props.mediator.onLog(hasCookies 
    ? `Using existing cookie for user ${props.credentials.email}`
    : `Logging in ${props.credentials.email}`);
  
  if(hasCookies){
    return true;
  }
  
  await props.page.goto(props.uploadUrl)

  const pageInteractor = PageInteraction(props.page);
  await pageInteractor.click(defaultLanguageXPath, { sleepAfterInputMs: 1000 });

  // Enter Email
  await props.page.waitForSelector(loginEmailInputSelector)
  await props.page.type(loginEmailInputSelector, props.credentials.email, { delay: 50 })
  await props.page.keyboard.press('Enter')

  // Wait for email response
  const waitForPasswordField = props.page.waitForSelector(loginPasswordInputSelector).then(() => 'password');
  const waitForIncorrectEmail = props.page.waitForXPath(loginEmailInvalidSelector).then(() => 'invalidEmail');
  const waitForAppAuthPage = props.page.waitForSelector(loginGoogleAppAuthSelector).then(() => 'mfa');

  const loginResult = await Promise.any([
    waitForAppAuthPage,
    waitForPasswordField,
    waitForIncorrectEmail,
  ]).then(async (result: string): Promise<string> => {

    // MFA authentication
    if(result === "mfa"){
      const codeElement = await props.page.$(loginGoogleAppAuthSelector)
      const code = (await codeElement?.getProperty('textContent'))?.toString().replace('JSHandle:', '')
      code && props.mediator.onUserAction(`Press "${code}" on your phone to login`)
    }

    // Password
    if(result === "password"){
      await pageInteractor.type(loginPasswordInputSelector, props.credentials.pass, { sleepBeforeInputMs: 1000 })
      await props.page.keyboard.press('Enter')
    }

    // Invalid email
    if(result === "invalidEmail"){
      props.mediator.onError("Invalid email provided");
      await props.browser.close();
    }

    return result;
  })

  if(loginResult === 'invalidEmail'){
    return false;
  }

  const waitForInvalidPassword = props.page.waitForXPath(loginPasswordInvalidSelector).then(() => 'invalidPassword');
  const waitForNavigation = props.page.waitForNavigation().then(() => 'success');
  
  const passwordSuccess = await Promise.any([
    waitForInvalidPassword,
    waitForNavigation
  ]).then(async (result: string): Promise<boolean> => {

    if(result !== 'success'){
      props.mediator.onError('Invalid password provided');
      await props.browser.close();

      return false;
    }

    return true;
  });

  if(!passwordSuccess){
    return false;
  }

  try {
    const isOnSmsAuthPage = await props.page.evaluate((loginSmsAuthSelector: string) => document.querySelector(loginSmsAuthSelector) !== null, loginSmsAuthSelector)
    
    if (isOnSmsAuthPage) {
      try {
        if (!props.mediator.onSmsVerificationCodeSent) {
          props.mediator.onError('onSmsVerificationCodeSent not implemented')
          return false
        }

        const code = await props.mediator.onSmsVerificationCodeSent()

        if (!code) {
          props.mediator.onError('Invalid SMS Code')
          return false
        }

        await props.page.type(loginSmsAuthSelector, code.trim())
        await props.page.keyboard.press('Enter')
        
      } catch (error) {
        await props.browser.close()
        
        props.mediator.onError((error as string).toString())
        return false
      }
    }
  } catch (error: any) {
    const isOnRecaptchaPage = await props.page.evaluate((recaptchaInputSelector: string) => document.querySelector(recaptchaInputSelector) !== null, loginRecaptchaInputSelector)

    if (isOnRecaptchaPage) {
      props.mediator.onError('Recaptcha found')
    }
  }
  
  const waitForChannelSelector = props.page.waitForSelector(createChannelSelector, { timeout: 120000 }).then(() => 'createChannel')
  const waitForUploadSelector = props.page.waitForSelector(uploadPopupSelector, { timeout: 120000 }).then(() => 'uploadFile')

  await Promise.any([
    waitForChannelSelector,
    waitForUploadSelector
  ]).then((result) => {
    if(result === 'createChannel'){
      pageInteractor.click(createChannelSelector, { sleepAfterInputMs: 3000});
    }
  }).catch(async () => {
    if(props.credentials.recoveryEmail) {
      await securityBypass(props.credentials.recoveryEmail, props.page, props.mediator)
    }
  })
 
  // Save cookies to local folder
  const result = await saveCookiesToLocal(props.credentials.email, props.page);
  
  result?.errorMessage 
    ? props.mediator.onError(`Cookies could not be saved. ${result.errorMessage}`) 
    : props.mediator.onLog('Cookies has been saved.')

  return result?.errorMessage === undefined;
}

// Login bypass with recovery email
async function securityBypass(recoveryEmail: string, page: Page, mediator: Mediator) {
  const pageInteractor = PageInteraction(page);

  try {
    await pageInteractor.click(loginConfirmRecoveryXPath)
  } catch (error) {
    mediator.onLog(error)
  }

  await page.waitForNavigation({
    waitUntil: 'networkidle0'
  })
  
  await page.waitForXPath(loginEnterRecoveryXPath)
  await sleep(5000)
  
  await page.focus(loginEmailInputSelector)
  await sleep(3000)
  
  await pageInteractor.type(loginEmailInputSelector, recoveryEmail, { inputDelayMs: 100 })
  await page.keyboard.press('Enter')
  
  await page.waitForNavigation({
    waitUntil: 'networkidle0'
  })
  
  await page.waitForSelector(uploadPopupSelector, {timeout: 60000})
}
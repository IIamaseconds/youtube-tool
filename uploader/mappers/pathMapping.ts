// Invalid video characters
export const invalidCharacters = ['<', '>']

// Buttons
export const buttonNextXpath = `//*[@id="next-button"]`;
export const buttonDoneXpath = `//*[@id="done-button"]`;
export const buttonSearchXpath = `//*[@id="search-input"]`;
export const buttonSearchSelector = `#search-input`;
export const buttonSelectFilesXpath = `//*[@id="select-files-button"]`;
export const buttonThumbnailSelectSelector = '#still-picker > ytcp-thumbnails-compact-editor-uploader-old > div > button'
export const buttonPlaylistsDropdownSelector = 'ytcp-video-metadata-playlists > ytcp-text-dropdown-trigger > ytcp-dropdown-trigger'
export const buttonShowMetaDataToggleXPath = `//*[@id="toggle-button"]`
export const buttonChildOptionQuery = (isForChildren? : boolean) => `#audience > ytkc-made-for-kids-select > div.made-for-kids-rating-container.style-scope.ytkc-made-for-kids-select > tp-yt-paper-radio-group > tp-yt-paper-radio-button:nth-child(${isForChildren ? 2 : 1})`

// Login language
export const defaultLanguageXPath = '//*[@data-value="en-GB"]'
export const loginEmailInputSelector = 'input[type="email"]';
export const loginEmailInvalidSelector = '//*[contains(text(), "Couldn\'t find your Google Account")]'
export const loginPasswordInvalidSelector = '//*[contains(text(), "Wrong password.")]'
export const loginPasswordInputSelector = 'input[type="password"]:not([aria-hidden="true"])'
export const loginGoogleAppAuthSelector = 'samp'
export const loginRecaptchaInputSelector = 'input[aria-label="Type the text you hear or see"]'
export const loginConfirmRecoveryXPath = "//*[normalize-space(text())='Confirm your recovery email']"
export const loginEnterRecoveryXPath = "//*[normalize-space(text())='Enter recovery email address']"
export const loginSmsAuthSelector = '#idvPin'

// Video title and description
export const textboxTitleAndDescriptionAvailableFunction = 'document.querySelectorAll(\'[id="textbox"]\').length > 1'
export const textboxTitleAndDescriptionXPath = '//*[@id="textbox"]';

// Video playlist
export const createPlayListButtonXPath = "//*[normalize-space(text())='Create']"
export const createPlayListDoneXPath = "//*[normalize-space(text())='Done']"
export const createPlayListNameXPath = "//*[normalize-space(text())='New playlist'] | //*[normalize-space(text())='Create playlist']"
export const selectPlayListNameXPath = (name: string) => `//*[@class="label label-text style-scope ytcp-checkbox-group" and normalize-space(text())="${name}"]`
export const playlistsXPath = `//*[@id="basics"]/div[4]/div[3]/div[1]/ytcp-video-metadata-playlists/ytcp-text-dropdown-trigger/ytcp-dropdown-trigger/div/div[3]`

// Video language
export const videoLanguageButtonXPath = "//*[normalize-space(text())='Video language']";
export const videoLanguageNameXPath = (language: string) => `//*[normalize-space(translate(text(),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz"))='${language.toLowerCase()}']`

// Video visibility
export const visibilityXpath = (visibility: string) => `//*[@name="${visibility.toUpperCase()}"]`

// Upload
export const uploadTagsInputXPath = `[aria-label="Tags"]`
export const uploadLinkSelector = `[href^="https://youtu.be"], [href^="https://youtube.com/shorts"]`

// Upload progress
export const uploadCompleteXPath = '//*[contains(text(),"Upload complete")]';
export const uploadDailyLimitXPath = '//*[contains(text(),"Daily upload limit reached")]';
export const uploadStateTextXPath = '//span[contains(@class, "ytcp-video-upload-progress") and contains(@class, "progress-label")]'

// Channel name
export const createChannelSelector = '#create-channel-button';
export const uploadPopupSelector = 'ytcp-uploads-dialog';
export const channelNameXPath = (channelName: string) => `//*[normalize-space(text())='${channelName}']`;
